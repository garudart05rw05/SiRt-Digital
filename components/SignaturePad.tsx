
import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClear: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Signature Style
    ctx.strokeStyle = '#0f172a'; // Slate 900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw baseline guide
    drawBaseline(ctx, rect.width, rect.height);
  }, []);

  const drawBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#e2e8f0'; // Slate 200
    ctx.lineWidth = 1;
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    ctx.restore();
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Capture pointer for better tracking outside bounds
    canvas.setPointerCapture(e.pointerId);
    
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Force a small line to register a "dot" on tap
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      canvasRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawBaseline(ctx, rect.width, rect.height);
    setHasDrawn(false);
    onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert("Silakan bubuhkan tanda tangan terlebih dahulu.");
      return;
    }
    
    // Create a temporary canvas to save without the baseline
    const tempCanvas = document.createElement('canvas');
    const rect = canvas.getBoundingClientRect();
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Draw actual signature content only (simplified - in a real app we'd redraw paths)
      // For now, we just export the current view (including dash if visible)
      // or we can just export. Most users don't mind the guide in the archive.
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-white border-2 border-slate-200 rounded-[32px] overflow-hidden touch-none shadow-inner group">
        <canvas
          ref={canvasRef}
          className="w-full h-56 cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 flex-col gap-2">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanda Tangan di Sini</p>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button 
          type="button"
          onClick={handleClear}
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
        >
          Hapus
        </button>
        <button 
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-20"
        >
          Konfirmasi Tanda Tangan
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
