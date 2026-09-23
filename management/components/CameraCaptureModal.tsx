'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashEffect, setFlashEffect] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopCamera();
    setIsInitializing(true);
    setErrorMessage('');
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or requires a secure (HTTPS or localhost) connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCamera(true);
    } catch (err: unknown) {
      console.error('Camera error:', err);
      setHasCamera(false);
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was detected on your device.');
      } else {
        setErrorMessage(error.message || 'Unable to access camera.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setErrorMessage('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Capture current frame
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    // Flash animation
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Crop to centered square for neat guard ID photo
    const minDim = Math.min(width, height);
    const startX = (width - minDim) / 2;
    const startY = (height - minDim) / 2;

    canvas.width = 600;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user front camera, mirror image back to natural orientation
      if (facingMode === 'user') {
        ctx.translate(600, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 600, 600);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopCamera();
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#040936] text-white rounded-3xl overflow-hidden shadow-2xl border border-[#C9A84C]/30 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Live Guard Photo</h3>
              <p className="text-xs text-slate-300">Align face inside the guide frame</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative aspect-square max-h-[360px] sm:max-h-[400px] w-full bg-black overflow-hidden flex items-center justify-center">
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-200" />
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Video */}
          {!capturedPhoto && (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
          )}

          {/* Captured Preview */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Loading State */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <svg className="animate-spin w-8 h-8 text-[#C9A84C] mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-slate-300">Accessing Camera...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#040936]/95 p-6 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white mb-1">Camera Unavailable</p>
              <p className="text-xs text-slate-300 max-w-xs mb-4">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-1.5 rounded-lg bg-[#C9A84C] text-[#040936] text-xs font-semibold hover:bg-[#b8953d] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Overlay Grid / Face Oval Guide (only when live) */}
          {!capturedPhoto && !errorMessage && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Oval cutout frame */}
              <div className="w-56 h-64 border-2 border-dashed border-[#C9A84C]/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative flex items-center justify-center">
                <div className="absolute -top-6 text-[11px] font-medium tracking-wide bg-[#040936]/80 text-[#C9A84C] px-2.5 py-0.5 rounded-full border border-[#C9A84C]/40">
                  CENTER GUARD FACE
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-5 bg-[#030628] border-t border-white/10 flex flex-col items-center gap-3">
          {!capturedPhoto ? (
            <div className="w-full flex items-center justify-between px-2">
              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={isInitializing || !!errorMessage}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors disabled:opacity-40"
                title="Switch Camera (Front/Rear)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isInitializing || !!errorMessage}
                className="w-16 h-16 rounded-full border-4 border-[#C9A84C] bg-white hover:bg-slate-100 flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                title="Take Photo"
              >
                <div className="w-11 h-11 rounded-full bg-[#040936] flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-[#C9A84C]" />
                </div>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake Photo
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#dfbf63] hover:brightness-105 text-[#040936] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Use This Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
