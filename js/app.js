import {
  formatFraction,
  formatFractionParen,
  fracParen,
  renderFracStack,
  setFracStack,
  setMixedDisplay,
  fillTextWithFractions,
  fromMixed,
  isValidMixedAnswer,
  mixedAnswerMatchesImproper,
  formatMixed,
  fractionValue,
  compareFractions,
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  fractionsEqual,
  randomFraction,
  lcm,
  gcd,
  simplify,
  shuffle,
} from './fraction.js';
import { drawPie, drawBar, drawMixedPies, drawNumberLine, drawTwoPies, drawBarsDifferentWholes, COLORS } from './visual.js?v=29';
import { initWindowAddGame } from './window-game.js?v=3';
import { initWindowCompareGame } from './window-compare-game.js?v=1';
import { initFlowerSubGame } from './flower-sub-game.js?v=2';
import { initCandyQuiz } from './candy-quiz.js?v=1';
import { initPizzaMixedGame } from './pizza-mixed-game.js?v=3';
import { initMulGardenGame } from './mul-garden-game.js?v=1';

// ─── Navigation ───────────────────────────────────────────────

const navBtns = document.querySelectorAll('#nav .nav-btn');
const modes = document.querySelectorAll('.mode');
const opsNavBtns = document.querySelectorAll('#ops-nav .sub-nav-btn');
const opsPanels = document.querySelectorAll('.ops-panel');

function showOpsPanel(op) {
  opsNavBtns.forEach((b) => b.classList.toggle('active', b.dataset.op === op));
  opsPanels.forEach((p) => p.classList.toggle('active', p.id === `ops-${op}`));
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    navBtns.forEach((b) => b.classList.toggle('active', b === btn));
    modes.forEach((m) => m.classList.toggle('active', m.id === `mode-${mode}`));
    if (mode === 'quiz' && quizState.current === 0 && !quizState.started) {
      startQuiz();
    }
    if (mode === 'ops') {
      const activeOp = document.querySelector('#ops-nav .sub-nav-btn.active');
      showOpsPanel(activeOp?.dataset.op || 'add');
    }
  });
});

opsNavBtns.forEach((btn) => {
  btn.addEventListener('click', () => showOpsPanel(btn.dataset.op));
});

showOpsPanel('add');

// ─── Visual Mode ──────────────────────────────────────────────

const visualNum = document.getElementById('visual-num');
const visualDen = document.getElementById('visual-den');
const pieCanvas = document.getElementById('pie-canvas');
const barCanvas = document.getElementById('bar-canvas');
const lineCanvas = document.getElementById('line-canvas');

function updateVisual() {
  const den = Math.max(1, parseInt(visualDen.value, 10) || 1);
  visualDen.value = den;
  visualNum.max = String(den * 2);

  let num = parseInt(visualNum.value, 10);
  if (Number.isNaN(num) || num < 0) num = 0;
  const maxNum = den * 2;
  if (num > maxNum) num = maxNum;
  visualNum.value = num;

  document.getElementById('visual-num-val').textContent = num;
  document.getElementById('visual-den-val').textContent = den;
  setFracStack('visual-fraction', num, den);

  const val = fractionValue(num, den);
  document.getElementById('visual-decimal').textContent = den === 0 ? '—' : val.toFixed(3).replace('.', ',');
  const simplified = simplify(num, den);
  const simplifiedEl = document.getElementById('visual-simplified');
  simplifiedEl.className = 'stat-value';
  if (simplified.den === 1) {
    simplifiedEl.textContent = String(simplified.num);
  } else {
    renderFracStack(simplifiedEl, simplified.num, simplified.den);
    simplifiedEl.classList.add('stat-value');
  }
  document.getElementById('visual-mixed').textContent = formatMixed(num, den);

  drawMixedPies(pieCanvas, num, den);
  drawBar(barCanvas, num, den);
  drawNumberLine(lineCanvas, num, den);
}

visualNum.addEventListener('input', updateVisual);
visualDen.addEventListener('input', updateVisual);
updateVisual();

// ─── Visual Quiz (prepoznaj razlomak na krugu) ───────────────

const vqState = { correct: 0, total: 0, answered: false, target: null, options: [] };

function showVisualQuizNext() {
  const nextBtn = document.getElementById('vq-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
  nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateVisualQuiz() {
  vqState.answered = false;
  const den = randomIntSafe(3, 8);
  const num = randomIntSafe(1, den - 1);
  vqState.target = { num, den };

  setFracStack('vq-target', num, den);
  document.getElementById('vq-feedback').textContent = '';
  document.getElementById('vq-feedback').className = 'feedback';
  const nextBtn = document.getElementById('vq-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');

  const wrong = [];
  while (wrong.length < 3) {
    const wDen = randomIntSafe(3, 10);
    const wNum = randomIntSafe(1, wDen);
    if (
      wNum <= wDen &&
      !fractionsEqual(wNum, wDen, num, den) &&
      !wrong.some((w) => fractionsEqual(w.num, w.den, wNum, wDen))
    ) {
      wrong.push({ num: wNum, den: wDen });
    }
  }

  vqState.options = shuffle([
    { num, den, correct: true },
    ...wrong.map((w) => ({ ...w, correct: false })),
  ]);

  const container = document.getElementById('vq-options');
  container.innerHTML = '';

  const colors = [COLORS.filled, COLORS.filledAlt, COLORS.filledAccent, COLORS.filledSoft];

  vqState.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'vq-option';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Krug ${i + 1}: ${opt.num} od ${opt.den} dijelova`);

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    drawPie(canvas, opt.num, opt.den, colors[i % colors.length]);

    const label = document.createElement('span');
    label.className = 'vq-option-label';
    label.textContent = `${opt.den} jednakih dijelova`;

    btn.appendChild(canvas);
    btn.appendChild(label);
    btn.addEventListener('click', () => handleVisualQuizAnswer(btn, opt));
    container.appendChild(btn);
  });
}

function handleVisualQuizAnswer(btn, opt) {
  if (vqState.answered) return;
  vqState.answered = true;
  vqState.total += 1;

  const feedback = document.getElementById('vq-feedback');
  const options = document.querySelectorAll('#vq-options .vq-option');
  options.forEach((b) => (b.disabled = true));

  const { num, den } = vqState.target;

  if (opt.correct) {
    btn.classList.add('correct');
    vqState.correct += 1;
    feedback.textContent = `Točno! ${num}/${den} je jedan broj: ${num} od ${den} jednakih dijelova iste cjeline.`;
    feedback.className = 'feedback success';
  } else {
    btn.classList.add('wrong');
    options.forEach((b, i) => {
      if (vqState.options[i].correct) b.classList.add('correct');
    });
    feedback.textContent = `Nije dovoljno gledati „koliko je obojeno“. Tražimo ${num} od ${den} dijelova — cjelina mora imati točno ${den} jednakih komada.`;
    feedback.className = 'feedback error';
  }

  document.getElementById('vq-correct').textContent = vqState.correct;
  document.getElementById('vq-total').textContent = vqState.total;
  showVisualQuizNext();
}

document.getElementById('vq-next').addEventListener('click', generateVisualQuiz);
generateVisualQuiz();

// ─── Number line quiz (označi razlomak) ───────────────────────

const NL = { padX: 28, w: 584, y: 57, totalW: 640, totalH: 110 };
const nlLineEl = document.getElementById('nl-line');
const nlState = {
  correct: 0,
  total: 0,
  answered: false,
  num: 3,
  den: 5,
  userIdx: null,
};

function renderNumberLineQuiz() {
  const { den, num, userIdx, answered } = nlState;
  const { padX, w, y, totalW, totalH } = NL;
  const showCorrect = answered && userIdx !== num;

  let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" class="nl-svg" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<line x1="${padX}" y1="${y}" x2="${padX + w}" y2="${y}" stroke="#3d342c" stroke-width="3" stroke-linecap="round"/>`;
  svg += `<polygon points="${padX + w - 10},${y - 6} ${padX + w},${y} ${padX + w - 10},${y + 6}" fill="#3d342c"/>`;

  for (let i = 0; i <= den; i++) {
    const x = padX + (i / den) * w;
    const major = i === 0 || i === den;
    svg += `<line x1="${x}" y1="${y - (major ? 12 : 7)}" x2="${x}" y2="${y + (major ? 12 : 7)}" stroke="${major ? '#3d342c' : '#c8bdb0'}" stroke-width="${major ? 2.5 : 1.25}"/>`;
    if (major) {
      svg += `<text x="${x}" y="${y + 32}" text-anchor="middle" fill="#3d342c" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600">${i === 0 ? '0' : '1'}</text>`;
    }
  }

  if (userIdx !== null && userIdx >= 0) {
    const mx = padX + (userIdx / den) * w;
    svg += `<circle cx="${mx}" cy="${y}" r="9" fill="#c41e3a" stroke="#fff" stroke-width="2"/>`;
  }

  if (showCorrect) {
    const cx = padX + (num / den) * w;
    svg += `<circle cx="${cx}" cy="${y}" r="9" fill="#40916c" stroke="#fff" stroke-width="2"/>`;
  }

  svg += '</svg>';
  nlLineEl.innerHTML = svg;
}

function numberLineClickToIndex(clientX, clientY) {
  const svg = nlLineEl.querySelector('.nl-svg');
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * NL.totalW;
  const y = ((clientY - rect.top) / rect.height) * NL.totalH;

  if (Math.abs(y - NL.y) > 36) return null;

  const frac = (x - NL.padX) / NL.w;
  if (frac < -0.05 || frac > 1.05) return null;

  const idx = Math.round(frac * nlState.den);
  return Math.max(0, Math.min(nlState.den, idx));
}

function generateNumberLineQuiz() {
  nlState.answered = false;
  nlState.userIdx = null;
  const den = randomIntSafe(4, 10);
  const num = randomIntSafe(1, den - 1);
  nlState.num = num;
  nlState.den = den;

  setFracStack('nl-target', num, den);
  document.getElementById('nl-feedback').textContent = '';
  document.getElementById('nl-feedback').className = 'feedback';
  document.getElementById('nl-check').hidden = false;
  document.getElementById('nl-clear').hidden = false;
  document.getElementById('nl-next').hidden = true;

  renderNumberLineQuiz();
}

function handleNumberLineClick(e) {
  if (nlState.answered) return;
  const idx = numberLineClickToIndex(e.clientX, e.clientY);
  if (idx === null) return;
  nlState.userIdx = idx;
  renderNumberLineQuiz();
}

function checkNumberLineQuiz() {
  if (nlState.answered) return;

  const feedback = document.getElementById('nl-feedback');
  if (nlState.userIdx === null) {
    feedback.textContent = 'Prvo klikni na brojevni pravac da postaviš oznaku.';
    feedback.className = 'feedback error';
    return;
  }

  nlState.answered = true;
  nlState.total += 1;

  const { num, den } = nlState;
  const correct = nlState.userIdx === num;

  if (correct) {
    nlState.correct += 1;
    feedback.textContent = `Točno! ${num}/${den} je ${num} korak${num === 1 ? '' : 'a'} od 0 prema 1 (ukupno ${den} jednakih dijelova).`;
    feedback.className = 'feedback success';
  } else {
    feedback.textContent = `Nije točno. ${num}/${den} je na ${num}. koraku od ${den} jednakih dijelova (ne ${nlState.userIdx}/${den}).`;
    feedback.className = 'feedback error';
    renderNumberLineQuiz();
  }

  document.getElementById('nl-correct').textContent = nlState.correct;
  document.getElementById('nl-total').textContent = nlState.total;
  document.getElementById('nl-check').hidden = true;
  document.getElementById('nl-clear').hidden = true;
  document.getElementById('nl-next').hidden = false;
}

nlLineEl.addEventListener('click', handleNumberLineClick);
document.getElementById('nl-check').addEventListener('click', checkNumberLineQuiz);
document.getElementById('nl-clear').addEventListener('click', () => {
  if (nlState.answered) return;
  nlState.userIdx = null;
  renderNumberLineQuiz();
  document.getElementById('nl-feedback').textContent = '';
  document.getElementById('nl-feedback').className = 'feedback';
});
document.getElementById('nl-next').addEventListener('click', generateNumberLineQuiz);
generateNumberLineQuiz();
initCandyQuiz();

function randomIntSafe(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Compare Mode ─────────────────────────────────────────────

const cmpCanvasA = document.getElementById('cmp-canvas-a');
const cmpCanvasB = document.getElementById('cmp-canvas-b');
const cmpState = { a: { num: 2, den: 3 }, b: { num: 4, den: 8 }, answered: false };

function cmpSymbol(cmp) {
  return cmp < 0 ? '<' : cmp > 0 ? '>' : '=';
}

function clearCompareVisuals() {
  cmpCanvasA.getContext('2d').clearRect(0, 0, cmpCanvasA.width, cmpCanvasA.height);
  cmpCanvasB.getContext('2d').clearRect(0, 0, cmpCanvasB.width, cmpCanvasB.height);
  document.getElementById('cmp-label-a').textContent = '';
  document.getElementById('cmp-label-b').textContent = '';
  document.getElementById('cmp-visual-symbol').textContent = '';
  document.getElementById('cmp-visuals').hidden = true;
}

function generateCompareProblem() {
  cmpState.answered = false;
  let a = randomFraction(10);
  let b = randomFraction(10);
  while (fractionsEqual(a.num, a.den, b.num, b.den)) {
    b = randomFraction(10);
  }
  cmpState.a = a;
  cmpState.b = b;

  setFracStack('cmp-frac-a', a.num, a.den);
  setFracStack('cmp-frac-b', b.num, b.den);
  document.getElementById('cmp-q').textContent = '?';
  document.getElementById('cmp-feedback').textContent = '';
  document.getElementById('cmp-feedback').className = 'feedback';
  clearCompareVisuals();
  document.getElementById('cmp-next').hidden = true;

  document.querySelectorAll('.cmp-guess-btn').forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove('correct', 'wrong');
  });
}

function revealCompareVisuals(cmp) {
  const { a, b } = cmpState;
  document.getElementById('cmp-q').textContent = cmpSymbol(cmp);
  document.getElementById('cmp-visual-symbol').textContent = cmpSymbol(cmp);
  document.getElementById('cmp-label-a').textContent = `${a.den} jednakih dijelova`;
  document.getElementById('cmp-label-b').textContent = `${b.den} jednakih dijelova`;
  drawPie(cmpCanvasA, a.num, a.den, COLORS.filled);
  drawPie(cmpCanvasB, b.num, b.den, COLORS.filledAlt);
  document.getElementById('cmp-visuals').hidden = false;
}

function explainCompare(a, b, cmp) {
  if (fractionsEqual(a.num, a.den, b.num, b.den)) {
    return 'Ovi razlomci su jednaki — ista vrijednost, možda drugačiji zapis.';
  }
  if (a.num === b.num && a.den !== b.den) {
    return cmp < 0
      ? `Isti brojnik, veći nazivnik daje sitnije dijelove — ${formatFraction(a.num, a.den)} je manji.`
      : `Isti brojnik, manji nazivnik daje veće dijelove — ${formatFraction(a.num, a.den)} je veći.`;
  }
  if (cmp < 0) return `${formatFraction(a.num, a.den)} je manji od ${formatFraction(b.num, b.den)}.`;
  return `${formatFraction(a.num, a.den)} je veći od ${formatFraction(b.num, b.den)}.`;
}

document.querySelectorAll('.cmp-guess-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (cmpState.answered) return;
    cmpState.answered = true;

    const guess = parseInt(btn.dataset.cmp, 10);
    const { a, b } = cmpState;
    const cmp = compareFractions(a.num, a.den, b.num, b.den);
    const feedback = document.getElementById('cmp-feedback');

    document.querySelectorAll('.cmp-guess-btn').forEach((bEl) => {
      bEl.disabled = true;
      const val = parseInt(bEl.dataset.cmp, 10);
      if (val === cmp) bEl.classList.add('correct');
    });

    revealCompareVisuals(cmp);

    if (guess === cmp) {
      btn.classList.add('correct');
      feedback.textContent = `Točno! ${explainCompare(a, b, cmp)}`;
      feedback.className = 'feedback success';
    } else {
      btn.classList.add('wrong');
      feedback.textContent = `Nije točno. ${explainCompare(a, b, cmp)}`;
      feedback.className = 'feedback error';
    }

    document.getElementById('cmp-next').hidden = false;
  });
});

document.getElementById('cmp-next').addEventListener('click', generateCompareProblem);
generateCompareProblem();
initWindowCompareGame();

// ─── Quiz Mode ────────────────────────────────────────────────

const QUIZ_TOTAL = 10;
const quizState = {
  score: 0,
  streak: 0,
  current: 0,
  started: false,
  answered: false,
  questions: [],
  stats: null,
};

const QUIZ_CAT_META = {
  compare: { label: 'Usporedba', acc: 'usporedbu' },
  ops: { label: 'Računske operacije', acc: 'računske operacije' },
  mixed: { label: 'Mješoviti brojevi', acc: 'mješovite brojeve' },
};

function createEmptyQuizStats() {
  return {
    compare: { correct: 0, total: 0 },
    ops: { correct: 0, total: 0 },
    mixed: { correct: 0, total: 0 },
  };
}

function isQuizCategoryMastered(stat) {
  if (stat.total === 0) return false;
  return stat.correct === stat.total;
}

function formatQuizCategoryList(accForms) {
  if (accForms.length === 0) return '';
  if (accForms.length === 1) return accForms[0];
  if (accForms.length === 2) return `${accForms[0]} i ${accForms[1]}`;
  return `${accForms.slice(0, -1).join(', ')} i ${accForms[accForms.length - 1]}`;
}

function buildQuizCategoryFeedback(stats) {
  const mastered = [];
  const practice = [];

  Object.keys(QUIZ_CAT_META).forEach((key) => {
    const stat = stats[key];
    if (stat.total === 0) return;
    const meta = QUIZ_CAT_META[key];
    if (isQuizCategoryMastered(stat)) mastered.push(meta.acc);
    else practice.push(meta.acc);
  });

  if (mastered.length === 0 && practice.length === 0) return '';

  if (mastered.length === Object.keys(QUIZ_CAT_META).length) {
    return 'Super si usvojila sve tri kategorije — bravo!';
  }

  const parts = [];
  if (mastered.length > 0) {
    parts.push(`Super si usvojila ${formatQuizCategoryList(mastered)}!`);
  }
  if (practice.length > 0) {
    const list = formatQuizCategoryList(practice);
    parts.push(mastered.length > 0 ? `Ali ${list} još moraš vježbati.` : `Još vježbaj ${list}.`);
  }
  return parts.join(' ');
}

function renderQuizSummary() {
  const wrap = document.getElementById('quiz-summary');
  const list = document.getElementById('quiz-summary-list');
  list.replaceChildren();

  Object.keys(QUIZ_CAT_META).forEach((key) => {
    const stat = quizState.stats[key];
    if (stat.total === 0) return;
    const meta = QUIZ_CAT_META[key];
    const li = document.createElement('li');
    li.textContent = `${meta.label}: ${stat.correct}/${stat.total} točno`;
    li.className = isQuizCategoryMastered(stat) ? 'quiz-stat-good' : 'quiz-stat-needs-work';
    list.appendChild(li);
  });

  wrap.hidden = list.children.length === 0;
}

function hideQuizSummary() {
  document.getElementById('quiz-summary').hidden = true;
  document.getElementById('quiz-summary-list').replaceChildren();
}

const QUIZ_OPS_SYMBOL = { add: '+', sub: '−', mul: '×', div: '÷' };
const QUIZ_OPS_INTRO = {
  add: 'Zbroji razlomke i upiši rezultat.',
  sub: 'Oduzmi razlomke i upiši rezultat.',
  mul: 'Pomnoži razlomke i upiši rezultat.',
  div: 'Podijeli razlomke i upiši rezultat.',
};

function createCompareQuizQuestion() {
  let a = randomFraction(10);
  let b = randomFraction(10);
  while (fractionsEqual(a.num, a.den, b.num, b.den)) b = randomFraction(10);
  return {
    kind: 'compare',
    a,
    b,
    correct: compareFractions(a.num, a.den, b.num, b.den),
  };
}

function randomSubtractPair() {
  let a = randomFraction(8);
  let b = randomFraction(8);
  if (compareFractions(a.num, a.den, b.num, b.den) < 0) [a, b] = [b, a];
  return { a, b };
}

function createOpsQuizQuestion(op) {
  let a;
  let b;
  if (op === 'add') {
    do {
      a = randomFraction(10);
      b = randomFraction(10);
    } while (a.den === b.den);
    return { kind: 'ops', op, a, b, result: addFractions(a.num, a.den, b.num, b.den) };
  }
  if (op === 'sub') {
    ({ a, b } = randomSubtractPair());
    if (a.den === b.den) b = { ...b, den: b.den + 1 };
    return { kind: 'ops', op, a, b, result: subtractFractions(a.num, a.den, b.num, b.den) };
  }
  if (op === 'mul') {
    a = randomFraction(10);
    b = randomFraction(10);
    return { kind: 'ops', op, a, b, result: multiplyFractions(a.num, a.den, b.num, b.den) };
  }
  do {
    a = randomFraction(10);
    b = randomFraction(10);
  } while (
    fractionsEqual(a.num, a.den, 1, 1) ||
    fractionsEqual(b.num, b.den, 1, 1) ||
    fractionsEqual(a.num, a.den, b.num, b.den) ||
    compareFractions(a.num, a.den, b.num, b.den) <= 0
  );
  return { kind: 'ops', op: 'div', a, b, result: divideFractions(a.num, a.den, b.num, b.den) };
}

function createMixedQuizQuestion(direction) {
  const den = randomIntSafe(2, 8);
  const whole = randomIntSafe(1, 4);
  const num = randomIntSafe(1, den - 1);
  const improperNum = whole * den + num;
  return {
    kind: 'mixed',
    direction,
    whole,
    num,
    den,
    improperNum,
    improperDen: den,
  };
}

function makeQuizQuestions() {
  const ops = ['add', 'sub', 'mul', 'div'];
  const questions = [
    createCompareQuizQuestion(),
    createCompareQuizQuestion(),
    createCompareQuizQuestion(),
    createOpsQuizQuestion('add'),
    createOpsQuizQuestion('sub'),
    createOpsQuizQuestion('mul'),
    createOpsQuizQuestion('div'),
    createMixedQuizQuestion('toImproper'),
    createMixedQuizQuestion('toMixed'),
  ];
  while (questions.length < QUIZ_TOTAL) {
    const roll = Math.random();
    if (roll < 0.34) questions.push(createCompareQuizQuestion());
    else if (roll < 0.67) questions.push(createOpsQuizQuestion(ops[randomIntSafe(0, ops.length - 1)]));
    else questions.push(createMixedQuizQuestion(Math.random() < 0.5 ? 'toImproper' : 'toMixed'));
  }
  return shuffle(questions.slice(0, QUIZ_TOTAL));
}

function hideAllQuizPanels() {
  document.querySelectorAll('.quiz-panel').forEach((panel) => {
    panel.hidden = true;
  });
}

function resetQuizCompareButtons() {
  document.querySelectorAll('.quiz-cmp-btn').forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove('correct', 'wrong');
  });
  document.getElementById('quiz-cmp-q').textContent = '?';
}

function setQuizInputsEnabled(enabled) {
  ['quiz-ops-num', 'quiz-ops-den', 'quiz-mixed-imp-num', 'quiz-mixed-imp-den', 'quiz-mixed-whole', 'quiz-mixed-num', 'quiz-mixed-den'].forEach((id) => {
    document.getElementById(id).disabled = !enabled;
  });
  document.getElementById('quiz-ops-check').disabled = !enabled;
  document.getElementById('quiz-mixed-check').disabled = !enabled;
  document.querySelectorAll('.quiz-cmp-btn').forEach((btn) => {
    btn.disabled = !enabled;
  });
}

function clearQuizInputs() {
  ['quiz-ops-num', 'quiz-ops-den', 'quiz-mixed-imp-num', 'quiz-mixed-imp-den', 'quiz-mixed-whole', 'quiz-mixed-num', 'quiz-mixed-den'].forEach((id) => {
    document.getElementById(id).value = '';
  });
}

function quizCategoryLabel(q) {
  if (q.kind === 'compare') return 'Usporedba';
  if (q.kind === 'ops') return 'Računske operacije';
  return 'Mješoviti brojevi';
}

function recordQuizResult(wasCorrect, feedbackText) {
  const q = quizState.questions[quizState.current];
  const stat = quizState.stats[q.kind];
  stat.total += 1;
  if (wasCorrect) stat.correct += 1;

  quizState.answered = true;
  setQuizInputsEnabled(false);

  if (wasCorrect) {
    quizState.score += 10 + quizState.streak * 2;
    quizState.streak += 1;
    document.getElementById('quiz-feedback').className = 'feedback success';
  } else {
    quizState.streak = 0;
    document.getElementById('quiz-feedback').className = 'feedback error';
  }

  fillTextWithFractions(document.getElementById('quiz-feedback'), feedbackText);
  updateQuizScoreboard();
  document.getElementById('quiz-next').hidden = false;
}

function showQuizCompare(q) {
  document.getElementById('quiz-panel-compare').hidden = false;
  setFracStack('quiz-cmp-a', q.a.num, q.a.den);
  setFracStack('quiz-cmp-b', q.b.num, q.b.den);
  resetQuizCompareButtons();
}

function showQuizOps(q) {
  document.getElementById('quiz-panel-ops').hidden = false;
  document.getElementById('quiz-ops-intro').textContent = QUIZ_OPS_INTRO[q.op];
  document.getElementById('quiz-ops-symbol').textContent = QUIZ_OPS_SYMBOL[q.op];
  setFracStack('quiz-ops-a', q.a.num, q.a.den);
  setFracStack('quiz-ops-b', q.b.num, q.b.den);
}

function showQuizMixed(q) {
  document.getElementById('quiz-panel-mixed').hidden = false;
  const toImproper = q.direction === 'toImproper';
  document.getElementById('quiz-mixed-intro').textContent = toImproper
    ? 'Upiši isti broj kao nepravi razlomak.'
    : 'Upiši isti broj kao mješoviti broj.';
  document.getElementById('quiz-mixed-given-mixed').hidden = !toImproper;
  document.getElementById('quiz-mixed-given-frac').hidden = toImproper;
  document.getElementById('quiz-mixed-answer-improper').hidden = !toImproper;
  document.getElementById('quiz-mixed-answer-mixed').hidden = toImproper;
  if (toImproper) setMixedDisplay('quiz-mixed-display', q.whole, q.num, q.den);
  else setFracStack('quiz-mixed-frac', q.improperNum, q.improperDen);
}

function startQuiz() {
  quizState.score = 0;
  quizState.streak = 0;
  quizState.current = 0;
  quizState.started = true;
  quizState.answered = false;
  quizState.stats = createEmptyQuizStats();
  quizState.questions = makeQuizQuestions();
  document.getElementById('quiz-next').hidden = true;
  document.getElementById('quiz-restart').hidden = true;
  document.getElementById('quiz-category').hidden = false;
  hideQuizSummary();
  updateQuizScoreboard();
  showQuizQuestion();
}

function updateQuizScoreboard() {
  document.getElementById('quiz-score').textContent = quizState.score;
  document.getElementById('quiz-streak').textContent = quizState.streak;
  document.getElementById('quiz-number').textContent = `${Math.min(quizState.current + 1, QUIZ_TOTAL)}/${QUIZ_TOTAL}`;
}

function showQuizQuestion() {
  if (quizState.current >= QUIZ_TOTAL) {
    finishQuiz();
    return;
  }

  quizState.answered = false;
  const q = quizState.questions[quizState.current];
  hideAllQuizPanels();
  clearQuizInputs();
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-feedback').className = 'feedback';
  document.getElementById('quiz-next').hidden = true;
  document.getElementById('quiz-category').textContent = quizCategoryLabel(q);
  setQuizInputsEnabled(true);

  if (q.kind === 'compare') showQuizCompare(q);
  else if (q.kind === 'ops') showQuizOps(q);
  else showQuizMixed(q);

  updateQuizScoreboard();
}

function handleQuizCompareAnswer(guess, btn) {
  if (quizState.answered) return;
  const q = quizState.questions[quizState.current];
  const cmp = compareFractions(q.a.num, q.a.den, q.b.num, q.b.den);

  document.querySelectorAll('.quiz-cmp-btn').forEach((bEl) => {
    bEl.disabled = true;
    const val = parseInt(bEl.dataset.cmp, 10);
    if (val === cmp) bEl.classList.add('correct');
  });
  document.getElementById('quiz-cmp-q').textContent = cmpSymbol(cmp);

  if (guess === cmp) {
    btn.classList.add('correct');
    recordQuizResult(true, `Točno! ${explainCompare(q.a, q.b, cmp)}`);
  } else {
    btn.classList.add('wrong');
    recordQuizResult(false, `Nije točno. ${explainCompare(q.a, q.b, cmp)}`);
  }
}

function parseQuizOpsAnswer() {
  const num = parseInt(document.getElementById('quiz-ops-num').value, 10);
  const den = parseInt(document.getElementById('quiz-ops-den').value, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function checkQuizOpsAnswer() {
  if (quizState.answered) return;
  const q = quizState.questions[quizState.current];
  const user = parseQuizOpsAnswer();
  if (!user) {
    document.getElementById('quiz-feedback').textContent = 'Upiši brojnik i nazivnik odgovora.';
    document.getElementById('quiz-feedback').className = 'feedback error';
    return;
  }

  const sym = QUIZ_OPS_SYMBOL[q.op];
  const left = formatFraction(q.a.num, q.a.den);
  const right = formatFraction(q.b.num, q.b.den);
  const answer = formatFraction(q.result.num, q.result.den);

  if (fractionsEqual(user.num, user.den, q.result.num, q.result.den)) {
    recordQuizResult(true, `Točno! ${left} ${sym} ${right} = ${answer}.`);
  } else {
    recordQuizResult(false, `Nije točno. Točan odgovor je ${answer}.`);
  }
}

function parseQuizMixedImproperAnswer() {
  const num = parseInt(document.getElementById('quiz-mixed-imp-num').value, 10);
  const den = parseInt(document.getElementById('quiz-mixed-imp-den').value, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function parseQuizMixedMixedAnswer() {
  const whole = parseInt(document.getElementById('quiz-mixed-whole').value, 10);
  const num = parseInt(document.getElementById('quiz-mixed-num').value, 10);
  const den = parseInt(document.getElementById('quiz-mixed-den').value, 10);
  if (Number.isNaN(whole) || Number.isNaN(num) || Number.isNaN(den) || den <= 0 || whole < 0) return null;
  return { whole, num, den };
}

function checkQuizMixedAnswer() {
  if (quizState.answered) return;
  const q = quizState.questions[quizState.current];

  if (q.direction === 'toImproper') {
    const user = parseQuizMixedImproperAnswer();
    if (!user) {
      document.getElementById('quiz-feedback').textContent = 'Upiši brojnik i nazivnik odgovora.';
      document.getElementById('quiz-feedback').className = 'feedback error';
      return;
    }
    const answer = formatFraction(q.improperNum, q.improperDen);
    if (fractionsEqual(user.num, user.den, q.improperNum, q.improperDen)) {
      recordQuizResult(true, `Točno! ${q.whole} ${q.num}/${q.den} = ${answer}.`);
    } else {
      recordQuizResult(false, `Nije točno. Točan odgovor je ${answer}.`);
    }
    return;
  }

  const user = parseQuizMixedMixedAnswer();
  if (!user) {
    document.getElementById('quiz-feedback').textContent = 'Upiši cijeli dio, brojnik i nazivnik.';
    document.getElementById('quiz-feedback').className = 'feedback error';
    return;
  }

  const answer = formatMixed(q.improperNum, q.improperDen);
  if (mixedAnswerMatchesImproper(user.whole, user.num, user.den, q.improperNum, q.improperDen)) {
    recordQuizResult(true, `Točno! ${formatFraction(q.improperNum, q.improperDen)} = ${answer}.`);
  } else {
    recordQuizResult(false, `Nije točno. Točan odgovor je ${answer}.`);
  }
}

function finishQuiz() {
  const pct = Math.round((quizState.score / (QUIZ_TOTAL * 10)) * 100);
  const categoryFeedback = buildQuizCategoryFeedback(quizState.stats);

  hideAllQuizPanels();
  document.getElementById('quiz-category').hidden = true;
  renderQuizSummary();

  const scoreLine = `Kviz završen! Bodovi: ${quizState.score} (${pct}%).`;
  document.getElementById('quiz-feedback').textContent = categoryFeedback
    ? `${scoreLine} ${categoryFeedback}`
    : scoreLine;
  document.getElementById('quiz-feedback').className = 'feedback success';
  document.getElementById('quiz-next').hidden = true;
  document.getElementById('quiz-restart').hidden = false;
  quizState.started = false;
}

document.querySelectorAll('.quiz-cmp-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    handleQuizCompareAnswer(parseInt(btn.dataset.cmp, 10), btn);
  });
});
document.getElementById('quiz-ops-check').addEventListener('click', checkQuizOpsAnswer);
document.getElementById('quiz-mixed-check').addEventListener('click', checkQuizMixedAnswer);
['quiz-ops-num', 'quiz-ops-den', 'quiz-mixed-imp-num', 'quiz-mixed-imp-den', 'quiz-mixed-whole', 'quiz-mixed-num', 'quiz-mixed-den'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = quizState.questions[quizState.current];
      if (!q || quizState.answered) return;
      if (q.kind === 'ops') checkQuizOpsAnswer();
      else if (q.kind === 'mixed') checkQuizMixedAnswer();
    }
  });
});
document.getElementById('quiz-next').addEventListener('click', () => {
  quizState.current += 1;
  showQuizQuestion();
});
document.getElementById('quiz-restart').addEventListener('click', startQuiz);

// ─── Ops: Zbrajanje ───────────────────────────────────────────

const addState = {
  a: { num: 1, den: 2 },
  b: { num: 1, den: 7 },
  wrongAttempts: 0,
  done: false,
};

function parseAddAnswer() {
  const numRaw = document.getElementById('add-ans-num').value.trim();
  const denRaw = document.getElementById('add-ans-den').value.trim();
  if (numRaw === '' || denRaw === '') return null;
  const num = parseInt(numRaw, 10);
  const den = parseInt(denRaw, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function isDirectAddTrap(user, a, b) {
  return user.num === a.num + b.num && user.den === a.den + b.den;
}

function isFullySimplified(num, den) {
  return den > 0 && gcd(Math.abs(num), den) === 1;
}

function buildAddSolutionText(a, b) {
  const common = lcm(a.den, b.den);
  const multA = common / a.den;
  const multB = common / b.den;
  const n1 = a.num * multA;
  const n2 = b.num * multB;
  const sum = n1 + n2;
  const result = simplify(sum, common);
  return `${fracParen(a.num, a.den)}×${multA}+${fracParen(b.num, b.den)}×${multB}=${fracParen(n1, common)}+${fracParen(n2, common)}=(${n1}+${n2})/${common}=${formatFractionParen(result.num, result.den)}`;
}

function setAddInputsEnabled(enabled) {
  document.getElementById('add-ans-num').disabled = !enabled;
  document.getElementById('add-ans-den').disabled = !enabled;
  document.getElementById('add-check').disabled = !enabled;
}

function showAddNext() {
  const nextBtn = document.getElementById('add-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
}

function hideAddNext() {
  const nextBtn = document.getElementById('add-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');
}

function showAddSolution() {
  document.getElementById('add-solution-text').textContent = buildAddSolutionText(addState.a, addState.b);
  document.getElementById('add-solution').hidden = false;
}

function hideAddSolution() {
  document.getElementById('add-solution').hidden = true;
}

function finishAddProblem() {
  addState.done = true;
  setAddInputsEnabled(false);
  showAddNext();
}

function generateAddProblem() {
  let a;
  let b;
  do {
    a = randomFraction(10);
    b = randomFraction(10);
  } while (a.den === b.den);

  addState.a = a;
  addState.b = b;
  addState.wrongAttempts = 0;
  addState.done = false;

  setFracStack('add-frac-a', a.num, a.den);
  setFracStack('add-frac-b', b.num, b.den);
  document.getElementById('add-ans-num').value = '';
  document.getElementById('add-ans-den').value = '';
  document.getElementById('add-feedback').textContent = '';
  document.getElementById('add-feedback').className = 'feedback';
  hideAddSolution();
  hideAddNext();
  setAddInputsEnabled(true);
  document.getElementById('add-ans-num').focus();
}

function checkAddAnswer() {
  if (addState.done) return;

  const user = parseAddAnswer();
  const feedback = document.getElementById('add-feedback');
  const { a, b } = addState;
  const result = addFractions(a.num, a.den, b.num, b.den);

  if (!user) {
    feedback.textContent = 'Upiši brojnik i nazivnik odgovora.';
    feedback.className = 'feedback error';
    return;
  }

  if (isDirectAddTrap(user, a, b)) {
    addState.wrongAttempts += 1;
    if (addState.wrongAttempts >= 2) {
      feedback.textContent = 'Jesi li sveo brojeve na zajednički nazivnik? Pokušaj ponovo.';
      feedback.className = 'feedback error';
      showAddSolution();
      finishAddProblem();
    } else {
      feedback.textContent = 'Jesi li sveo brojeve na zajednički nazivnik? Pokušaj ponovo.';
      feedback.className = 'feedback error';
    }
    return;
  }

  if (fractionsEqual(user.num, user.den, result.num, result.den)) {
    if (isFullySimplified(user.num, user.den)) {
      feedback.textContent = `Točno! ${fracParen(a.num, a.den)} + ${fracParen(b.num, b.den)} = ${formatFractionParen(result.num, result.den)}.`;
      feedback.className = 'feedback success';
      finishAddProblem();
    } else {
      feedback.textContent = 'Odgovor je točan, ali je li do kraja skraćen?';
      feedback.className = 'feedback error';
    }
    return;
  }

  addState.wrongAttempts += 1;
  if (addState.wrongAttempts >= 2) {
    feedback.textContent = 'Nije točno. Pogledaj postupak ispod.';
    feedback.className = 'feedback error';
    showAddSolution();
    finishAddProblem();
  } else {
    feedback.textContent = 'Nije točno. Pokušaj ponovo.';
    feedback.className = 'feedback error';
  }
}

document.getElementById('add-check').addEventListener('click', checkAddAnswer);
document.getElementById('add-next').addEventListener('click', generateAddProblem);
document.getElementById('add-ans-num').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkAddAnswer();
});
document.getElementById('add-ans-den').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkAddAnswer();
});
generateAddProblem();
initWindowAddGame();

// ─── Ops: Oduzimanje ──────────────────────────────────────────

const subState = {
  a: { num: 3, den: 4 },
  b: { num: 1, den: 7 },
  wrongAttempts: 0,
  done: false,
};

function parseSubAnswer() {
  const numRaw = document.getElementById('sub-ans-num').value.trim();
  const denRaw = document.getElementById('sub-ans-den').value.trim();
  if (numRaw === '' || denRaw === '') return null;
  const num = parseInt(numRaw, 10);
  const den = parseInt(denRaw, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function isDirectSubTrap(user, a, b) {
  return user.num === a.num - b.num && user.den === a.den - b.den;
}

function buildSubSolutionText(a, b) {
  const common = lcm(a.den, b.den);
  const multA = common / a.den;
  const multB = common / b.den;
  const n1 = a.num * multA;
  const n2 = b.num * multB;
  const diff = n1 - n2;
  const result = simplify(diff, common);
  return `${fracParen(a.num, a.den)}×${multA}-${fracParen(b.num, b.den)}×${multB}=${fracParen(n1, common)}-${fracParen(n2, common)}=(${n1}-${n2})/${common}=${formatFractionParen(result.num, result.den)}`;
}

function setSubInputsEnabled(enabled) {
  document.getElementById('sub-ans-num').disabled = !enabled;
  document.getElementById('sub-ans-den').disabled = !enabled;
  document.getElementById('sub-check').disabled = !enabled;
}

function showSubNext() {
  const nextBtn = document.getElementById('sub-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
}

function hideSubNext() {
  const nextBtn = document.getElementById('sub-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');
}

function showSubSolution() {
  document.getElementById('sub-solution-text').textContent = buildSubSolutionText(subState.a, subState.b);
  document.getElementById('sub-solution').hidden = false;
}

function hideSubSolution() {
  document.getElementById('sub-solution').hidden = true;
}

function finishSubProblem() {
  subState.done = true;
  setSubInputsEnabled(false);
  showSubNext();
}

function generateSubProblem() {
  let a;
  let b;
  do {
    a = randomFraction(10);
    b = randomFraction(10);
  } while (a.den === b.den || compareFractions(a.num, a.den, b.num, b.den) <= 0);

  subState.a = a;
  subState.b = b;
  subState.wrongAttempts = 0;
  subState.done = false;

  setFracStack('sub-frac-a', a.num, a.den);
  setFracStack('sub-frac-b', b.num, b.den);
  document.getElementById('sub-ans-num').value = '';
  document.getElementById('sub-ans-den').value = '';
  document.getElementById('sub-feedback').textContent = '';
  document.getElementById('sub-feedback').className = 'feedback';
  hideSubSolution();
  hideSubNext();
  setSubInputsEnabled(true);
  document.getElementById('sub-ans-num').focus();
}

function checkSubAnswer() {
  if (subState.done) return;

  const user = parseSubAnswer();
  const feedback = document.getElementById('sub-feedback');
  const { a, b } = subState;
  const result = subtractFractions(a.num, a.den, b.num, b.den);

  if (!user) {
    feedback.textContent = 'Upiši brojnik i nazivnik odgovora.';
    feedback.className = 'feedback error';
    return;
  }

  if (isDirectSubTrap(user, a, b)) {
    subState.wrongAttempts += 1;
    if (subState.wrongAttempts >= 2) {
      feedback.textContent = 'Jesi li sveo brojeve na zajednički nazivnik? Pokušaj ponovo.';
      feedback.className = 'feedback error';
      showSubSolution();
      finishSubProblem();
    } else {
      feedback.textContent = 'Jesi li sveo brojeve na zajednički nazivnik? Pokušaj ponovo.';
      feedback.className = 'feedback error';
    }
    return;
  }

  if (fractionsEqual(user.num, user.den, result.num, result.den)) {
    if (isFullySimplified(user.num, user.den)) {
      feedback.textContent = `Točno! ${fracParen(a.num, a.den)} − ${fracParen(b.num, b.den)} = ${formatFractionParen(result.num, result.den)}.`;
      feedback.className = 'feedback success';
      finishSubProblem();
    } else {
      feedback.textContent = 'Odgovor je točan, ali je li do kraja skraćen?';
      feedback.className = 'feedback error';
    }
    return;
  }

  subState.wrongAttempts += 1;
  if (subState.wrongAttempts >= 2) {
    feedback.textContent = 'Nije točno. Pogledaj postupak ispod.';
    feedback.className = 'feedback error';
    showSubSolution();
    finishSubProblem();
  } else {
    feedback.textContent = 'Nije točno. Pokušaj ponovo.';
    feedback.className = 'feedback error';
  }
}

document.getElementById('sub-check').addEventListener('click', checkSubAnswer);
document.getElementById('sub-next').addEventListener('click', generateSubProblem);
document.getElementById('sub-ans-num').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkSubAnswer();
});
document.getElementById('sub-ans-den').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkSubAnswer();
});
generateSubProblem();
initFlowerSubGame();

// ─── Ops: Množenje ────────────────────────────────────────────

const mulState = {
  a: { num: 2, den: 5 },
  b: { num: 10, den: 3 },
  wrongAttempts: 0,
  done: false,
};

function parseMulAnswer() {
  const numRaw = document.getElementById('mul-ans-num').value.trim();
  const denRaw = document.getElementById('mul-ans-den').value.trim();
  if (numRaw === '' || denRaw === '') return null;
  const num = parseInt(numRaw, 10);
  const den = parseInt(denRaw, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function isDirectMulTrap(user, a, b) {
  if (user.num === a.num + b.num && user.den === a.den + b.den) return 'add';
  if (user.num === a.num * b.num && user.den === a.den + b.den) return 'partial';
  return null;
}

function buildMulSolutionSteps(a, b) {
  const result = multiplyFractions(a.num, a.den, b.num, b.den);
  const rawNum = a.num * b.num;
  const rawDen = a.den * b.den;
  const simplifyBy = gcd(rawNum, rawDen);
  const intro1 =
    simplifyBy > 1
      ? `Prvo sve množimo, a na kraju skraćujemo sa ${simplifyBy}.`
      : 'Prvo sve množimo.';

  const steps = [
    {
      intro: intro1,
      formula: `${fracParen(a.num, a.den)}×${fracParen(b.num, b.den)}=(${a.num}×${b.num})/(${a.den}×${b.den})=${fracParen(rawNum, rawDen)}=${formatFractionParen(result.num, result.den)}`,
    },
  ];

  const gCross1 = gcd(a.num, b.den);
  const gCross2 = gcd(a.den, b.num);
  if (gCross1 > 1 || gCross2 > 1) {
    const leftNum = a.num / gCross1;
    const leftDen = a.den / gCross2;
    const rightNum = b.num / gCross2;
    const rightDen = b.den / gCross1;
    const crossResult = simplify(leftNum * rightNum, leftDen * rightDen);
    steps.push({
      intro: 'Prvo kratim brojnike i nazivnike, pa nakon toga sve množimo.',
      formula: `${fracParen(a.num, a.den)}×${fracParen(b.num, b.den)}=${fracParen(leftNum, leftDen)}×${fracParen(rightNum, rightDen)}=${formatFractionParen(crossResult.num, crossResult.den)}`,
    });
  }

  return steps;
}

function setMulInputsEnabled(enabled) {
  document.getElementById('mul-ans-num').disabled = !enabled;
  document.getElementById('mul-ans-den').disabled = !enabled;
  document.getElementById('mul-check').disabled = !enabled;
}

function showMulNext() {
  const nextBtn = document.getElementById('mul-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
}

function hideMulNext() {
  const nextBtn = document.getElementById('mul-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');
}

function showMulSolution() {
  const steps = buildMulSolutionSteps(mulState.a, mulState.b);
  const container = document.getElementById('mul-solution-steps');
  container.innerHTML = steps
    .map(
      (step, i) => `
        <div class="ops-arith-solution-step">
          <p class="ops-arith-solution-label">${steps.length > 1 ? `<strong>${i + 1}.</strong> ` : ''}${step.intro}</p>
          <p class="ops-arith-solution-text">${step.formula}</p>
        </div>`
    )
    .join('');
  document.getElementById('mul-solution').hidden = false;
}

function hideMulSolution() {
  document.getElementById('mul-solution').hidden = true;
  document.getElementById('mul-solution-steps').innerHTML = '';
}

function finishMulProblem() {
  mulState.done = true;
  setMulInputsEnabled(false);
  showMulNext();
}

function generateMulProblem() {
  let a;
  let b;
  do {
    a = randomFraction(10);
    b = randomFraction(10);
  } while (
    fractionsEqual(a.num, a.den, 1, 1) ||
    fractionsEqual(b.num, b.den, 1, 1) ||
    fractionsEqual(a.num, a.den, b.num, b.den)
  );

  mulState.a = a;
  mulState.b = b;
  mulState.wrongAttempts = 0;
  mulState.done = false;

  setFracStack('mul-frac-a', a.num, a.den);
  setFracStack('mul-frac-b', b.num, b.den);
  document.getElementById('mul-ans-num').value = '';
  document.getElementById('mul-ans-den').value = '';
  document.getElementById('mul-feedback').textContent = '';
  document.getElementById('mul-feedback').className = 'feedback';
  hideMulSolution();
  hideMulNext();
  setMulInputsEnabled(true);
  document.getElementById('mul-ans-num').focus();
}

function mulTrapMessage(trap) {
  if (trap === 'add') {
    return 'Pri množenju množiš brojnike međusobno i nazivnike međusobno, ne ih zbrajaš. Pokušaj ponovo.';
  }
  return 'Množiš i brojnike i nazivnike — ne zbrajaj nazivnike. Pokušaj ponovo.';
}

function checkMulAnswer() {
  if (mulState.done) return;

  const user = parseMulAnswer();
  const feedback = document.getElementById('mul-feedback');
  const { a, b } = mulState;
  const result = multiplyFractions(a.num, a.den, b.num, b.den);

  if (!user) {
    feedback.textContent = 'Upiši brojnik i nazivnik odgovora.';
    feedback.className = 'feedback error';
    return;
  }

  const trap = isDirectMulTrap(user, a, b);
  if (trap) {
    mulState.wrongAttempts += 1;
    feedback.textContent = mulTrapMessage(trap);
    feedback.className = 'feedback error';
    if (mulState.wrongAttempts >= 2) {
      showMulSolution();
      finishMulProblem();
    }
    return;
  }

  if (fractionsEqual(user.num, user.den, result.num, result.den)) {
    if (isFullySimplified(user.num, user.den)) {
      feedback.textContent = `Točno! ${fracParen(a.num, a.den)} × ${fracParen(b.num, b.den)} = ${formatFractionParen(result.num, result.den)}.`;
      feedback.className = 'feedback success';
      finishMulProblem();
    } else {
      feedback.textContent = 'Odgovor je točan, ali je li do kraja skraćen?';
      feedback.className = 'feedback error';
    }
    return;
  }

  mulState.wrongAttempts += 1;
  if (mulState.wrongAttempts >= 2) {
    feedback.textContent = 'Nije točno. Pogledaj postupak ispod.';
    feedback.className = 'feedback error';
    showMulSolution();
    finishMulProblem();
  } else {
    feedback.textContent = 'Nije točno. Pokušaj ponovo.';
    feedback.className = 'feedback error';
  }
}

document.getElementById('mul-check').addEventListener('click', checkMulAnswer);
document.getElementById('mul-next').addEventListener('click', generateMulProblem);
document.getElementById('mul-ans-num').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkMulAnswer();
});
document.getElementById('mul-ans-den').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkMulAnswer();
});
generateMulProblem();
initMulGardenGame();

// ─── Ops: Djeljenje ───────────────────────────────────────────

const divState = {
  a: { num: 2, den: 5 },
  b: { num: 10, den: 3 },
  wrongAttempts: 0,
  done: false,
  format: 'inline',
};

let divNextFormat = 'inline';

function divProblemText(a, b, format) {
  return format === 'compound'
    ? `${fracParen(a.num, a.den)}/${fracParen(b.num, b.den)}`
    : `${fracParen(a.num, a.den)} ÷ ${fracParen(b.num, b.den)}`;
}

function updateDivProblemDisplay(format) {
  const isCompound = format === 'compound';
  document.getElementById('div-display-inline').hidden = isCompound;
  document.getElementById('div-display-compound').hidden = !isCompound;
  document.getElementById('div-intro').textContent = isCompound
    ? 'Dvojni razlomak — podijeli gornji razlomak s donjim i upiši rezultat.'
    : 'Podijeli prvi razlomak s drugim i upiši rezultat.';
}

function parseDivAnswer() {
  const numRaw = document.getElementById('div-ans-num').value.trim();
  const denRaw = document.getElementById('div-ans-den').value.trim();
  if (numRaw === '' || denRaw === '') return null;
  const num = parseInt(numRaw, 10);
  const den = parseInt(denRaw, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function isDirectDivTrap(user, a, b) {
  if (user.num === a.num + b.num && user.den === a.den + b.den) return 'add';
  if (user.num === a.num * b.num && user.den === a.den * b.den) return 'multiply';
  return null;
}

function buildDivSolutionSteps(a, b, format) {
  const recip = { num: b.den, den: b.num };
  const result = divideFractions(a.num, a.den, b.num, b.den);
  const rawNum = a.num * recip.num;
  const rawDen = a.den * recip.den;
  const simplifyBy = gcd(rawNum, rawDen);
  const intro1 =
    simplifyBy > 1
      ? `Drugi razlomak okrenemo — zamijenimo mu brojnik i nazivnik, pa sve množimo, a na kraju skraćujemo sa ${simplifyBy}.`
      : 'Drugi razlomak okrenemo — zamijenimo mu brojnik i nazivnik, pa sve množimo.';
  const problemStart = divProblemText(a, b, format);

  const steps = [
    {
      intro: intro1,
      formula: `${problemStart}=${fracParen(a.num, a.den)}×${fracParen(recip.num, recip.den)}=(${a.num}×${recip.num})/(${a.den}×${recip.den})=${fracParen(rawNum, rawDen)}=${formatFractionParen(result.num, result.den)}`,
    },
  ];

  const gCross1 = gcd(a.num, b.num);
  const gCross2 = gcd(a.den, b.den);
  if (gCross1 > 1 || gCross2 > 1) {
    const leftNum = a.num / gCross1;
    const leftDen = a.den / gCross2;
    const rightNum = recip.num / gCross2;
    const rightDen = recip.den / gCross1;
    const crossResult = simplify(leftNum * rightNum, leftDen * rightDen);
    steps.push({
      intro: 'Prvo okrenemo drugi razlomak, zatim kratimo brojnike i nazivnike, pa nakon toga sve množimo.',
      formula: `${problemStart}=${fracParen(a.num, a.den)}×${fracParen(recip.num, recip.den)}=${fracParen(leftNum, leftDen)}×${fracParen(rightNum, rightDen)}=${formatFractionParen(crossResult.num, crossResult.den)}`,
    });
  }

  return steps;
}

function setDivInputsEnabled(enabled) {
  document.getElementById('div-ans-num').disabled = !enabled;
  document.getElementById('div-ans-den').disabled = !enabled;
  document.getElementById('div-check').disabled = !enabled;
}

function showDivNext() {
  const nextBtn = document.getElementById('div-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
}

function hideDivNext() {
  const nextBtn = document.getElementById('div-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');
}

function showDivSolution() {
  const steps = buildDivSolutionSteps(divState.a, divState.b, divState.format);
  const container = document.getElementById('div-solution-steps');
  container.innerHTML = steps
    .map(
      (step, i) => `
        <div class="ops-arith-solution-step">
          <p class="ops-arith-solution-label">${steps.length > 1 ? `<strong>${i + 1}.</strong> ` : ''}${step.intro}</p>
          <p class="ops-arith-solution-text">${step.formula}</p>
        </div>`
    )
    .join('');
  document.getElementById('div-solution').hidden = false;
}

function hideDivSolution() {
  document.getElementById('div-solution').hidden = true;
  document.getElementById('div-solution-steps').innerHTML = '';
}

function finishDivProblem() {
  divState.done = true;
  setDivInputsEnabled(false);
  showDivNext();
}

function generateDivProblem() {
  let a;
  let b;
  do {
    a = randomFraction(10);
    b = randomFraction(10);
  } while (
    fractionsEqual(a.num, a.den, 1, 1) ||
    fractionsEqual(b.num, b.den, 1, 1) ||
    fractionsEqual(a.num, a.den, b.num, b.den) ||
    compareFractions(a.num, a.den, b.num, b.den) <= 0
  );

  divState.a = a;
  divState.b = b;
  divState.wrongAttempts = 0;
  divState.done = false;
  divState.format = divNextFormat;
  divNextFormat = divState.format === 'inline' ? 'compound' : 'inline';

  setFracStack('div-frac-a', a.num, a.den);
  setFracStack('div-frac-b', b.num, b.den);
  setFracStack('div-compound-a', a.num, a.den);
  setFracStack('div-compound-b', b.num, b.den);
  updateDivProblemDisplay(divState.format);
  document.getElementById('div-ans-num').value = '';
  document.getElementById('div-ans-den').value = '';
  document.getElementById('div-feedback').textContent = '';
  document.getElementById('div-feedback').className = 'feedback';
  hideDivSolution();
  hideDivNext();
  setDivInputsEnabled(true);
  document.getElementById('div-ans-num').focus();
}

function divTrapMessage(trap) {
  if (trap === 'add') {
    return 'Pri dijeljenju drugi razlomak okreni — zamijeni mu brojnik i nazivnik, pa množi. Pokušaj ponovo.';
  }
  return 'Pri dijeljenju drugi razlomak okreni — zamijeni mu brojnik i nazivnik, pa množi. Pokušaj ponovo.';
}

function checkDivAnswer() {
  if (divState.done) return;

  const user = parseDivAnswer();
  const feedback = document.getElementById('div-feedback');
  const { a, b } = divState;
  const result = divideFractions(a.num, a.den, b.num, b.den);

  if (!user) {
    feedback.textContent = 'Upiši brojnik i nazivnik odgovora.';
    feedback.className = 'feedback error';
    return;
  }

  const trap = isDirectDivTrap(user, a, b);
  if (trap) {
    divState.wrongAttempts += 1;
    feedback.textContent = divTrapMessage(trap);
    feedback.className = 'feedback error';
    if (divState.wrongAttempts >= 2) {
      showDivSolution();
      finishDivProblem();
    }
    return;
  }

  if (fractionsEqual(user.num, user.den, result.num, result.den)) {
    if (isFullySimplified(user.num, user.den)) {
      feedback.textContent = `Točno! ${divProblemText(a, b, divState.format)} = ${formatFractionParen(result.num, result.den)}.`;
      feedback.className = 'feedback success';
      finishDivProblem();
    } else {
      feedback.textContent = 'Odgovor je točan, ali je li do kraja skraćen?';
      feedback.className = 'feedback error';
    }
    return;
  }

  divState.wrongAttempts += 1;
  if (divState.wrongAttempts >= 2) {
    feedback.textContent = 'Nije točno. Pogledaj postupak ispod.';
    feedback.className = 'feedback error';
    showDivSolution();
    finishDivProblem();
  } else {
    feedback.textContent = 'Nije točno. Pokušaj ponovo.';
    feedback.className = 'feedback error';
  }
}

document.getElementById('div-check').addEventListener('click', checkDivAnswer);
document.getElementById('div-next').addEventListener('click', generateDivProblem);
document.getElementById('div-ans-num').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkDivAnswer();
});
document.getElementById('div-ans-den').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkDivAnswer();
});
generateDivProblem();

// ─── Mješoviti brojevi ────────────────────────────────────────

const mixedState = {
  type: 'toImproper',
  whole: 0,
  num: 0,
  den: 0,
  improperNum: 0,
  improperDen: 0,
  wrongAttempts: 0,
  done: false,
};

let mixedNextType = 'toImproper';

function randomMixedTask() {
  const den = randomIntSafe(2, 8);
  const whole = randomIntSafe(1, 4);
  const num = randomIntSafe(1, den - 1);
  const improperNum = whole * den + num;
  return { whole, num, den, improperNum, improperDen: den };
}

function setMixedUiType(type) {
  const toImproper = type === 'toImproper';
  document.getElementById('mixed-intro').textContent = toImproper
    ? 'Zadan je mješoviti broj — upiši isti broj kao nepravi razlomak.'
    : 'Zadan je nepravi razlomak — upiši ga kao mješoviti broj.';
  document.getElementById('mixed-given-mixed').hidden = !toImproper;
  document.getElementById('mixed-given-frac').hidden = toImproper;
  document.getElementById('mixed-answer-improper').hidden = !toImproper;
  document.getElementById('mixed-answer-mixed').hidden = toImproper;
}

function setMixedInputsEnabled(enabled) {
  ['mixed-imp-num', 'mixed-imp-den', 'mixed-mix-whole', 'mixed-mix-num', 'mixed-mix-den'].forEach((id) => {
    document.getElementById(id).disabled = !enabled;
  });
  document.getElementById('mixed-check').disabled = !enabled;
}

function showMixedNext() {
  const nextBtn = document.getElementById('mixed-next');
  nextBtn.hidden = false;
  nextBtn.removeAttribute('hidden');
}

function hideMixedNext() {
  const nextBtn = document.getElementById('mixed-next');
  nextBtn.hidden = true;
  nextBtn.setAttribute('hidden', '');
}

function showMixedSolution(text) {
  document.getElementById('mixed-solution-text').textContent = text;
  document.getElementById('mixed-solution').hidden = false;
}

function hideMixedSolution() {
  document.getElementById('mixed-solution').hidden = true;
}

function finishMixedProblem() {
  mixedState.done = true;
  setMixedInputsEnabled(false);
  showMixedNext();
}

function clearMixedAnswers() {
  document.getElementById('mixed-imp-num').value = '';
  document.getElementById('mixed-imp-den').value = '';
  document.getElementById('mixed-mix-whole').value = '';
  document.getElementById('mixed-mix-num').value = '';
  document.getElementById('mixed-mix-den').value = '';
}

function parseMixedImproperAnswer() {
  const num = parseInt(document.getElementById('mixed-imp-num').value, 10);
  const den = parseInt(document.getElementById('mixed-imp-den').value, 10);
  if (Number.isNaN(num) || Number.isNaN(den) || den <= 0) return null;
  return { num, den };
}

function parseMixedMixedAnswer() {
  const whole = parseInt(document.getElementById('mixed-mix-whole').value, 10);
  const num = parseInt(document.getElementById('mixed-mix-num').value, 10);
  const den = parseInt(document.getElementById('mixed-mix-den').value, 10);
  if (Number.isNaN(whole) || Number.isNaN(num) || Number.isNaN(den) || den <= 0 || whole < 0) return null;
  return { whole, num, den };
}

function isMixedToImproperTrap(user, task) {
  return (
    (user.num === task.whole + task.num && user.den === task.den) ||
    (user.num === task.whole * task.num && user.den === task.den)
  );
}

function isImproperToMixedTrap(user, task) {
  return user.whole === task.improperNum && user.num === task.improperDen;
}

function buildMixedToImproperSolution(task) {
  const product = task.whole * task.improperDen;
  return `${task.whole} cijelih = ${task.whole}×${task.improperDen}/${task.improperDen} = ${product}/${task.improperDen}, plus ${task.num}/${task.den} → ${task.improperNum}/${task.improperDen}.`;
}

function buildMixedToMixedSolution(task) {
  return `${task.improperNum} ÷ ${task.improperDen} = ${task.whole} ostatak ${task.num}, dakle ${task.whole} ${task.num}/${task.den}.`;
}

function generateMixedProblem() {
  const type = mixedNextType;
  mixedNextType = type === 'toImproper' ? 'toMixed' : 'toImproper';

  const task = randomMixedTask();
  mixedState.type = type;
  mixedState.whole = task.whole;
  mixedState.num = task.num;
  mixedState.den = task.den;
  mixedState.improperNum = task.improperNum;
  mixedState.improperDen = task.improperDen;
  mixedState.wrongAttempts = 0;
  mixedState.done = false;

  setMixedUiType(type);
  if (type === 'toImproper') {
    setMixedDisplay('mixed-problem-display', task.whole, task.num, task.den);
  } else {
    setFracStack('mixed-problem-frac', task.improperNum, task.improperDen);
  }

  clearMixedAnswers();
  document.getElementById('mixed-feedback').textContent = '';
  document.getElementById('mixed-feedback').className = 'feedback';
  hideMixedSolution();
  hideMixedNext();
  setMixedInputsEnabled(true);

  if (type === 'toImproper') {
    document.getElementById('mixed-imp-num').focus();
  } else {
    document.getElementById('mixed-mix-whole').focus();
  }
}

function checkMixedAnswer() {
  if (mixedState.done) return;

  const feedback = document.getElementById('mixed-feedback');
  const task = mixedState;

  if (task.type === 'toImproper') {
    const user = parseMixedImproperAnswer();
    if (!user) {
      feedback.textContent = 'Upiši brojnik i nazivnik odgovora.';
      feedback.className = 'feedback error';
      return;
    }

    if (isMixedToImproperTrap(user, task)) {
      task.wrongAttempts += 1;
      const msg = 'Ne zbrajaj cijeli broj i brojnik! Cijeli dio pretvori u dijelove iste veličine.';
      if (task.wrongAttempts >= 2) {
        feedback.textContent = msg;
        feedback.className = 'feedback error';
        showMixedSolution(buildMixedToImproperSolution(task));
        finishMixedProblem();
      } else {
        feedback.textContent = msg;
        feedback.className = 'feedback error';
      }
      return;
    }

    if (fractionsEqual(user.num, user.den, task.improperNum, task.improperDen)) {
      feedback.textContent = `Točno! ${task.whole} ${task.num}/${task.den} = ${formatFraction(task.improperNum, task.improperDen)}.`;
      feedback.className = 'feedback success';
      finishMixedProblem();
      return;
    }
  } else {
    const user = parseMixedMixedAnswer();
    if (!user) {
      feedback.textContent = 'Upiši cijeli dio, brojnik i nazivnik.';
      feedback.className = 'feedback error';
      return;
    }

    if (isImproperToMixedTrap(user, task)) {
      task.wrongAttempts += 1;
      const msg = 'Mješoviti broj nije „brojnik pa nazivnik“. Podijeli nepravi razlomak cjelom cjelinom.';
      if (task.wrongAttempts >= 2) {
        feedback.textContent = msg;
        feedback.className = 'feedback error';
        showMixedSolution(buildMixedToMixedSolution(task));
        finishMixedProblem();
      } else {
        feedback.textContent = msg;
        feedback.className = 'feedback error';
      }
      return;
    }

    const converted = fromMixed(user.whole, user.num, user.den);
    const valueOk = fractionsEqual(converted.num, converted.den, task.improperNum, task.improperDen);
    const canonical = formatMixed(task.improperNum, task.improperDen);

    if (mixedAnswerMatchesImproper(user.whole, user.num, user.den, task.improperNum, task.improperDen)) {
      feedback.textContent = `Točno! ${formatFraction(task.improperNum, task.improperDen)} = ${canonical}.`;
      feedback.className = 'feedback success';
      finishMixedProblem();
      return;
    }

    if (valueOk && !isValidMixedAnswer(user.whole, user.num, user.den)) {
      feedback.textContent = 'Ostatak mora biti manji od nazivnika — upiši mješoviti broj u standardnom obliku.';
      feedback.className = 'feedback error';
      return;
    }
  }

  task.wrongAttempts += 1;
  if (task.wrongAttempts >= 2) {
    feedback.textContent = 'Nije točno. Pogledaj postupak ispod.';
    feedback.className = 'feedback error';
    showMixedSolution(
      task.type === 'toImproper' ? buildMixedToImproperSolution(task) : buildMixedToMixedSolution(task)
    );
    finishMixedProblem();
  } else {
    feedback.textContent = 'Nije točno. Pokušaj ponovo.';
    feedback.className = 'feedback error';
  }
}

document.getElementById('mixed-check').addEventListener('click', checkMixedAnswer);
document.getElementById('mixed-next').addEventListener('click', generateMixedProblem);
['mixed-imp-num', 'mixed-imp-den', 'mixed-mix-whole', 'mixed-mix-num', 'mixed-mix-den'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkMixedAnswer();
  });
});
generateMixedProblem();
initPizzaMixedGame();
