import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Scan, Barcode } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  mode: 'label' | 'barcode';
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  mode,
  onClose,
  onCapture,
  onBarcodeDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, []);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  const handleTakeSnapshot = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        return dataUrl;
      }
    }
    return null;
  }, [stopCamera]);

  // Real-time automatic barcode scanning loop (Active only when mode === 'barcode')
  useEffect(() => {
    if (!isOpen || mode !== 'barcode' || capturedImage || cameraError) return;

    let animationFrameId: number;
    let detector: any = null;

    if ('BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (err) {
        console.warn('BarcodeDetector error:', err);
      }
    }

    const autoScan = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (detector) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detectedCode = barcodes[0].rawValue;
              onBarcodeDetected(detectedCode);
              stopCamera();
              onClose();
              return;
            }
          } catch (e) {
            // Frame detection error ignored during active stream
          }
        }
      }
      animationFrameId = requestAnimationFrame(autoScan);
    };

    animationFrameId = requestAnimationFrame(autoScan);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, mode, capturedImage, cameraError, onBarcodeDetected, stopCamera, onClose]);

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            {mode === 'barcode' ? (
              <Barcode className="w-5 h-5 text-emerald-400" />
            ) : (
              <Camera className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="font-semibold text-lg text-white">
              {mode === 'barcode' ? 'Auto Barcode Scanner' : 'Capture Food Label Photo'}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Preview Viewport */}
        <div className="my-4 relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm text-slate-300">{cameraError}</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured label" className="w-full h-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {/* Overlay graphics */}
              {mode === 'barcode' ? (
                <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex flex-col items-center justify-between p-3 bg-emerald-500/5">
                  <span className="bg-slate-950/80 backdrop-blur text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <Scan className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    Scanning Barcode Automatically...
                  </span>
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
                  <span className="bg-slate-950/70 text-slate-300 text-[11px] px-2.5 py-0.5 rounded-full">
                    Center Barcode Within Box
                  </span>
                </div>
              ) : (
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-950/70 backdrop-blur text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                    Align Ingredient Label Here
                  </span>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Use Label Photo</span>
              </button>
            </>
          ) : mode === 'label' ? (
            <button
              disabled={Boolean(cameraError)}
              onClick={handleTakeSnapshot}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>Take Label Photo</span>
            </button>
          ) : (
            <div className="w-full text-center text-xs text-slate-400 py-2">
              Hold camera steady over barcode to auto-detect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};