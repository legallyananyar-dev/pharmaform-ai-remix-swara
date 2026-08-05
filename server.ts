import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_DRUGS } from './src/data/drugDatabase.js';
import { INITIAL_EXCIPIENTS } from './src/data/excipientLibrary.js';
import { predictCompatibility, computeEngineeredFeatures } from './src/utils/mlEngine.js';
import { computeDescriptorsFromSMILES, parseSDFFileContent } from './src/utils/cheminformatics.js';
import { CompatibilityPrediction, DashboardMetrics } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent state (simulating SQLite / SQLAlchemy backend)
let predictionHistory: CompatibilityPrediction[] = [
  predictCompatibility(INITIAL_DRUGS[0], INITIAL_EXCIPIENTS[0]), // Paracetamol + Lactose
  predictCompatibility(INITIAL_DRUGS[0], INITIAL_EXCIPIENTS[1]), // Paracetamol + MCC
  predictCompatibility(INITIAL_DRUGS[6], INITIAL_EXCIPIENTS[0]), // Fluoxetine + Lactose (Incompatible Maillard)
  predictCompatibility(INITIAL_DRUGS[7], INITIAL_EXCIPIENTS[6]), // Ciprofloxacin + Mg Stearate (Incompatible Chelation)
  predictCompatibility(INITIAL_DRUGS[1], INITIAL_EXCIPIENTS[5]), // Ibuprofen + Mannitol
  predictCompatibility(INITIAL_DRUGS[2], INITIAL_EXCIPIENTS[11]),// Aspirin + Citric Acid (Ester Hydrolysis)
];

// Initialize Gemini AI Client for AI Formulation Assistant
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return aiClient;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// GET /api/dashboard
app.get('/api/dashboard', (req, res) => {
  const totalPredictions = predictionHistory.length;
  const compatibleCount = predictionHistory.filter(p => p.status === 'Compatible').length;
  const reactiveCount = predictionHistory.filter(p => p.status === 'Possibly Reactive').length;
  const incompatibleCount = predictionHistory.filter(p => p.status === 'Incompatible').length;

  const avgConfidence = totalPredictions > 0
    ? Math.round(predictionHistory.reduce((acc, curr) => acc + curr.confidenceScore, 0) / totalPredictions)
    : 92;

  // Excipient frequency map
  const excMap: Record<string, { count: number; category: string }> = {};
  predictionHistory.forEach(p => {
    const name = p.excipient.name;
    if (!excMap[name]) {
      excMap[name] = { count: 0, category: p.excipient.category };
    }
    excMap[name].count += 1;
  });

  const mostUsedExcipients = Object.entries(excMap)
    .map(([name, data]) => ({ name, count: data.count, category: data.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const metrics: DashboardMetrics = {
    totalPredictions,
    compatibleCount,
    reactiveCount,
    incompatibleCount,
    avgConfidence,
    mostUsedExcipients,
    recentAnalyses: predictionHistory.slice(0, 6)
  };

  res.json(metrics);
});

// POST /api/predict
app.post('/api/predict', (req, res) => {
  try {
    const { drug, excipient } = req.body;
    if (!drug || !excipient) {
      return res.status(400).json({ error: 'Drug and Excipient definitions are required.' });
    }

    const prediction = predictCompatibility(drug, excipient);
    
    // Add to top of history
    predictionHistory.unshift(prediction);
    if (predictionHistory.length > 100) {
      predictionHistory = predictionHistory.slice(0, 100);
    }

    res.json(prediction);
  } catch (error: any) {
    console.error('Prediction endpoint error:', error);
    res.status(500).json({ error: error.message || 'Failed to compute compatibility prediction.' });
  }
});

// GET /api/history
app.get('/api/history', (req, res) => {
  const { search, status } = req.query;
  let result = [...predictionHistory];

  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter(p => 
      p.drug.name.toLowerCase().includes(term) ||
      p.excipient.name.toLowerCase().includes(term) ||
      p.drug.smiles.toLowerCase().includes(term) ||
      p.excipient.category.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'all') {
    result = result.filter(p => p.status === status);
  }

  res.json(result);
});

// DELETE /api/history/:id
app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  predictionHistory = predictionHistory.filter(p => p.id !== id);
  res.json({ success: true, message: `Prediction ${id} removed` });
});

// GET /api/drug/:id
app.get('/api/drug/:id', (req, res) => {
  const drug = INITIAL_DRUGS.find(d => d.id === req.params.id);
  if (!drug) return res.status(404).json({ error: 'Drug compound not found.' });
  res.json(drug);
});

// GET /api/excipient/:id
app.get('/api/excipient/:id', (req, res) => {
  const excipient = INITIAL_EXCIPIENTS.find(e => e.id === req.params.id);
  if (!excipient) return res.status(404).json({ error: 'Excipient compound not found.' });
  res.json(excipient);
});

// POST /api/upload - SDF/MOL File Uploader
app.post('/api/upload', (req, res) => {
  try {
    const { fileContent } = req.body;
    if (!fileContent) {
      return res.status(400).json({ error: 'File content is empty.' });
    }

    const parsed = parseSDFFileContent(fileContent);
    const descriptors = computeDescriptorsFromSMILES(parsed.smiles);

    const drug = {
      id: `custom-drug-${Date.now()}`,
      name: parsed.name,
      smiles: parsed.smiles,
      formula: parsed.formula,
      therapeuticCategory: 'Uploaded Custom API',
      descriptors
    };

    res.json(drug);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse SDF/MOL file format.' });
  }
});

// POST /api/pubchem/search
app.post('/api/pubchem/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query parameter required.' });

    // Call NIH PubChem REST API
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/Title,IUPACName,MolecularWeight,MolecularFormula,CanonicalSMILES,TPSA,XLogP,HBondDonorCount,HBondAcceptorCount,HeavyAtomCount,RotatableBondCount/JSON`);

    if (!response.ok) {
      return res.status(404).json({ error: 'Compound not found in PubChem database.' });
    }

    const data: any = await response.json();
    const props = data?.PropertyTable?.Properties?.[0];

    if (!props) return res.status(404).json({ error: 'No chemical properties found for this compound.' });

    const smiles = props.CanonicalSMILES || '';
    const descriptors = computeDescriptorsFromSMILES(smiles);
    descriptors.mw = props.MolecularWeight ? parseFloat(props.MolecularWeight) : descriptors.mw;
    descriptors.logP = props.XLogP ? parseFloat(props.XLogP) : descriptors.logP;
    descriptors.tpsa = props.TPSA ? parseFloat(props.TPSA) : descriptors.tpsa;
    descriptors.hbd = props.HBondDonorCount ?? descriptors.hbd;
    descriptors.hba = props.HBondAcceptorCount ?? descriptors.hba;
    descriptors.heavyAtoms = props.HeavyAtomCount ?? descriptors.heavyAtoms;
    descriptors.rotatableBonds = props.RotatableBondCount ?? descriptors.rotatableBonds;

    const searchedDrug = {
      id: `pubchem-${props.CID || Date.now()}`,
      name: props.Title || query,
      smiles,
      formula: props.MolecularFormula || '',
      therapeuticCategory: 'PubChem Retrieved API',
      descriptors
    };

    res.json(searchedDrug);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to query PubChem database.' });
  }
});

// POST /api/ai-assistant - AI Formulation Scientist Copilot (Gemini API)
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { prompt, currentDrug, currentExcipient } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `Formulation Insight (Rule-Engine Mode): For active drug ${currentDrug?.name || 'API'} and excipient ${currentExcipient?.name || 'Excipient'}, we recommend assessing moisture levels below 2.0% RH and considering direct compression or dry roller compaction if ester hydrolysis or Maillard glycation risks exist. Configure GEMINI_API_KEY in Secrets panel for live LLM copilot responses.`
      });
    }

    const systemPrompt = `You are PharmaForm AI Copilot, a senior pharmaceutical formulation scientist, cheminformatics expert, and industrial drug developer. 
Your job is to provide concise, scientifically accurate, actionable guidance on drug-excipient interactions, degradation pathways (Maillard, hydrolysis, oxidation, chelation), wet vs dry granulation, excipient substitutions, and solid-state stability.

Current Context:
Active API: ${currentDrug ? `${currentDrug.name} (SMILES: ${currentDrug.smiles}, MW: ${currentDrug.descriptors.mw}, LogP: ${currentDrug.descriptors.logP})` : 'None specified'}
Excipient: ${currentExcipient ? `${currentExcipient.name} (Category: ${currentExcipient.category}, Concentration: ${currentExcipient.typicalConcentration})` : 'None specified'}

Provide clear headings, bullet points, and specific excipient alternatives if an incompatibility is discussed. Keep responses crisp and industrial-focused.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const reply = response.text || 'No response generated from AI copilot.';
    res.json({ reply });
  } catch (error: any) {
    console.error('AI assistant error:', error);
    res.status(500).json({ error: 'Failed to consult AI formulation assistant.' });
  }
});

// ==========================================
// VITE & SERVER BOOTSTRAP
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PharmaForm AI Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
