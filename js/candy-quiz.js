import { fillTextWithFractions } from './fraction.js';
import { amountOf, gridFor } from './window-game.js?v=3';

const PROBLEMS = [
  { total: 24, num: 3, den: 6 },
  { total: 12, num: 1, den: 4 },
  { total: 16, num: 2, den: 8 },
  { total: 20, num: 2, den: 5 },
  { total: 18, num: 1, den: 3 },
  { total: 24, num: 1, den: 8 },
  { total: 12, num: 2, den: 6 },
  { total: 24, num: 2, den: 3 },
  { total: 16, num: 3, den: 4 },
  { total: 20, num: 3, den: 5 },
];

const WRAPPERS = ['#c41e3a', '#e85d6a', '#2d6a4f', '#e9b44c', '#4d7cc7', '#c45c26'];

function candyNoun(n) {
  if (n === 1) return 'bombon';
  return 'bombona';
}

function candyCountLabel(n) {
  return `${n} ${candyNoun(n)}`;
}

function makeCandyEl(id) {
  const color = WRAPPERS[id % WRAPPERS.length];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'cq-candy';
  el.dataset.id = String(id);
  el.setAttribute('aria-label', 'Bombon');
  el.setAttribute('aria-pressed', 'false');
  el.innerHTML = `<svg viewBox="0 0 56 32" fill="none" aria-hidden="true">
    <path d="M11 6 L0 16 L11 26 Z" fill="${color}"/>
    <path d="M45 6 L56 16 L45 26 Z" fill="${color}"/>
    <ellipse cx="28" cy="16" rx="18" ry="12" fill="${color}"/>
    <ellipse cx="28" cy="13" rx="10" ry="5.5" fill="rgba(255,255,255,0.32)"/>
    <path d="M18 10 Q28 18 38 10" stroke="rgba(255,255,255,0.45)" stroke-width="1.4" fill="none"/>
  </svg>`;
  return el;
}

export function initCandyQuiz() {
  const root = document.getElementById('candy-quiz');
  if (!root) return;

  const questionEl = document.getElementById('cq-question');
  const gridEl = document.getElementById('cq-grid');
  const countEl = document.getElementById('cq-count');
  const checkBtn = document.getElementById('cq-check');
  const nextBtn = document.getElementById('cq-next');
  const feedbackEl = document.getElementById('cq-feedback');
  const solutionEl = document.getElementById('cq-solution');
  const stepsEl = document.getElementById('cq-solution-steps');
  const scoreCorrect = document.getElementById('cq-correct');
  const scoreTotal = document.getElementById('cq-total');

  const state = {
    round: 0,
    problem: PROBLEMS[0],
    target: 12,
    done: false,
    correct: 0,
    total: 0,
  };

  function markedCount() {
    return gridEl.querySelectorAll('.cq-candy.is-marked').length;
  }

  function updateCount() {
    countEl.textContent = `Označeno: ${candyCountLabel(markedCount())}`;
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
    const { total, num, den } = state.problem;
    const part = total / den;
    stepsEl.replaceChildren();
    addStep(
      `Treba označiti ${num}/${den} od ${total} bombona. Cijelinu podijeli na ${den} jednakih dijelova.`,
      `${total} : ${den} = ${part}, pa ${num} × ${part} = ${candyCountLabel(state.target)}.`
    );
    solutionEl.hidden = false;
  }

  function generateRound() {
    const problem = PROBLEMS[state.round % PROBLEMS.length];
    state.problem = problem;
    state.target = amountOf(problem.num, problem.den, problem.total);
    state.done = false;

    fillTextWithFractions(
      questionEl,
      `Na stolu je ${problem.total} bombona. Označi ${problem.num}/${problem.den} bombona.`
    );

    const { cols } = gridFor(problem.total);
    gridEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    gridEl.replaceChildren();
    for (let i = 0; i < problem.total; i++) {
      gridEl.appendChild(makeCandyEl(i));
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

  function toggleCandy(btn) {
    if (state.done) return;
    const marked = btn.classList.toggle('is-marked');
    btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
    updateCount();
  }

  function checkAnswer() {
    if (state.done) return;
    state.done = true;
    state.total += 1;
    checkBtn.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');

    const marked = markedCount();
    const ok = marked === state.target;
    showSolution();

    if (ok) {
      state.correct += 1;
      root.classList.add('is-correct');
      feedbackEl.textContent = `Točno! ${candyCountLabel(state.target)} je ${state.problem.num}/${state.problem.den} od ${state.problem.total}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      feedbackEl.textContent = `Nije točno. Treba označiti ${candyCountLabel(state.target)}, a označeno je ${candyCountLabel(marked)}.`;
      feedbackEl.className = 'feedback error';
    }

    scoreCorrect.textContent = String(state.correct);
    scoreTotal.textContent = String(state.total);
  }

  gridEl.addEventListener('click', (e) => {
    const candy = e.target.closest('.cq-candy');
    if (candy) toggleCandy(candy);
  });

  checkBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', () => {
    state.round += 1;
    generateRound();
  });

  generateRound();
}
