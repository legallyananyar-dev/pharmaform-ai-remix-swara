import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Pill, 
  Layers, 
  AlertTriangle, 
  Lightbulb, 
  Loader2 
} from 'lucide-react';
import { Drug, Excipient, FormulationCopilotMessage } from '../types';

interface AIFormulationAssistantProps {
  currentDrug: Drug;
  currentExcipient: Excipient;
  isDarkMode: boolean;
}

export const AIFormulationAssistant: React.FC<AIFormulationAssistantProps> = ({
  currentDrug,
  currentExcipient,
  isDarkMode
}) => {
  const [messages, setMessages] = useState<FormulationCopilotMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Hello! I am your AI Formulation Scientist Copilot. I can assist you with drug-excipient compatibility troubleshooting, excipient substitutions, degradation pathway analysis (Maillard, hydrolysis, oxidation), and wet vs dry granulation process optimization for active API **${currentDrug.name}** and excipient **${currentExcipient.name}**. How can I help with your formulation research today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const presetQueries = [
    `Suggest non-reducing sugar excipient replacements for ${currentDrug.name}`,
    `How to prevent Magnesium Stearate metal chelation during tablet compaction?`,
    `Wet granulation vs direct compression suitability for ${currentDrug.name}`,
    `Explain Maillard condensation reaction mechanism with primary amine APIs`
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: FormulationCopilotMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentDrug,
          currentExcipient
        })
      });

      const data = await response.json();
      const assistantMsg: FormulationCopilotMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned from formulation copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: 'assistant',
          content: 'Formulation Scientist Copilot unavailable. Please ensure process.env.GEMINI_API_KEY is configured in Secrets panel.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>AI Formulation Scientist R&D Copilot</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gemini 3.6 Flash powered industrial assistant for excipient substitution, degradation pathways, and process parameter optimization.
          </p>
        </div>

        {/* Current Context Pill */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <span className="text-slate-400">Context:</span>
          <span className="text-cyan-300 font-bold">{currentDrug.name}</span>
          <span className="text-slate-500">+</span>
          <span className="text-emerald-400 font-bold">{currentExcipient.name}</span>
        </div>
      </div>

      {/* Preset Scientist Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {presetQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className={`p-3 rounded-xl border text-left text-xs transition-all hover:scale-[1.01] ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 text-slate-300' 
                : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold text-[10px] uppercase">R&D Prompt</span>
            </div>
            <p className="font-medium line-clamp-2">{q}</p>
          </button>
        ))}
      </div>

      {/* Chat Container Stage */}
      <div className={`rounded-2xl border flex flex-col h-[520px] overflow-hidden ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
      }`}>
        
        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser 
                    ? 'bg-sky-600 text-white' 
                    : 'bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-bold'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-sky-600 text-white rounded-tr-none' 
                    : isDarkMode 
                      ? 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between mb-1 text-[10px] opacity-75">
                    <span className="font-bold">{isUser ? 'Formulation Scientist' : 'PharmaForm AI Copilot'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 text-cyan-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Consulting Gemini AI Formulation Knowledge Base...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask copilot about excipient substitution, wet vs dry granulation, or degradation chemistry..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className={`w-full text-xs rounded-xl px-4 py-3 border outline-none ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-5 py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0 flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send Query</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
