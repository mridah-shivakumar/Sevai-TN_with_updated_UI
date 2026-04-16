import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SAHAYAK_PIN, BENEFICIARIES, appendAudit } from '../utils/sahayakMock.js';
import { evaluateAll } from '../utils/eligibilityEngine.js';
import { categoryEmoji, formatRupees } from '../utils/formatters.js';
import { t } from '../data/strings.js';

export default function SahayakMode({ lang, onExit }) {
  const [phase, setPhase] = useState('pin'); // pin | scan | beneficiary
  const [pinInput, setPinInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [beneficiary, setBeneficiary] = useState(null);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  const submitPin = () => {
    if (pinInput === SAHAYAK_PIN) {
      setErr(null);
      setPhase('scan');
    } else {
      setErr(lang === 'ta' ? 'தவறான PIN' : 'Wrong PIN');
    }
  };

  const submitCode = () => {
    const b = BENEFICIARIES[codeInput.trim()];
    if (b) {
      setBeneficiary(b);
      setPhase('beneficiary');
      setErr(null);
      appendAudit({
        sahayak_action: 'loaded_beneficiary',
        scheme_id: null,
        beneficiary_id: b.id,
      });
    } else {
      setErr(lang === 'ta' ? 'பயனாளி காணப்படவில்லை' : 'Beneficiary not found');
    }
  };

  const initiateFor = (scheme_id) => {
    appendAudit({
      sahayak_action: 'initiated_application',
      scheme_id,
      beneficiary_id: beneficiary.id,
    });
    // Switch to this beneficiary's "vault" temporarily via sessionStorage
    sessionStorage.setItem('sevai_sahayak_beneficiary', JSON.stringify(beneficiary));
    nav(`/apply/${scheme_id}?sahayak=1`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col font-sans">
      <header className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-sm">🧑‍🤝‍🧑</span>
          <span className="font-black text-xl text-[#1A1A1A] tracking-tight">{t('sahayak_title', lang)}</span>
        </div>
        <button
          onClick={onExit}
          className="text-sm font-bold bg-gray-100 text-[#1A1A1A] rounded-full px-5 py-2 hover:bg-gray-200 transition-colors !min-h-0 !min-w-0"
        >
          {lang === 'ta' ? 'வெளியேறு' : 'Exit'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {phase === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              className="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100 p-8 max-w-sm mx-auto mt-12"
            >
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2 text-center">{t('sahayak_enter_pin', lang)}</h2>
              <p className="text-[12px] font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">
                {lang === 'ta' ? 'மாதிரி PIN: 9999' : 'Demo PIN: 9999'}
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-[20px] border-2 border-gray-100 bg-gray-50 focus:border-[#007AFF] outline-none px-4 py-5 text-center text-3xl font-mono tracking-[0.4em] font-black text-[#1A1A1A] transition-colors shadow-inner"
              />
              {err && <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm font-bold border border-red-100">{err}</div>}
              <button onClick={submitPin} className="w-full bg-[#1A1A1A] text-white rounded-full px-6 py-4 font-black transition-transform active:scale-95 shadow-[0_8px_20px_rgba(0,0,0,0.2)] mt-8 text-lg">
                {t('continue', lang)}
              </button>
            </motion.div>
          )}

          {phase === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              className="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100 p-8 max-w-sm mx-auto mt-6"
            >
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-6 text-center">{t('sahayak_scan_code', lang)}</h2>
              <div className="mx-auto w-44 h-44 rounded-[24px] bg-gradient-to-tr from-gray-900 to-gray-800 text-white grid place-items-center relative overflow-hidden shadow-xl shadow-gray-900/20 mb-6">
                <div className="absolute inset-0 opacity-10"
                     style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 8px),repeating-linear-gradient(0deg,#fff 0 4px,transparent 4px 8px)' }} />
                <div className="relative text-center text-sm leading-tight">
                  <div className="text-5xl mb-3 drop-shadow-md">📷</div>
                  <div className="font-bold tracking-widest text-[#007AFF] uppercase text-[10px]">Ready to Scan</div>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
                {lang === 'ta' ? 'மாதிரி குறியீடுகள்: 100100 · 200200 · 300300' : 'Demo codes: 100100 · 200200 · 300300'}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="100100"
                className="w-full rounded-[20px] border-2 border-gray-100 bg-gray-50 focus:border-[#007AFF] outline-none px-4 py-4 text-center text-2xl font-mono tracking-[0.2em] font-black text-[#1A1A1A] transition-colors"
              />
              {err && <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm font-bold border border-red-100">{err}</div>}
              <button onClick={submitCode} className="w-full bg-[#007AFF] text-white rounded-full px-6 py-4 font-black transition-transform active:scale-95 shadow-[0_8px_16px_rgba(0,122,255,0.25)] mt-6 text-lg">
                {lang === 'ta' ? 'பயனாளியை ஏற்று' : 'Load beneficiary'}
              </button>
            </motion.div>
          )}

          {phase === 'beneficiary' && beneficiary && (
            <BeneficiaryView
              key="b"
              beneficiary={beneficiary}
              lang={lang}
              onInitiate={initiateFor}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BeneficiaryView({ beneficiary, lang, onInitiate }) {
  const { eligible } = evaluateAll(beneficiary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#007AFF]/10 grid place-items-center text-3xl shadow-inner shrink-0">
            {beneficiary.gender === 'female' ? '👩' : '👨'}
          </div>
          <div className="flex-1">
            <div className="font-black text-2xl text-[#1A1A1A] tracking-tight">{beneficiary.name}</div>
            <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mt-1.5 leading-relaxed">
              {beneficiary.age} YRS · {beneficiary.occupation.replace('_', ' ')} · {beneficiary.district}
            </div>
            <div className="text-[14px] font-black text-[#007AFF] mt-1.5">
              ₹{beneficiary.annual_income.toLocaleString('en-IN')} / {lang === 'ta' ? 'ஆண்டு' : 'year'} <span className="text-gray-300 mx-2">|</span> <span className="text-[#1A1A1A]">{beneficiary.caste}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-6 px-2">
          {lang === 'ta' ? 'தகுதியான திட்டங்கள்' : 'Eligible schemes'} ({eligible.length})
        </h3>
        <div className="space-y-3 pb-12">
          {eligible.map(({ scheme }) => (
            <div key={scheme.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 pl-5 flex items-center gap-4 transition-all hover:border-gray-200">
              <div className="text-3xl drop-shadow-sm">{categoryEmoji(scheme.category)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-[#1A1A1A] tracking-tight truncate text-base">{scheme.name_plain}</div>
                <div className="text-[13px] font-bold text-[#007AFF] mt-0.5">{formatRupees(scheme.benefit_amount)}</div>
              </div>
              <button 
                onClick={() => onInitiate(scheme.id)} 
                className="!min-h-0 bg-[#007AFF] text-white font-black rounded-full px-6 py-3 hover:bg-[#005bb5] shadow-[0_4px_12px_rgba(0,122,255,0.25)] transition-all active:scale-95"
              >
                {lang === 'ta' ? 'விண்ணப்பி' : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
