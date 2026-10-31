import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  SwitchCamera, 
  Upload, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface VisitorPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  visitorName?: string;
}

export default function VisitorPhotoCaptureModal({
  isOpen,
  onClose,
  onCapture,
  visitorName = 'Visitor'
}: VisitorPhotoCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setLoadingCamera(true);
    setCameraError(null);
    stopStream();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.');
      setLoadingCamera(false);
      return;
    }

    try {
      // Check available devices for camera flip option
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {}

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setLoadingCamera(false);
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings or upload a photo directly.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device. You can upload a photo from your file manager.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is already in use by another application. Please close other camera apps and retry.';
      }
      setCameraError(message);
      setLoadingCamera(false);
    }
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const handleUsePhoto = () => {
    if (!capturedPhoto) return;
    onCapture(capturedPhoto);
    stopStream();
    onClose();
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Fallback file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A174E] via-[#5229AB] to-[#6339CA] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/15">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Capture Visitor Live Photo</span>
              </h3>
              <p className="text-xs text-purple-200 font-medium">
                Identity Verification · {visitorName}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Section */}
        <div className="p-5 space-y-4 bg-slate-900 flex flex-col items-center justify-center relative min-h-[340px]">
          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {capturedPhoto ? (
            /* Captured Photo Preview */
            <div className="relative w-full aspect-4/3 max-w-md rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl bg-black flex items-center justify-center">
              <img 
                src={capturedPhoto} 
                alt="Captured visitor" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Captured</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Error / Permission Fallback View */
            <div className="text-center p-6 space-y-4 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">Camera Unavailable</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo File</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream View */
            <div className="relative w-full aspect-4/3 max-w-md rounded-2xl overflow-hidden border border-purple-500/40 bg-black flex items-center justify-center">
              {loadingCamera && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2 z-10 text-purple-300">
                  <RefreshCw className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-bold">Initializing Live Camera...</span>
                </div>
              )}

              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />

              {/* Facial Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-56 rounded-3xl border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Align visitor face inside frame
                  </div>
                </div>
              </div>

              {/* Camera Flip Button */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                  title="Switch Front/Rear Camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium">Stored securely in visitor logs and verification record</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Photo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loadingCamera || !!cameraError}
                  onClick={handleCaptureFrame}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#6339CA] hover:bg-[#5229AB] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>Capture Photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
