import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Camera } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (data: string, mode: 'barcode' | 'image') => void;
  mode?: 'barcode' | 'image';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'barcode',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('Initializing camera...');

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let codeReader: BrowserMultiFormatReader | null = null;

    setCameraError(null);

    const initCameraAndScanner = async () => {
      try {
        // Step 1: Explicitly request camera permissions through native Web API first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        });

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Step 2: Attach ZXing barcode reader only in barcode mode
        if (mode === 'barcode') {
          setScanMessage('Align barcode inside the red frame...');
          codeReader = new BrowserMultiFormatReader();

          codeReader.decodeFromVideoElement(videoRef.current!, (result) => {
            if (result) {
              const code = result.getText();
              if (code) {
                setScanMessage(`Scanned GTIN: ${code}`);
                if (codeReader) codeReader.reset();
                if (activeStream) {
                  activeStream.getTracks().forEach((track) => track.stop());
                }
                onCapture(code, 'barcode');
              }
            }
          });
        } else {
          setScanMessage('Point camera at ingredient list and tap Take Photo.');
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          'Camera access blocked or unavailable. Please check your browser site permissions.'
        );
      }
    };

    initCameraAndScanner();

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, mode]);

  const handleManualSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl, 'image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-slate-900 border border-slate-800 w-full ${
          mode === 'barcode' ? 'max-w-3xl' : 'max-w-xl'
        } rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4 relative transition-all`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm sm:text-base flex items-center">
            {mode === 'barcode' ? (
              <>
                <ScanLine className="w-5 h-5 mr-2 text-cyan-400 animate-pulse" />
                High-Precision Barcode Scanner
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2 text-emerald-400" />
                Capture Ingredient Label Photo
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cameraError ? (
          <div className="bg-rose-950/40 border border-rose-500/30 p-6 rounded-xl text-xs sm:text-sm text-rose-300 text-center">
            {cameraError}
          </div>
        ) : (
          <div
            className={`relative rounded-xl overflow-hidden bg-slate-950 ${
              mode === 'barcode' ? 'aspect-video' : 'aspect-[4/3]'
            } flex items-center justify-center shadow-inner`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlays */}
            {mode === 'barcode' ? (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-4/5 h-0.5 bg-red-500 shadow-[0_0_20px_#ef4444] animate-pulse" />
                <div className="absolute w-5/6 h-36 border-2 border-dashed border-red-500/70 rounded-2xl bg-red-500/5 flex items-end justify-center pb-3">
                  <span className="text-xs font-mono font-bold text-red-200 bg-slate-950/90 px-3 py-1 rounded-full border border-red-500/40">
                    ALIGN BARCODE HERE
                  </span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/40 pointer-events-none m-6 rounded-xl flex items-end justify-center pb-4">
                <span className="text-[11px] font-medium text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                  Center food ingredient list inside frame
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between pt-1 gap-3">
          <span className="text-xs text-slate-400 text-center sm:text-left font-mono">
            {scanMessage}
          </span>
          {mode === 'image' && (
            <button
              type="button"
              onClick={handleManualSnapshot}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg transition-all"
            >
              <Camera className="w-4 h-4 mr-2" />
              <span>Take Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};