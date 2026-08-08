import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  mode?: 'label' | 'barcode';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'label'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // @ts-ignore
          advanced: [{ focusMode: 'continuous' }]
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        
        // @ts-ignore
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          try {
            await track.applyConstraints({
              // @ts-ignore
              advanced: [{ focusMode: 'continuous' }]
            });
          } catch (err) {
            console.log("Hardware autofocus fallback:", err);
          }
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Unable to access camera. Please allow camera permissions in browser/phone settings.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleShutterClick = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      onCapture(imageDataUrl);
      stopCamera();
      onClose();
    }

    setIsCapturing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              {mode === 'barcode' ? 'Center Barcode' : 'Capture Food Label'}
            </h3>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-400">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs">{cameraError}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />

              {/* Autofocus Frame Overlay */}
              <div className="absolute inset-12 border-2 border-dashed border-cyan-400/80 rounded-2xl pointer-events-none flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
                  Autofocus Active
                </span>
              </div>
            </>
          )}
        </div>

        {/* Shutter Capture Controls */}
        <div className="p-6 bg-slate-900 flex flex-col items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleShutterClick}
            disabled={isCapturing || Boolean(cameraError)}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-1 shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              {isCapturing ? (
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 group-hover:scale-105 transition-transform" />
              )}
            </div>
          </button>
          
          <span className="text-xs text-slate-400 font-medium">
            {cameraError ? "Allow camera permissions to proceed" : "Tap shutter button to capture image"}
          </span>
        </div>

      </div>
    </div>
  );
};