import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Pill, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { DashboardMetrics, CompatibilityPrediction, Drug, Excipient } from '../types';
import { computeDescriptorsFromSMILES } from '../utils/cheminformatics';
import { generatePDFReport } from '../utils/pdfExporter';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  drugs: Drug[];
  excipients: Excipient[];
  onSelectPrediction: (pred: CompatibilityPrediction) => void;
  onRunQuickPredict: (drug: Drug, excipient: Excipient) => void;
  setActiveTab: (tab: any) => void;
  isDarkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  drugs,
  excipients,
  onSelectPrediction,
  onRunQuickPredict,
  setActiveTab,
  isDarkMode
}) => {
  const [quickDrugId, setQuickDrugId] = useState(drugs[0]?.id || '');
  const [quickExcId, setQuickExcId] = useState(excipients[0]?.id || '');
  const [customSmiles, setCustomSmiles] = useState('');

  const handleQuickRun = () => {
    let selectedDrug = drugs.find(d => d.id === quickDrugId) || drugs[0];
    if (customSmiles.trim()) {
      const desc = computeDescriptorsFromSMILES(customSmiles.trim());
      selectedDrug = {
        id: `quick-${Date.now()}`,
        name: 'Custom SMILES API',
        smiles: customSmiles.trim(),
        formula: 'C10H14N2O',
        therapeuticCategory: 'Quick Screen Compound',
        descriptors: desc
      };
    }
    const selectedExc = excipients.find(e => e.id === quickExcId) || excipients[0];
    onRunQuickPredict(selectedDrug, selectedExc);
  };

  const pieData = [
    { name: 'Compatible', value: metrics.compatibleCount, color: '#10B981' },
    { name: 'Possibly Reactive', value: metrics.reactiveCount, color: '#F59E0B' },
    { name: 'Incompatible', value: metrics.incompatibleCount, color: '#EF4444' }
  ];

  const excipientBarData = metrics.mostUsedExcipients.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    count: item.count
  }));

  return (
    <div className="space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden transition-all shadow-xl ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/80 border-slate-800' 
          : 'bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-emerald-500/10 border-sky-200'
      }`}>
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pharmaceutical Machine Learning Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI-Powered Drug–Excipient Compatibility Platform
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Predict physical & chemical interactions between active pharmaceutical ingredients and excipients prior to laboratory trial batches. Powered by Random Forest classification, RDKit cheminformatics, and SHAP explainability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('predict')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>New Compatibility Screening</span>
            </button>
            
            <button
              onClick={() => setActiveTab('excipients')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-colors flex items-center space-x-2 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Pill className="w-4 h-4 text-cyan-400" />
              <span>Explore Excipient Library</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Predictions */}
        <div className={`p-5 rounded-xl border transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Analyses</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black">{metrics.totalPredictions}</span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live Synced</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Recorded formulation trials</p>
        </div>

        {/* Compatible Rate */}
        <div className={`p-5 rounded-xl border transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Compatible Pairs</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{metrics.compatibleCount}</span>
            <span className="text-xs font-semibold text-slate-400">
              {metrics.totalPredictions > 0 ? Math.round((metrics.compatibleCount / metrics.totalPredictions) * 100) : 0}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">High stability combinations</p>
        </div>

        {/* Incompatible Alerts */}
        <div className={`p-5 rounded-xl border transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Incompatible Risks</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-400">{metrics.incompatibleCount}</span>
            <span className="text-xs font-semibold text-slate-400">
              {metrics.reactiveCount} Possibly Reactive
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Reactive alerts caught by ML</p>
        </div>

        {/* Avg Model Confidence */}
        <div className={`p-5 rounded-xl border transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Model Confidence</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-400">{metrics.avgConfidence}%</span>
            <span className="text-[11px] text-cyan-400 font-mono">RF Ensemble</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Scikit-learn cross-validation</p>
        </div>

      </div>

      {/* Quick SMILES & Compound Screen Widget */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Quick Formulation Screening</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Drug API</label>
            <select
              value={quickDrugId}
              onChange={(e) => {
                setQuickDrugId(e.target.value);
                setCustomSmiles('');
              }}
              className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none font-medium ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {drugs.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.therapeuticCategory})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">OR Paste SMILES String</label>
            <input
              type="text"
              placeholder="e.g. CC(=O)NC1=CC=C(O)C=C1"
              value={customSmiles}
              onChange={(e) => setCustomSmiles(e.target.value)}
              className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none font-mono ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Excipient</label>
            <div className="flex items-center space-x-2">
              <select
                value={quickExcId}
                onChange={(e) => setQuickExcId(e.target.value)}
                className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none font-medium ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {excipients.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                ))}
              </select>

              <button
                onClick={handleQuickRun}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>Run</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compatibility Risk Distribution Pie */}
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span>Compatibility Risk Profile</span>
            <span className="text-[11px] font-normal text-slate-400">Dataset Overview</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center space-x-6 text-xs mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400 font-medium">{item.name}: <strong className="text-slate-200">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Screened Excipients Bar */}
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span>Most Utilized Excipients in Trials</span>
            <span className="text-[11px] font-normal text-slate-400">Frequency Analysis</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={excipientBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="count" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Predictions Feed */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-200">Recent Compatibility Screenings</h3>
            <p className="text-xs text-slate-400">Instant ML interaction predictions & SHAP explanations</p>
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {metrics.recentAnalyses.map((pred) => {
            const isComp = pred.status === 'Compatible';
            const isReac = pred.status === 'Possibly Reactive';
            return (
              <div 
                key={pred.id} 
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 p-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{pred.drug.name}</span>
                    <span className="text-slate-500 text-xs">+</span>
                    <span className="font-bold text-sm text-cyan-300">{pred.excipient.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{pred.shapExplanationSummary}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    isComp 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : isReac 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {pred.status} ({pred.confidenceScore}%)
                  </span>

                  <button
                    onClick={() => onSelectPrediction(pred)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Details & SHAP
                  </button>

                  <button
                    onClick={() => generatePDFReport(pred)}
                    title="Export Analytical PDF"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
