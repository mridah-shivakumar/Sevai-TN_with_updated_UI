import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../data/strings.js';
import { formatRupees } from '../utils/formatters.js';
import { speak } from '../utils/speechUtils.js';

// Full-screen reveal after onboarding. Counts up N schemes + total ₹ value.
export default function WowReveal({ count, totalValue, lang, onContinue }) {
  const [n, setN] = useState(0);
  const [v, setV] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1500;
    let raf;
    const tick = (ts) => {
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(count * eased));
      setV(Math.round(totalValue * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Celebratory TTS
    const msg = t('wow_qualify_for', lang).replace('[N]', String(count));
    speak(msg, lang);

    const auto = setTimeout(() => onContinue(), 3200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(auto);
    };
  }, [count, totalValue, lang, onContinue]);

  return (
    <motion.div
      initial={{ backgroundColor: '#1A1A1A' }}
      animate={{ backgroundColor: '#007AFF' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white px-6 font-sans overflow-hidden"
      onClick={onContinue}
    >
      {/* Dynamic Background Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 via-transparent to-white/20 opacity-50 pointer-events-none" 
      />

      {/* Massive scheme count typography */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center z-10"
      >
        <div className="text-[140px] font-black leading-none tracking-tighter drop-shadow-xl">
          {n}
        </div>
        <div className="text-3xl md:text-5xl font-black mt-2 tracking-tight">
           {lang === 'ta' ? 'திட்டங்கள் உள்ளன!' : 'Schemes Found!'}
        </div>
      </motion.div>

      {/* High-end Fintech Monetary Widget */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: 'spring' }}
        className="mt-12 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[32px] p-8 w-full max-w-sm shadow-[0_20px_40px_rgba(0,0,0,0.2)] z-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
        <div className="text-sm uppercase tracking-[0.2em] font-bold opacity-80 mb-2">
          {t('wow_total_value', lang)}
        </div>
        <div className="text-5xl font-black tracking-tighter">
          {formatRupees(v)}
        </div>
        <div className="text-sm font-bold opacity-70 mt-2 bg-black/20 rounded-full inline-block px-4 py-1">
          {t('wow_per_year', lang)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-12 text-sm font-bold opacity-60 tracking-widest uppercase flex flex-col items-center gap-2"
      >
        <span className="w-1 h-8 rounded-full bg-white/50 animate-bounce" />
        {t('wow_tap_to_continue', lang)}
      </motion.div>
    </motion.div>
  );
}
