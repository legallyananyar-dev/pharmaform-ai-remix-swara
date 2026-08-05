/**
 * PharmaForm AI — AI-Powered Drug–Excipient Compatibility Prediction Platform
 */
import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DrugInputView } from './components/DrugInputView';
import { ExcipientLibraryView } from './components/ExcipientLibraryView';
import { PredictionView } from './components/PredictionView';
import { MoleculeViewer } from './components/MoleculeViewer';
import { HistoryView } from './components/HistoryView';
import { AIFormulationAssistant } from './components/AIFormulationAssistant';
import { GoogleDriveManager } from './components/GoogleDriveManager';

import { INITIAL_DRUGS } from './data/drugDatabase';
import { INITIAL_EXCIPIENTS } from './data/excipientLibrary';
import { predictCompatibility } from './utils/mlEngine';
import { Drug, Excipient, CompatibilityPrediction, DashboardMetrics } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [drugs, setDrugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [excipients, setExcipients] = useState<Excipient[]>(INITIAL_EXCIPIENTS);

  const [selectedDrug, setSelectedDrug] = useState<Drug>(INITIAL_DRUGS[0]);
  const [selectedExcipient, setSelectedExcipient] = useState<Excipient>(INITIAL_EXCIPIENTS[0]);

  const [history, setHistory] = useState<CompatibilityPrediction[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<CompatibilityPrediction | null>(null);

  // Fetch initial prediction history & metrics from API or compute local fallback
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data: CompatibilityPrediction[] = await res.json();
          if (data && data.length > 0) {
            setHistory(data);
            setCurrentPrediction(data[0]);
            return;
          }
        }
      } catch (err) {
        console.log('Using initial fallback history');
      }

      // Initial fallback predictions
      const initialPredictions = [
        predictCompatibility(INITIAL_DRUGS[0], INITIAL_EXCIPIENTS[0]), // Paracetamol + Lactose
        predictCompatibility(INITIAL_DRUGS[0], INITIAL_EXCIPIENTS[1]), // Paracetamol + MCC
        predictCompatibility(INITIAL_DRUGS[6], INITIAL_EXCIPIENTS[0]), // Fluoxetine + Lactose (Maillard Incompatible)
        predictCompatibility(INITIAL_DRUGS[7], INITIAL_EXCIPIENTS[6]), // Ciprofloxacin + Mg Stearate (Metal Chelation Incompatible)
        predictCompatibility(INITIAL_DRUGS[1], INITIAL_EXCIPIENTS[5]), // Ibuprofen + Mannitol
        predictCompatibility(INITIAL_DRUGS[2], INITIAL_EXCIPIENTS[11]),// Aspirin + Citric Acid (Ester Hydrolysis)
      ];

      setHistory(initialPredictions);
      setCurrentPrediction(initialPredictions[0]);
    }

    loadData();
  }, []);

  // Compute live dashboard metrics
  const totalPredictions = history.length;
  const compatibleCount = history.filter(p => p.status === 'Compatible').length;
  const reactiveCount = history.filter(p => p.status === 'Possibly Reactive').length;
  const incompatibleCount = history.filter(p => p.status === 'Incompatible').length;
  const avgConfidence = totalPredictions > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.confidenceScore, 0) / totalPredictions)
    : 94;

  const excMap: Record<string, { count: number; category: string }> = {};
  history.forEach(p => {
    const name = p.excipient.name;
    if (!excMap[name]) excMap[name] = { count: 0, category: p.excipient.category };
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
    recentAnalyses: history.slice(0, 6)
  };

  // Run prediction handler
  const handleRunPrediction = async (drug: Drug, excipient: Excipient) => {
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drug, excipient })
      });

      if (res.ok) {
        const newPred: CompatibilityPrediction = await res.json();
        setCurrentPrediction(newPred);
        setHistory(prev => [newPred, ...prev]);
        setActiveTab('predict');
        return;
      }
    } catch (err) {
      console.log('API call fallback to client ML calculation');
    }

    const newPred = predictCompatibility(drug, excipient);
    setCurrentPrediction(newPred);
    setHistory(prev => [newPred, ...prev]);
    setActiveTab('predict');
  };

  const handleAddCustomDrug = (newDrug: Drug) => {
    setDrugs(prev => [newDrug, ...prev]);
    setSelectedDrug(newDrug);
  };

  const handleDeletePrediction = async (id: string) => {
    setHistory(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            drugs={drugs}
            excipients={excipients}
            onSelectPrediction={(pred) => {
              setCurrentPrediction(pred);
              setSelectedDrug(pred.drug);
              setSelectedExcipient(pred.excipient);
              setActiveTab('predict');
            }}
            onRunQuickPredict={(drug, excipient) => {
              setSelectedDrug(drug);
              setSelectedExcipient(excipient);
              handleRunPrediction(drug, excipient);
            }}
            setActiveTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'drug-input' && (
          <DrugInputView
            drugs={drugs}
            selectedDrug={selectedDrug}
            setSelectedDrug={setSelectedDrug}
            onAddCustomDrug={handleAddCustomDrug}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'excipients' && (
          <ExcipientLibraryView
            excipients={excipients}
            selectedExcipient={selectedExcipient}
            setSelectedExcipient={setSelectedExcipient}
            onRunScreeningWithExcipient={(exc) => {
              setSelectedExcipient(exc);
              handleRunPrediction(selectedDrug, exc);
            }}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'predict' && (
          <PredictionView
            drugs={drugs}
            excipients={excipients}
            currentPrediction={currentPrediction}
            onRunPrediction={handleRunPrediction}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'viewer' && (
          <MoleculeViewer
            drug={selectedDrug}
            excipient={selectedExcipient}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectPrediction={(pred) => {
              setCurrentPrediction(pred);
              setSelectedDrug(pred.drug);
              setSelectedExcipient(pred.excipient);
              setActiveTab('predict');
            }}
            onDeletePrediction={handleDeletePrediction}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'copilot' && (
          <AIFormulationAssistant
            currentDrug={selectedDrug}
            currentExcipient={selectedExcipient}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'gdrive' && (
          <GoogleDriveManager
            history={history}
            onRestoreHistory={(restored) => setHistory(restored)}
            currentPrediction={currentPrediction}
            isDarkMode={isDarkMode}
          />
        )}

      </main>

      {/* Professional Footer */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PharmaForm AI — Industrial Drug–Excipient Compatibility Prediction Platform</p>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Random Forest Model v2.4</span>
            <span>RDKit Engine</span>
            <span>SHAP Explainable AI</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
