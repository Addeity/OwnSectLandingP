/*
 * The primary pill leans toward the mouse over it, a few pixels and no more,
 * and settles back when the mouse leaves: it reads as something that
 * noticed you rather than a picture of a button. Moved by `translate`, so a
 * press (`scale`, styles/motion.css) and the pill's own transform still
 * apply; eased toward the pointer on the frame clock, and dropped at rest,
 * so a pill nobody is near is not a layer of its own.
 *
 * Only with a mouse, and never with reduced motion. The full-width pills in
 * the forms are left alone: across a form a moving button is a nuisance.
 */
import { reduceMotion } from '../lib/motion.ts';

/** the share of the pointer's distance from the pill's centre it follows */
const PULL = 0.24;
/** and the most it moves, in px */
const MOST = 7;
/** how closely it follows: the time, in ms, to close most of the gap */
const FOLLOW = 120;

export function magnetic(): void {
  if (reduceMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('.btn--solid:not(.btn--block)').forEach(lean);
}

function lean(btn: HTMLElement): void {
  const goal = { x: 0, y: 0 };
  const now = { x: 0, y: 0 };
  let raf = 0;
  let last = 0;
  const clamp = (v: number) => Math.max(-MOST, Math.min(MOST, v));

  const frame = (t: number) => {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    const k = 1 - Math.exp(-dt / FOLLOW);
    now.x += (goal.x - now.x) * k;
    now.y += (goal.y - now.y) * k;
    if (!goal.x && !goal.y && Math.abs(now.x) + Math.abs(now.y) < 0.05) {
      btn.style.translate = '';
      raf = 0;
      last = 0;
      return;
    }
    btn.style.translate = `${now.x.toFixed(2)}px ${now.y.toFixed(2)}px`;
    raf = requestAnimationFrame(frame);
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

  btn.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = btn.getBoundingClientRect();
    // measured from where the pill rests, not from where it has leant to
    goal.x = clamp((e.clientX - (r.left - now.x + r.width / 2)) * PULL);
    goal.y = clamp((e.clientY - (r.top - now.y + r.height / 2)) * PULL);
    run();
  }, { passive: true });
  btn.addEventListener('pointerleave', () => {
    goal.x = 0;
    goal.y = 0;
    run();
  });
}
