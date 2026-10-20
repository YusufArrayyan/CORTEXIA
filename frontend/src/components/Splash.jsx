import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import '../splash.css';

const SEEN_KEY = 'cortexia-splash-seen';
const STAR = 'M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z';
const LETTERS = 'CORTEXIA'.split('');
const LAND = 0.5;
const IDLE = 1.9;
const CLOSE_MS = 8500;
const LOADING = ['Menyiapkan buku cerita…', 'Memanggil teman-teman huruf…', 'CORTI sedang pemanasan mata…', 'Siap berpetualang!'];
const SPARKLES = [[-150, -40, 16, '#ffad22'], [140, -70, 12, '#fa702e'], [-110, -120, 10, '#5965be'], [165, 20, 14, '#ffad22'], [-175, 45, 10, '#fa702e']];
const DROPS = [[-74, -44, '#fa702e', 11], [-50, -78, '#ffad22', 8], [-22, -96, '#fa702e', 6], [22, -90, '#ffad22', 7], [50, -74, '#fa702e', 10], [76, -40, '#ffad22', 8], [-96, -16, '#5965be', 6], [96, -12, '#5965be', 6]];

const Corti = () => <svg viewBox="0 0 120 130" aria-hidden="true">
  <defs><linearGradient id="splash-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9d45"/><stop offset="1" stopColor="#f2621f"/></linearGradient></defs>
  <motion.g style={{ transformBox: 'fill-box', transformOrigin: '15% 100%' }} animate={{ rotate: [0, 8, 0, -5, 0] }} transition={{ delay: IDLE, duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
    <motion.g style={{ transformBox: 'fill-box', transformOrigin: '15% 100%' }} animate={{ rotate: [0, -18, 12, -6, 0] }} transition={{ delay: LAND + 0.05, duration: 0.8 }}>
      <path d="M58 26c-1-9 2-15 9-18" fill="none" stroke="#19244c" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="68" cy="7" r="6" fill="#fa702e"/>
    </motion.g>
  </motion.g>
  <rect x="6" y="24" width="108" height="102" rx="32" fill="url(#splash-body)"/>
  <path d="M24 42c8-8 20-11 34-11" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round"/>
  <motion.g style={{ transformBox: 'fill-box', transformOrigin: 'center' }} animate={{ scaleY: [1, 0.1, 1] }} transition={{ delay: 1.55, duration: 0.24, repeat: Infinity, repeatDelay: 2.4 }}>
    <ellipse cx="42" cy="66" rx="7.5" ry="10" fill="#19244c"/><ellipse cx="78" cy="66" rx="7.5" ry="10" fill="#19244c"/>
    <circle cx="44.5" cy="61.5" r="2.8" fill="#fff"/><circle cx="80.5" cy="61.5" r="2.8" fill="#fff"/>
  </motion.g>
  <ellipse cx="28" cy="84" rx="8" ry="5" fill="#ffc9b0" opacity=".85"/><ellipse cx="92" cy="84" rx="8" ry="5" fill="#ffc9b0" opacity=".85"/>
  <path d="M50 84q10 10 20 0" fill="none" stroke="#19244c" strokeWidth="4.5" strokeLinecap="round"/>
</svg>;

export const Splash = () => {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => !sessionStorage.getItem(SEEN_KEY));
  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SEEN_KEY, '1');
    document.body.style.overflow = 'hidden';
    const close = () => setShow(false);
    const timer = setTimeout(close, CLOSE_MS);
    window.addEventListener('keydown', close);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [show]);

  return <MotionConfig reducedMotion="user"><AnimatePresence>{show && <motion.div className="splash" role="status" aria-label="Membuka CORTEXIA" data-testid="splash" onClick={() => setShow(false)} exit={{ opacity: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
    <motion.div className="splash-blob orange" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}/>
    <motion.div className="splash-blob blue" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }}/>
    <motion.div className="splash-stage" exit={{ opacity: 0, scale: 1.12 }} transition={{ duration: 0.4, ease: 'easeIn' }}>
      <div className="splash-hero">
        {!reduce && [0, 0.16].map(d => <motion.span key={d} className="splash-ripple" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0.6, 0], scale: [0.3, 0.4, 2.3] }} transition={{ delay: LAND + d, duration: 0.9, times: [0, 0.05, 1], ease: 'easeOut' }}/>)}
        {!reduce && DROPS.map(([x, y, color, size], i) => <motion.span key={i} className="splash-drop" style={{ background: color, width: size, height: size, marginLeft: -size / 2 }} initial={{ opacity: 0 }} animate={{ x: [0, x * 0.6, x], y: [0, y, 30], opacity: [0, 1, 0], scale: [0.5, 1, 0.7] }} transition={{ delay: LAND + 0.02, duration: 0.8, times: [0, 0.45, 1], ease: ['easeOut', 'easeIn'], opacity: { delay: LAND + 0.02, duration: 0.8, times: [0, 0.08, 1] } }}/>)}
        {!reduce && SPARKLES.map(([x, y, size, color], i) => <motion.svg key={i} className="splash-sparkle" viewBox="0 0 24 24" style={{ x, y, width: size, height: size, marginLeft: -size / 2, color }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 90] }} transition={{ delay: 1.6 + i * 0.35, duration: 1.6, repeat: Infinity, repeatDelay: 0.5 }}><path d={STAR} fill="currentColor"/></motion.svg>)}
        <motion.div className="splash-float" animate={{ y: [0, -10, 0] }} transition={{ delay: IDLE, duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}><motion.div className="splash-corti" initial={{ opacity: 0 }} animate={{ y: [-200, 0, 0, -16, 0], scaleX: [0.9, 1, 1.16, 0.95, 1], scaleY: [1.12, 1, 0.8, 1.06, 1], opacity: [0, 1, 1, 1, 1] }} transition={{ delay: 0.1, duration: 0.95, times: [0, 0.42, 0.58, 0.8, 1], ease: ['easeIn', 'easeOut', 'easeOut', 'easeInOut'] }}><Corti/></motion.div></motion.div>
      </div>
      <div className="splash-word" aria-hidden="true">
        {LETTERS.map((l, i) => <motion.span key={i} initial={{ opacity: 0, y: 28, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.75 + i * 0.05 }}>{l}</motion.span>)}
        <motion.span className="splash-mark" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12, delay: 1.2 }}>
          <i/><motion.svg viewBox="0 0 24 24" animate={{ rotate: [0, 90] }} transition={{ delay: 1.3, duration: 0.7 }}><path d={STAR} fill="currentColor"/></motion.svg>
        </motion.span>
      </div>
      <motion.p className="splash-tag" initial={{ opacity: 0, letterSpacing: '0.7em' }} animate={{ opacity: 1, letterSpacing: '0.32em' }} transition={{ delay: 1.35, duration: 0.7, ease: 'easeOut' }}>Teman Baca Seru</motion.p>
      <motion.div className="splash-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.5 }}>
        {!reduce && <div className="splash-track"><motion.span initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ delay: 1.6, duration: CLOSE_MS / 1000 - 1.8, ease: 'easeInOut' }}/></div>}
        <div className="splash-status">{LOADING.map((text, i) => {
          const last = i === LOADING.length - 1, step = (CLOSE_MS / 1000 - 1.8) / LOADING.length;
          return <motion.span key={text} initial={{ opacity: 0, y: 6 }} animate={last ? { opacity: [0, 1], y: [6, 0] } : { opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }} transition={{ delay: 1.7 + i * step, duration: last ? 0.3 : step, times: last ? undefined : [0, 0.15, 0.85, 1] }}>{text}</motion.span>;
        })}</div>
      </motion.div>
    </motion.div>
    <motion.span className="splash-skip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }} transition={{ delay: 1.8 }}>Ketuk untuk lanjut</motion.span>
  </motion.div>}</AnimatePresence></MotionConfig>;
};
