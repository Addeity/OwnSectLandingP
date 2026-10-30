/*
 * The plans on the pricing page, and how they move (styles/plans.css draws
 * them).
 *
 * The billing switch: a pill slides under the period chosen, and every
 * plan's price rolls to its new figure digit by digit. Each figure is
 * rebuilt once into columns of digits, one strip of 0 to 9 in each, which
 * CSS moves to the digit shown; the figure itself is kept beside them as
 * text for screen readers, and a figure that is not a number ("Custom")
 * stays as it is.
 *
 * The tilt: under a mouse a plan leans toward the pointer and lifts a
 * little, eased so it follows the hand rather than snapping to it. When the
 * pointer leaves it settles, and its transform is dropped, so a plan at rest
 * is not a layer of its own.
 */
import { DUR, SPRING_SOFT, gsap, reduceMotion } from '../lib/motion.ts';

/** --e-out, for the few things WAAPI animates here */
const EASE = 'cubic-bezier(.16,1,.3,1)';

export function plans(): void {
  billing();
  tilts();
}

/* ------------------------------------------------------------ billing */
function billing(): void {
  const group = document.getElementById('billing');
  if (!group) return;
  const pill = group.querySelector<HTMLElement>('.billing__pill');
  const btns = [...group.querySelectorAll<HTMLButtonElement>('button[data-period]')];
  const save = group.querySelector<HTMLElement>('.billing__save');
  const figures = [...document.querySelectorAll<HTMLElement>('.plan__amt[data-mo][data-yr]')].map(figure);
  const notes = [...document.querySelectorAll<HTMLElement>('.plan__note[data-note-mo][data-note-yr]')];

  const place = (btn: HTMLElement, animate: boolean) => {
    // laid out only once its section comes near (content-visibility): measured again when it is
    if (!pill || !btn.offsetWidth) return;
    gsap.to(pill, { x: btn.offsetLeft, width: btn.offsetWidth, duration: animate && !reduceMotion ? DUR.panel : 0, ease: SPRING_SOFT, overwrite: true });
    group.classList.add('has-pill');
  };

  group.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-period]');
    if (!btn || btn.classList.contains('is-on')) return;
    const yearly = btn.dataset.period === 'yr';
    for (const b of btns) {
      b.classList.toggle('is-on', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    }
    place(btn, true);
    // every word written first, then every animation started: one style pass, not one per line
    const lines = notes.filter((note) => {
      const text = (yearly ? note.dataset.noteYr : note.dataset.noteMo) ?? '';
      if (note.textContent === text) return false;
      note.textContent = text;
      return true;
    });
    for (const show of figures) show(yearly);
    if (!reduceMotion) for (const line of lines) line.animate(RISE_IN, { duration: 360, easing: EASE });
    // the saving is the reason to switch: it answers the press
    if (yearly && save && !reduceMotion) {
      save.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 520, easing: EASE });
    }
  });

  const sync = () => {
    const on = btns.find((b) => b.classList.contains('is-on'));
    if (on) place(on, false);
  };
  sync();
  document.fonts?.ready.then(sync);
  new ResizeObserver(sync).observe(group);
}

/** new words rising into a line that changed */
const RISE_IN: Keyframe[] = [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }];

/** a line of text changed in place */
function swap(el: HTMLElement, text: string): void {
  if (el.textContent === text) return;
  el.textContent = text;
  if (!reduceMotion) el.animate(RISE_IN, { duration: 360, easing: EASE });
}

/**
 * Rebuilds one price as rolling digits and returns what shows the monthly
 * or the yearly figure. The two figures must have the same shape (digits in
 * the same places) to roll; when they do not, the figure is swapped whole.
 */
function figure(amt: HTMLElement, plan: number): (yearly: boolean) => void {
  const mo = amt.dataset.mo!;
  const yr = amt.dataset.yr!;
  const text = amt.textContent!.trim();
  const at = text.lastIndexOf(mo);
  const shape = (v: string) => v.replace(/\d/g, '0');
  if (at < 0 || shape(mo) !== shape(yr)) {
    const before = at < 0 ? '' : text.slice(0, at);
    const after = at < 0 ? '' : text.slice(at + mo.length);
    return (yearly) => swap(amt, `${before}${yearly ? yr : mo}${after}`);
  }

  const before = text.slice(0, at);
  const after = text.slice(at + mo.length);
  const sr = document.createElement('span');
  sr.className = 'sr';
  sr.textContent = text;
  const odo = document.createElement('span');
  odo.className = 'odo';
  odo.setAttribute('aria-hidden', 'true');
  const fixed = (s: string) => {
    if (!s) return;
    const el = document.createElement('span');
    el.textContent = s;
    odo.append(el);
  };

  fixed(before);
  const cols: HTMLElement[] = [];
  for (const ch of mo) {
    if (!/\d/.test(ch)) { fixed(ch); continue; }
    const col = document.createElement('span');
    col.className = 'odo__c';
    col.style.setProperty('--c', String(cols.length));
    col.style.setProperty('--n', ch);
    // blank, 0 to 9, then 0 again: a spring past either end still lands on a digit (styles/plans.css)
    col.innerHTML = `<span class="odo__g">0</span><span class="odo__strip"> \n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0</span>`;
    odo.append(col);
    cols.push(col);
  }
  fixed(after);
  amt.style.setProperty('--p', String(plan));
  amt.replaceChildren(sr, odo);

  return (yearly) => {
    const v = yearly ? yr : mo;
    sr.textContent = `${before}${v}${after}`;
    const digits = v.replace(/\D/g, '');
    cols.forEach((col, i) => col.style.setProperty('--n', digits[i]!));
  };
}

/* --------------------------------------------------------------- tilt */
/** degrees a plan leans at its edge, and how far it lifts, in px */
const TILT = 5;
const LIFT = 6;
/** how closely it follows the pointer: the time, in ms, to close most of the gap */
const FOLLOW = 110;

function tilts(): void {
  if (reduceMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('.plan').forEach(tilt);
}

function tilt(card: HTMLElement): void {
  const goal = { x: 0, y: 0, lift: 0 };
  const now = { x: 0, y: 0, lift: 0 };
  let raf = 0;
  let last = 0;

  const frame = (t: number) => {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    const k = 1 - Math.exp(-dt / FOLLOW);
    now.x += (goal.x - now.x) * k;
    now.y += (goal.y - now.y) * k;
    now.lift += (goal.lift - now.lift) * k;
    if (!goal.lift && Math.abs(now.x) + Math.abs(now.y) + Math.abs(now.lift) < 0.02) {
      card.style.transform = '';
      raf = 0;
      last = 0;
      return;
    }
    card.style.transform = `perspective(1100px) translate3d(0, ${(-now.lift).toFixed(2)}px, 0) rotateX(${now.x.toFixed(2)}deg) rotateY(${now.y.toFixed(2)}deg)`;
    raf = requestAnimationFrame(frame);
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    goal.x = -py * TILT * 0.8;
    goal.y = px * TILT;
    goal.lift = LIFT;
    run();
  }, { passive: true });
  card.addEventListener('pointerleave', () => {
    goal.x = 0;
    goal.y = 0;
    goal.lift = 0;
    run();
  });
}
