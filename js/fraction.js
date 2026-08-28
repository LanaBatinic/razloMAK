/** Fraction math utilities */

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

export function simplify(num, den) {
  if (den === 0) return { num: 0, den: 1 };
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return {
    num: (sign * num) / g,
    den: Math.abs(den) / g,
  };
}

export function formatFraction(num, den) {
  const s = simplify(num, den);
  if (s.den === 1) return String(s.num);
  return `${s.num}/${s.den}`;
}

/** Razlomak u zagradi za jednolinijski zapis, npr. (4/6) */
export function fracParen(num, den) {
  if (den === 1) return String(num);
  return `(${num}/${den})`;
}

/** Skraćeni razlomak u zagradi, npr. (4/3); cijeli broj bez zagrade */
export function formatFractionParen(num, den) {
  const text = formatFraction(num, den);
  return text.includes('/') ? `(${text})` : text;
}

/** Okomiti razlomak u DOM-u: brojnik iznad nazivnika */
export function renderFracStack(el, num, den) {
  if (!el) return;
  el.classList.add('frac-stack');
  el.replaceChildren();
  const numEl = document.createElement('span');
  numEl.className = 'frac-num';
  numEl.textContent = String(num);
  const bar = document.createElement('span');
  bar.className = 'frac-bar';
  bar.setAttribute('aria-hidden', 'true');
  const denEl = document.createElement('span');
  denEl.className = 'frac-den';
  denEl.textContent = String(den);
  el.appendChild(numEl);
  el.appendChild(bar);
  el.appendChild(denEl);
  el.setAttribute('aria-label', `${num}/${den}`);
}

export function setFracStack(id, num, den) {
  renderFracStack(document.getElementById(id), num, den);
}

/** Mješoviti broj: cijeli dio + okomiti razlomak */
export function renderMixedDisplay(el, whole, num, den) {
  if (!el) return;
  el.className = 'mixed-display';
  el.replaceChildren();
  const wholeEl = document.createElement('span');
  wholeEl.className = 'mixed-whole';
  wholeEl.textContent = String(whole);
  const stack = document.createElement('span');
  renderFracStack(stack, num, den);
  el.appendChild(wholeEl);
  el.appendChild(stack);
  el.setAttribute('aria-label', `${whole} ${num}/${den}`);
}

export function setMixedDisplay(id, whole, num, den) {
  renderMixedDisplay(document.getElementById(id), whole, num, den);
}

const FRAC_INLINE = /(\d+)\/(\d+)/g;

/** U tekstu zamijeni zapise poput 3/5 okomitim razlomcima */
export function fillTextWithFractions(el, text) {
  if (!el) return;
  el.replaceChildren();
  let lastIndex = 0;
  FRAC_INLINE.lastIndex = 0;
  let match;
  while ((match = FRAC_INLINE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      el.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const stack = document.createElement('span');
    renderFracStack(stack, parseInt(match[1], 10), parseInt(match[2], 10));
    el.appendChild(stack);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    el.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

export function toMixed(num, den) {
  const s = simplify(num, den);
  const negative = s.num < 0;
  const absNum = Math.abs(s.num);
  const whole = Math.floor(absNum / s.den);
  const rem = absNum % s.den;
  return {
    negative,
    whole,
    num: rem,
    den: s.den,
    improperNum: s.num,
    improperDen: s.den,
  };
}

export function formatMixed(num, den) {
  const m = toMixed(num, den);
  const sign = m.negative ? '−' : '';
  if (m.num === 0) return `${sign}${m.whole}`;
  if (m.whole === 0) return `${sign}${m.num}/${m.den}`;
  return `${sign}${m.whole} ${m.num}/${m.den}`;
}

export function fromMixed(whole, num, den) {
  return simplify(whole * den + num, den);
}

/** Je li mješoviti zapis valjan (ostatak manji od nazivnika)? */
export function isValidMixedAnswer(whole, num, den) {
  if (den <= 0 || whole < 0 || num < 0) return false;
  return num < den;
}

/** Odgovara li mješoviti broj nepravom razlomku (dopuštena i skraćena forma)? */
export function mixedAnswerMatchesImproper(whole, num, den, improperNum, improperDen) {
  if (!isValidMixedAnswer(whole, num, den)) return false;
  const converted = fromMixed(whole, num, den);
  return fractionsEqual(converted.num, converted.den, improperNum, improperDen);
}

export function fractionValue(num, den) {
  if (den === 0) return NaN;
  return num / den;
}

export function fractionsEqual(aNum, aDen, bNum, bDen) {
  return aNum * bDen === bNum * aDen;
}

export function compareFractions(aNum, aDen, bNum, bDen) {
  const left = aNum * bDen;
  const right = bNum * aDen;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function addFractions(n1, d1, n2, d2) {
  const common = lcm(d1, d2);
  const num = n1 * (common / d1) + n2 * (common / d2);
  return simplify(num, common);
}

export function multiplyFractions(n1, d1, n2, d2) {
  return simplify(n1 * n2, d1 * d2);
}

export function subtractFractions(n1, d1, n2, d2) {
  const common = lcm(d1, d2);
  const num = n1 * (common / d1) - n2 * (common / d2);
  return simplify(num, common);
}

export function divideFractions(n1, d1, n2, d2) {
  return simplify(n1 * d2, d1 * n2);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFraction(maxDen = 8) {
  const den = randomInt(2, maxDen);
  const num = randomInt(1, den - 1);
  return { num, den };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
