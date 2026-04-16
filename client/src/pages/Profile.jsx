import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../hooks/useVault.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { DISTRICTS } from '../data/districts.js';
import { t } from '../data/strings.js';
import { getAuditLog } from '../utils/sahayakMock.js';
import SahayakMode from '../components/SahayakMode.jsx';
import DocumentScanner from '../components/DocumentScanner.jsx';

const EDITABLE_FIELDS = [
  { key: 'name', type: 'text', labelTa: 'பெயர்', labelEn: 'Name' },
  { key: 'age', type: 'number', labelTa: 'வயது', labelEn: 'Age' },
  { key: 'gender', type: 'select', options: [['female', '👩'], ['male', '👨']], labelTa: 'பாலினம்', labelEn: 'Gender' },
  { key: 'occupation', type: 'select', options: [
    ['farmer', '🌾 Farmer'], ['student', '📚 Student'], ['daily_wage', '🔨 Daily Wage'],
    ['small_business', '🏪 Small Business'], ['homemaker', '🏠 Homemaker'], ['other', '· Other'],
  ], labelTa: 'வேலை', labelEn: 'Occupation' },
  { key: 'district', type: 'district', labelTa: 'மாவட்டம்', labelEn: 'District' },
  { key: 'annual_income', type: 'number', labelTa: 'ஆண்டு வருமானம் (₹)', labelEn: 'Annual Income (₹)' },
  { key: 'caste', type: 'select', options: [['General', 'General'], ['OBC', 'OBC'], ['SC', 'SC'], ['ST', 'ST']], labelTa: 'சாதி', labelEn: 'Caste' },
  { key: 'ration_card_number', type: 'text', labelTa: 'குடும்ப அட்டை எண்', labelEn: 'Ration Card #' },
  { key: 'aadhaar_last4', type: 'text', labelTa: 'ஆதார் கடைசி 4', labelEn: 'Aadhaar last 4' },
  { key: 'dob', type: 'text', labelTa: 'பிறந்த தேதி', labelEn: 'Date of Birth' },
  { key: 'idNumber', type: 'text', labelTa: 'அடையாள எண்', labelEn: 'ID Number' },
  { key: 'address', type: 'text', labelTa: 'முகவரி', labelEn: 'Address' },
];

export default function Profile() {
  const { vault, setVault, resetVault } = useVault();
  const { lang, setLang } = useLanguage();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [showSahayak, setShowSahayak] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const audit = getAuditLog();

  const startEdit = (key, current) => {
    setEditing(key);
    setDraft(current ?? '');
  };

  const saveEdit = () => {
    if (editing === 'age' || editing === 'annual_income') {
      setVault({ [editing]: Number(draft) || 0 });
    } else {
      setVault({ [editing]: draft || null });
    }
    setEditing(null);
  };

  const handleOcrData = (data) => {
    // Only update fields that Claude successfully extracted
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.dob) updates.dob = data.dob;
    if (data.idNumber) updates.idNumber = data.idNumber;
    if (data.address) updates.address = data.address;
    
    // Convert 'DD/MM/YYYY' dob to age approximately if needed, or just keep dob
    if (Object.keys(updates).length > 0) {
      setVault(updates);
    }
  };

  const renderValue = (f) => {
    const v = vault[f.key];
    if (f.type === 'district') {
      const d = DISTRICTS.find((x) => x.id === v);
      return d ? (lang === 'ta' ? d.ta : d.en) : '—';
    }
    if (f.type === 'select' && f.options) {
      const match = f.options.find(([k]) => k === v);
      return match ? match[1] : v || '—';
    }
    if (f.key === 'annual_income' && v) return `₹${Number(v).toLocaleString('en-IN')}`;
    if (v == null || v === '') return '—';
    return String(v);
  };

  return (
    <div className="min-h-[100dvh] pb-28 bg-[#FAFAFA] font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{t('profile_title', lang)}</h1>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#007AFF] mt-0.5">{vault.name || '—'}</p>
        </div>
        <button
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          className="text-xs font-bold bg-gray-100 text-[#1A1A1A] rounded-full px-4 py-2 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {lang === 'ta' ? 'EN' : 'தமிழ்'}
        </button>
      </header>

      <div className="p-5 space-y-5">
        {/* Privacy banner */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5 flex gap-4 items-start">
          <span className="text-2xl bg-gray-50 h-12 w-12 rounded-full grid place-items-center shrink-0">🔒</span>
          <div className="text-sm mt-0.5">
            <div className="font-black text-[#1A1A1A] tracking-tight text-base mb-0.5">{t('device_only', lang)}</div>
            <div className="text-[12px] text-gray-500 font-medium leading-snug">{t('profile_privacy', lang)}</div>
          </div>
        </div>

        {/* Document Scanner UI */}
        <DocumentScanner onDataExtracted={handleOcrData} lang={lang} />

        {/* Fields */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 divide-y divide-gray-100 p-3 pt-4">
          {EDITABLE_FIELDS.map((f) => (
            <div key={f.key} className="py-4 first:pt-1 pl-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {lang === 'ta' ? f.labelTa : f.labelEn}
                  </div>
                  {editing === f.key ? (
                    <div className="mt-2 pr-3">
                      <EditInput field={f} draft={draft} setDraft={setDraft} lang={lang} />
                    </div>
                  ) : (
                    <div className="font-black text-[#1A1A1A] text-[16px] mt-1 tracking-tight break-words pr-4">{renderValue(f)}</div>
                  )}
                </div>
                {editing === f.key ? (
                  <div className="flex gap-2 flex-col md:flex-row mt-2 md:mt-0 items-end md:items-center">
                    <button onClick={() => setEditing(null)} className="!min-h-0 bg-gray-100 text-gray-600 rounded-full px-4 py-2 text-sm font-bold">
                      ✕
                    </button>
                    <button onClick={saveEdit} className="!min-h-0 bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30 rounded-full px-5 py-2 text-sm font-bold">
                      {t('save', lang)}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(f.key, vault[f.key])}
                    className="!min-h-0 text-[12px] font-bold text-[#007AFF] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 cursor-pointer rounded-full px-4 py-2 transition-colors active:scale-95"
                  >
                    {t('edit', lang)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Helper activity */}
        {audit.length > 0 && (
          <div className="card">
            <button
              onClick={() => setAuditOpen((o) => !o)}
              className="w-full flex items-center justify-between !min-h-0"
            >
              <span className="font-semibold">{t('helper_activity', lang)}</span>
              <span className="text-sm text-brand-muted">
                {audit.length} · {auditOpen ? '▲' : '▼'}
              </span>
            </button>
            <AnimatePresence>
              {auditOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {audit.slice(0, 20).map((a, i) => (
                    <li key={i} className="text-xs bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold">{a.sahayak_action.replace(/_/g, ' ')}</div>
                      <div className="text-brand-muted mt-0.5">
                        {a.scheme_id ? `${a.scheme_id} · ` : ''}beneficiary {a.beneficiary_id} ·{' '}
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sahayak login */}
        <button
          onClick={() => setShowSahayak(true)}
          className="w-full card flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-saffron/15 text-2xl grid place-items-center">
            🧑‍🤝‍🧑
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">{t('sahayak_login', lang)}</div>
            <div className="text-xs text-brand-muted">
              {lang === 'ta'
                ? 'மற்றவர்களுக்காக விண்ணப்பிக்க'
                : 'Apply on behalf of others'}
            </div>
          </div>
          <span className="text-brand-muted">›</span>
        </button>

        {/* Reset */}
        <div className="pt-6">
          <button
            onClick={() => {
              if (confirm(lang === 'ta' ? 'விண்ணப்பத் தரவுகளை அழிக்கவா?' : 'Delete all saved data on this device?')) {
                resetVault();
                location.href = '/';
              }
            }}
            className="!min-h-0 block mx-auto text-[13px] font-bold text-red-500 rounded-full px-6 py-3 bg-red-50 hover:bg-red-100 tracking-wide transition-colors"
          >
            {lang === 'ta' ? 'அனைத்து தரவையும் அழி' : 'Delete All Data'}
          </button>
        </div>
      </div>

      {showSahayak && <SahayakMode lang={lang} onExit={() => setShowSahayak(false)} />}
    </div>
  );
}

function EditInput({ field, draft, setDraft, lang }) {
  if (field.type === 'select') {
    return (
      <select
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
      >
        <option value="">—</option>
        {field.options.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'district') {
    return (
      <select
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
      >
        <option value="">—</option>
        {DISTRICTS.map((d) => (
          <option key={d.id} value={d.id}>{lang === 'ta' ? d.ta : d.en}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type}
      value={draft ?? ''}
      onChange={(e) => setDraft(e.target.value)}
      className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-base"
    />
  );
}
