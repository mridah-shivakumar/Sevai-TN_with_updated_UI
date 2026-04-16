import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../data/strings.js';
import { DISTRICTS } from '../data/districts.js';
import { speak, stopSpeaking, createRecorder } from '../utils/speechUtils.js';
import { ageBandToNumber, incomeBandToMax, occupationKey } from '../utils/formatters.js';

// WhatsApp-style chat onboarding. Bot asks questions one at a time, large options below.

const STEPS = [
  { key: 'language', prompt: 'bot_greet' },
  { key: 'age', prompt: 'bot_age' },
  { key: 'occupation', prompt: 'bot_occupation' },
  { key: 'district', prompt: 'bot_district' },
  { key: 'annual_income', prompt: 'bot_income' },
  { key: 'caste', prompt: 'bot_caste' },
  { key: 'gender', prompt: 'bot_gender' },
];

const BUBBLE_DELAY = 650;

export default function ChatOnboarding({ onComplete, lang, setLang }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // {field, value, text}
  const scrollRef = useRef(null);
  const recorderRef = useRef(null);

  const step = STEPS[stepIdx];

  // Send bot prompt for the current step
  useEffect(() => {
    if (!step) return;
    setTyping(true);
    const promptText = t(step.prompt, lang);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'bot', text: promptText, lang }]);
      speak(promptText, lang);
    }, BUBBLE_DELAY);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, lang]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, typing]);

  const pushUser = (text) => setMessages((m) => [...m, { from: 'user', text }]);

  const confirmAndAdvance = (field, value, text) => {
    pushUser(text);
    setAnswers((a) => ({ ...a, [field]: value }));
    setStepIdx((i) => i + 1);
  };

  const handleLanguageChoice = (l) => {
    setLang(l);
    confirmAndAdvance('languages_preferred', [l], l === 'ta' ? 'தமிழ்' : 'English');
  };

  const handleAgeChoice = (band, label) => {
    confirmAndAdvance('age', ageBandToNumber(band), label);
  };

  const handleOccupationChoice = (occEn, label) => {
    confirmAndAdvance('occupation', occupationKey(occEn), label);
  };

  const handleDistrictChoice = (d) => {
    confirmAndAdvance('district', d.id, lang === 'ta' ? d.ta : d.en);
  };

  const handleIncomeChoice = (band, label) => {
    confirmAndAdvance('annual_income', incomeBandToMax(band), label);
  };

  const handleCasteChoice = (c) => {
    confirmAndAdvance('caste', c === 'prefer_not_say' ? null : c, c === 'prefer_not_say' ? t('prefer_not_say', lang) : c);
  };

  const handleGenderChoice = (isFemale, label) => {
    confirmAndAdvance('gender', isFemale ? 'female' : 'male', label);
  };

  // Voice recording → backend /api/extract-intent
  const toggleRecord = async () => {
    if (!recorderRef.current) recorderRef.current = createRecorder();
    const rec = recorderRef.current;
    if (!recording) {
      try {
        await rec.start();
        setRecording(true);
      } catch (err) {
        console.warn('mic permission', err);
        setMessages((m) => [
          ...m,
          { from: 'system', text: lang === 'ta' ? 'மைக் அணுகல் மறுக்கப்பட்டது' : 'Microphone access denied' },
        ]);
      }
    } else {
      const blob = await rec.stop();
      setRecording(false);
      if (!blob) return;
      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        fd.append('language', lang);
        fd.append('field', step.key);
        fd.append('question', t(step.prompt, lang));
        const res = await fetch('/api/extract-intent', { method: 'POST', body: fd });
        const data = await res.json();
        setTranscribing(false);
        if (data?.field && data?.value != null) {
          // Show as a user message and wait for user confirmation before advancing
          setPendingAnswer({ field: data.field, value: data.value, text: String(data.value), confidence: data.confidence });
        } else {
          setMessages((m) => [
            ...m,
            { from: 'system', text: lang === 'ta' ? 'புரிந்துகொள்ள முடியவில்லை. விருப்பத்தை தட்டுங்கள்.' : "Couldn't hear clearly. Please tap an option." },
          ]);
        }
      } catch (err) {
        setTranscribing(false);
        console.warn('extract-intent failed', err);
      }
    }
  };

  const confirmPending = () => {
    if (!pendingAnswer) return;
    const { field, value, text } = pendingAnswer;
    // Heuristic mapping from extracted value → our enum/number
    let storedValue = value;
    if (step.key === 'age') storedValue = typeof value === 'number' ? value : parseInt(value, 10) || 30;
    if (step.key === 'annual_income') storedValue = typeof value === 'number' ? value : 100000;
    confirmAndAdvance(step.key === 'language' ? 'languages_preferred' : step.key, storedValue, text);
    setPendingAnswer(null);
  };

  const rejectPending = () => setPendingAnswer(null);

  // When all steps done, fire final animation + onComplete
  useEffect(() => {
    if (stepIdx === STEPS.length) {
      setTyping(true);
      const finish = t('bot_finishing', lang);
      const timer = setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { from: 'bot', text: finish }]);
        speak(finish, lang);
      }, 400);
      const done = setTimeout(() => {
        onComplete(answers);
      }, 2400);
      return () => {
        clearTimeout(timer);
        clearTimeout(done);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // ---------- Options renderer ----------
  const options = useMemo(() => {
    if (pendingAnswer) return null;
    if (!step) return null;
    switch (step.key) {
      case 'language':
        return (
          <div className="flex gap-3 flex-wrap justify-center">
            <ChatOpt onClick={() => handleLanguageChoice('ta')}>தமிழ்</ChatOpt>
            <ChatOpt onClick={() => handleLanguageChoice('en')}>English</ChatOpt>
          </div>
        );
      case 'age':
        return (
          <div className="grid grid-cols-3 gap-3">
            {[
              ['under_18', t('age_under_18', lang)],
              ['18_25', t('age_18_25', lang)],
              ['26_40', t('age_26_40', lang)],
              ['41_60', t('age_41_60', lang)],
              ['60_plus', t('age_60_plus', lang)],
            ].map(([k, label]) => (
              <ChatOpt key={k} onClick={() => handleAgeChoice(k, label)}>
                {label}
              </ChatOpt>
            ))}
          </div>
        );
      case 'occupation':
        return (
          <div className="grid grid-cols-2 gap-3">
            {['Farmer', 'Student', 'Daily Wage Worker', 'Small Business', 'Homemaker', 'Other'].map((o) => (
              <ChatOpt key={o} onClick={() => handleOccupationChoice(o, t(`occ_${occupationKey(o)}`, lang))}>
                {t(`occ_${occupationKey(o)}`, lang)}
              </ChatOpt>
            ))}
          </div>
        );
      case 'district':
        return (
          <div className="max-h-[200px] overflow-y-auto hide-scrollbar -mx-2 px-2">
            <div className="flex gap-2 flex-wrap justify-center">
              {DISTRICTS.map((d) => (
                <ChatOpt key={d.id} onClick={() => handleDistrictChoice(d)} size="sm">
                  {lang === 'ta' ? d.ta : d.en}
                </ChatOpt>
              ))}
            </div>
          </div>
        );
      case 'annual_income':
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['under_1l', t('inc_under_1l', lang)],
              ['1_2_5l', t('inc_1_2_5l', lang)],
              ['2_5_5l', t('inc_2_5_5l', lang)],
              ['above_5l', t('inc_above_5l', lang)],
            ].map(([k, label]) => (
              <ChatOpt key={k} onClick={() => handleIncomeChoice(k, label)}>
                {label}
              </ChatOpt>
            ))}
          </div>
        );
      case 'caste':
        return (
          <div className="grid grid-cols-2 gap-3">
            {['General', 'OBC', 'SC', 'ST', 'prefer_not_say'].map((c) => (
              <ChatOpt key={c} onClick={() => handleCasteChoice(c)}>
                {c === 'prefer_not_say' ? t('prefer_not_say', lang) : c}
              </ChatOpt>
            ))}
          </div>
        );
      case 'gender':
        return (
          <div className="flex gap-3 justify-center">
            <ChatOpt onClick={() => handleGenderChoice(true, t('yes', lang))}>{t('yes', lang)}</ChatOpt>
            <ChatOpt onClick={() => handleGenderChoice(false, t('no', lang))}>{t('no', lang)}</ChatOpt>
          </div>
        );
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lang, pendingAnswer]);

  return (
    <div className="flex flex-col h-[100dvh] bg-brand-white text-brand-ink font-sans relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-black flex items-center justify-center text-xl font-bold text-white shadow-md">
            S
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight">{t('app_name', lang)} AI</div>
            <div className="text-[11px] font-semibold text-brand-blue tracking-wider uppercase">Active</div>
          </div>
        </div>
        <button
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          className="text-sm font-semibold px-3 py-1 bg-gray-100 rounded-full active:scale-95 transition-transform"
        >
          {t('switch_language', lang)}
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-[24px] px-5 py-3.5 text-lg font-medium leading-snug shadow-sm ${
                  m.from === 'user'
                    ? 'bg-brand-blue text-white rounded-br-sm'
                    : m.from === 'system'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-white text-brand-ink rounded-bl-sm border border-gray-100'
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-sm px-5 py-4 shadow-sm">
                <span className="inline-flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-blue/60 animate-pulse" />
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-blue/60 animate-pulse [animation-delay:150ms]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-blue/60 animate-pulse [animation-delay:300ms]" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending voice answer confirmation */}
        {pendingAnswer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-brand-blue rounded-[24px] p-5 shadow-lg mt-4 max-w-[85%] mx-auto"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-2">
              {lang === 'ta' ? 'நான் கேட்டது:' : 'Voice Detected:'}
            </div>
            <div className="text-xl font-black mb-5">{pendingAnswer.text}</div>
            <div className="flex xl:flex-row gap-3">
              <button onClick={rejectPending} className="bg-gray-100 text-brand-ink font-bold px-4 py-3 rounded-xl flex-1 active:scale-95 transition-transform">
                {lang === 'ta' ? 'மாற்று' : 'Wrong'}
              </button>
              <button onClick={confirmPending} className="bg-brand-blue text-white font-bold px-4 py-3 rounded-xl flex-1 shadow-md active:scale-95 transition-transform">
                {lang === 'ta' ? 'சரி' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Spacer to push content above fixed bottom */}
        <div className="h-40" />
      </div>

      {/* Fixed Bottom UI: Options & AI Pulse Mic */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-6 z-40">
        
        <div className="max-w-md mx-auto relative flex flex-col items-center">
            {/* Options grid fades out when typing or recording to keep UI clean */}
            <AnimatePresence>
              {!recording && !typing && !pendingAnswer && options && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="w-full bg-white/80 backdrop-blur-xl border border-gray-100 shadow-xl rounded-[32px] p-4 mb-6 relative z-20"
                >
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">
                     {lang === 'ta' ? 'ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்' : 'Tap an Option'}
                  </div>
                  {options}
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Pulse Orb / Mic Button */}
            <div className="relative group flex items-center justify-center">
              {/* Pulse effect */}
              {(recording || transcribing) && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute w-24 h-24 bg-brand-blue rounded-full blur-2xl z-0 pointer-events-none"
                />
              )}
              
              <button
                onClick={toggleRecord}
                className={`relative z-10 rounded-[32px] w-20 h-20 flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                  recording ? 'bg-brand-ink text-white shadow-[0_0_40px_rgba(0,122,255,0.8)]' : 'bg-brand-black text-white hover:bg-gray-800'
                }`}
                aria-label={lang === 'ta' ? 'குரலால் பேசு' : 'Speak answer'}
              >
                {recording ? (
                  <div className="flex gap-1.5 items-center justify-center">
                    <span className="w-1.5 h-6 bg-brand-blue rounded-full animate-[wave_1s_ease-in-out_infinite]" />
                    <span className="w-1.5 h-10 bg-brand-blue rounded-full animate-[wave_1s_ease-in-out_infinite_0.1s]" />
                    <span className="w-1.5 h-5 bg-brand-blue rounded-full animate-[wave_1s_ease-in-out_infinite_0.2s]" />
                  </div>
                ) : transcribing ? (
                  <span className="w-6 h-6 border-4 border-white border-t-brand-blue rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12 2c-1.66 0-3 1.34-3 3v7c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3zM5 11a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.92V21h-2v-3.08A7 7 0 015 11z" />
                  </svg>
                )}
              </button>
            </div>
            {!recording && !transcribing && !options && !typing && !pendingAnswer && (
                 <div className="text-xs font-bold text-gray-400 mt-3 absolute -bottom-6">
                    {lang === 'ta' ? 'பேச மைக்-ஐ அழுத்தவும்' : 'Tap to speak'}
                 </div>
            )}
        </div>
        
      </div>
    </div>
  );
}

function ChatOpt({ children, onClick, size }) {
  const isSm = size === 'sm';
  return (
    <button
      onClick={onClick}
      className={`${isSm ? 'w-auto px-4 py-2.5 text-sm mb-1' : 'w-full px-5 py-4 text-xl mb-2'} text-center rounded-[20px] bg-gray-50 border-2 border-transparent text-[#1A1A1A] font-bold hover:border-[#007AFF] hover:bg-[#007AFF]/5 hover:text-[#007AFF] active:scale-[0.98] transition-all shadow-sm`}
    >
      {children}
    </button>
  );
}
