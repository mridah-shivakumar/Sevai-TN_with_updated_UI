import { NavLink } from 'react-router-dom';
import { t } from '../data/strings.js';

const items = [
  { to: '/feed', labelKey: 'nav_feed', emoji: '🏠' },
  { to: '/applications', labelKey: 'nav_apps', emoji: '📄' },
  { to: '/profile', labelKey: 'nav_profile', emoji: '👤' },
];

export default function BottomNav({ lang }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 !min-h-0 text-[11px] uppercase tracking-wider transition-all duration-300 ${
                isActive ? 'text-[#007AFF] font-black' : 'text-gray-400 font-bold'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-[22px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-110 -translate-y-1 drop-shadow-md' : 'grayscale opacity-60'}`}>
                  {item.emoji}
                </span>
                <span>{t(item.labelKey, lang)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
