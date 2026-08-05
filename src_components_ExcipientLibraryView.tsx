import React, { useState } from 'react';
import { 
  Pill, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Info, 
  ArrowRight, 
  Atom 
} from 'lucide-react';
import { Excipient } from '../types';

interface ExcipientLibraryViewProps {
  excipients: Excipient[];
  selectedExcipient: Excipient;
  setSelectedExcipient: (excipient: Excipient) => void;
  onRunScreeningWithExcipient: (excipient: Excipient) => void;
  isDarkMode: boolean;
}

export const ExcipientLibraryView: React.FC<ExcipientLibraryViewProps> = ({
  excipients,
  selectedExcipient,
  setSelectedExcipient,
  onRunScreeningWithExcipient,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('All');

  const categories = ['All', 'Diluent', 'Binder', 'Disintegrant', 'Lubricant', 'Glidant', 'Coating', 'Buffer'];
  const dosageForms = ['All', 'Tablet', 'Capsule', 'ODT', 'Granule', 'Sustained-Release'];

  const filteredExcipients = excipients.filter(exc => {
    const matchesSearch = exc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exc.reactiveRiskGroups.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || exc.category === selectedCategory;
    const matchesDosage = selectedDosageForm === 'All' || exc.dosageForms.some(d => d.includes(selectedDosageForm));

    return matchesSearch && matchesCategory && matchesDosage;
  });

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <Pill className="w-6 h-6 text-cyan-400" />
            <span>Pharmaceutical Excipient Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable library of pharmaceutical excipients, chemical reactive risk factors, concentration limits, and dosage form suitability.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={`p-5 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by excipient name or reactive risk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Functional Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Dosage Form Filter */}
          <div>
            <select
              value={selectedDosageForm}
              onChange={(e) => setSelectedDosageForm(e.target.value)}
              className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {dosageForms.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Dosage Forms' : `Dosage: ${d}`}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Excipient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExcipients.map(exc => {
          const isSelected = selectedExcipient.id === exc.id;
          const hasHighRisk = exc.reactiveRiskGroups.some(r => 
            r.toLowerCase().includes('reducing sugar') || 
            r.toLowerCase().includes('cation') || 
            r.toLowerCase().includes('peroxide')
          );

          return (
            <div
              key={exc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30' 
                  : isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {exc.category}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    Conc: <strong>{exc.typicalConcentration}</strong>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-100">{exc.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">CAS: {exc.casNumber || 'N/A'}</p>

                <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {exc.description || 'Standard pharmaceutical grade functional excipient.'}
                </p>

                {/* Descriptors Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">MW: {exc.descriptors.mw}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">LogP: {exc.descriptors.logP}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">TPSA: {exc.descriptors.tpsa}</span>
                </div>

                {/* Reactive Risk Group Tags */}
                <div className="mt-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Reactive Risk Factors</span>
                  <div className="flex flex-wrap gap-1">
                    {exc.reactiveRiskGroups.map((group, idx) => {
                      const isAlert = group.toLowerCase().includes('sugar') || group.toLowerCase().includes('cation') || group.toLowerCase().includes('peroxide');
                      return (
                        <span 
                          key={idx} 
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isAlert 
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {group}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedExcipient(exc)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isSelected ? 'Target Excipient Active' : 'Select Excipient'}
                </button>

                <button
                  onClick={() => {
                    setSelectedExcipient(exc);
                    onRunScreeningWithExcipient(exc);
                  }}
                  title="Run Compatibility Screen"
                  className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
