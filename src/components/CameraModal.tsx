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
  const [scanMessage, setScanMessage] = useState<string>('Initializing high-speed scanner...');

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let codeReader: BrowserMultiFormatReader | null = null;

    setCameraError(null);

    const initCameraAndScanner = async () => {
      try {
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

        if (mode === 'barcode') {
          setScanMessage('Align barcode inside the laser frame...');
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
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div
        className={`bg-slate-900 border border-slate-800 w-full ${
          mode === 'barcode' ? 'max-w-3xl' : 'max-w-md'
        } rounded-2xl overflow-hidden shadow-2xl relative transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm sm:text-base flex items-center">
            {mode === 'barcode' ? (
              <>
                <ScanLine className="w-5 h-5 mr-2 text-cyan-400 animate-pulse" />
                ZXing Laser Barcode Scanner
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2 text-cyan-400" />
                Capture Food Label
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-4 space-y-4">
          {cameraError ? (
            <div className="bg-rose-950/40 border border-rose-500/30 p-6 rounded-xl text-xs sm:text-sm text-rose-300 text-center">
              {cameraError}
            </div>
          ) : (
            <div
              className={`relative rounded-xl overflow-hidden bg-slate-950 ${
                mode === 'barcode' ? 'aspect-video' : 'aspect-square'
              } flex items-center justify-center shadow-inner`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* BARCODE LASER OVERLAY */}
              {mode === 'barcode' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-4/5 h-0.5 bg-red-500 shadow-[0_0_20px_#ef4444] animate-pulse" />
                  <div className="absolute w-5/6 h-32 border-2 border-dashed border-red-500/70 rounded-2xl bg-red-500/5 flex items-end justify-center pb-2">
                    <span className="text-[10px] font-mono font-bold text-red-200 bg-slate-950/90 px-3 py-1 rounded-full border border-red-500/40">
                      HOLD BARCODE STILL
                    </span>
                  </div>
                </div>
              )}

              {/* RESTORED ORIGINAL LABEL OVERLAY */}
              {mode === 'image' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-full h-full border-2 border-dashed border-cyan-400/60 rounded-2xl flex items-center justify-center">
                    <span className="text-xs font-mono font-medium text-cyan-200 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
                      Autofocus Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {mode === 'barcode' ? (
            <div className="text-center pt-1 pb-2">
              <span className="text-xs text-slate-400 font-mono">{scanMessage}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <button
                type="button"
                onClick={handleManualSnapshot}
                className="group relative w-16 h-16 rounded-full border-4 border-cyan-400/80 flex items-center justify-center p-1 transition-transform active:scale-95 hover:border-cyan-300"
              >
                <div className="w-full h-full rounded-full bg-cyan-400 group-hover:bg-cyan-300 transition-colors" />
              </button>
              <span className="text-xs text-slate-400 font-medium">
                Tap shutter button to capture image
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};