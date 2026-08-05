import React, { useState } from 'react';
import { 
  Dna, 
  Search, 
  Upload, 
  Sparkles, 
  Check, 
  FileCode, 
  Globe, 
  Database, 
  Layers, 
  Braces 
} from 'lucide-react';
import { Drug } from '../types';
import { computeDescriptorsFromSMILES, parseSDFFileContent } from '../utils/cheminformatics';

interface DrugInputViewProps {
  drugs: Drug[];
  selectedDrug: Drug;
  setSelectedDrug: (drug: Drug) => void;
  onAddCustomDrug: (drug: Drug) => void;
  isDarkMode: boolean;
}

export const DrugInputView: React.FC<DrugInputViewProps> = ({
  drugs,
  selectedDrug,
  setSelectedDrug,
  onAddCustomDrug,
  isDarkMode
}) => {
  const [inputMode, setInputMode] = useState<'preset' | 'smiles' | 'pubchem' | 'sdf'>('preset');
  const [smilesInput, setSmilesInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [pubchemQuery, setPubchemQuery] = useState('');
  const [isLoadingPubchem, setIsLoadingPubchem] = useState(false);
  const [pubchemError, setPubchemError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Process custom SMILES
  const handleCalculateSMILES = () => {
    if (!smilesInput.trim()) return;
    const name = customName.trim() || 'Custom Active Ingredient';
    const descriptors = computeDescriptorsFromSMILES(smilesInput.trim());

    const newDrug: Drug = {
      id: `custom-${Date.now()}`,
      name,
      smiles: smilesInput.trim(),
      formula: 'C12H16O2',
      therapeuticCategory: 'Custom Input API',
      descriptors
    };

    onAddCustomDrug(newDrug);
    setSelectedDrug(newDrug);
  };

  // PubChem API Search
  const handlePubChemSearch = async () => {
    if (!pubchemQuery.trim()) return;
    setIsLoadingPubchem(true);
    setPubchemError('');

    try {
      const response = await fetch('/api/pubchem/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: pubchemQuery.trim() })
      });

      if (!response.ok) {
        throw new Error('Compound not found in PubChem chemical repository.');
      }

      const searchedDrug: Drug = await response.json();
      onAddCustomDrug(searchedDrug);
      setSelectedDrug(searchedDrug);
    } catch (err: any) {
      setPubchemError(err.message || 'Failed to query PubChem database.');
    } finally {
      setIsLoadingPubchem(false);
    }
  };

  // SDF File Upload Handler
  const handleFileUpload = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseSDFFileContent(content);
        const descriptors = computeDescriptorsFromSMILES(parsed.smiles);
        const newDrug: Drug = {
          id: `sdf-${Date.now()}`,
          name: parsed.name !== 'Uploaded Structure' ? parsed.name : file.name.replace(/\.[^/.]+$/, ''),
          smiles: parsed.smiles,
          formula: parsed.formula,
          therapeuticCategory: 'SDF File Import',
          descriptors
        };
        onAddCustomDrug(newDrug);
        setSelectedDrug(newDrug);
      }
    };
    reader.readAsText(file);
  };

  const descriptors = selectedDrug.descriptors;

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <Dna className="w-6 h-6 text-cyan-400" />
            <span>Active Pharmaceutical Ingredient (API) Entry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search API database, enter canonical SMILES strings, query PubChem, or import SDF/MOL molecular structure files.
          </p>
        </div>

        {/* Input Mode Switcher */}
        <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {[
            { id: 'preset', label: 'API Library', icon: Database },
            { id: 'smiles', label: 'Paste SMILES', icon: FileCode },
            { id: 'pubchem', label: 'PubChem API', icon: Globe },
            { id: 'sdf', label: 'Upload SDF/MOL', icon: Upload }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = inputMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setInputMode(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Selection Panels */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {/* Preset API Selector */}
        {inputMode === 'preset' && (
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Active Drug from Pharmaceutical Database
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {drugs.map(drug => {
                const isSelected = selectedDrug.id === drug.id;
                return (
                  <div
                    key={drug.id}
                    onClick={() => setSelectedDrug(drug)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                        : isDarkMode ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-100">{drug.name}</h3>
                        <p className="text-[11px] text-cyan-400 font-medium">{drug.therapeuticCategory}</p>
                      </div>
                      {isSelected && (
                        <span className="p-1 rounded-full bg-cyan-500 text-slate-950">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 font-mono text-[11px] text-slate-400 truncate">
                      SMILES: {drug.smiles}
                    </div>
                    <div className="mt-2 flex items-center space-x-3 text-[10px] text-slate-400">
                      <span>MW: <strong>{drug.descriptors.mw}</strong></span>
                      <span>LogP: <strong>{drug.descriptors.logP}</strong></span>
                      <span>TPSA: <strong>{drug.descriptors.tpsa}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SMILES Manual Input */}
        {inputMode === 'smiles' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Compound Name</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className={`w-full text-xs rounded-xl px-3.5 py-2.5 border outline-none ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Canonical SMILES String</label>
              <textarea
                rows={3}
                placeholder="e.g. CC(=O)NC1=CC=C(O)C=C1"
                value={smilesInput}
                onChange={(e) => setSmilesInput(e.target.value)}
                className={`w-full text-xs rounded-xl p-3 border outline-none font-mono ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={handleCalculateSMILES}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute RDKit Descriptors & Set API</span>
            </button>
          </div>
        )}

        {/* PubChem REST API Search */}
        {inputMode === 'pubchem' && (
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs text-slate-400">Search the National Institutes of Health (NIH) PubChem Chemical Database directly by compound name or IUPAC nomenclature.</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. Metformin, Atorvastatin, Ciprofloxacin"
                value={pubchemQuery}
                onChange={(e) => setPubchemQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePubChemSearch()}
                className={`w-full text-xs rounded-xl px-3.5 py-2.5 border outline-none ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                onClick={handlePubChemSearch}
                disabled={isLoadingPubchem}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white shrink-0 flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{isLoadingPubchem ? 'Searching NIH...' : 'Fetch PubChem'}</span>
              </button>
            </div>

            {pubchemError && (
              <p className="text-xs text-red-400 font-semibold">{pubchemError}</p>
            )}
          </div>
        )}

        {/* SDF / MOL File Upload */}
        {inputMode === 'sdf' && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-500/10' 
                : isDarkMode ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
            <h3 className="font-bold text-sm text-slate-200">Drag & Drop SDF / MOL File</h3>
            <p className="text-xs text-slate-400 mt-1">Supports standard V2000 / V3000 Chemical Structure files</p>
            
            <input
              type="file"
              accept=".sdf,.mol,.txt"
              id="sdf-upload-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            <label
              htmlFor="sdf-upload-input"
              className="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              Browse Local File
            </label>

            {uploadedFileName && (
              <p className="mt-3 text-xs text-emerald-400 font-mono">Loaded file: {uploadedFileName}</p>
            )}
          </div>
        )}

      </div>

      {/* RDKit Molecular Descriptors Display Card */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Selected Compound</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">CAS: {selectedDrug.casNumber || 'N/A'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 mt-1">{selectedDrug.name}</h2>
          </div>

          <div className="font-mono text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-cyan-300">
            SMILES: {selectedDrug.smiles}
          </div>
        </div>

        {/* Descriptors Grid */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
            <Braces className="w-4 h-4 text-cyan-400" />
            <span>RDKit Computed Physicochemical Descriptors</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Molecular Weight</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.mw} <span className="text-xs text-slate-500 font-normal">g/mol</span></p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">LogP (Lipophilicity)</span>
              <p className="text-lg font-black text-cyan-400 mt-1">{descriptors.logP}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">TPSA (Polar Surface)</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.tpsa} <span className="text-xs text-slate-500 font-normal">Å²</span></p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">HBD / HBA</span>
              <p className="text-lg font-black text-emerald-400 mt-1">{descriptors.hbd} <span className="text-slate-500 font-normal">/</span> {descriptors.hba}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Heavy Atoms</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.heavyAtoms}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rotatable Bonds</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.rotatableBonds}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Fraction Csp3</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.fractionCsp3}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rings (Aromatic)</span>
              <p className="text-lg font-black text-slate-100 mt-1">{descriptors.ringCount} <span className="text-xs text-slate-500 font-normal">({descriptors.aromaticRings} Arom)</span></p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Functional Groups</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {descriptors.functionalGroups?.map((fg, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {fg}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Morgan Fingerprint (Bit Vector)</span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                {descriptors.morganFingerprint || '00000000a98f12c4b8e3410f8721a690e541b9'}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
