import {
  fillTextWithFractions,
  fractionsEqual,
  multiplyFractions,
  formatFractionParen,
  fracParen,
  shuffle,
} from './fraction.js';
import { amountOf } from './window-game.js?v=3';
import { makeFlowerEl, flowerCountLabel } from './flower-sub-game.js?v=2';

const PROBLEMS = [
  { total: 12, of: { num: 2, den: 3 }, take: { num: 1, den: 2 } },
  { total: 12, of: { num: 3, den: 4 }, take: { num: 1, den: 3 } },
  { total: 16, of: { num: 1, den: 2 }, take: { num: 1, den: 2 } },
  { total: 12, of: { num: 2, den: 4 }, take: { num: 1, den: 2 } },
  { total: 20, of: { num: 2, den: 5 }, take: { num: 1, den: 2 } },
  { total: 18, of: { num: 2, den: 3 }, take: { num: 1, den: 2 } },
  { total: 24, of: { num: 3, den: 4 }, take: { num: 2, den: 3 } },
  { total: 16, of: { num: 3, den: 4 }, take: { num: 1, den: 2 } },
  { total: 10, of: { num: 4, den: 5 }, take: { num: 1, den: 2 } },
  { total: 12, of: { num: 3, den: 4 }, take: { num: 2, den: 3 } },
];

function gardenGrid(n) {
  const order = [6, 5, 4, 3];
  for (const cols of order) {
    if (n % cols === 0) return { cols, rows: n / cols };
  }
  return { cols: 4, rows: Math.ceil(n / 4) };
}

export function initMulGardenGame() {
  const root = document.getElementById('mul-garden-game');
  if (!root) return;

  const storyEl = document.getElementById('mg-story');
  const stepEl = document.getElementById('mg-step');
  const bedEl = document.getElementById('mg-bed');
  const countEl = document.getElementById('mg-count');
  const hintEl = document.getElementById('mg-hint');
  const phaseBtn = document.getElementById('mg-phase');
  const fracWrap = document.getElementById('mg-frac-wrap');
  const fracQEl = document.getElementById('mg-frac-q');
  const fracNumEl = document.getElementById('mg-frac-num');
  const fracDenEl = document.getElementById('mg-frac-den');
  const checkBtn = document.getElementById('mg-check');
  const nextBtn = document.getElementById('mg-next');
  const feedbackEl = document.getElementById('mg-feedback');
  const solutionEl = document.getElementById('mg-solution');
  const stepsEl = document.getElementById('mg-solution-steps');

  const state = {
    problem: null,
    firstTarget: 0,
    finalTarget: 0,
    phase: 1,
    done: false,
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

  function markedFlowers() {
    return [...bedEl.querySelectorAll('.mg-flower.is-marked')];
  }

  function takenCount() {
    return bedEl.querySelectorAll('.mg-flower.is-taken').length;
  }

  function updateCount() {
    if (state.phase === 1) {
      countEl.textContent = `Označeno: ${flowerCountLabel(markedFlowers().length)}`;
    } else {
      countEl.textContent = `Uzeto: ${flowerCountLabel(takenCount())}`;
    }
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
    const { total, of, take } = state.problem;
    const firstPart = total / of.den;
    const secondPart = state.firstTarget / take.den;
    const rawNum = take.num * of.num;
    const rawDen = take.den * of.den;
    const result = multiplyFractions(take.num, take.den, of.num, of.den);

    stepsEl.replaceChildren();
    addStep(
      `Prvo uzmi ${of.num}/${of.den} od ${total} cvjetova. Cijelinu podijeli na ${of.den} jednakih dijelova.`,
      `${total} : ${of.den} = ${firstPart}, pa ${of.num} × ${firstPart} = ${flowerCountLabel(state.firstTarget)}.`
    );
    addStep(
      `Zatim uzmi ${take.num}/${take.den} od tih ${state.firstTarget} cvjetova.`,
      `${state.firstTarget} : ${take.den} = ${secondPart}, pa ${take.num} × ${secondPart} = ${flowerCountLabel(state.finalTarget)}.`
    );
    addStep(
      'Isto razlomcima: množiš brojnike međusobno i nazivnike međusobno.',
      `${fracParen(take.num, take.den)}×${fracParen(of.num, of.den)}=(${take.num}×${of.num})/(${take.den}×${of.den})=${fracParen(rawNum, rawDen)}=${formatFractionParen(result.num, result.den)}`
    );
    solutionEl.hidden = false;
  }

  function setPhaseOneUi() {
    const { of } = state.problem;
    fillTextWithFractions(stepEl, `Korak 1: označi ${of.num}/${of.den} cvjetova.`);
    hintEl.textContent = 'Klikni cvijet da ga označiš. Klikni ponovo da skineš oznaku.';
    phaseBtn.hidden = false;
    fracWrap.hidden = true;
    checkBtn.hidden = true;
  }

  function enterPhaseTwo() {
    state.phase = 2;
    const { take } = state.problem;
    fillTextWithFractions(stepEl, `Korak 2: od označenih uzmi ${take.num}/${take.den}.`);
    hintEl.textContent = 'Klikni označeni cvijet da ga uzmeš. Klikni ponovo da ga vratiš.';
    phaseBtn.hidden = true;
    fracWrap.hidden = false;
    checkBtn.hidden = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';

    bedEl.querySelectorAll('.mg-flower').forEach((flower) => {
      if (flower.classList.contains('is-marked')) {
        flower.classList.remove('is-idle');
        flower.disabled = false;
      } else {
        flower.classList.add('is-idle');
        flower.disabled = true;
      }
    });
    updateCount();
  }

  function generateRound() {
    const problem = nextProblem();
    const firstTarget = amountOf(problem.of.num, problem.of.den, problem.total);
    const finalTarget = amountOf(problem.take.num, problem.take.den, firstTarget);

    state.problem = problem;
    state.firstTarget = firstTarget;
    state.finalTarget = finalTarget;
    state.phase = 1;
    state.done = false;

    fillTextWithFractions(
      storyEl,
      `Mara ima ${problem.total} cvjetova maka u gredici. Prvo označi ${problem.of.num}/${problem.of.den} gredice, zatim od označenog uzmi ${problem.take.num}/${problem.take.den}.`
    );
    fillTextWithFractions(
      fracQEl,
      `Koliko je ${problem.take.num}/${problem.take.den} × ${problem.of.num}/${problem.of.den}?`
    );

    const { cols } = gardenGrid(problem.total);
    bedEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    bedEl.replaceChildren();
    for (let i = 0; i < problem.total; i++) {
      const flower = makeFlowerEl(i);
      flower.classList.add('mg-flower');
      flower.setAttribute('aria-pressed', 'false');
      bedEl.appendChild(flower);
    }

    fracNumEl.value = '';
    fracDenEl.value = '';
    fracNumEl.disabled = false;
    fracDenEl.disabled = false;
    checkBtn.disabled = false;
    phaseBtn.disabled = false;
    nextBtn.hidden = true;
    solutionEl.hidden = true;
    stepsEl.replaceChildren();
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    root.classList.remove('is-done', 'is-correct', 'is-wrong');
    setPhaseOneUi();
    updateCount();
  }

  function toggleFlower(flower) {
    if (state.done) return;
    if (state.phase === 1) {
      const marked = flower.classList.toggle('is-marked');
      flower.setAttribute('aria-pressed', marked ? 'true' : 'false');
      updateCount();
      return;
    }
    if (!flower.classList.contains('is-marked')) return;
    const taken = flower.classList.toggle('is-taken');
    flower.setAttribute('aria-pressed', taken ? 'true' : 'false');
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

  function checkPhaseOne() {
    if (state.done || state.phase !== 1) return;
    const marked = markedFlowers().length;
    if (marked === state.firstTarget) {
      enterPhaseTwo();
      return;
    }
    const { total, of } = state.problem;
    feedbackEl.textContent = `Nije točno. Treba označiti ${flowerCountLabel(state.firstTarget)} — to je ${of.num}/${of.den} od ${total}. Pokušaj ponovo.`;
    feedbackEl.className = 'feedback error';
  }

  function checkAnswer() {
    if (state.done || state.phase !== 2) return;
    const frac = parseFracAnswer();
    if (!frac) {
      feedbackEl.textContent = 'Upiši umnožak — brojnik i nazivnik.';
      feedbackEl.className = 'feedback error';
      fracNumEl.focus();
      return;
    }

    const { of, take } = state.problem;
    state.done = true;
    checkBtn.disabled = true;
    fracNumEl.disabled = true;
    fracDenEl.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');
    showSolution();

    const taken = takenCount();
    const flowersOk = taken === state.finalTarget;
    const fracOk = fractionsEqual(frac.num, frac.den, take.num * of.num, take.den * of.den);

    if (flowersOk && fracOk) {
      root.classList.add('is-correct');
      feedbackEl.textContent = `Točno! Uzeto je ${flowerCountLabel(state.finalTarget)}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      const flowerLine = flowersOk
        ? `Cvjetovi su točni (${flowerCountLabel(state.finalTarget)}).`
        : `Treba uzeti ${flowerCountLabel(state.finalTarget)}, a uzeto je ${flowerCountLabel(taken)}.`;
      const result = multiplyFractions(take.num, take.den, of.num, of.den);
      const fracLine = fracOk
        ? 'Umnožak je točan.'
        : `Umnožak je ${result.num}/${result.den}.`;
      feedbackEl.textContent = `Nije točno. ${flowerLine} ${fracLine}`;
      feedbackEl.className = 'feedback error';
    }
  }

  bedEl.addEventListener('click', (e) => {
    const flower = e.target.closest('.mg-flower');
    if (flower) toggleFlower(flower);
  });

  phaseBtn.addEventListener('click', checkPhaseOne);
  checkBtn.addEventListener('click', checkAnswer);
  fracNumEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
  fracDenEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
  nextBtn.addEventListener('click', generateRound);

  generateRound();
}
