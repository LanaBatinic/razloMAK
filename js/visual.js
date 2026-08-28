/** Canvas drawing for pie, bar, number-line and mixed models — mak tema */

const COLORS = {
  filled: '#c41e3a',
  filledAlt: '#40916c',
  filledAccent: '#d4a373',
  filledSoft: '#e85d6a',
  empty: '#f0ebe3',
  stroke: '#3d342c',
  grid: '#c8bdb0',
};

function drawStackedFraction(ctx, x, y, num, den, { fontSize = 13, baseline = 'top', color = COLORS.stroke } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${fontSize}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  const numStr = String(num);
  const denStr = String(den);
  const lineW = Math.max(numStr.length, denStr.length) * fontSize * 0.62;
  const gap = fontSize * 0.28;
  const blockH = fontSize * 2 + gap;

  let topY = y;
  if (baseline === 'top') {
    topY = y;
  } else if (baseline === 'bottom') {
    topY = y - blockH;
  } else {
    topY = y - blockH / 2;
  }

  ctx.textBaseline = 'middle';
  ctx.fillText(numStr, x, topY + fontSize * 0.5);
  ctx.fillRect(x - lineW / 2, topY + fontSize + gap * 0.35, lineW, 1.5);
  ctx.fillText(denStr, x, topY + fontSize * 1.5 + gap);
  ctx.restore();
}

function drawOnePie(ctx, cx, cy, radius, num, den, color) {
  if (den <= 0) return;
  const sliceAngle = (2 * Math.PI) / den;
  const fillCount = Math.max(0, Math.min(num, den));

  for (let i = 0; i < den; i++) {
    const start = -Math.PI / 2 + i * sliceAngle;
    const end = start + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = i < fillCount ? color : COLORS.empty;
    ctx.fill();
    ctx.strokeStyle = COLORS.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.32, 0, 2 * Math.PI);
  ctx.fillStyle = '#faf8f4';
  ctx.fill();
}

export function drawPie(canvas, num, den, color = COLORS.filled) {
  const ctx = canvas.getContext('2d');
  const size = Math.min(canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = size / 2 - 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawOnePie(ctx, cx, cy, radius, num, den, color);
}

export function drawTwoPies(canvas, a, b) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = Math.min(canvas.width / 2 - 12, canvas.height - 8);
  const radius = size / 2 - 6;
  const cy = canvas.height / 2;
  const cx1 = canvas.width * 0.25;
  const cx2 = canvas.width * 0.75;
  drawOnePie(ctx, cx1, cy, radius, a.num, a.den, COLORS.filled);
  drawOnePie(ctx, cx2, cy, radius, b.num, b.den, COLORS.filledAlt);

  ctx.fillStyle = COLORS.stroke;
  const labelY = Math.min(cy + radius + 4, canvas.height - 28);
  drawStackedFraction(ctx, cx1, labelY, a.num, a.den);
  drawStackedFraction(ctx, cx2, labelY, b.num, b.den);
}

/** Cijele + ostatak: više krugova kad je razlomak veći od 1. */
export function drawMixedPies(canvas, num, den, color = COLORS.filled) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (den <= 0) return;

  const wholes = Math.floor(Math.max(0, num) / den);
  const rem = Math.max(0, num) % den;
  const count = Math.max(1, wholes + (rem > 0 || num === 0 ? 1 : 0));
  const gap = 10;
  const pieSize = Math.min(
    canvas.height - 8,
    (canvas.width - gap * (count - 1)) / count
  );
  const radius = pieSize / 2 - 6;
  const totalW = count * pieSize + (count - 1) * gap;
  const startX = (canvas.width - totalW) / 2;

  for (let i = 0; i < count; i++) {
    const cx = startX + i * (pieSize + gap) + pieSize / 2;
    const cy = canvas.height / 2;
    let fill = 0;
    if (i < wholes) fill = den;
    else if (i === wholes) fill = rem;
    drawOnePie(ctx, cx, cy, radius, fill, den, color);
  }
}

export function drawBar(canvas, num, den, color = COLORS.filled) {
  const ctx = canvas.getContext('2d');
  const padding = 8;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (den <= 0) return;

  const wholes = Math.floor(Math.max(0, num) / den);
  const rem = Math.max(0, num) % den;
  const units = Math.max(1, wholes + (rem > 0 || num === 0 ? 1 : 0));
  const unitGap = 6;
  const unitW = (w - unitGap * (units - 1)) / units;
  const segW = unitW / den;

  for (let u = 0; u < units; u++) {
    const ux = padding + u * (unitW + unitGap);
    const fillCount = u < wholes ? den : u === wholes ? rem : 0;
    for (let i = 0; i < den; i++) {
      const x = ux + i * segW;
      ctx.fillStyle = i < fillCount ? color : COLORS.empty;
      ctx.fillRect(x + 1, padding, segW - 2, h);
      ctx.strokeStyle = COLORS.stroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, padding, segW - 2, h);
    }
    ctx.strokeStyle = COLORS.stroke;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ux, padding, unitW, h);
  }
}

/**
 * Dvije trake različitih duljina (različite cjeline).
 * Pokazuje da „3 obojena dijela“ nije dovoljno bez cjeline.
 */
export function drawBarsDifferentWholes(canvas, left, right) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padX = 16;
  const padY = 18;
  const labelW = 28;
  const gap = 22;
  const barH = (canvas.height - padY * 2 - gap) / 2;
  const maxW = canvas.width - padX * 2 - labelW;
  const scale = maxW / Math.max(left.den, right.den);

  function row(y, frac, color, tag) {
    ctx.fillStyle = COLORS.stroke;
    ctx.font = '600 14px Fredoka, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, padX, y + barH / 2);

    const x0 = padX + labelW;
    const w = frac.den * scale;
    const segW = w / frac.den;
    for (let i = 0; i < frac.den; i++) {
      ctx.fillStyle = i < frac.num ? color : COLORS.empty;
      ctx.fillRect(x0 + i * segW, y, segW - 1, barH);
      ctx.strokeStyle = COLORS.stroke;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(x0 + i * segW, y, segW - 1, barH);
    }
    ctx.strokeStyle = COLORS.stroke;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0, y, w, barH);
  }

  row(padY, left, COLORS.filled, 'A');
  row(padY + barH + gap, right, COLORS.filledAlt, 'B');
}

export function drawNumberLine(canvas, num, den, { max = null } = {}) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (den <= 0) return;

  const value = num / den;
  const lineMax = max ?? (value > 1 ? Math.max(2, Math.ceil(value)) : 1);
  const padX = 28;
  const y = canvas.height * 0.55;
  const w = canvas.width - padX * 2;

  ctx.strokeStyle = COLORS.stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(padX + w, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padX + w - 10, y - 6);
  ctx.lineTo(padX + w, y);
  ctx.lineTo(padX + w - 10, y + 6);
  ctx.fillStyle = COLORS.stroke;
  ctx.fill();

  const ticks = den * lineMax;
  for (let i = 0; i <= ticks; i++) {
    const x = padX + (i / ticks) * w;
    const major = i % den === 0;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 12 : 6));
    ctx.lineTo(x, y + (major ? 12 : 6));
    ctx.lineWidth = major ? 2.5 : 1.25;
    ctx.strokeStyle = major ? COLORS.stroke : COLORS.grid;
    ctx.stroke();

    if (major) {
      ctx.fillStyle = COLORS.stroke;
      ctx.font = '600 13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i / den), x, y + 16);
    }
  }

  const markX = padX + (value / lineMax) * w;
  ctx.beginPath();
  ctx.arc(markX, y, 8, 0, 2 * Math.PI);
  ctx.fillStyle = COLORS.filled;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawStackedFraction(ctx, markX, y - 14, num, den, { fontSize: 14, baseline: 'bottom', color: COLORS.filled });
}

/** Brojevni pravac za vježbu — bez rješenja, s opcionalnim oznakama učenika. */
export function drawNumberLineExercise(
  canvas,
  den,
  { userNum = null, showCorrect = false, correctNum = 0, correctDen = 1 } = {}
) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (den <= 0) return;

  const lineMax = 1;
  const padX = 28;
  const y = canvas.height * 0.52;
  const w = canvas.width - padX * 2;

  ctx.strokeStyle = COLORS.stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(padX + w, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padX + w - 10, y - 6);
  ctx.lineTo(padX + w, y);
  ctx.lineTo(padX + w - 10, y + 6);
  ctx.fillStyle = COLORS.stroke;
  ctx.fill();

  const ticks = den;
  for (let i = 0; i <= ticks; i++) {
    const x = padX + (i / ticks) * w;
    const major = i === 0 || i === ticks || i % Math.max(1, Math.floor(den / 2)) === 0;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 12 : 7));
    ctx.lineTo(x, y + (major ? 12 : 7));
    ctx.lineWidth = major ? 2.5 : 1.25;
    ctx.strokeStyle = major ? COLORS.stroke : COLORS.grid;
    ctx.stroke();

    if (i === 0 || i === ticks) {
      ctx.fillStyle = COLORS.stroke;
      ctx.font = '600 13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(i === 0 ? '0' : '1', x, y + 16);
    }
  }

  function drawMarker(markNum, markDen, color) {
    const value = markNum / markDen;
    const markX = padX + value * w;
    ctx.beginPath();
    ctx.arc(markX, y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawStackedFraction(ctx, markX, y - 16, markNum, markDen, { fontSize: 13, baseline: 'bottom', color });
  }

  if (userNum !== null && userNum >= 0) {
    drawMarker(userNum, den, COLORS.filled);
  }

  if (showCorrect && correctDen > 0) {
    drawMarker(correctNum, correctDen, COLORS.filledAlt);
  }
}

export function numberLineClickToIndex(canvas, clientX, clientY, den) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const x = (clientX - rect.left) * scaleX;
  const padX = 28;
  const w = canvas.width - padX * 2;
  const y = canvas.height * 0.52;
  const lineY = y;

  if (Math.abs((clientY - rect.top) * (canvas.height / rect.height) - lineY) > 36) {
    return null;
  }

  const frac = (x - padX) / w;
  if (frac < -0.05 || frac > 1.05) return null;

  const idx = Math.round(frac * den);
  return Math.max(0, Math.min(den, idx));
}

export { COLORS };
