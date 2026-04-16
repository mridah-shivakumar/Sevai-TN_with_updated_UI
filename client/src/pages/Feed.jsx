import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVault } from '../hooks/useVault.js';
import { useEligibility } from '../hooks/useEligibility.js';
import { useLanguage } from '../hooks/useLanguage.js';
import SchemeCard from '../components/SchemeCard.jsx';
import FuzzyMatchCard from '../components/FuzzyMatchCard.jsx';
import { t } from '../data/strings.js';
import { formatRupees } from '../utils/formatters.js';
import { DISTRICTS } from '../data/districts.js';
import { hasTamilVoice } from '../utils/speechUtils.js';

export default function Feed() {
  const { vault } = useVault();
  const { lang, setLang } = useLanguage();
  const { eligible, close_matches, totalValue } = useEligibility(vault);
  const [loading, setLoading] = useState(true);
  const [tamilVoiceBanner, setTamilVoiceBanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      if (lang === 'ta') {
        const ok = await hasTamilVoice();
        setTamilVoiceBanner(!ok);
      } else {
        setTamilVoiceBanner(false);
      }
    })();
  }, [lang]);

  const districtLabel = DISTRICTS.find((d) => d.id === vault.district);
  const districtStr = districtLabel ? (lang === 'ta' ? districtLabel.ta : districtLabel.en) : '';

  return (
    <div className="min-h-[100dvh] pb-24 bg-brand-white">
      {/* Hero header */}
      <header className="bg-white px-6 pt-8 pb-6 border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-brand-blue tracking-widest uppercase mb-1">{t('app_name', lang)}</div>
            <div className="text-xl font-black tracking-tight text-brand-ink">
              {vault.name
                ? lang === 'ta'
                  ? `வணக்கம், ${vault.name}`
                  : `Hello, ${vault.name}`
                : lang === 'ta'
                ? 'வணக்கம்'
                : 'Hello'}
              {districtStr && <span className="text-gray-400 font-medium"> · {districtStr}</span>}
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="text-xs font-bold bg-gray-100 text-brand-ink rounded-full px-4 py-2 hover:bg-gray-200 transition-colors"
          >
            {lang === 'ta' ? 'EN' : 'தமிழ்'}
          </button>
        </div>
        <div className="mt-6 flex bg-gray-50 rounded-2xl p-4 items-center gap-4 border border-gray-100">
          <div className="w-14 h-14 bg-brand-black text-white rounded-xl flex items-center justify-center text-2xl font-black">
            {eligible.length}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {lang === 'ta' ? 'திட்டங்கள் | மொத்தம்' : 'Schemes | Total Value'}
            </div>
            <div className="text-2xl font-black text-brand-blue mt-0.5 tracking-tighter">
              {formatRupees(totalValue)}
              <span className="text-xs text-brand-ink font-semibold ml-1">{t('wow_per_year', lang)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tamil voice banner */}
      {tamilVoiceBanner && (
        <div className="mx-4 mt-3 amber-banner">{t('tamil_voice_unavailable', lang)}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="px-5 py-10 text-center">
          <div className="inline-flex items-center gap-3 text-brand-muted">
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse [animation-delay:300ms]" />
            </span>
            {t('loading_schemes', lang)}
          </div>
        </div>
      ) : (
        <>
          {/* Cards */}
          <section className="px-4 py-4 space-y-3">
            <h2 className="text-sm font-bold text-brand-muted uppercase tracking-wide px-1">
              {lang === 'ta' ? 'பரிந்துரைக்கப்பட்டவை' : 'Recommended for you'}
            </h2>
            {eligible.length === 0 && (
              <div className="amber-banner">
                {lang === 'ta'
                  ? 'உங்கள் சுயவிவரத்திற்கு பொருந்தும் திட்டங்கள் கிடைக்கவில்லை.'
                  : 'No schemes match your profile yet.'}
              </div>
            )}
            {eligible.map(({ scheme }) => (
              <SchemeCard key={scheme.id} scheme={scheme} vault={vault} lang={lang} />
            ))}
          </section>

          {/* Close matches */}
          {close_matches.length > 0 && (
            <section className="px-4 py-4 space-y-3">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-brand-saffron-dark uppercase tracking-wide px-1"
              >
                ⚠︎ {t('close_matches', lang)}
              </motion.h2>
              {close_matches.map((entry) => (
                <FuzzyMatchCard key={entry.scheme.id} entry={entry} vault={vault} lang={lang} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
