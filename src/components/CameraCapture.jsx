import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, SwitchCamera } from 'lucide-react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');

  const startCamera = useCallback(async (mode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsStreaming(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode || facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line

  const switchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const MAX = 480;
    const ratio = Math.min(MAX / video.videoWidth, MAX / video.videoHeight);
    const w = Math.round(video.videoWidth * ratio);
    const h = Math.round(video.videoHeight * ratio);
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedPhoto(dataUrl);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      setIsStreaming(false);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold text-lg">Take Photo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        {/* Preview */}
        <div className="relative bg-black" style={{ aspectRatio: '1/1' }}>
          {capturedPhoto ? (
            <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6">
                  <p className="text-red-400 text-center text-sm">{error}</p>
                </div>
              )}
              {!isStreaming && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Guide circle */}
          {!capturedPhoto && isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white/30 rounded-full" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 flex items-center gap-3">
          {capturedPhoto ? (
            <>
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3.5 rounded-2xl font-medium transition-colors"
              >
                <RefreshCw size={18} /> Retake
              </button>
              <button
                onClick={() => { onCapture(capturedPhoto); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-semibold transition-colors"
              >
                <Check size={18} /> Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={switchCamera}
                className="flex items-center justify-center w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl transition-colors"
              >
                <SwitchCamera size={20} />
              </button>
              <button
                onClick={takePhoto}
                disabled={!isStreaming}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-3.5 rounded-2xl font-semibold transition-colors"
              >
                <Camera size={20} /> Capture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
