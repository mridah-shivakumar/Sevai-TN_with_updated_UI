import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StatusTimeline from '../components/StatusTimeline.jsx';
import { loadApplications, saveApplications } from '../utils/applications.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../data/strings.js';

// On mount: if there are no applications yet, seed one "rejected" demo entry (PMAY-Gramin)
// so the timeline + Fix & Resubmit flow can be shown to judges.
const seedIfEmpty = () => {
  const existing = loadApplications();
  if (existing.length === 0) {
    saveApplications([
      {
        scheme_id: 'pmay-gramin',
        submitted_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
        status: 'rejected',
        reject_reason: null, // uses default Tamil/English copy
        documents: ['Aadhaar Card', 'Bank Passbook'],
      },
    ]);
  }
};

export default function Applications() {
  const { lang } = useLanguage();
  const [apps, setApps] = useState([]);

  useEffect(() => {
    seedIfEmpty();
    setApps(loadApplications());
    const handler = () => setApps(loadApplications());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className="min-h-[100dvh] pb-28 bg-[#FAFAFA] font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-30 shadow-sm">
        <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{t('nav_apps', lang)}</h1>
        <p className="text-[12px] font-bold uppercase tracking-widest text-[#007AFF] mt-1">
          {lang === 'ta'
            ? `${apps.length} விண்ணப்பம் கண்காணிக்கப்படுகிறது`
            : `${apps.length} application${apps.length === 1 ? '' : 's'} tracked`}
        </p>
      </header>

      <div className="p-4 space-y-3">
        {apps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-brand-muted"
          >
            {lang === 'ta'
              ? 'இன்னும் எந்த விண்ணப்பமும் இல்லை. திட்டங்களில் இருந்து விண்ணப்பிக்கவும்.'
              : 'No applications yet. Apply from the Schemes tab.'}
          </motion.div>
        )}

        {apps
          .sort((a, b) => b.submitted_at - a.submitted_at)
          .map((app, i) => (
            <motion.div
              key={`${app.scheme_id}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatusTimeline app={app} lang={lang} />
            </motion.div>
          ))}
      </div>
    </div>
  );
}
