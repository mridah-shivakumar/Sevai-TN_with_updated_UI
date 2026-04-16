import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { t, tf } from '../data/strings.js';
import { SCHEME_BY_ID } from '../data/schemes.js';

const stages = ['submitted', 'under_review', 'final'];

export default function StatusTimeline({ app, lang }) {
  const scheme = SCHEME_BY_ID[app.scheme_id];
  const nav = useNavigate();
  if (!scheme) return null;

  const isApproved = app.status === 'approved';
  const isRejected = app.status === 'rejected';
  const isReview = app.status === 'under_review' || (!isApproved && !isRejected);

  const nodes = [
    {
      key: 'submitted',
      label: t('status_submitted', lang),
      reached: true,
      color: 'brand-green',
    },
    {
      key: 'under_review',
      label: t('status_under_review', lang),
      reached: isReview || isApproved || isRejected,
      color: isRejected ? 'brand-amber' : 'brand-green',
    },
    {
      key: 'final',
      label: isApproved ? t('status_approved', lang) : isRejected ? t('status_rejected', lang) : t('status_under_review', lang),
      reached: isApproved || isRejected,
      color: isApproved ? 'brand-green' : isRejected ? 'brand-amber' : 'gray',
    },
  ];

  const plainCopy = isApproved
    ? tf('status_plain_approved', lang, { name: scheme.name_plain })
    : isRejected
    ? tf('status_plain_rejected', lang, { name: scheme.name_plain, reason: app.reject_reason || (lang === 'ta' ? 'வருமான சான்றிதழ் இல்லை' : 'Income certificate missing') })
    : tf('status_plain_review', lang, { name: scheme.name_plain });

  // Hindi/Tanglish SMS mock
  const smsMock = isApproved
    ? `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan swikar ho gaya. ₹${scheme.benefit_amount.toLocaleString('en-IN')} aapke khate mein 7 dinon mein aayega.`
    : isRejected
    ? `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan ke liye aur document chahiye. Kripya form phir se jama karein.`
    : `Aapka ${scheme.name_plain.split(' ').slice(0, 3).join(' ')} aavedhan process mein hai. 5-7 din mein update milega.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="min-w-0">
          <h3 className="font-black text-lg text-[#1A1A1A] leading-tight tracking-tight">{scheme.name_plain}</h3>
          <div className="text-[12px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">{scheme.name_official}</div>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-gray-100" />
        {nodes.map((n, i) => (
          <div key={n.key} className="relative mb-5 last:mb-0">
            <div
              className={`absolute -left-[22px] top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[11px] font-bold ${
                n.reached
                  ? n.color === 'brand-green'
                    ? 'bg-[#007AFF] border-[#007AFF] shadow-sm shadow-[#007AFF]/30'
                    : 'bg-red-500 border-red-500 shadow-sm shadow-red-500/30'
                  : 'bg-white border-gray-200'
              }`}
            >
              {n.reached && i < nodes.length - 1 ? '✓' : ''}
              {n.reached && i === nodes.length - 1 && isApproved && '✓'}
              {n.reached && i === nodes.length - 1 && isRejected && '!'}
            </div>
            <div className={`text-[14px] font-bold tracking-tight mt-[-2px] ${n.reached ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
              {n.label}
            </div>
          </div>
        ))}
      </div>

      {/* Plain-language status sentence */}
      <div
        className={`mt-5 rounded-[16px] p-4 text-[13px] font-bold leading-relaxed tracking-wide ${
          isApproved ? 'bg-[#007AFF]/10 text-[#007AFF]' : isRejected ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-[#1A1A1A]'
        }`}
      >
        {plainCopy}
      </div>

      {/* Mock SMS preview */}
      <div className="mt-4 bg-[#1A1A1A] text-white rounded-[16px] p-4 shadow-inner">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#007AFF] mb-2">
          {t('mock_sms_label', lang)}
        </div>
        <div className="text-[13px] font-mono leading-relaxed opacity-90 selection:bg-[#007AFF] selection:text-white">{smsMock}</div>
      </div>

      {/* Fix & resubmit */}
      {isRejected && (
        <button
          onClick={() => nav(`/apply/${scheme.id}`)}
          className="w-full mt-4 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-black rounded-full px-5 py-3 transition-colors text-sm uppercase tracking-widest text-center"
        >
          {t('fix_resubmit', lang)}
        </button>
      )}
    </motion.div>
  );
}
