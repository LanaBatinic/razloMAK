import {
  lcm,
  fracParen,
  fillTextWithFractions,
} from './fraction.js';
import { amountOf } from './window-game.js?v=3';

const PROBLEMS = [
  { total: 24, a: { num: 1, den: 3, name: 'Lucija', dative: 'Luciji' }, b: { num: 2, den: 8, name: 'Tea', dative: 'Tei' } },
  { total: 12, a: { num: 1, den: 4, name: 'Ana', dative: 'Ani' }, b: { num: 1, den: 3, name: 'Luka', dative: 'Luki' } },
  { total: 16, a: { num: 1, den: 4, name: 'Ema', dative: 'Emi' }, b: { num: 2, den: 8, name: 'Filip', dative: 'Filipu' } },
  { total: 18, a: { num: 1, den: 6, name: 'Mia', dative: 'Miji' }, b: { num: 2, den: 9, name: 'Ivan', dative: 'Ivanu' } },
  { total: 20, a: { num: 1, den: 5, name: 'Petra', dative: 'Petri' }, b: { num: 1, den: 4, name: 'Marko', dative: 'Marku' } },
  { total: 24, a: { num: 1, den: 8, name: 'Luka', dative: 'Luki' }, b: { num: 1, den: 3, name: 'Ana', dative: 'Ani' } },
  { total: 12, a: { num: 2, den: 6, name: 'Tea', dative: 'Tei' }, b: { num: 1, den: 4, name: 'Lucija', dative: 'Luciji' } },
  { total: 24, a: { num: 1, den: 6, name: 'Filip', dative: 'Filipu' }, b: { num: 3, den: 8, name: 'Ema', dative: 'Emi' } },
];

export function flowerNoun(n) {
  if (n === 1) return 'cvijet';
  if (n >= 2 && n <= 4) return 'cvijeta';
  return 'cvjetova';
}

export function flowerCountLabel(n) {
  return `${n} ${flowerNoun(n)}`;
}

export function makeFlowerEl(id) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'fg-flower';
  el.dataset.id = String(id);
  el.setAttribute('aria-label', 'Cvijet maka');
  const petal = id % 2 === 0 ? 'var(--mak-petal)' : 'var(--mak-petal-light)';
  el.innerHTML = `<svg viewBox="0 0 64 72" fill="none" aria-hidden="true">
    <path d="M32 22 C26 12 14 14 18 24 C10 22 8 34 16 36 C12 44 22 46 26 40 C22 50 34 52 32 44 C36 52 48 50 44 40 C52 46 56 44 48 36 C56 34 54 22 46 24 C50 14 38 12 32 22Z" fill="${petal}"/>
    <circle cx="32" cy="30" r="7" fill="var(--mak-center)"/>
    <path d="M31 40 L32 64" stroke="var(--mak-stem)" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 50 Q20 46 14 38" stroke="var(--mak-leaf)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
  return el;
}

export function initFlowerSubGame() {
  const root = document.getElementById('flower-sub-game');
  if (!root) return;

  const storyEl = document.getElementById('fg-story');
  const checkBtn = document.getElementById('fg-check');
  const nextBtn = document.getElementById('fg-next');
  const feedbackEl = document.getElementById('fg-feedback');
  const solutionEl = document.getElementById('fg-solution');
  const stepsEl = document.getElementById('fg-solution-steps');
  const answerEl = document.getElementById('fg-answer');

  const baskets = {
    mara: document.getElementById('fg-basket-mara'),
    a: document.getElementById('fg-basket-a'),
    b: document.getElementById('fg-basket-b'),
  };
  const counts = {
    mara: document.getElementById('fg-count-mara'),
    a: document.getElementById('fg-count-a'),
    b: document.getElementById('fg-count-b'),
  };

  const state = {
    round: 0,
    problem: PROBLEMS[0],
    amounts: { a: 8, b: 6, remain: 10 },
    selected: null,
    done: false,
    drag: null,
  };

  function countOf(who) {
    return baskets[who].querySelectorAll('.fg-flower').length;
  }

  function updateCounts() {
    const { a, b } = state.problem;
    counts.mara.textContent = `Mara: ${flowerCountLabel(countOf('mara'))}`;
    counts.a.textContent = `${a.name}: ${flowerCountLabel(countOf('a'))}`;
    counts.b.textContent = `${b.name}: ${flowerCountLabel(countOf('b'))}`;
  }

  function clearSelect() {
    state.selected?.classList.remove('is-selected');
    state.selected = null;
  }

  function selectFlower(flower) {
    if (state.done) return;
    if (state.selected === flower) {
      clearSelect();
      return;
    }
    clearSelect();
    state.selected = flower;
    flower.classList.add('is-selected');
  }

  function moveTo(flower, who) {
    if (!flower || !baskets[who]) return;
    if (flower.parentElement === baskets[who]) return;
    baskets[who].appendChild(flower);
    updateCounts();
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
    const na = state.amounts.a;
    const nb = state.amounts.b;
    const remain = state.amounts.remain;
    const common = lcm(a.den, b.den);
    const n1 = a.num * (common / a.den);
    const n2 = b.num * (common / b.den);
    const given = n1 + n2;
    const left = common - given;
    const partA = total / a.den;
    const partB = total / b.den;

    stepsEl.replaceChildren();
    addStep(
      `${a.name} dobije ${a.num}/${a.den} od ${total} cvjetova. Cijelinu podijeli na ${a.den} jednakih dijelova.`,
      `${total} : ${a.den} = ${partA}, pa ${a.num} × ${partA} = ${flowerCountLabel(na)}.`
    );
    addStep(
      `${b.name} dobije ${b.num}/${b.den} od ${total} cvjetova. Cijelinu podijeli na ${b.den} jednakih dijelova.`,
      `${total} : ${b.den} = ${partB}, pa ${b.num} × ${partB} = ${flowerCountLabel(nb)}.`
    );
    addStep(
      'Od Marinih cvjetova oduzmi ono što je dala.',
      `${total} − ${na} − ${nb} = ${flowerCountLabel(remain)} ostaje Mari.`
    );
    addStep(
      'Isto razlomcima — od cjeline oduzmi oba dijela.',
      `1−${fracParen(a.num, a.den)}−${fracParen(b.num, b.den)}=${fracParen(common, common)}−${fracParen(n1, common)}−${fracParen(n2, common)}=${fracParen(left, common)}, pa ${fracParen(left, common)} od ${total} = ${remain}.`
    );
    solutionEl.hidden = false;
  }

  function generateRound() {
    const problem = PROBLEMS[state.round % PROBLEMS.length];
    const na = amountOf(problem.a.num, problem.a.den, problem.total);
    const nb = amountOf(problem.b.num, problem.b.den, problem.total);
    state.problem = problem;
    state.amounts = { a: na, b: nb, remain: problem.total - na - nb };
    state.done = false;
    state.drag = null;
    clearSelect();

    fillTextWithFractions(
      storyEl,
      `Mara ima ${problem.total} cvjetova maka. Želi dati ${problem.a.num}/${problem.a.den} ${problem.a.dative} i ${problem.b.num}/${problem.b.den} ${problem.b.dative}. Koliko cvjetova ostaje Mari?`
    );

    document.getElementById('fg-name-a').textContent = problem.a.name;
    document.getElementById('fg-name-b').textContent = problem.b.name;

    Object.values(baskets).forEach((el) => el.replaceChildren());
    for (let i = 0; i < problem.total; i++) {
      baskets.mara.appendChild(makeFlowerEl(i));
    }

    answerEl.value = '';
    answerEl.disabled = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    solutionEl.hidden = true;
    stepsEl.replaceChildren();
    nextBtn.hidden = true;
    checkBtn.disabled = false;
    root.classList.remove('is-done', 'is-correct', 'is-wrong');
    updateCounts();
  }

  function checkAnswer() {
    if (state.done) return;
    const raw = answerEl.value.trim();
    if (raw === '') {
      feedbackEl.textContent = 'Upiši u kućicu koliko cvjetova ostaje Mari.';
      feedbackEl.className = 'feedback error';
      answerEl.focus();
      return;
    }
    const typed = parseInt(raw, 10);
    if (Number.isNaN(typed) || typed < 0) {
      feedbackEl.textContent = 'Upiši cijeli broj cvjetova.';
      feedbackEl.className = 'feedback error';
      return;
    }

    state.done = true;
    checkBtn.disabled = true;
    answerEl.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');
    clearSelect();
    showSolution();

    const { a, b } = state.problem;
    const remain = state.amounts.remain;
    const numberOk = typed === remain;

    if (numberOk) {
      root.classList.add('is-correct');
      feedbackEl.textContent = `Točno! Mari ostaje ${flowerCountLabel(remain)}. ${a.name} ${state.amounts.a}, ${b.name} ${state.amounts.b}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      feedbackEl.textContent = `Nije točno. ${a.name} dobije ${flowerCountLabel(state.amounts.a)}, ${b.name} ${flowerCountLabel(state.amounts.b)}, pa Mari ostaje ${flowerCountLabel(remain)}.`;
      feedbackEl.className = 'feedback error';
    }
  }

  let skipClick = false;

  root.addEventListener('click', (e) => {
    if (e.target.closest('#fg-check, #fg-next, #fg-answer')) return;
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (state.done) return;
    const flower = e.target.closest('.fg-flower');
    if (flower) {
      selectFlower(flower);
      return;
    }
    const person = e.target.closest('.fg-person');
    if (person && state.selected) {
      moveTo(state.selected, person.dataset.who);
      clearSelect();
    }
  });

  root.addEventListener('keydown', (e) => {
    if (e.target === answerEl && e.key === 'Enter') {
      e.preventDefault();
      checkAnswer();
    }
  });

  root.addEventListener('pointerdown', (e) => {
    if (state.done) return;
    if (e.target.closest('#fg-check, #fg-next, #fg-answer')) return;
    const flower = e.target.closest('.fg-flower');
    if (!flower) return;
    const rect = flower.getBoundingClientRect();
    state.drag = {
      flower,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
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
      d.ghost.classList.remove('is-selected');
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
      selectFlower(d.flower);
      return;
    }

    skipClick = true;
    d.ghost?.remove();
    d.flower.classList.remove('is-dragging');
    const drop = document.elementFromPoint(e.clientX, e.clientY);
    const person = drop?.closest('#flower-sub-game .fg-person');
    if (person) moveTo(d.flower, person.dataset.who);
    clearSelect();
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
