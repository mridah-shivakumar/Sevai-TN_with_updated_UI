import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SCHEME_BY_ID } from '../data/schemes.js';
import { useVault } from '../hooks/useVault.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../data/strings.js';
import { addApplication } from '../utils/applications.js';
import { appendAudit } from '../utils/sahayakMock.js';
import { DISTRICTS } from '../data/districts.js';
import SuccessAnimation from '../components/SuccessAnimation.jsx';
import CrossSchemeChain from '../components/CrossSchemeChain.jsx';
import DocumentScanner from '../components/DocumentScanner.jsx';

export default function Apply() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isSahayak = search.get('sahayak') === '1';
  const scheme = SCHEME_BY_ID[id];
  const { vault: ownVault } = useVault();
  const vault = useMemo(() => {
    if (!isSahayak) return ownVault;
    try {
      return JSON.parse(sessionStorage.getItem('sevai_sahayak_beneficiary') || '{}');
    } catch {
      return ownVault;
    }
  }, [isSahayak, ownVault]);
  const { lang } = useLanguage();
  const nav = useNavigate();

  const [docs, setDocs] = useState({});
  const [showOCR, setShowOCR] = useState(null);
  const [activeScannerDoc, setActiveScannerDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const startRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  if (!scheme) {
    return <div className="p-6 text-center">Scheme not found</div>;
  }

  const districtLabel = DISTRICTS.find((d) => d.id === vault.district);

  const fields = [
    { label: lang === 'ta' ? 'பெயர்' : 'Name', value: vault.name || (lang === 'ta' ? 'உள்ளிடப்படவில்லை' : 'Not set') },
    { label: lang === 'ta' ? 'வயது' : 'Age', value: vault.age ?? '—' },
    { label: lang === 'ta' ? 'பாலினம்' : 'Gender', value: vault.gender || '—' },
    {
      label: lang === 'ta' ? 'மாவட்டம்' : 'District',
      value: districtLabel ? (lang === 'ta' ? districtLabel.ta : districtLabel.en) : vault.district || '—',
    },
    { label: lang === 'ta' ? 'சாதி' : 'Caste', value: vault.caste || '—' },
    {
      label: lang === 'ta' ? 'ஆண்டு வருமானம்' : 'Annual income',
      value: vault.annual_income ? `₹${vault.annual_income.toLocaleString('en-IN')}` : '—',
    },
    { label: lang === 'ta' ? 'வேலை' : 'Occupation', value: vault.occupation || '—' },
  ];

  const handleDocExtracted = (data, base64) => {
    if (activeScannerDoc) {
      setDocs((d) => ({ ...d, [activeScannerDoc]: 'scanned.jpg' }));
      
      // Auto-fill vault if data is found
      if (data && Object.keys(data).length > 0) {
        setVault((prev) => {
            const updates = {};
            if (data.name) updates.name = data.name;
            if (data.dob) updates.dob = data.dob;
            if (data.idNumber) updates.idNumber = data.idNumber;
            if (data.address) updates.address = data.address;
            return { ...prev, ...updates };
        });
      }
      setActiveScannerDoc(null);
    }
  };

  const allDocsDone = scheme.documents_required.every((d) => docs[d]);

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    elapsedRef.current = Math.round((Date.now() - startRef.current) / 1000);
    addApplication({
      scheme_id: scheme.id,
      submitted_at: Date.now(),
      status: 'under_review',
      documents: Object.keys(docs),
      by_sahayak: isSahayak,
    });
    if (isSahayak) {
      appendAudit({
        sahayak_action: 'submitted_application',
        scheme_id: scheme.id,
        beneficiary_id: vault.id,
      });
    }
    setShowSuccess(true);
  };

  const onSuccessDone = () => {
    setShowSuccess(false);
    setShowRelated(true);
  };

  return (
    <div className="min-h-[100dvh] pb-28 bg-[#FAFAFA] font-sans">
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => nav(-1)} className="!min-h-0 !min-w-0 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#1A1A1A">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </button>
        <div className="flex-1 truncate">
          <div className="font-black text-lg tracking-tight text-[#1A1A1A] leading-tight truncate">{scheme.name_plain}</div>
          <div className="text-[12px] font-bold uppercase tracking-widest text-[#007AFF] mt-0.5">
            {isSahayak
              ? lang === 'ta'
                ? 'உதவியாளர் முறையில் விண்ணப்பிக்கிறது'
                : 'Applying via Sahayak mode'
              : lang === 'ta'
              ? 'தானாக நிரப்பப்பட்டுள்ளது'
              : 'Pre-filled from your profile'}
          </div>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* Review section */}
        <section className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight">{t('apply_review_title', lang)}</h2>
          </div>
          <dl className="grid grid-cols-2 gap-y-4 gap-x-3">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{f.label}</dt>
                <dd className="text-[15px] font-bold text-[#1A1A1A] mt-0.5 break-words">{String(f.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg inline-flex">
            <span>🔒</span>
            <span>{t('device_only', lang)}</span>
          </div>
        </section>

        {/* Documents */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xl">📄</span>
            <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight">{t('apply_document_title', lang)}</h2>
          </div>
          <div className="space-y-3">
            {scheme.documents_required.map((d) => {
              const done = !!docs[d];
              return (
                <button
                  key={d}
                  onClick={() => setActiveScannerDoc(d)}
                  type="button"
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all cursor-pointer active:scale-[0.98] ${
                    done ? 'border-[#007AFF] bg-[#007AFF]/5 shadow-[0_4px_12px_rgba(0,122,255,0.1)]' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`shrink-0 w-12 h-12 rounded-full grid place-items-center text-2xl transition-colors ${
                      done ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30' : 'bg-gray-50'
                    }`}
                  >
                    {done ? '✓' : '📸'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-black text-base tracking-tight ${done ? 'text-[#007AFF]' : 'text-[#1A1A1A]'}`}>{d}</div>
                    <div className={`text-[12px] font-bold mt-0.5 ${done ? 'text-[#007AFF]/70' : 'text-gray-400 uppercase tracking-widest'}`}>
                      {done
                        ? `${t('apply_detected', lang)} ${d}`
                        : t('apply_tap_photo', lang)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4">
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`w-full bg-[#007AFF] text-white rounded-full px-5 py-5 text-xl font-black shadow-[0_8px_16px_rgba(0,122,255,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 ${!allDocsDone ? 'opacity-70 grayscale-[30%]' : ''}`}
          >
            {submitting
              ? lang === 'ta'
                ? 'சமர்ப்பிக்கிறது...'
                : 'Submitting...'
              : t('apply_submit', lang)}
          </button>
          {!allDocsDone && (
            <p className="text-xs font-bold text-gray-400 text-center mt-3 tracking-wide">
              {lang === 'ta'
                ? 'ஆவணங்கள் இல்லாவிட்டாலும் சமர்ப்பிக்கலாம் — பின்னர் சேர்க்கலாம்'
                : 'You can submit without photos — you can add them later'}
            </p>
          )}
        </div>
      </div>

      {/* Active Scanner Overlay */}
      <AnimatePresence>
        {activeScannerDoc && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
          >
            <div className="p-4 pt-10 min-h-[100dvh] flex flex-col">
              <h3 className="text-white mb-6 text-center text-xl font-bold">
                {lang === 'ta' ? `ஸ்கேன் செய்க: ${activeScannerDoc}` : `Scanning: ${activeScannerDoc}`}
              </h3>
              <DocumentScanner 
                onDataExtracted={handleDocExtracted} 
                lang={lang} 
                autoOpen={true} 
              />
              <button 
                onClick={() => setActiveScannerDoc(null)} 
                className="mt-auto text-white p-4 border border-white/20 rounded-xl"
              >
                {lang === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR processing overlay */}
      <AnimatePresence>
        {showOCR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 grid place-items-center"
          >
            <div className="bg-white rounded-2xl p-6 max-w-xs mx-4 text-center">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-base font-semibold mb-1">
                {lang === 'ta' ? 'ஆவணத்தை படிக்கிறது...' : 'Reading document...'}
              </div>
              <div className="text-xs text-brand-muted">{showOCR}</div>
              <div className="mt-3 h-1 bg-gray-100 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-brand-green"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success animation */}
      {showSuccess && (
        <SuccessAnimation
          schemeName={scheme.name_plain}
          elapsedSeconds={elapsedRef.current}
          lang={lang}
          onDone={onSuccessDone}
        />
      )}

      {/* Post-submit cross-scheme chain */}
      {showRelated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-black/40 grid place-items-end"
          onClick={() => nav('/applications')}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-5 w-full max-w-lg mx-auto space-y-4"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
            <div className="text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-xl font-bold">
                {lang === 'ta' ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' : 'Application submitted'}
              </h3>
              <p className="text-sm text-brand-muted mt-1">{scheme.name_plain}</p>
            </div>
            <CrossSchemeChain schemeId={scheme.id} vault={vault} lang={lang} variant="single" />
            <button onClick={() => nav('/applications')} className="btn-secondary w-full">
              {lang === 'ta' ? 'விண்ணப்பங்களைக் காண்' : 'See my applications'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
