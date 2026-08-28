import {
  lcm,
  fracParen,
  fillTextWithFractions,
} from './fraction.js';
import {
  amountOf,
  gridFor,
  windowCountLabel,
  makeWindowEl,
} from './window-game.js?v=3';

const PROBLEMS = [
  { total: 24, a: { num: 3, den: 8, name: 'Ivan' }, b: { num: 1, den: 3, name: 'Marko' } },
  { total: 12, a: { num: 1, den: 4, name: 'Ana' }, b: { num: 1, den: 3, name: 'Luka' } },
  { total: 24, a: { num: 1, den: 2, name: 'Ema' }, b: { num: 2, den: 4, name: 'Filip' } },
  { total: 16, a: { num: 3, den: 8, name: 'Mia' }, b: { num: 1, den: 4, name: 'Ivan' } },
  { total: 18, a: { num: 1, den: 6, name: 'Petra' }, b: { num: 2, den: 9, name: 'Marko' } },
  { total: 20, a: { num: 2, den: 5, name: 'Luka' }, b: { num: 1, den: 4, name: 'Ana' } },
  { total: 24, a: { num: 1, den: 8, name: 'Filip' }, b: { num: 1, den: 3, name: 'Ema' } },
  { total: 12, a: { num: 2, den: 6, name: 'Marko' }, b: { num: 1, den: 2, name: 'Mia' } },
];

function winnerKey(na, nb) {
  if (na > nb) return 'a';
  if (na < nb) return 'b';
  return 'eq';
}

function winnerName(problem, key) {
  if (key === 'eq') return 'Jednako';
  return key === 'a' ? problem.a.name : problem.b.name;
}

export function initWindowCompareGame() {
  const root = document.getElementById('window-compare-game');
  if (!root) return;

  const storyEl = document.getElementById('wcg-story');
  const checkBtn = document.getElementById('wcg-check');
  const nextBtn = document.getElementById('wcg-next');
  const feedbackEl = document.getElementById('wcg-feedback');
  const solutionEl = document.getElementById('wcg-solution');
  const stepsEl = document.getElementById('wcg-solution-steps');

  const sides = {
    a: {
      slots: document.getElementById('wcg-slots-a'),
      pool: document.getElementById('wcg-pool-a'),
      count: document.getElementById('wcg-count-a'),
      name: document.getElementById('wcg-name-a'),
      poolLabel: document.getElementById('wcg-pool-label-a'),
    },
    b: {
      slots: document.getElementById('wcg-slots-b'),
      pool: document.getElementById('wcg-pool-b'),
      count: document.getElementById('wcg-count-b'),
      name: document.getElementById('wcg-name-b'),
      poolLabel: document.getElementById('wcg-pool-label-b'),
    },
  };

  const state = {
    round: 0,
    problem: PROBLEMS[0],
    amounts: { a: 9, b: 8 },
    winner: 'a',
    guess: null,
    done: false,
    drag: null,
  };

  function placedCount(key) {
    return sides[key].slots.querySelectorAll('.wg-window').length;
  }

  function updateCount(key) {
    sides[key].count.textContent = `Na zgradi: ${windowCountLabel(placedCount(key))}`;
  }

  function firstEmptySlot(key) {
    return [...sides[key].slots.children].find((slot) => !slot.querySelector('.wg-window'));
  }

  function playerOf(win) {
    return win.dataset.player;
  }

  function moveToBuilding(win) {
    const key = playerOf(win);
    const slot = firstEmptySlot(key);
    if (!slot) return;
    slot.appendChild(win);
    win.classList.add('is-placed');
    updateCount(key);
  }

  function moveToPool(win) {
    const key = playerOf(win);
    sides[key].pool.appendChild(win);
    win.classList.remove('is-placed');
    updateCount(key);
  }

  function toggleWindow(win) {
    if (state.done) return;
    const key = playerOf(win);
    if (win.parentElement === sides[key].pool) moveToBuilding(win);
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
    const na = state.amounts.a;
    const nb = state.amounts.b;
    const common = lcm(a.den, b.den);
    const n1 = a.num * (common / a.den);
    const n2 = b.num * (common / b.den);
    const partA = total / a.den;
    const partB = total / b.den;
    const win = state.winner;

    stepsEl.replaceChildren();
    addStep(
      `${a.name} stavi ${a.num}/${a.den} od ${total} prozora. Cijelinu podijeli na ${a.den} jednakih dijelova.`,
      `${total} : ${a.den} = ${partA}, pa ${a.num} × ${partA} = ${na} prozora.`
    );
    addStep(
      `${b.name} stavi ${b.num}/${b.den} od ${total} prozora. Cijelinu podijeli na ${b.den} jednakih dijelova.`,
      `${total} : ${b.den} = ${partB}, pa ${b.num} × ${partB} = ${nb} prozora.`
    );

    let compareText;
    if (win === 'eq') {
      compareText = `${na} = ${nb}, pa ${a.name} i ${b.name} stave jednako.`;
    } else if (win === 'a') {
      compareText = `${na} > ${nb}, pa ${a.name} stavi više.`;
    } else {
      compareText = `${nb} > ${na}, pa ${b.name} stavi više.`;
    }
    addStep('Usporedi broj prozora.', compareText);
    addStep(
      'Isto preko razlomaka — svedi na zajednički nazivnik.',
      `${fracParen(a.num, a.den)}=${fracParen(n1, common)}, ${fracParen(b.num, b.den)}=${fracParen(n2, common)}. ${n1} od ${common} i ${n2} od ${common} ${win === 'eq' ? 'jednako je' : n1 > n2 ? `znači da ${a.name} ima više` : `znači da ${b.name} ima više`}.`
    );
    solutionEl.hidden = false;
  }

  function setGuess(who) {
    if (state.done) return;
    state.guess = who;
    document.querySelectorAll('.wcg-who-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.who === who);
    });
  }

  function generateRound() {
    const problem = PROBLEMS[state.round % PROBLEMS.length];
    const na = amountOf(problem.a.num, problem.a.den, problem.total);
    const nb = amountOf(problem.b.num, problem.b.den, problem.total);
    state.problem = problem;
    state.amounts = { a: na, b: nb };
    state.winner = winnerKey(na, nb);
    state.guess = null;
    state.done = false;
    state.drag = null;

    fillTextWithFractions(
      storyEl,
      `Na svakoj zgradi treba biti ${problem.total} prozora. ${problem.a.name} u jednom danu stavi ${problem.a.num}/${problem.a.den} svih prozora, a ${problem.b.name} ${problem.b.num}/${problem.b.den}. Koji stavi više prozora u jednom danu?`
    );

    document.getElementById('wcg-who-a').textContent = problem.a.name;
    document.getElementById('wcg-who-b').textContent = problem.b.name;
    document.querySelectorAll('.wcg-who-btn').forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('selected', 'correct', 'wrong');
    });

    const { cols } = gridFor(problem.total);

    ['a', 'b'].forEach((key) => {
      const person = problem[key];
      sides[key].name.textContent = person.name;
      sides[key].poolLabel.textContent = `Prozori za ${person.name}`;
      sides[key].slots.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      sides[key].slots.replaceChildren();
      sides[key].pool.replaceChildren();
      for (let i = 0; i < problem.total; i++) {
        const slot = document.createElement('div');
        slot.className = 'wg-slot';
        sides[key].slots.appendChild(slot);
        const win = makeWindowEl(`${key}-${i}`);
        win.dataset.player = key;
        sides[key].pool.appendChild(win);
      }
      updateCount(key);
    });

    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    solutionEl.hidden = true;
    stepsEl.replaceChildren();
    nextBtn.hidden = true;
    checkBtn.disabled = false;
    root.classList.remove('is-done', 'is-correct', 'is-wrong');
  }

  function checkAnswer() {
    if (state.done) return;
    if (state.guess == null) {
      feedbackEl.textContent = 'Prvo zaokruži tko stavi više (ili Jednako).';
      feedbackEl.className = 'feedback error';
      return;
    }

    state.done = true;
    checkBtn.disabled = true;
    nextBtn.hidden = false;
    root.classList.add('is-done');
    document.querySelectorAll('.wcg-who-btn').forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.who === state.winner) btn.classList.add('correct');
    });

    const placedA = placedCount('a');
    const placedB = placedCount('b');
    const windowsOk = placedA === state.amounts.a && placedB === state.amounts.b;
    const nameOk = state.guess === state.winner;
    const { a, b } = state.problem;

    showSolution();

    if (windowsOk && nameOk) {
      root.classList.add('is-correct');
      const who = state.winner === 'eq'
        ? `${a.name} i ${b.name} stave jednako`
        : `${winnerName(state.problem, state.winner)} stavi više`;
      feedbackEl.textContent = `Točno! ${a.name} ${state.amounts.a}, ${b.name} ${state.amounts.b}. ${who}.`;
      feedbackEl.className = 'feedback success';
    } else {
      root.classList.add('is-wrong');
      if (!nameOk) {
        document.querySelector(`.wcg-who-btn[data-who="${state.guess}"]`)?.classList.add('wrong');
      }
      const whoLine = state.winner === 'eq'
        ? `Stave jednako (${state.amounts.a} i ${state.amounts.b} prozora).`
        : `${winnerName(state.problem, state.winner)} stavi više: ${a.name} ${windowCountLabel(state.amounts.a)}, ${b.name} ${windowCountLabel(state.amounts.b)}.`;
      feedbackEl.textContent = `Nije točno. ${a.name}: treba ${windowCountLabel(state.amounts.a)} (imaš ${placedA}), ${b.name}: treba ${windowCountLabel(state.amounts.b)} (imaš ${placedB}). ${whoLine}`;
      feedbackEl.className = 'feedback error';
    }
  }

  let skipClick = false;

  root.addEventListener('click', (e) => {
    if (skipClick) {
      skipClick = false;
      return;
    }
    const whoBtn = e.target.closest('.wcg-who-btn');
    if (whoBtn) {
      setGuess(whoBtn.dataset.who);
      return;
    }
    const win = e.target.closest('.wg-window');
    if (win) toggleWindow(win);
  });

  root.addEventListener('keydown', (e) => {
    const win = e.target.closest('.wg-window');
    if (!win) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleWindow(win);
    }
  });

  root.addEventListener('pointerdown', (e) => {
    if (state.done) return;
    if (e.target.closest('.wcg-who-btn')) return;
    const win = e.target.closest('.wg-window');
    if (!win) return;
    const rect = win.getBoundingClientRect();
    state.drag = {
      win,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
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
    const key = playerOf(d.win);
    const drop = document.elementFromPoint(e.clientX, e.clientY);
    const playerEl = drop?.closest(`[data-player="${key}"]`);
    const onBuilding = playerEl && drop.closest('.wg-building, .wg-slots, .wg-slot');
    const onPool = playerEl && drop.closest('.wg-pool');
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
