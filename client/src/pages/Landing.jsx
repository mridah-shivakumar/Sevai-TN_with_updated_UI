import { motion } from 'framer-motion';

export default function Landing({ onStart, lang, setLang }) {
  const t = (en, ta) => (lang === 'en' ? en : ta);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#007AFF]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 md:px-12 flex justify-between items-center relative z-10">
        <h1 className="text-2xl font-black tracking-tight text-white">
          Sevai<span className="text-[#007AFF]">-</span>Scout
        </h1>
        <button
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          className="neo-glass-dark px-4 py-2 rounded-full font-semibold text-sm transition-transform active:scale-95"
        >
          {lang === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </header>

      <main className="container mx-auto px-6 md:px-12 pt-12 pb-24 grid lg:grid-cols-2 gap-16 relative z-10 items-center">
        {/* Left Column: Hero Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-8 text-center lg:text-left"
        >
          <h2 className="text-5xl lg:text-[72px] leading-[1.1] font-black tracking-tighter text-shadow-glow">
            {t(
              'Your High-Tech Bridge to Government Support.',
              'அரசு திட்டங்களுக்கான உங்கள் உயர்தொழில்நுட்ப பாலம்.'
            )}
          </h2>
          <p className="text-lg lg:text-xl text-white/60 max-w-xl mx-auto lg:mx-0 font-medium tracking-tight">
            {t(
              'Discover premium, tailored schemes precisely matched to your profile. Zero paperwork. Zero confusion.',
              'பூஜ்ஜிய காகித வேலைகளுடன் உங்கள் சுயவிவரத்திற்கு ஏற்ற திட்டங்களைக் கண்டறியவும்.'
            )}
          </p>

          <div className="pt-6">
            <button
              onClick={onStart}
              className="bg-[#007AFF] text-white w-full lg:w-auto px-10 py-5 rounded-full text-xl font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-[0_0_30px_rgba(0,122,255,0.4)]"
            >
              {t('Launch Sevai-Scout', 'சேவை-ஸ்கவுட்டைத் தொடங்குங்கள்')}
            </button>
          </div>
        </motion.div>

        {/* Right Column: 3D Phone & Bento Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center justify-center lg:justify-end mt-16 lg:mt-0 w-full"
        >
          {/* Main Wrapper for Phone + Floating Stats */}
          <div className="relative w-[320px] h-[660px] lg:w-[380px] lg:h-[780px]">
            {/* Floating Phone Mockup */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="w-full h-full bg-gradient-to-tr from-gray-950 to-gray-800 rounded-[48px] border-[12px] border-gray-900 shadow-[0_0_80px_rgba(0,122,255,0.15),0_40px_60px_rgba(0,0,0,0.6)] relative z-20 overflow-hidden"
            >
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-8 bg-gray-900 z-30 rounded-b-[24px] flex items-center justify-center px-4 w-36 mx-auto">
                <div className="w-16 h-1.5 bg-black rounded-full" />
              </div>
              
              {/* Phone Screen content simulation */}
              <div className="w-full h-full bg-[#FAFAFA] p-5 pt-14 flex flex-col gap-5 relative">
                {/* Fake App Header */}
                <div className="flex justify-between items-center mb-2">
                  <div className="w-24 h-5 bg-gray-200 rounded-full" />
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                </div>
                
                {/* Fake Cards */}
                <div className="w-full bg-white rounded-[24px] shadow-sm border border-gray-100 p-5">
                   <div className="flex gap-4 mb-5">
                     <div className="w-12 h-12 bg-green-100 rounded-full" />
                     <div className="flex-1 space-y-2 py-1">
                       <div className="h-3 w-3/4 bg-gray-200 rounded-full mb-2" />
                       <div className="h-2 w-1/2 bg-gray-100 rounded-full" />
                     </div>
                   </div>
                   <div className="w-full h-10 bg-[#007AFF] rounded-full opacity-90" />
                </div>

                <div className="w-full bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-[#007AFF]/5 rounded-bl-full" />
                   <div className="flex gap-4 mb-5 relative z-10">
                     <div className="w-12 h-12 bg-orange-100 rounded-full" />
                     <div className="flex-1 space-y-2 py-1">
                       <div className="h-3 w-4/5 bg-gray-200 rounded-full mb-2" />
                       <div className="h-2 w-2/3 bg-gray-100 rounded-full" />
                     </div>
                   </div>
                   <div className="w-full h-2 bg-red-400 rounded-full mb-4" />
                   <div className="w-full h-10 bg-[#007AFF] rounded-full opacity-90 relative z-10" />
                </div>
                
                {/* Bottom Nav Fade */}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
              </div>
            </motion.div>

            {/* Bento Stats around the phone - Absolutely positioned relative to the phone bounds */}
            
            {/* Stat 1: Top Right */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
               className="bg-white/10 backdrop-blur-xl p-6 rounded-[24px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col absolute top-20 -right-8 lg:top-32 lg:-right-20 w-48 z-40 transform rotate-2"
            >
              <div className="text-3xl lg:text-4xl font-black text-[#007AFF] mb-1">₹4Cr+</div>
              <div className="text-xs text-white/80 font-bold uppercase tracking-wide">{t('Claimed Successfully', 'வெற்றிகரமாக கோரப்பட்டது')}</div>
            </motion.div>

            {/* Stat 2: Middle Left */}
            <motion.div 
               initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
               className="bg-black/80 lg:bg-black/40 backdrop-blur-md p-6 rounded-[24px] border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col absolute bottom-56 -left-12 lg:bottom-56 lg:-left-24 w-48 z-40 transform -rotate-3"
            >
              <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-1">12k</div>
              <div className="text-xs text-[#007AFF] font-bold uppercase tracking-wide">{t('Farmers Served', 'பயனடைந்த விவசாயிகள்')}</div>
            </motion.div>
            
            {/* Stat 3: Bottom Right */}
            <motion.div 
               initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
               className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 rounded-[24px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] absolute -bottom-8 -right-4 lg:-bottom-12 lg:-right-16 w-56 lg:w-64 z-40"
            >
               <div className="flex items-center gap-3">
                 <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </div>
                 <div className="text-sm font-bold text-white/90 tracking-wide">System Online</div>
               </div>
               <div className="text-xs text-white/60 mt-2 font-medium">Real-time matching active</div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
