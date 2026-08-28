import {
  lcm,
  simplify,
  formatFractionParen,
  fracParen,
  fillTextWithFractions,
} from './fraction.js';

const PROBLEMS = [
  { total: 24, a: { num: 2, den: 8, name: 'Ivan' }, b: { num: 3, den: 6, name: 'Marko' } },
  { total: 12, a: { num: 1, den: 4, name: 'Ana' }, b: { num: 1, den: 3, name: 'Luka' } },
  { total: 16, a: { num: 1, den: 4, name: 'Ema' }, b: { num: 3, den: 8, name: 'Filip' } },
  { total: 18, a: { num: 1, den: 6, name: 'Mia' }, b: { num: 2, den: 9, name: 'Ivan' } },
  { total: 20, a: { num: 1, den: 5, name: 'Petra' }, b: { num: 2, den: 4, name: 'Marko' } },
  { total: 24, a: { num: 1, den: 3, name: 'Luka' }, b: { num: 1, den: 8, name: 'Ana' } },
  { total: 30, a: { num: 1, den: 5, name: 'Filip' }, b: { num: 2, den: 6, name: 'Ema' } },
  { total: 12, a: { num: 2, den: 6, name: 'Marko' }, b: { num: 1, den: 4, name: 'Mia' } },
];

export function amountOf(num, den, total) {
  return (num * total) / den;
}

export function gridFor(n) {
  const order = n >= 20 ? [6, 5, 4, 3] : [4, 3, 6, 5];
  for (const cols of order) {
    if (n % cols === 0) return { cols, rows: n / cols };
  }
  return { cols: 4, rows: Math.ceil(n / 4) };
}

export function windowCountLabel(n) {
  if (n === 1) return '1 prozor';
  if (n >= 2 && n <= 4) return `${n} prozora`;
  return `${n} prozora`;
}

export function makeWindowEl(id) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'wg-window';
  el.dataset.id = String(id);
  el.setAttribute('aria-label', 'Prozor');
  el.innerHTML = '<span></span><span></span><span></span><span></span>';
  return el;
}

export function initWindowAddGame() {
  const root = document.getElementById('window-game');
  if (!root) return;

  const storyEl = document.getElementById('wg-story');
  const slotsEl = document.getElementById('wg-slots');
  const poolEl = document.getElementById('wg-pool');
  const countEl = document.getElementById('wg-count');
  const checkBtn = document.getElementById('wg-check');
  const nextBtn = document.getElementById('wg-next');
  const feedbackEl = document.getElementById('wg-feedback');
  const solutionEl = document.getElementById('wg-solution');
  const stepsEl = document.getElementById('wg-solution-steps');

  const state = {
    round: 0,
    problem: PROBLEMS[0],
    correct: 18,
    done: false,
    drag: null,
  };

  function placedCount() {
    return slotsEl.querySelectorAll('.wg-window').length;
  }

  function updateCount() {
    countEl.textContent = `Na zgradi: ${windowCountLabel(placedCount())}`;
  }

  function firstEmptySlot() {
    return [...slotsEl.children].find((slot) => !slot.querySelector('.wg-window'));
  }

  function moveToBuilding(win) {
    const slot = firstEmptySlot();
    if (!slot) return;
    slot.appendChild(win);
    win.classList.add('is-placed');
    updateCount();
  }

  function moveToPool(win) {
    poolEl.appendChild(win);
    win.classList.remove('is-placed');
    updateCount();
  }

  function toggleWindow(win) {
    if (state.done) return;
    if (win.parentElement === poolEl) moveToBuilding(win);
    else moveToPool(win);
  }

  function addStep(intro, formula) {
    const step = document.createElement('div');
    step.className = 'ops-arith-solution-step';
    const p = document.createElement('p');
    p.className = 'ops-arith-solution-label';
    fillTextWithFractions(p, intro);
    const f = document.createElement('p');
    f.className = 'ops-arith-solution-text';
    fillTextWithFractions(f, formula);
    step.append(p, f);
    stepsEl.appendChild(step);
  }

  function showSolution() {
    const { total, a, b } = state.problem;
    const ivan = amountOf(a.num, a.den, total);
    const marko = amountOf(b.num, b.den, total);
    const common = lcm(a.den, b.den);
    const multA = common / a.den;
    const multB = common / b.den;
    const n1 = a.num * multA;
    const n2 = b.num * multB;
    const sum = n1 + n2;
    const result = simplify(sum, common);
    const partA = total / a.den;
    const partB = total / b.den;

    stepsEl.replaceChildren();
    addStep(
      `${a.name} stavi ${a.num}/${a.den} od ${total} prozora. Cijelinu podijeli na ${a.den} jednakih dijelova.`,
      `${total} : ${a.den} = ${partA}, pa ${a.num} × ${partA} = ${ivan} prozora.`
    );
    addStep(
      `${b.name} stavi ${b.num}/${b.den} od ${total} prozora. Cijelinu podijeli na ${b.den} jednakih dijelova.`,
      `${total} : ${b.den} = ${partB}, pa ${b.num} × ${partB} = ${marko} prozora.`
    );
    addStep(
      'Zbroji koliko su stavili zajedno u jednom danu.',
      `${ivan} + ${marko} = ${state.correct} prozora.`
    );
    addStep(
      'Isti zbroj razlomcima, pa rezultat pomnoži s brojem svih prozora.',
      `${fracParen(a.num, a.den)}×${multA}+${fracParen(b.num, b.den)}×${multB}=${fracParen(n1, common)}+${fracParen(n2, common)}=(${n1}+${n2})/${common}=${formatFractionParen(result.num, result.den)},  ${formatFractionParen(result.num, result.den)} od ${total} = ${state.correct}`
    );
    solutionEl.hidden = false;
  }

  function generateRound() {
    const problem = PROBLEMS[state.round % PROBLEMS.length];
    state.problem = problem;
    state.correct = amountOf(problem.a.num, problem.a.den, problem.total) + amountOf(problem.b.num, problem.b.den, problem.total);
    state.done = false;
    state.drag = null;

    fillTextWithFractions(
      storyEl,
      `Na zgradu treba staviti ${problem.total} prozora. ${problem.a.name} u jednom danu može staviti ${problem.a.num}/${problem.a.den} svih prozora, a ${problem.b.name} ${problem.b.num}/${problem.b.den}. Koliko u jednom danu mogu napraviti prozora?`
    );

    const { cols } = gridFor(problem.total);
    slotsEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    slotsEl.replaceChildren();
    poolEl.replaceChildren();

    for (let i = 0; i < problem.total; i++) {
      const slot = document.createElement('div');
      slot.className = 'wg-slot';
      slotsEl.appendChild(slot);
      poolEl.appendChild(makeWindowEl(i));
    }

    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    solutionEl.hidden = true;
    stepsEl.replaceChildren();
    nextBtn.hidden = true;
    checkBtn.disabled = false;
    root.classList.remove('is-done', 'is-correct', 'is-wrong');
    updateCount();
  }

  function checkAnswer() {
    if (state.done) return;
    state.done = true;
    checkBtn.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');

    const placed = placedCount();
    const correct = state.correct;
    showSolution();

    if (placed === correct) {
      root.classList.add('is-correct');
      feedbackEl.textContent = `Točno! U jednom danu stave ${windowCountLabel(correct)}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      feedbackEl.textContent = `Nije točno. Treba prenijeti ${windowCountLabel(correct)}, a na zgradi je ${windowCountLabel(placed)}.`;
      feedbackEl.className = 'feedback error';
    }
  }

  let skipClick = false;

  root.addEventListener('click', (e) => {
    if (skipClick) {
      skipClick = false;
      return;
    }
    const win = e.target.closest('.wg-window');
    if (win) toggleWindow(win);
  });

  poolEl.addEventListener('keydown', (e) => {
    const win = e.target.closest('.wg-window');
    if (!win) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleWindow(win);
    }
  });

  slotsEl.addEventListener('keydown', (e) => {
    const win = e.target.closest('.wg-window');
    if (!win) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleWindow(win);
    }
  });

  root.addEventListener('pointerdown', (e) => {
    if (state.done) return;
    const win = e.target.closest('.wg-window');
    if (!win) return;
    const rect = win.getBoundingClientRect();
    state.drag = {
      win,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromPool: win.parentElement === poolEl,
      ghost: null,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    win.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  root.addEventListener('pointermove', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (!d.moved && dist < 8) return;
    d.moved = true;
    if (!d.ghost) {
      d.ghost = d.win.cloneNode(true);
      d.ghost.classList.add('wg-ghost');
      d.ghost.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d.ghost);
      d.win.classList.add('is-dragging');
    }
    d.ghost.style.width = `${d.win.offsetWidth}px`;
    d.ghost.style.height = `${d.win.offsetHeight}px`;
    d.ghost.style.left = `${e.clientX - d.offsetX}px`;
    d.ghost.style.top = `${e.clientY - d.offsetY}px`;
  });

  function clearDrag() {
    const d = state.drag;
    if (!d) return;
    d.win.classList.remove('is-dragging');
    if (d.ghost) d.ghost.remove();
    state.drag = null;
  }

  root.addEventListener('pointerup', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;

    if (!d.moved) {
      skipClick = true;
      clearDrag();
      toggleWindow(d.win);
      return;
    }

    skipClick = true;
    d.ghost?.remove();
    d.win.classList.remove('is-dragging');
    const drop = document.elementFromPoint(e.clientX, e.clientY);
    const onBuilding = drop?.closest('#wg-building, #wg-slots, .wg-slot');
    const onPool = drop?.closest('#wg-pool');
    if (onBuilding) moveToBuilding(d.win);
    else if (onPool) moveToPool(d.win);
    state.drag = null;
  });

  root.addEventListener('pointercancel', () => clearDrag());

  checkBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', () => {
    state.round += 1;
    generateRound();
  });

  generateRound();
}
