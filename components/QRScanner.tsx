
import React, { useRef, useEffect, useState } from 'react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onCancel: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulating a successful scan for this demo app 
  // since we don't have a JS QR library bundled in this prompt
  const simulateScan = () => {
    onScan("SCANNED_GUEST_QR_" + Date.now());
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-6 animate-page-enter">
      <div className="relative w-full max-w-sm aspect-square border-2 border-white/20 rounded-[40px] overflow-hidden shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-10 text-center bg-slate-900">
            <p className="text-white text-sm font-bold uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover grayscale brightness-125 contrast-125"
          />
        )}
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-amber-500 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
             <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500 animate-[scan_2s_infinite]"></div>
          </div>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-amber-500 rounded-2xl z-20"></div>
        </div>

        {/* Demo trigger */}
        {!error && (
           <button 
             onClick={simulateScan}
             className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest border border-white/20"
           >
             Tap to Simulasikan Scan
           </button>
        )}
      </div>

      <div className="mt-12 text-center space-y-2">
        <h4 className="text-white text-lg font-black uppercase tracking-tight">Pindai QR Buku Tamu</h4>
        <p className="text-white/40 text-xs font-medium max-w-xs mx-auto">Arahkan kamera ke QR Code yang terpasang di Gerbang atau Pos Penjagaan RT 05.</p>
      </div>

      <button 
        onClick={onCancel}
        className="mt-16 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
