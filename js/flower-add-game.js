import {
  lcm,
  simplify,
  formatFractionParen,
  fracParen,
  fillTextWithFractions,
  fillFormulaWithFractions,
  setFeedbackText,
} from './fraction.js';
import { amountOf } from './window-game.js?v=3';
import { makeFlowerEl, flowerCountLabel } from './flower-sub-game.js?v=2';

const PROBLEMS = [
  { total: 24, a: { num: 2, den: 8, name: 'Lucija' }, b: { num: 3, den: 6, name: 'Marko' } },
  { total: 12, a: { num: 1, den: 4, name: 'Ana' }, b: { num: 1, den: 3, name: 'Luka' } },
  { total: 16, a: { num: 1, den: 4, name: 'Ema' }, b: { num: 3, den: 8, name: 'Filip' } },
  { total: 18, a: { num: 1, den: 6, name: 'Mia' }, b: { num: 2, den: 9, name: 'Ivan' } },
  { total: 20, a: { num: 1, den: 5, name: 'Petra' }, b: { num: 2, den: 4, name: 'Marko' } },
  { total: 24, a: { num: 1, den: 3, name: 'Luka' }, b: { num: 1, den: 8, name: 'Ana' } },
  { total: 30, a: { num: 1, den: 5, name: 'Filip' }, b: { num: 2, den: 6, name: 'Ema' } },
  { total: 12, a: { num: 2, den: 6, name: 'Tea' }, b: { num: 1, den: 4, name: 'Lucija' } },
];

export function initFlowerAddGame() {
  const root = document.getElementById('flower-add-game');
  if (!root) return;

  const storyEl = document.getElementById('fag-story');
  const tableEl = document.getElementById('fag-table');
  const poolEl = document.getElementById('fag-pool');
  const countEl = document.getElementById('fag-count');
  const checkBtn = document.getElementById('fag-check');
  const nextBtn = document.getElementById('fag-next');
  const feedbackEl = document.getElementById('fag-feedback');
  const solutionEl = document.getElementById('fag-solution');
  const stepsEl = document.getElementById('fag-solution-steps');

  const state = {
    round: 0,
    problem: PROBLEMS[0],
    correct: 18,
    done: false,
    drag: null,
  };

  function tableCount() {
    return tableEl.querySelectorAll('.fg-flower').length;
  }

  function updateCount() {
    countEl.textContent = `Na stolu: ${flowerCountLabel(tableCount())}`;
  }

  function moveToTable(flower) {
    tableEl.appendChild(flower);
    flower.classList.add('is-on-table');
    updateCount();
  }

  function moveToPool(flower) {
    poolEl.appendChild(flower);
    flower.classList.remove('is-on-table');
    updateCount();
  }

  function toggleFlower(flower) {
    if (state.done) return;
    if (flower.parentElement === poolEl) moveToTable(flower);
    else moveToPool(flower);
  }

  function addStep(intro, formula) {
    const step = document.createElement('div');
    step.className = 'ops-arith-solution-step';
    const p = document.createElement('p');
    p.className = 'ops-arith-solution-label';
    fillTextWithFractions(p, intro);
    const f = document.createElement('p');
    f.className = 'ops-arith-solution-text';
    fillFormulaWithFractions(f, formula);
    step.append(p, f);
    stepsEl.appendChild(step);
  }

  function showSolution() {
    const { total, a, b } = state.problem;
    const na = amountOf(a.num, a.den, total);
    const nb = amountOf(b.num, b.den, total);
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
      `${a.name} donese ${a.num}/${a.den} od ${total} cvjetova. Cijelinu podijeli na ${a.den} jednakih dijelova.`,
      `${total} : ${a.den} = ${partA}, pa ${a.num} × ${partA} = ${flowerCountLabel(na)}.`
    );
    addStep(
      `${b.name} donese ${b.num}/${b.den} od ${total} cvjetova. Cijelinu podijeli na ${b.den} jednakih dijelova.`,
      `${total} : ${b.den} = ${partB}, pa ${b.num} × ${partB} = ${flowerCountLabel(nb)}.`
    );
    addStep(
      'Zbroji koliko su cvjetova donijeli zajedno.',
      `${na} + ${nb} = ${flowerCountLabel(state.correct)}.`
    );
    addStep(
      'Isti zbroj razlomcima, pa rezultat pomnoži s brojem svih cvjetova.',
      `${fracParen(a.num, a.den)}×${multA}+${fracParen(b.num, b.den)}×${multB}=${fracParen(n1, common)}+${fracParen(n2, common)}=(${n1}+${n2})/${common}=${formatFractionParen(result.num, result.den)},  ${formatFractionParen(result.num, result.den)} od ${total} = ${state.correct}`
    );
    solutionEl.hidden = false;
  }

  function generateRound() {
    const problem = PROBLEMS[state.round % PROBLEMS.length];
    state.problem = problem;
    state.correct =
      amountOf(problem.a.num, problem.a.den, problem.total) +
      amountOf(problem.b.num, problem.b.den, problem.total);
    state.done = false;
    state.drag = null;

    fillTextWithFractions(
      storyEl,
      `Na stolu treba složiti ${problem.total} cvjetova maka. ${problem.a.name} donese ${problem.a.num}/${problem.a.den} svih cvjetova, a ${problem.b.name} ${problem.b.num}/${problem.b.den}. Koliko cvjetova zajedno donesu?`
    );

    tableEl.replaceChildren();
    poolEl.replaceChildren();

    for (let i = 0; i < problem.total; i++) {
      poolEl.appendChild(makeFlowerEl(i));
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
    showSolution();

    const placed = tableCount();
    const correct = state.correct;

    if (placed === correct) {
      root.classList.add('is-correct');
      setFeedbackText(
        feedbackEl,
        `Točno! Zajedno donesu ${flowerCountLabel(correct)}.`
      );
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      setFeedbackText(
        feedbackEl,
        `Nije točno. Treba prenijeti ${flowerCountLabel(correct)}, a na stolu je ${flowerCountLabel(placed)}.`
      );
      feedbackEl.className = 'feedback error';
    }
  }

  let skipClick = false;

  root.addEventListener('click', (e) => {
    if (e.target.closest('#fag-check, #fag-next')) return;
    if (skipClick) {
      skipClick = false;
      return;
    }
    const flower = e.target.closest('.fg-flower');
    if (flower) toggleFlower(flower);
  });

  poolEl.addEventListener('keydown', (e) => {
    const flower = e.target.closest('.fg-flower');
    if (!flower) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlower(flower);
    }
  });

  tableEl.addEventListener('keydown', (e) => {
    const flower = e.target.closest('.fg-flower');
    if (!flower) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlower(flower);
    }
  });

  root.addEventListener('pointerdown', (e) => {
    if (state.done) return;
    if (e.target.closest('#fag-check, #fag-next')) return;
    const flower = e.target.closest('.fg-flower');
    if (!flower) return;
    const rect = flower.getBoundingClientRect();
    state.drag = {
      flower,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromPool: flower.parentElement === poolEl,
      ghost: null,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    flower.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  root.addEventListener('pointermove', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (!d.moved && dist < 8) return;
    d.moved = true;
    if (!d.ghost) {
      d.ghost = d.flower.cloneNode(true);
      d.ghost.classList.add('fg-ghost');
      d.ghost.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d.ghost);
      d.flower.classList.add('is-dragging');
    }
    d.ghost.style.width = `${d.flower.offsetWidth}px`;
    d.ghost.style.height = `${d.flower.offsetHeight}px`;
    d.ghost.style.left = `${e.clientX - d.offsetX}px`;
    d.ghost.style.top = `${e.clientY - d.offsetY}px`;
  });

  function clearDrag() {
    const d = state.drag;
    if (!d) return;
    d.flower.classList.remove('is-dragging');
    if (d.ghost) d.ghost.remove();
    state.drag = null;
  }

  root.addEventListener('pointerup', (e) => {
    const d = state.drag;
    if (!d || d.pointerId !== e.pointerId) return;

    if (!d.moved) {
      skipClick = true;
      clearDrag();
      toggleFlower(d.flower);
      return;
    }

    skipClick = true;
    d.ghost?.remove();
    d.flower.classList.remove('is-dragging');
    const drop = document.elementFromPoint(e.clientX, e.clientY);
    const onTable = drop?.closest('#fag-table');
    const onPool = drop?.closest('#fag-pool');
    if (onTable) moveToTable(d.flower);
    else if (onPool) moveToPool(d.flower);
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
