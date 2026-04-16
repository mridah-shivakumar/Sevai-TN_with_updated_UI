import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentScanner({ onDataExtracted, lang = 'en', autoOpen = false }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [isCasting, setIsCasting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Get available hardware cameras on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const v = devs.filter(d => d.kind === 'videoinput');
      setDevices(v);
      if (v.length > 0) {
        // Just pick the first one initially
        setSelectedDeviceId(v[0].deviceId);
      }
    });
  }, []);

  // Start camera automatically if requested, and clean up streams properly on unmount
  useEffect(() => {
    if (autoOpen && selectedDeviceId) {
      openCamera(selectedDeviceId);
    }
    return () => stopStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, selectedDeviceId]);

  const openCamera = async (deviceId) => {
    setIsOpen(true);
    setErrorMsg(null);
    setIsCasting(true);

    try {
      let stream;
      try {
        if (deviceId) {
           stream = await navigator.mediaDevices.getUserMedia({
             video: { deviceId: { exact: deviceId } }
           });
        } else {
           stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      } catch (e) {
        console.warn('Camera request failed, attempting generic fallback...', e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly play for devices that need it
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted:', playErr);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMsg(lang === 'ta' ? 'கேமரா அணுகல் மறுக்கப்பட்டது.' : 'Camera access denied or unavailable.');
      setIsCasting(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCasting(false);
  };

  const cancelScanner = () => {
    stopStream();
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleSwitchCamera = (e) => {
    const newId = e.target.value;
    stopStream();
    setSelectedDeviceId(newId);
    // Effects will re-run and open the camera based on selectedDeviceId
  };

  const captureAndExtract = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Draw current frame to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get Base64 JPEG
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    // Stop stream and show loading
    stopStream();
    setIsExtracting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        throw new Error('Failed to extract data');
      }

      const exactedData = await response.json();
      if (exactedData.error) throw new Error(exactedData.error);

      // Successfully processed
      setIsExtracting(false);
      setIsOpen(false);
      if (onDataExtracted) {
        onDataExtracted(exactedData, base64Image);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      // Fallback: Still resolve with the image so the user isn't stuck just because Claude OCR failed on non-standard docs
      setIsExtracting(false);
      setIsOpen(false);
      if (onDataExtracted) {
        onDataExtracted({}, base64Image);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={openCamera}
        className="w-full flex items-center justify-center gap-4 px-5 py-5 mb-6 rounded-full bg-[#007AFF] text-white shadow-[0_8px_16px_rgba(0,122,255,0.25)] active:scale-95 transition-all outline-none"
      >
        <span className="text-3xl drop-shadow-md">📸</span>
        <div className="text-left flex-1">
          <div className="font-black text-lg tracking-tight leading-tight">{lang === 'ta' ? 'ஸ்மார்ட் ஸ்கேன்' : 'Smart Scan ID'}</div>
          <div className="text-[12px] font-bold text-white/80 uppercase tracking-wider">{lang === 'ta' ? 'தானாக நிரப்ப ஐடியை ஸ்கேன் செய்க' : 'Auto-fill form using camera'}</div>
        </div>
        <span className="text-white/60 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-xl">›</span>
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl overflow-hidden bg-black shadow-xl relative border border-gray-800">
      {/* Hidden canvas for extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {isExtracting ? (
        <div className="h-64 flex flex-col items-center justify-center p-6 bg-brand-bg relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-green/5 animate-pulse" />
          <div className="text-4xl mb-4 relative z-10 animate-bounce">📄</div>
          <div className="text-brand-ink font-bold text-center relative z-10">
            {lang === 'ta' ? 'தரவை பிரித்தெடுக்கிறது...' : 'Extracting data...'}
          </div>
          <div className="text-xs text-brand-muted text-center mt-2 relative z-10 max-w-xs">
            {lang === 'ta' ? 'செயற்கை நுண்ணறிவு ஆவணத்தைப் படிக்கிறது' : 'AI is reading your document directly'}
          </div>
        </div>
      ) : (
        <div className="bg-black text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {lang === 'ta' ? 'கேமரா நேரடி காட்சி' : 'Live Camera'}
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={cancelScanner} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors">
                ✕
              </button>
            </div>
          </div>
          
          <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-white/10">
             {/* Fallback space while camera is booting */}
            {!isCasting && !errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-auto max-h-[50vh] object-cover ${errorMsg ? 'hidden' : 'block'}`}
              onPlay={() => setIsCasting(true)}
            />
            
            {/* Guide overlay */}
            {isCasting && !errorMsg && (
              <div className="absolute inset-0 border-2 border-dashed border-white/40 m-6 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)] pointer-events-none" />
            )}
            
            {errorMsg && (
               <div className="p-8 text-center text-red-400 bg-red-400/10">
                 {errorMsg}
               </div>
            )}
          </div>
          
          {/* Hardware Camera Selector Dropdown */}
          {devices.length > 1 && (
            <div className="mt-4 px-2">
               <label className="text-xs text-white/70 block mb-1">Select Camera Hardware:</label>
               <select 
                 value={selectedDeviceId} 
                 onChange={handleSwitchCamera}
                 className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
               >
                 {devices.map((d, i) => (
                   <option key={d.deviceId} value={d.deviceId}>
                     {d.label || `Camera ${i + 1}`}
                   </option>
                 ))}
               </select>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            {errorMsg ? (
               <button onClick={openCamera} className="px-6 py-2 bg-white/10 rounded-full font-bold">
                 {lang === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'}
               </button>
            ) : (
               <button 
                  onClick={captureAndExtract} 
                  className="bg-white text-black font-bold h-16 w-16 rounded-full flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
               >
                 <span className="text-xl">📷</span>
               </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
