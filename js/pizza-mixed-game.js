import {
  fillTextWithFractions,
  setMixedDisplay,
  fractionsEqual,
  shuffle,
} from './fraction.js';

const PROBLEMS = [
  { whole: 3, num: 1, den: 4 },
  { whole: 2, num: 1, den: 3 },
  { whole: 1, num: 1, den: 2 },
  { whole: 2, num: 1, den: 4 },
  { whole: 1, num: 2, den: 5 },
  { whole: 2, num: 2, den: 3 },
  { whole: 1, num: 3, den: 4 },
  { whole: 3, num: 1, den: 2 },
  { whole: 2, num: 1, den: 5 },
  { whole: 1, num: 1, den: 3 },
];

function denName(den) {
  const map = {
    2: 'polovice',
    3: 'trećine',
    4: 'četvrtine',
    5: 'petine',
    6: 'šestine',
    8: 'osmine',
  };
  return map[den] || `${den} jednakih dijelova`;
}

function sliceCountLabel(n) {
  if (n === 1) return '1 kriška';
  if (n >= 2 && n <= 4) return `${n} kriške`;
  return `${n} kriški`;
}

function polar(cx, cy, r, a) {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedgeD(cx, cy, r, i, den) {
  const a0 = -Math.PI / 2 + (i / den) * Math.PI * 2;
  const a1 = -Math.PI / 2 + ((i + 1) / den) * Math.PI * 2;
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function makePizzaEl(den) {
  const wrap = document.createElement('div');
  wrap.className = 'pg-pizza';
  const wedges = [];
  const lines = [];
  for (let i = 0; i < den; i++) {
    wedges.push(`<path class="pg-wedge" data-slot="${i}" d="${wedgeD(60, 60, 50, i, den)}" />`);
    const a = -Math.PI / 2 + (i / den) * Math.PI * 2;
    const [x, y] = polar(60, 60, 50, a);
    lines.push(`<line x1="60" y1="60" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" class="pg-cut"/>`);
  }
  wrap.innerHTML = `<svg viewBox="0 0 120 120" class="pg-pizza-svg" aria-hidden="true">
    <circle cx="60" cy="60" r="57" fill="#c47c2c"/>
    <circle cx="60" cy="60" r="51" fill="#f6e0b4"/>
    ${wedges.join('')}
    ${lines.join('')}
    <circle cx="60" cy="60" r="4.5" fill="#e8c48a" stroke="#c47c2c" stroke-width="1"/>
  </svg>`;
  return wrap;
}

function makeSliceEl(id, den) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pg-slice';
  el.dataset.id = String(id);
  el.setAttribute('aria-label', 'Kriška pizze');
  el.innerHTML = `<svg viewBox="0 0 80 78" fill="none" aria-hidden="true">
    <path d="${wedgeD(40, 46, 34, 0, den)}" fill="#c41e3a"/>
    <path d="${wedgeD(40, 46, 34, 0, den)}" fill="none" stroke="#c47c2c" stroke-width="5" stroke-linejoin="round"/>
  </svg>`;
  return el;
}

export function initPizzaMixedGame() {
  const root = document.getElementById('pizza-mixed-game');
  if (!root) return;

  const questionEl = document.getElementById('pg-question');
  const hintEl = document.getElementById('pg-slice-hint');
  const pizzasEl = document.getElementById('pg-pizzas');
  const poolEl = document.getElementById('pg-pool');
  const countEl = document.getElementById('pg-count');
  const fracNumEl = document.getElementById('pg-frac-num');
  const fracDenEl = document.getElementById('pg-frac-den');
  const checkBtn = document.getElementById('pg-check');
  const nextBtn = document.getElementById('pg-next');
  const feedbackEl = document.getElementById('pg-feedback');
  const solutionEl = document.getElementById('pg-solution');
  const stepsEl = document.getElementById('pg-solution-steps');

  const state = {
    problem: null,
    target: 13,
    den: 4,
    done: false,
    drag: null,
    queue: [],
  };

  function nextProblem() {
    if (state.queue.length === 0) {
      const last = state.problem;
      state.queue = shuffle(PROBLEMS);
      if (last && state.queue.length > 1 && state.queue[0] === last) {
        const swapAt = Math.floor(Math.random() * (state.queue.length - 1)) + 1;
        [state.queue[0], state.queue[swapAt]] = [state.queue[swapAt], state.queue[0]];
      }
    }
    return state.queue.shift();
  }

  function placedCount() {
    return pizzasEl.querySelectorAll('.pg-wedge.is-filled').length;
  }

  function updateCount() {
    countEl.textContent = `Na pizzama: ${sliceCountLabel(placedCount())}`;
  }

  function firstEmptyWedge(pizza) {
    const scope = pizza || pizzasEl;
    return scope.querySelector('.pg-wedge:not(.is-filled)');
  }

  function fillWedge(wedge, fromSlice) {
    if (!wedge || wedge.classList.contains('is-filled')) return false;
    const slice = fromSlice && fromSlice.parentElement === poolEl
      ? fromSlice
      : poolEl.querySelector('.pg-slice');
    if (!slice) return false;
    wedge.classList.add('is-filled');
    slice.remove();
    updateCount();
    return true;
  }

  function emptyWedge(wedge) {
    if (!wedge?.classList.contains('is-filled')) return;
    wedge.classList.remove('is-filled');
    const n = poolEl.querySelectorAll('.pg-slice').length;
    poolEl.appendChild(makeSliceEl(`back-${n}`, state.den));
    updateCount();
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
    const { whole, num, den } = state.problem;
    const fromWholes = whole * den;
    stepsEl.replaceChildren();
    addStep(
      `${whole} cijele pizze podijeljene na ${denName(den)} daju ${whole} × ${den} kriški, plus još ${num}/${den}.`,
      `${whole} × ${den} = ${fromWholes}, ${fromWholes} + ${num} = ${sliceCountLabel(state.target)}.`
    );
    addStep(
      'Isto kao nepravi razlomak: cijeli dio pretvori u kriške, pa zbroji ostatak.',
      `${whole} ${num}/${den} = ${state.target}/${den}, dakle ${sliceCountLabel(state.target)}.`
    );
    solutionEl.hidden = false;
  }

  function generateRound() {
    const problem = nextProblem();
    const { whole, num, den } = problem;
    const target = whole * den + num;
    const neededPizzas = whole + (num > 0 ? 1 : 0);
    const pizzaCount = neededPizzas + 2;
    const poolCount = target + den;

    state.problem = problem;
    state.target = target;
    state.den = den;
    state.done = false;
    state.drag = null;

    questionEl.replaceChildren();
    questionEl.appendChild(document.createTextNode('Koliko je kriški pizze '));
    const mix = document.createElement('span');
    mix.id = 'pg-mixed';
    questionEl.appendChild(mix);
    questionEl.appendChild(document.createTextNode('?'));
    setMixedDisplay('pg-mixed', whole, num, den);

    hintEl.textContent = `Kriške su ${denName(den)}. Ima više pizza i kriški nego što treba.`;

    pizzasEl.replaceChildren();
    for (let i = 0; i < pizzaCount; i++) {
      pizzasEl.appendChild(makePizzaEl(den));
    }

    poolEl.replaceChildren();
    for (let i = 0; i < poolCount; i++) {
      poolEl.appendChild(makeSliceEl(i, den));
    }

    fracNumEl.value = '';
    fracDenEl.value = '';
    fracNumEl.disabled = false;
    fracDenEl.disabled = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    solutionEl.hidden = true;
    stepsEl.replaceChildren();
    nextBtn.hidden = true;
    checkBtn.disabled = false;
    root.classList.remove('is-done', 'is-correct', 'is-wrong');
    updateCount();
  }

  function parseFracAnswer() {
    const numRaw = fracNumEl.value.trim();
    const denRaw = fracDenEl.value.trim();
    if (numRaw === '' || denRaw === '') return null;
    const num = parseInt(numRaw, 10);
    const den = parseInt(denRaw, 10);
    if (Number.isNaN(num) || Number.isNaN(den) || den <= 0 || num < 0) return null;
    return { num, den };
  }

  function checkAnswer() {
    if (state.done) return;
    const frac = parseFracAnswer();
    if (!frac) {
      feedbackEl.textContent = 'Upiši nepravi razlomak — brojnik i nazivnik.';
      feedbackEl.className = 'feedback error';
      fracNumEl.focus();
      return;
    }

    state.done = true;
    checkBtn.disabled = true;
    fracNumEl.disabled = true;
    fracDenEl.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');
    showSolution();

    const placed = placedCount();
    const slicesOk = placed === state.target;
    const fracOk = fractionsEqual(frac.num, frac.den, state.target, state.den);

    if (slicesOk && fracOk) {
      root.classList.add('is-correct');
      feedbackEl.textContent = `Točno! ${sliceCountLabel(state.target)}, to je ${state.target}/${state.den}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      const sliceLine = slicesOk
        ? `Kriške su točne (${sliceCountLabel(state.target)}).`
        : `Treba staviti ${sliceCountLabel(state.target)}, a na pizzama je ${sliceCountLabel(placed)}.`;
      const fracLine = fracOk
        ? `Nepravi razlomak je točan.`
        : `Nepravi razlomak je ${state.target}/${state.den}.`;
      feedbackEl.textContent = `Nije točno. ${sliceLine} ${fracLine}`;
      feedbackEl.className = 'feedback error';
    }
  }

  let skipClick = false;

  root.addEventListener('click', (e) => {
    if (e.target.closest('#pg-check, #pg-next, #pg-frac-num, #pg-frac-den, .pg-frac-box')) return;
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (state.done) return;
    const slice = e.target.closest('.pg-slice');
    if (slice) {
      fillWedge(firstEmptyWedge(), slice);
      return;
    }
    const wedge = e.target.closest('.pg-wedge');
    if (wedge?.classList.contains('is-filled')) emptyWedge(wedge);
  });

  root.addEventListener('pointerdown', (e) => {
    if (state.done) return;
    if (e.target.closest('#pg-check, #pg-next, #pg-frac-num, #pg-frac-den, .pg-frac-box')) return;
    const slice = e.target.closest('.pg-slice');
    if (!slice) return;
    const rect = slice.getBoundingClientRect();
    state.drag = {
      slice,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      ghost: null,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    slice.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  root.addEventListener('pointermove', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (!d.moved && dist < 8) return;
    d.moved = true;
    if (!d.ghost) {
      d.ghost = d.slice.cloneNode(true);
      d.ghost.classList.add('pg-ghost');
      d.ghost.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d.ghost);
      d.slice.classList.add('is-dragging');
    }
    d.ghost.style.width = `${d.slice.offsetWidth}px`;
    d.ghost.style.height = `${d.slice.offsetHeight}px`;
    d.ghost.style.left = `${e.clientX - d.offsetX}px`;
    d.ghost.style.top = `${e.clientY - d.offsetY}px`;
  });

  function clearDrag() {
    const d = state.drag;
    if (!d) return;
    d.slice.classList.remove('is-dragging');
    d.ghost?.remove();
    state.drag = null;
  }

  root.addEventListener('pointerup', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;

    if (!d.moved) {
      skipClick = true;
      clearDrag();
      fillWedge(firstEmptyWedge(), d.slice);
      return;
    }

    skipClick = true;
    d.ghost?.remove();
    d.slice.classList.remove('is-dragging');
    const drop = document.elementFromPoint(e.clientX, e.clientY);
    const pizza = drop?.closest('#pizza-mixed-game .pg-pizza');
    if (pizza) fillWedge(firstEmptyWedge(pizza), d.slice);
    state.drag = null;
  });

  root.addEventListener('pointercancel', () => clearDrag());

  checkBtn.addEventListener('click', checkAnswer);
  fracNumEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
  fracDenEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
  nextBtn.addEventListener('click', () => {
    generateRound();
  });

  generateRound();
}
