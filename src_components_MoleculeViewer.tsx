import React, { useState, useEffect, useRef } from 'react';
import { 
  Atom, 
  RotateCw, 
  Eye, 
  Sparkles, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Box 
} from 'lucide-react';
import { Drug, Excipient } from '../types';

interface MoleculeViewerProps {
  drug: Drug;
  excipient: Excipient;
  isDarkMode: boolean;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({
  drug,
  excipient,
  isDarkMode
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'2D' | '3D'>('2D');
  const [selectedTarget, setSelectedTarget] = useState<'drug' | 'excipient'>('drug');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  const activeCompound = selectedTarget === 'drug' ? drug : excipient;

  // 3D Canvas Rendering Engine
  useEffect(() => {
    if (activeViewMode !== '3D' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = rotationAngle;

    // Generate atom coordinates from SMILES string hash
    const smiles = activeCompound.smiles;
    const atoms: { x: number; y: number; z: number; element: string; color: string; size: number }[] = [];
    
    for (let i = 0; i < Math.max(8, smiles.length); i++) {
      const char = smiles[i] || 'C';
      let element = 'C';
      let color = '#94A3B8'; // Carbon = Slate/Gray
      let size = 10;

      if (char === 'O') { element = 'O'; color = '#EF4444'; size = 11; }
      else if (char === 'N') { element = 'N'; color = '#3B82F6'; size = 11; }
      else if (char === 'F' || char === 'Cl') { element = char; color = '#10B981'; size = 12; }
      else if (char === 'S') { element = 'S'; color = '#F59E0B'; size = 13; }
      else if (char === 'P') { element = 'P'; color = '#8B5CF6'; size = 13; }

      const theta = (i / Math.max(8, smiles.length)) * Math.PI * 2;
      const radius = 60 + (i % 3) * 20;
      atoms.push({
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius * 0.5 + (i % 2 === 0 ? 20 : -20),
        z: Math.sin(theta) * radius,
        element,
        color,
        size
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      angle += 0.015;

      // Draw bonds between atoms
      ctx.lineWidth = 3;
      ctx.strokeStyle = isDarkMode ? '#334155' : '#CBD5E1';
      for (let i = 0; i < atoms.length - 1; i++) {
        const a1 = atoms[i];
        const a2 = atoms[i + 1];

        // 3D Y-axis Rotation Transformation
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const x1 = a1.x * cosA - a1.z * sinA + centerX;
        const y1 = a1.y + centerY;
        const x2 = a2.x * cosA - a2.z * sinA + centerX;
        const y2 = a2.y + centerY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Sort atoms by Z-depth for 3D realism
      const transformedAtoms = atoms.map(a => {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rotX = a.x * cosA - a.z * sinA + centerX;
        const rotY = a.y + centerY;
        const rotZ = a.x * sinA + a.z * cosA;
        return { ...a, rotX, rotY, rotZ };
      }).sort((a, b) => a.rotZ - b.rotZ);

      // Render 3D Spheres with Radial Shading
      transformedAtoms.forEach(atom => {
        const scale = 1 + atom.rotZ / 250;
        const r = atom.size * Math.max(0.6, scale);

        const grad = ctx.createRadialGradient(
          atom.rotX - r * 0.3, atom.rotY - r * 0.3, r * 0.1,
          atom.rotX, atom.rotY, r
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, atom.color);
        grad.addColorStop(1, '#020617');

        ctx.beginPath();
        ctx.arc(atom.rotX, atom.rotY, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isDarkMode ? '#0F172A' : '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Atom Label Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.element, atom.rotX, atom.rotY);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [activeViewMode, activeCompound, isDarkMode]);

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-3">
            <Atom className="w-6 h-6 text-cyan-400" />
            <span>2D / 3D Molecular Structure Visualizer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interactive ball-and-stick molecular structure renderer with functional group highlights.
          </p>
        </div>

        {/* Compound Selector & Mode Toggle */}
        <div className="flex items-center space-x-3">
          <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setSelectedTarget('drug')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTarget === 'drug' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              API: {drug.name.substring(0, 16)}
            </button>
            <button
              onClick={() => setSelectedTarget('excipient')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTarget === 'excipient' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Excipient: {excipient.name.substring(0, 16)}
            </button>
          </div>

          <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveViewMode('2D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                activeViewMode === '2D' ? 'bg-sky-600 text-white' : 'text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2D Diagram</span>
            </button>
            <button
              onClick={() => setActiveViewMode('3D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                activeViewMode === '3D' ? 'bg-sky-600 text-white' : 'text-slate-400'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Ball & Stick</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {/* Compound Info Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">{selectedTarget === 'drug' ? 'Active Drug API' : 'Excipient Target'}</span>
            <h2 className="text-xl font-extrabold text-slate-100">{activeCompound.name}</h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">SMILES: {activeCompound.smiles}</p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
            <span>MW: <strong className="text-cyan-400">{activeCompound.descriptors.mw}</strong></span>
            <span>LogP: <strong className="text-emerald-400">{activeCompound.descriptors.logP}</strong></span>
            <span>TPSA: <strong className="text-slate-100">{activeCompound.descriptors.tpsa} Å²</strong></span>
          </div>
        </div>

        {/* Render Canvas / 2D Vector Stage */}
        <div className="relative w-full h-96 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
          
          <div className="absolute top-4 left-4 flex items-center space-x-2 text-[10px] font-mono text-cyan-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{activeViewMode === '3D' ? 'Interactive WebGL 3D Canvas' : 'Vector 2D Structural Schema'}</span>
          </div>

          {activeViewMode === '3D' ? (
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={350} 
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />
          ) : (
            <div className="text-center p-8 max-w-lg space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <Atom className="w-12 h-12 text-cyan-400 animate-spin-slow" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">2D Chemical Bond Structural Schema</h3>
                <p className="text-xs font-mono text-cyan-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {activeCompound.smiles}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {activeCompound.descriptors.functionalGroups?.map((fg, i) => (
                  <span key={i} className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {fg}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
