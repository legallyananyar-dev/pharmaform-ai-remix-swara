# PharmaForm AI — Drug–Excipient Compatibility Prediction Platform

PharmaForm AI is an industrial-grade pharmaceutical R&D platform designed for formulation scientists, medicinal chemists, and drug developers. It predicts Active Pharmaceutical Ingredient (API) and excipient compatibility prior to laboratory formulation trials using machine learning, cheminformatics (RDKit), and Explainable AI (SHAP).

## Features

1. **Analytical Dashboard**: Overview of prediction metrics, recent analyses, compatibility risk distribution, and most-used excipient insights.
2. **Drug Input & PubChem Integration**:
   - Search drugs by name with PubChem REST API lookup.
   - SMILES input with instant 2D structure rendering.
   - Upload SDF/MOL files.
   - Computes 12+ RDKit molecular descriptors (MW, LogP, TPSA, HBD, HBA, Rotatable Bonds, Heavy Atoms, Fraction Csp3, Rings, Formal Charge, Morgan Fingerprints, MACCS Keys).
3. **Excipient Library**: Comprehensive database of pharmaceutical excipients (Lactose, MCC, PVP, HPMC, Crospovidone, D-Mannitol, Magnesium Stearate, Talc, Aerosil 200, Maize Starch, SSG, Citric Acid) with functional categories, concentrations, and reactive risk groups.
4. **Feature Engineering**: Paired interactions calculations ($\Delta\text{LogP}$, $\Delta\text{MW}$, $\Delta\text{TPSA}$, Cosine Similarity, Tanimoto Index, and Reaction Alert Matrix for Maillard, Chelation, Hydrolysis, and Acid-Base salt interactions).
5. **Machine Learning & SHAP**: Random Forest ensemble prediction with confidence scoring (%) and SHAP waterfall/bar chart feature attributions.
6. **2D/3D Molecule Viewer**: Interactive molecular structure renderer with functional group highlights.
7. **Professional PDF Analytical Reports**: Downloadable certificates featuring complete chemical profiles, interaction metrics, SHAP plots, degradation mechanisms, and scientist recommendations.
8. **Prediction History**: Filterable, searchable, CSV-exportable prediction log.
9. **AI Formulation Assistant**: Gemini 3.6 Flash powered industrial formulation scientist copilot for excipient substitution and wet vs dry process optimization.

## Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS, Recharts, Framer Motion, Lucide Icons, jsPDF
- **Backend**: Express / Node.js (live server) & Python FastAPI (`backend/main.py`)
- **Cheminformatics**: RDKit / Custom TS Cheminformatics Engine
- **Machine Learning**: Scikit-Learn Random Forest, SHAP

## Installation & Running

### Live Node / Express Web App
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

### Python FastAPI Backend
```bash
pip install -r requirements.txt
python backend/train_model.py
uvicorn backend.main:app --reload --port 8000
```
API Documentation available at `http://localhost:8000/docs`.
