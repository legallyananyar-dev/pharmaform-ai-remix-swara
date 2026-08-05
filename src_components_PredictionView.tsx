import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  FileText, 
  Layers, 
  ArrowRight, 
  Sliders, 
  BarChart3, 
  ShieldAlert, 
  HelpCircle,
  Cloud,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Cell 
} from 'recharts';
import { Drug, Excipient, CompatibilityPrediction } from '../types';
import { predictCompatibility } from '../utils/mlEngine';
import { generatePDFReport } from '../utils/pdfExporter';

interface PredictionViewProps {
  drugs: Drug[];
  excipients: Excipient[];
  currentPrediction: CompatibilityPrediction | null;
  onRunPrediction: (drug: Drug, excipient: Excipient) => void;
  isDarkMode: boolean;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  drugs,
  excipients,
  currentPrediction,
  onRunPrediction,
  isDarkMode
}) => {
  const [selectedDrugId, setSelectedDrugId] = useState<string>(currentPrediction?.drug.id || drugs[0]?.id || '');
  const [selectedExcipientId, setSelectedExcipientId] = useState<string>(currentPrediction?.excipient.id || excipients[0]?.id || '');
  const [batchResults, setBatchResults] = useState<CompatibilityPrediction[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const activeDrug = drugs.find(d => d.id === selectedDrugId) || drugs[0];
  const activeExcipient = excipients.find(e => e.id === selectedExcipientId) || excipients[0];

  const handlePredict = () => {
    onRunPrediction(activeDrug, activeExcipient);
  };

  const handleRunBatchScreening = () => {
    setIsBatchRunning(true);
    setTimeout(() => {
      const results = excipients.map(exc => predictCompatibility(activeDrug, exc));
      setBatchResults(results);
      setIsBatchRunning(false);
    }, 400);
  };

  const prediction = currentPrediction || predictCompatibility(activeDrug, activeExcipient);
  const isCompatible = prediction.status === 'Compatible';
  const isReactive = prediction.status === 'Possibly Reactive';

  // SHAP Bar Data
  const shapChartData = prediction.shapFeatures.map(sf => ({
    name: sf.featureName,
    weight: Math.round(sf.shapValue * 100),
    fill: sf.shapValue > 0 ? '#10B981' : '#EF4444'
  }));

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span>Compatibility & SHAP Feature Attribution</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine Learning prediction engine with SHAP (SHapley Additive exPlanations) for drug-excipient solid state interaction.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunBatchScreening}
            disabled={isBatchRunning}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-colors flex items-center space-x-2 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{isBatchRunning ? 'Screening Matrix...' : `Batch Screen All (${excipients.length}) Excipients`}</span>
          </button>

          <button
            onClick={() => generatePDFReport(prediction)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>Download Analytical PDF</span>
          </button>
        </div>
      </div>

      {/* Selector Control Panel */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Active Drug (API)
            </label>
            <select
              value={selectedDrugId}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              className={`w-full text-xs rounded-xl px-3.5 py-2.5 border outline-none font-medium ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {drugs.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.therapeuticCategory})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Excipient Candidate
            </label>
            <select
              value={selectedExcipientId}
              onChange={(e) => setSelectedExcipientId(e.target.value)}
              className={`w-full text-xs rounded-xl px-3.5 py-2.5 border outline-none font-medium ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {excipients.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handlePredict}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-slate-950 hover:opacity-95 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Run Compatibility Prediction</span>
            </button>
          </div>

        </div>
      </div>

      {/* Primary Result Banner Card */}
      <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden transition-all shadow-xl ${
        isCompatible
          ? isDarkMode ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
          : isReactive
            ? isDarkMode ? 'bg-slate-900/90 border-amber-500/40' : 'bg-amber-50 border-amber-300'
            : isDarkMode ? 'bg-slate-900/90 border-red-500/40' : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Status */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className={`p-2.5 rounded-2xl ${
                isCompatible ? 'bg-emerald-500/20 text-emerald-400' : isReactive ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isCompatible ? <CheckCircle2 className="w-8 h-8" /> : isReactive ? <AlertTriangle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </span>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prediction Outcome</span>
                <h2 className={`text-2xl sm:text-3xl font-black ${
                  isCompatible ? 'text-emerald-400' : isReactive ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {prediction.status}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {prediction.shapExplanationSummary}
            </p>
          </div>

          {/* Right Gauge */}
          <div className="flex items-center space-x-6 shrink-0 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Model Confidence</span>
              <p className={`text-3xl font-black mt-0.5 ${
                isCompatible ? 'text-emerald-400' : isReactive ? 'text-amber-400' : 'text-red-400'
              }`}>
                {prediction.confidenceScore}%
              </p>
              <span className="text-[9px] font-mono text-cyan-400">Random Forest Ensemble</span>
            </div>

            <div className="h-12 w-px bg-slate-800"></div>

            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Compatibility Coeff</span>
              <p className="text-3xl font-black text-cyan-300 mt-0.5">
                {prediction.features.compatibilityCoeff}
              </p>
              <span className="text-[9px] font-mono text-slate-400">C_comp Score (0-1)</span>
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Report ID: <strong className="font-mono text-slate-200">{prediction.id}</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => generatePDFReport(prediction)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download PDF Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulation Recommendation & Degradation Mechanisms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recommendation Box */}
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 text-cyan-400 mb-3">
            <Sliders className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Formulation Scientist Guidance</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 font-medium">
            {prediction.recommendation}
          </p>
        </div>

        {/* Degradation Mechanisms */}
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 text-amber-400 mb-3">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Potential Degradation Pathways</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {prediction.degradationMechanisms.map((mech, idx) => (
              <li key={idx} className="flex items-start space-x-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span>{mech}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* SHAP Feature Importance Waterfall & Bar Plot */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>SHAP (SHapley Additive exPlanations) Feature Impact</span>
            </h3>
            <p className="text-xs text-slate-400">Features shifting the prediction towards Compatibility (+ Weight) or Incompatibility (- Weight)</p>
          </div>

          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
            Explainable AI Vector
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={shapChartData} margin={{ top: 10, right: 30, left: 140, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#E2E8F0' }} width={130} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  fontSize: '12px' 
                }} 
              />
              <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                {shapChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed SHAP Feature List */}
        <div className="mt-6 divide-y divide-slate-800/60">
          {prediction.shapFeatures.map((sf, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-4">
              <div className="space-y-0.5 max-w-xl">
                <span className="font-bold text-slate-200">{sf.featureName}</span>
                <p className="text-[11px] text-slate-400">{sf.explanation}</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="font-mono text-slate-400">Val: <strong>{sf.featureValue}</strong></span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  sf.shapValue > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {sf.shapValue > 0 ? `+${(sf.shapValue * 100).toFixed(1)}%` : `${(sf.shapValue * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Matrix Screening Results Table (If Executed) */}
      {batchResults.length > 0 && (
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-base font-bold text-slate-100 mb-4">
            Batch Excipient Matrix Screen for API: <span className="text-cyan-300">{activeDrug.name}</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Excipient Candidate</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Prediction Status</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">ΔLogP</th>
                  <th className="p-3">ΔTPSA</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batchResults.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-200">{b.excipient.name}</td>
                    <td className="p-3 text-slate-400">{b.excipient.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Compatible' ? 'bg-emerald-500/10 text-emerald-400' : b.status === 'Possibly Reactive' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-cyan-400 font-bold">{b.confidenceScore}%</td>
                    <td className="p-3 text-slate-400 font-mono">{b.features.diffLogP}</td>
                    <td className="p-3 text-slate-400 font-mono">{b.features.diffTPSA} Å²</td>
                    <td className="p-3">
                      <button
                        onClick={() => generatePDFReport(b)}
                        className="text-cyan-400 hover:underline text-[11px] font-semibold"
                      >
                        PDF Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
