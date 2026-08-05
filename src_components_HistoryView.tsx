import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  FileText, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap 
} from 'lucide-react';
import { CompatibilityPrediction } from '../types';
import { generatePDFReport } from '../utils/pdfExporter';

interface HistoryViewProps {
  history: CompatibilityPrediction[];
  onSelectPrediction: (pred: CompatibilityPrediction) => void;
  onDeletePrediction: (id: string) => void;
  isDarkMode: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectPrediction,
  onDeletePrediction,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.excipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.drug.smiles.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.excipient.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Escape CSV field properly handling quotes, commas, and newlines
  const escapeCSVField = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Export CSV function with UTF-8 BOM for Excel/Sheets compatibility
  const handleExportCSV = () => {
    const itemsToExport = filteredHistory;
    if (itemsToExport.length === 0) return;

    const headers = [
      'Report ID',
      'Timestamp',
      'Drug Name',
      'Drug SMILES',
      'Therapeutic Category',
      'Excipient Name',
      'Excipient Category',
      'Typical Concentration',
      'Status',
      'Confidence Score (%)',
      'Compatibility Coeff',
      'Delta LogP',
      'Delta MW (g/mol)',
      'Delta TPSA (A^2)',
      'Maillard Risk',
      'Metal Chelation Risk',
      'SHAP Summary',
      'Degradation Mechanisms',
      'Formulation Recommendation'
    ];

    const rows = itemsToExport.map(item => [
      item.id,
      new Date(item.timestamp).toISOString(),
      item.drug.name,
      item.drug.smiles,
      item.drug.therapeuticCategory || 'N/A',
      item.excipient.name,
      item.excipient.category || 'N/A',
      item.excipient.typicalConcentration || 'N/A',
      item.status,
      item.confidenceScore,
      item.features?.compatibilityCoeff ?? '',
      item.features?.diffLogP ?? '',
      item.features?.diffMW ?? '',
      item.features?.diffTPSA ?? '',
      item.features?.maillardReactionRisk ? 'YES' : 'NO',
      item.features?.metalChelationRisk ? 'YES' : 'NO',
      item.shapExplanationSummary || '',
      item.degradationMechanisms ? item.degradationMechanisms.join('; ') : '',
      item.recommendation || ''
    ]);

    const csvRows = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(row => row.map(escapeCSVField).join(','))
    ];

    // Include UTF-8 BOM (\uFEFF) for Excel compatibility
    const csvString = csvRows.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestampStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `PharmaForm_Compatibility_History_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Prediction Audit Log & History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete records of historical drug-excipient machine learning compatibility predictions and analytical reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredHistory.length === 0}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors flex items-center space-x-2 shrink-0"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export CSV ({filteredHistory.length} {filteredHistory.length === 1 ? 'Record' : 'Records'})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className={`p-5 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by drug API, excipient, or SMILES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="all">All Prediction Statuses</option>
              <option value="Compatible">Compatible Only</option>
              <option value="Possibly Reactive">Possibly Reactive Only</option>
              <option value="Incompatible">Incompatible Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Prediction History Table */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-semibold">No predictions matched your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Active API (Drug)</th>
                  <th className="p-3">Excipient</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">SHAP Summary</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.map(item => {
                  const isComp = item.status === 'Compatible';
                  const isReac = item.status === 'Possibly Reactive';
                  const formattedTime = new Date(item.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{formattedTime}</td>
                      <td className="p-3 font-bold text-slate-100">{item.drug.name}</td>
                      <td className="p-3 text-cyan-300 font-semibold">{item.excipient.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isComp 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : isReac 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-cyan-400 font-bold">{item.confidenceScore}%</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{item.shapExplanationSummary}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onSelectPrediction(item)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => generatePDFReport(item)}
                            title="Download PDF Certificate"
                            className="p-1 rounded text-slate-400 hover:text-slate-200"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeletePrediction(item.id)}
                            title="Delete Record"
                            className="p-1 rounded text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
