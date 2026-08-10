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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('Align barcode inside the laser frame...');

  useEffect(() => {
    if (!isOpen) return;

    let selectedDeviceId: string;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    setCameraError(null);
    setScanMessage('Initializing high-speed scanner...');

    if (mode === 'barcode') {
      codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          // Prefer back/environment facing camera on phones
          const backCamera = videoInputDevices.find((device) =>
            /back|rear|environment/i.test(device.label)
          );
          selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0]?.deviceId;

          return codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                const scannedCode = result.getText();
                if (scannedCode) {
                  setScanMessage(`Scanned: ${scannedCode}`);
                  // Stop scanning and pass scanned GTIN code back
                  codeReader.reset();
                  onCapture(scannedCode, 'barcode');
                }
              }
            }
          );
        })
        .catch((err) => {
          console.error('ZXing camera error:', err);
          setCameraError('Camera access denied or device not supported.');
        });
    } else {
      // Standard camera stream for label photo capture
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => setCameraError('Camera access failed.'));
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
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
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 relative">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm sm:text-base flex items-center">
            {mode === 'barcode' ? (
              <>
                <ScanLine className="w-5 h-5 mr-2 text-cyan-400 animate-pulse" />
                ZXing Laser Barcode Scanner
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
          <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-300 text-center">
            {cameraError}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Laser Viewfinder Box for Barcode Mode */}
            {mode === 'barcode' ? (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-3/4 h-0.5 bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse" />
                <div className="absolute w-4/5 h-24 border-2 border-dashed border-red-500/60 rounded-xl bg-red-500/5 flex items-end justify-center pb-2">
                  <span className="text-[10px] font-mono text-red-300 bg-slate-950/90 px-2 py-0.5 rounded border border-red-500/30">
                    HOLD BARCODE STILL
                  </span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/40 pointer-events-none m-6 rounded-xl flex items-end justify-center pb-4">
                <span className="text-[11px] font-medium text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                  Center food label text
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
          <span className="text-xs text-slate-400 text-center sm:text-left font-mono">
            {mode === 'barcode' ? scanMessage : 'Take a snapshot of the ingredient list.'}
          </span>
          {mode === 'image' && (
            <button
              type="button"
              onClick={handleManualSnapshot}
              className="w-full sm:w-auto px-5 py-2 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg"
            >
              <Camera className="w-4 h-4 mr-1" />
              <span>Capture Label Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};