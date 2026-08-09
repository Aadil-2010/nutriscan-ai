import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageOrBarcode: string, mode?: 'barcode' | 'image') => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('Unable to access rear camera. Please check browser permissions.');
      }
    };

    const scanLiveBarcode = async () => {
      if ('BarcodeDetector' in window && videoRef.current && videoRef.current.readyState === 4) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128'],
          });
          const detected = await barcodeDetector.detect(videoRef.current);
          if (detected && detected.length > 0) {
            const code = detected[0].rawValue;
            if (code) {
              onCapture(code, 'barcode');
              return; // Stop scanning loop once detected
            }
          }
        } catch (e) {
          // Continue loop if frame detection fails
        }
      }
      if (isOpen) {
        animationFrameId = requestAnimationFrame(scanLiveBarcode);
      }
    };

    if (isOpen) {
      startCamera().then(() => {
        scanLiveBarcode();
      });
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
    };
  }, [isOpen]);

  const handleManualSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(dataUrl, 'image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 relative">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm sm:text-base flex items-center">
            <Camera className="w-4 h-4 mr-2 text-cyan-400" />
            Live Barcode Scanner
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cameraError ? (
          <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-300 text-center">
            {cameraError}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Target Reticle Frame */}
            <div className="absolute inset-0 border-2 border-cyan-500/30 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-24 border-2 border-dashed border-cyan-400 rounded-lg animate-pulse" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Point camera at barcode. Detected number will fill the input box automatically.
          </span>
          <button
            type="button"
            onClick={handleManualSnapshot}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Capture Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};