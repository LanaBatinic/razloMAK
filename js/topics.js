/**
 * Deset kategorija za vježbu — svaka cilja jednu zabludu o razlomcima.
 */
import {
  simplify,
  formatFraction,
  formatMixed,
  fractionValue,
  compareFractions,
  addFractions,
  subtractFractions,
  fractionsEqual,
  randomInt,
  randomFraction,
  shuffle,
} from './fraction.js';

function options(correct, wrongs) {
  const unique = [];
  const seen = new Set([correct]);
  for (const w of wrongs) {
    if (!seen.has(w) && w !== '' && w != null) {
      seen.add(w);
      unique.push(w);
    }
  }
  while (unique.length < 3) {
    const extra = `${randomInt(1, 9)}/${randomInt(2, 9)}`;
    if (!seen.has(extra)) {
      seen.add(extra);
      unique.push(extra);
    }
  }
  return shuffle([correct, ...unique.slice(0, 3)]);
}

function pick(makers) {
  return makers[randomInt(0, makers.length - 1)]();
}

function subtractPair() {
  let a = randomFraction(8);
  let b = randomFraction(8);
  if (compareFractions(a.num, a.den, b.num, b.den) < 0) {
    [a, b] = [b, a];
  }
  return { a, b };
}

const ROUND = 8;

export const TOPICS = [
  {
    id: 'one-number',
    title: 'Razlomak se ne doživljava kao jedan broj',
    insight:
      '3/4 nije „broj 3 i broj 4“, nego jedan broj na pravcu — između 0 i 1, jednak 0,75.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const { num, den } = randomFraction(8);
          const value = fractionValue(num, den);
          const asDecimal = value.toFixed(2).replace('.', ',');
          const correct = `jedan broj (${asDecimal})`;
          return {
            prompt: `Što je ${num}/${den}?`,
            options: shuffle([correct, `dva broja: ${num} i ${den}`, String(num + den), `samo brojnik ${num}`]),
            correct,
            explain: `${num}/${den} je jedan broj. Brojnik i nazivnik zajedno određuju mjesto na brojevnom pravcu.`,
            visual: { type: 'line', num, den },
          };
        },
        () => {
          const { num, den } = randomFraction(8);
          const correct = 'između 0 i 1';
          return {
            prompt: `Gdje se ${num}/${den} nalazi kao broj?`,
            options: shuffle([correct, `na broju ${num}`, `na broju ${den}`, 'između 2 i 10']),
            correct,
            explain: `${num}/${den} je manji od 1 (brojnik je manji od nazivnika), pa je točka između 0 i 1.`,
            visual: { type: 'line', num, den },
          };
        },
        () => {
          const { num, den } = randomFraction(8);
          const val = fractionValue(num, den);
          const correct = val.toFixed(2).replace('.', ',');
          return {
            prompt: `Koji decimalni broj je isti kao ${num}/${den}?`,
            options: options(correct, [
              String(num + den),
              `${num},${den}`,
              (val + 1).toFixed(2).replace('.', ','),
            ]),
            correct,
            explain: `${num} ÷ ${den} = ${correct}. To je jedan broj, ne dva zapisana jedno pokraj drugog.`,
            visual: { type: 'line', num, den },
          };
        },
        () => {
          const den = randomInt(3, 8);
          const num = randomInt(1, den - 1);
          const correct = `${num}/${den}`;
          return {
            prompt: `Koji zapis predstavlja jedan broj (udio cjeline), a ne zbroj ${num}+${den}?`,
            options: shuffle([correct, String(num + den), `${num} i ${den}`, String(num * den)]),
            correct,
            explain: `Zapis ${num}/${den} je jedan broj. ${num}+${den}=${num + den} bio bi zbroj dvaju cijelih brojeva.`,
            visual: { type: 'pie', num, den },
          };
        },
      ]),
  },
  {
    id: 'independent',
    title: 'Brojnik i nazivnik se tretiraju kao neovisni brojevi',
    insight:
      'Brojnik (koliko dijelova uzimamo) i nazivnik (na koliko jednakih dijelova je cjelina podijeljena) rade samo zajedno.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const den = randomInt(4, 8);
          const num = randomInt(1, den - 1);
          const correct = `${num} od ${den} jednakih dijelova jedne cjeline`;
          return {
            prompt: `U razlomku ${num}/${den}, što znače ${num} i ${den}?`,
            options: shuffle([
              correct,
              `dva neovisna broja ${num} i ${den}`,
              `${num} cijelih i ${den} cijelih`,
              `${num + den} dijelova bez cjeline`,
            ]),
            correct,
            explain: `Nazivnik ${den} kaže veličinu dijela. Brojnik ${num} kaže koliko tih komada uzimamo.`,
            visual: { type: 'pie', num, den },
          };
        },
        () => {
          const den = randomInt(4, 8);
          const num = randomInt(1, den - 2);
          return {
            prompt: `Ako u ${num}/${den} povećaš samo brojnik (a nazivnik ostane ${den}), razlomak…`,
            options: shuffle(['postaje veći', 'postaje manji', 'ostaje isti', `postaje cijeli broj ${den}`]),
            correct: 'postaje veći',
            explain: `Isti dijelovi (${den}), ali uzimaš ih više — vrijednost raste. Brojnik i nazivnik nisu nezavisni: mijenjaš odnos.`,
            visual: { type: 'pies', a: { num, den }, b: { num: num + 1, den } },
          };
        },
        () => {
          const den = randomInt(3, 6);
          const num = 1;
          return {
            prompt: `Ako u 1/${den} povećaš samo nazivnik, razlomak…`,
            options: shuffle([
              'postaje manji jer su dijelovi sitniji',
              'postaje veći jer je donji broj veći',
              'ostaje 1',
              'ne mijenja se jer je brojnik i dalje 1',
            ]),
            correct: 'postaje manji jer su dijelovi sitniji',
            explain: `Nazivnik nije zaseban „veći broj“. Veći nazivnik dijeli istu cjelinu na više komada — svaki je manji.`,
            visual: { type: 'pies', a: { num, den }, b: { num: 1, den: den + 2 } },
          };
        },
        () => {
          const { num, den } = randomFraction(7);
          return {
            prompt: `Možeš li ${num} i ${den} u ${num}/${den} zbrojiti kao ${num}+${den} da dobiješ vrijednost razlomka?`,
            options: shuffle([
              'Ne — to nisu dva odvojena cijela broja za zbrajanje',
              `Da, ${num}/${den} = ${num + den}`,
              'Da, ali samo ako su jednaki',
              'Da, to je skraćivanje',
            ]),
            correct: 'Ne — to nisu dva odvojena cijela broja za zbrajanje',
            explain: `${num} i ${den} opisuju jedan udio, ne dva broja koja se zbrajaju.`,
            visual: { type: 'pie', num, den },
          };
        },
      ]),
  },
  {
    id: 'add-parts',
    title: 'Zbrajanje/oduzimanje brojnika i nazivnika',
    insight:
      '1/2 + 1/3 nije 2/5. Zbrajaju se samo dijelovi iste veličine — prvo zajednički nazivnik.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          let a = randomFraction(6);
          let b = randomFraction(6);
          while (a.den === b.den) b = randomFraction(6);
          const result = addFractions(a.num, a.den, b.num, b.den);
          const correct = formatFraction(result.num, result.den);
          const trap = formatFraction(a.num + b.num, a.den + b.den);
          return {
            prompt: `Koliko je ${a.num}/${a.den} + ${b.num}/${b.den}?`,
            options: options(correct, [trap, formatFraction(a.num + b.num, a.den), formatFraction(result.num + 1, result.den)]),
            correct,
            explain: `${a.num}/${a.den} + ${b.num}/${b.den} nije ${trap}. Ne zbrajaj gore i dolje. Prvo isti nazivnik.`,
            visual: { type: 'none' },
          };
        },
        () => {
          const { a, b } = subtractPair();
          if (a.den === b.den) b.den = a.den + 1;
          const result = subtractFractions(a.num, a.den, b.num, b.den);
          const correct = formatFraction(result.num, result.den);
          const trap = formatFraction(Math.abs(a.num - b.num), Math.abs(a.den - b.den) || a.den + b.den);
          return {
            prompt: `Koliko je ${a.num}/${a.den} − ${b.num}/${b.den}?`,
            options: options(correct, [trap, formatFraction(a.num - b.num, a.den), formatFraction(result.num + 1, result.den || 1)]),
            correct,
            explain: `Oduzimaju se samo brojnici kad su nazivnici jednaki. ${trap} bi značilo oduzeti i gore i dolje.`,
            visual: { type: 'none' },
          };
        },
        () => {
          const den = randomInt(3, 8);
          const n1 = randomInt(1, den - 2);
          const n2 = randomInt(1, den - n1);
          const correct = formatFraction(n1 + n2, den);
          const trap = formatFraction(n1 + n2, den + den);
          return {
            prompt: `Koliko je ${n1}/${den} + ${n2}/${den}?`,
            options: options(correct, [trap, `${n1 + n2}/${den + den}`, `${n1}/${n2}`]),
            correct,
            explain: `Isti nazivnik ${den} — zbroji samo brojnike: ${n1}+${n2}=${n1 + n2}, nazivnik ostaje ${den}. Ne ${n1 + n2}/${den * 2}.`,
            visual: { type: 'pie', num: n1 + n2, den },
          };
        },
        () => {
          return {
            prompt: 'Zašto 1/4 + 1/4 nije 2/8?',
            options: shuffle([
              'Jer se nazivnik ne zbraja — 1/4 + 1/4 = 2/4',
              'Jer 2/8 je točan zbroj',
              'Jer treba zbrojiti 1+1 i 4+4',
              'Jer razlomci se ne zbrajaju',
            ]),
            correct: 'Jer se nazivnik ne zbraja — 1/4 + 1/4 = 2/4',
            explain: 'Dva puta četvrtina je polovina: 2/4. 2/8 je četvrtina — to bi bilo manje od jednog 1/4, što nema smisla.',
            visual: { type: 'pies', a: { num: 2, den: 4 }, b: { num: 2, den: 8 } },
          };
        },
      ]),
  },
  {
    id: 'compare',
    title: 'Pogrešno uspoređivanje razlomaka',
    insight:
      'Veći nazivnik ne znači veći razlomak. 1/8 je manji od 1/4 jer su dijelovi sitniji.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const small = randomInt(3, 6);
          const big = small + randomInt(2, 4);
          const correct = `1/${small} je veći`;
          return {
            prompt: `Što je veće: 1/${small} ili 1/${big}?`,
            options: shuffle([correct, `1/${big} je veći`, 'Jednaki su', `Veći je onaj s brojem ${big}`]),
            correct,
            explain: `Isti brojnik 1, a nazivnik ${big} dijeli cjelinu na sitnije dijelove — 1/${big} < 1/${small}.`,
            visual: { type: 'pies', a: { num: 1, den: small }, b: { num: 1, den: big } },
          };
        },
        () => {
          const a = randomFraction(8);
          let b = randomFraction(8);
          while (fractionsEqual(a.num, a.den, b.num, b.den)) b = randomFraction(8);
          const cmp = compareFractions(a.num, a.den, b.num, b.den);
          const correct = cmp > 0 ? `${a.num}/${a.den} je veći` : `${b.num}/${b.den} je veći`;
          return {
            prompt: `Usporedi ${a.num}/${a.den} i ${b.num}/${b.den}.`,
            options: shuffle([
              correct,
              cmp > 0 ? `${b.num}/${b.den} je veći` : `${a.num}/${a.den} je veći`,
              'Jednaki su',
              'Veći je onaj s većim brojnikom',
            ]),
            correct,
            explain: 'Usporedi vrijednosti (isti nazivnik ili obojeni dio iste cjeline) — ne gledaj samo jedan broj.',
            visual: { type: 'pies', a, b },
          };
        },
        () => {
          const den = randomInt(4, 9);
          const lo = randomInt(1, den - 2);
          const hi = lo + 1;
          const correct = `${hi}/${den} je veći`;
          return {
            prompt: `Isti nazivnik: što je veće, ${lo}/${den} ili ${hi}/${den}?`,
            options: shuffle([correct, `${lo}/${den} je veći`, 'Jednaki su', `Veći je nazivnik ${den}`]),
            correct,
            explain: `Kad je nazivnik isti, veći brojnik znači više jednakih dijelova. ${hi}/${den} > ${lo}/${den}.`,
            visual: { type: 'pies', a: { num: lo, den }, b: { num: hi, den } },
          };
        },
        () => {
          const { num, den } = randomFraction(6);
          const k = randomInt(2, 3);
          return {
            prompt: `Usporedi ${num}/${den} i ${num * k}/${den * k}.`,
            options: shuffle(['Jednaki su', `${num}/${den} je veći`, `${num * k}/${den * k} je veći`, 'Ne možemo usporediti']),
            correct: 'Jednaki su',
            explain: `To su jednaki razlomci: pomnoženo s ${k}/${k}. Veći brojevi u zapisu ne znače veći razlomak.`,
            visual: { type: 'pies', a: { num, den }, b: { num: num * k, den: den * k } },
          };
        },
      ]),
  },
  {
    id: 'equivalent',
    title: 'Pogrešno shvaćanje ekvivalentnih razlomaka',
    insight:
      'Jednak razlomak dobiješ kad gore i dolje pomnožiš (ili podijeliš) istim brojem. Zbrajanje istog broja gore i dolje kvari vrijednost.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const { num, den } = randomFraction(7);
          const k = randomInt(2, 4);
          const correct = `${num * k}/${den * k}`;
          const addTrap = `${num + k}/${den + k}`;
          return {
            prompt: `Koji razlomak je jednak ${num}/${den}?`,
            options: options(correct, [addTrap, `${num + 1}/${den + 1}`, `${num * k}/${den}`]),
            correct,
            explain: `${num}/${den} × ${k}/${k} = ${correct}. ${addTrap} nije jednak jer zbrajanje ${k} gore i dolje mijenja vrijednost.`,
            visual: { type: 'pies', a: { num, den }, b: { num: num * k, den: den * k } },
          };
        },
        () => {
          const { num, den } = randomFraction(6);
          const k = randomInt(2, 4);
          return {
            prompt: `Je li ${num}/${den} jednak ${num + k}/${den + k}?`,
            options: shuffle([
              'Ne — zbrajanje istog broja gore i dolje ne čuva vrijednost',
              'Da — to je pravilo za jednake razlomke',
              'Da, ako je k paran',
              'Samo ako je nazivnik veći',
            ]),
            correct: 'Ne — zbrajanje istog broja gore i dolje ne čuva vrijednost',
            explain: `Jednakost: množi ili dijeli oba broja istim brojem. ${num}+${k} i ${den}+${k} daje drugi razlomak.`,
            visual: { type: 'pies', a: { num, den }, b: { num: num + k, den: den + k } },
          };
        },
        () => {
          const g = randomInt(2, 4);
          const sNum = randomInt(1, 4);
          const sDen = randomInt(sNum + 1, 7);
          const num = sNum * g;
          const den = sDen * g;
          const correct = formatFraction(num, den);
          return {
            prompt: `Skrati ${num}/${den} na najjednostavniji jednaki razlomak.`,
            options: options(correct, [`${sNum}/${den}`, `${num}/${sDen}`, `${sNum + 1}/${sDen}`]),
            correct,
            explain: `Podijeli gore i dolje s ${g}: ${num}/${den} = ${correct}.`,
            visual: { type: 'pies', a: { num, den }, b: { num: sNum, den: sDen } },
          };
        },
        () => {
          const { num, den } = randomFraction(5);
          const k = randomInt(2, 3);
          return {
            prompt: `Čime trebaš pomnožiti ${num}/${den} da dobiješ ${num * k}/${den * k}?`,
            options: shuffle([`${k}/${k}`, String(k), `${k}/1`, `zbroji ${k} gore i dolje`]),
            correct: `${k}/${k}`,
            explain: `Množiš razlomak s 1 zapisanom kao ${k}/${k}. Ne množiš samo jedan broj i ne zbrajaš ${k}.`,
            visual: { type: 'pies', a: { num, den }, b: { num: num * k, den: den * k } },
          };
        },
      ]),
  },
  {
    id: 'whole',
    title: 'Nerazumijevanje odnosa cijelog broja i razlomka',
    insight:
      'Svaki cijeli broj je i razlomak: 1 = 4/4 = 3/3. Ako je brojnik jednak nazivniku, to je točno jedna cjelina.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const den = randomInt(3, 8);
          return {
            prompt: `Koliko je ${den}/${den}?`,
            options: shuffle(['1', '0', String(den), `${den}/${den + 1}`]),
            correct: '1',
            explain: `${den} od ${den} dijelova čini cijelu jedinicu. ${den}/${den} = 1.`,
            visual: { type: 'pie', num: den, den },
          };
        },
        () => {
          const whole = randomInt(2, 4);
          const den = randomInt(2, 6);
          const correct = `${whole * den}/${den}`;
          return {
            prompt: `Zapiši cijeli broj ${whole} kao razlomak s nazivnikom ${den}.`,
            options: options(correct, [`${whole}/${den}`, `${den}/${whole}`, `${whole + den}/${den}`]),
            correct,
            explain: `${whole} cijelih = ${whole} × (${den}/${den}) = ${correct}.`,
            visual: { type: 'mixed', num: whole * den, den },
          };
        },
        () => {
          const den = randomInt(3, 6);
          const extra = randomInt(1, den - 1);
          const num = den + extra;
          return {
            prompt: `${num}/${den} je…`,
            options: shuffle(['veći od 1', 'manji od 1', 'jednak 0', `jednak ${extra}`]),
            correct: 'veći od 1',
            explain: `Brojnik ${num} > nazivnik ${den}, pa je to više od jedne cjeline (${formatMixed(num, den)}).`,
            visual: { type: 'mixed', num, den },
          };
        },
        () => {
          const den = randomInt(2, 5);
          const wholes = randomInt(2, 4);
          const num = wholes * den;
          return {
            prompt: `Koliko cijelih ima u ${num}/${den}?`,
            options: options(String(wholes), [String(num), String(den), '1', String(wholes + 1)]),
            correct: String(wholes),
            explain: `${num}/${den} = ${wholes}/${1} jer ${wholes} × ${den} = ${num}. To je ${wholes} cijele.`,
            visual: { type: 'mixed', num, den },
          };
        },
      ]),
  },
  {
    id: 'mixed',
    title: 'Problemi s mješovitim brojevima',
    insight:
      'Mješoviti broj spaja cjeline i razlomak: 7/4 = 1 3/4. Pretvori cijele u dijelove, pa zbroji ostatak.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const den = randomInt(2, 6);
          const whole = randomInt(1, 3);
          const rem = randomInt(1, den - 1);
          const improper = whole * den + rem;
          const correct = formatMixed(improper, den);
          return {
            prompt: `Zapiši ${improper}/${den} kao mješoviti broj.`,
            options: options(correct, [`${whole} ${improper}/${den}`, `${whole + rem}/${den}`, String(whole), `${rem}/${den}`]),
            correct,
            explain: `${improper} ÷ ${den} = ${whole} ostatak ${rem}, dakle ${correct}.`,
            visual: { type: 'mixed', num: improper, den },
          };
        },
        () => {
          const den = randomInt(2, 6);
          const whole = randomInt(1, 3);
          const rem = randomInt(1, den - 1);
          const improper = whole * den + rem;
          const mixedLabel = `${whole} ${rem}/${den}`;
          const correct = `${improper}/${den}`;
          const s = simplify(improper, den);
          const simplified = formatFraction(s.num, s.den);
          return {
            prompt: `Zapiši ${mixedLabel} kao nepravi razlomak.`,
            options: options(correct, [`${whole + rem}/${den}`, `${whole}/${den}`, `${rem}/${den}`]),
            correct,
            explain: `${whole} cijelih = ${whole * den}/${den}, plus ${rem}/${den} = ${correct}${
              simplified !== correct ? ` (skraćeno ${simplified})` : ''
            }.`,
            visual: { type: 'mixed', num: improper, den },
          };
        },
        () => {
          const den = randomInt(3, 6);
          const whole = randomInt(1, 2);
          const rem = randomInt(1, den - 1);
          const improper = whole * den + rem;
          return {
            prompt: `Što je ${formatMixed(improper, den)}?`,
            options: shuffle([
              `${whole} cijela i još ${rem}/${den}`,
              `${whole + rem} cijelih`,
              `samo razlomak ${rem}/${den}`,
              `${improper} cijelih`,
            ]),
            correct: `${whole} cijela i još ${rem}/${den}`,
            explain: `Mješoviti broj nije zbroj znamenki ${whole}+${rem}. To je ${whole} punih cjelina plus ${rem} od ${den} dijelova.`,
            visual: { type: 'mixed', num: improper, den },
          };
        },
        () => {
          const den = 4;
          const improper = 7;
          return {
            prompt: 'Koliko je 7/4 u mješovitom zapisu?',
            options: shuffle(['1 3/4', '7 4', '3/4', '1 7/4']),
            correct: '1 3/4',
            explain: '4/4 čini jednu cjelinu, ostaju 3/4. Dakle 1 3/4, ne „7 i 4“.',
            visual: { type: 'mixed', num: improper, den },
          };
        },
      ]),
  },
  {
    id: 'sense',
    title: 'Mehaničko primjenjivanje pravila bez provjere ima li smisla rezultat',
    insight:
      'Prije ili poslije računanja procijeni: 1/2 + 1/3 mora biti veće od 1/2 i manje od 1. Ako dobiješ 2/5, rezultat nema smisla.',
    round: ROUND,
    make: () =>
      pick([
        () => ({
          prompt: '1/2 + 1/3 je otprilike…',
          options: shuffle(['malo manje od 1', '2/5 (zbroji gore i dolje)', 'oko 0', 'više od 2']),
          correct: 'malo manje od 1',
          explain:
            '1/2 je pola, 1/3 je malo manje od pola, zbroj je malo manje od 1. 2/5 je manje od 1/2 — to ne može biti zbroj.',
          visual: { type: 'none' },
        }),
        () => {
          const a = randomFraction(6);
          const val = fractionValue(a.num, a.den);
          const correct =
            val > 0.5 ? 'veći od polovice' : val === 0.5 ? 'točno polovica' : 'manji od polovice';
          return {
            prompt: `Bez točnog računanja: ${a.num}/${a.den} je…`,
            options: shuffle(['veći od polovice', 'manji od polovice', 'točno polovica', 'veći od 2']),
            correct,
            explain: `Usporedi s 1/2. To pomaže da odbaciš nemoguće odgovore.`,
            visual: { type: 'line', num: a.num, den: a.den },
          };
        },
        () => ({
          prompt: '7/8 + 1/9 je najbliže…',
          options: shuffle(['1', '8/17', '0', '7']),
          correct: '1',
          explain: '7/8 je skoro 1, 1/9 je malo. Zbroj je oko 1, ne 8/17 (to bi bilo zbrajanje gore i dolje).',
          visual: { type: 'none' },
        }),
        () => {
          const a = randomFraction(5);
          const b = randomFraction(5);
          const trap = formatFraction(a.num + b.num, a.den + b.den);
          return {
            prompt: `Zbroj ${a.num}/${a.den} + ${b.num}/${b.den} mora biti…`,
            options: shuffle([
              'veći od svakog zbrojenog razlomka',
              `jednak ${trap} (zbroji gore i dolje)`,
              'manji od oba razlomka',
              'uvijek točno 1',
            ]),
            correct: 'veći od svakog zbrojenog razlomka',
            explain: `Zbroj je veći od ${a.num}/${a.den} i od ${b.num}/${b.den}. Ako ti ispadne ${trap}, rezultat nema smisla.`,
            visual: { type: 'none' },
          };
        },
      ]),
  },
  {
    id: 'picture',
    title: 'Oslanjanje na slikovne reprezentacije bez razumijevanja cjeline',
    insight:
      'Broj obojenih dijelova ništa ne govori dok ne znaš cijelinu. Tri obojena kvadrata mogu biti 3/4 ili 3/8 — ovisi o ukupnom broju dijelova.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const filled = randomInt(2, 4);
          const denA = filled + randomInt(1, 2);
          const denB = denA * 2;
          const cmp = compareFractions(filled, denA, filled, denB);
          const bigger = cmp > 0 ? 'A' : 'B';
          return {
            prompt: `Traka A: ${filled}/${denA}. Traka B: ${filled}/${denB}. Ista količina obojenih dijelova. Koji razlomak je veći?`,
            options: shuffle([
              `${bigger} (${bigger === 'A' ? `${filled}/${denA}` : `${filled}/${denB}`}) je veći`,
              `Jednaki su jer su oba ${filled} dijela obojena`,
              'B je veći jer je traka duža',
              'Ne možemo znati',
            ]),
            correct: `${bigger} (${bigger === 'A' ? `${filled}/${denA}` : `${filled}/${denB}`}) je veći`,
            explain: `Broj „${filled} obojena“ nije dovoljan. Cjelina A ima ${denA} dijelova, B ima ${denB}. ${filled}/${denA} > ${filled}/${denB}.`,
            visual: { type: 'diff-wholes', a: { num: filled, den: denA }, b: { num: filled, den: denB } },
          };
        },
        () => {
          const filled = randomInt(2, 4);
          return {
            prompt: `Na slici je obojeno ${filled} polja, ali ne vidiš koliko polja ima cjelina. Koji je razlomak?`,
            options: shuffle([
              'Ne možemo znati bez cjeline',
              `${filled}/4`,
              `${filled}/8`,
              String(filled),
            ]),
            correct: 'Ne možemo znati bez cjeline',
            explain: `${filled} obojena polja mogu biti ${filled}/4, ${filled}/5 ili ${filled}/10. Razlomak traži i nazivnik — cijelinu.`,
            visual: { type: 'none' },
          };
        },
        () => {
          const den = randomInt(4, 8);
          const num = randomInt(1, den - 1);
          return {
            prompt: `Krug je podijeljen na ${den} jednakih dijelova, obojeno ih je ${num}. Koji razlomak prikazuje?`,
            options: options(`${num}/${den}`, [`${num}/${num + den}`, `${den}/${num}`, String(num)]),
            correct: `${num}/${den}`,
            explain: `Cjelina = ${den} dijelova (nazivnik). Obojeno = ${num} (brojnik). Ne broji samo obojeno.`,
            visual: { type: 'pie', num, den },
          };
        },
        () => {
          return {
            prompt: 'Dva kruga imaju 2 obojena isječka. Prvi ima 4 dijela, drugi 8. Jesu li razlomci jednaki?',
            options: shuffle([
              'Ne — 2/4 nije isto što i 2/8 jer cjeline nisu iste',
              'Da — oba imaju 2 obojena dijela',
              'Da — slike izgledaju slično',
              'Da, oba su 2',
            ]),
            correct: 'Ne — 2/4 nije isto što i 2/8 jer cjeline nisu iste',
            explain: 'Ista slika „dva obojena komada“ skriva različite veličine komada. 2/4 = 1/2, 2/8 = 1/4.',
            visual: { type: 'pies', a: { num: 2, den: 4 }, b: { num: 2, den: 8 } },
          };
        },
      ]),
  },
  {
    id: 'whole-rules',
    title: 'Prenošenje pravila za cijele brojeve na razlomke',
    insight:
      'Kod cijelih brojeva veći broj znači više. Kod razlomaka veći nazivnik znači sitnije dijelove. Množenje s brojem manjim od 1 smanjuje rezultat.',
    round: ROUND,
    make: () =>
      pick([
        () => {
          const small = randomInt(3, 5);
          const big = small * 2;
          return {
            prompt: `Zašto 1/${big} nije veći od 1/${small}, iako je ${big} > ${small}?`,
            options: shuffle([
              `Jer ${big} dijelova čini sitnije komade od ${small} dijelova iste cjeline`,
              'Jer brojnik 1 je isti, pa su razlomci jednaki',
              'Jer pravila za cijele brojeve uvijek vrijede i ovdje',
              `Jer ${big} + ${small} = ${big + small}`,
            ]),
            correct: `Jer ${big} dijelova čini sitnije komade od ${small} dijelova iste cjeline`,
            explain: 'Pravilo „veći broj = veća količina“ vrijedi za cijele brojeve, ne za nazivnik.',
            visual: { type: 'pies', a: { num: 1, den: small }, b: { num: 1, den: big } },
          };
        },
        () => {
          const a = randomFraction(4);
          const b = randomFraction(4);
          const product = formatFraction(a.num * b.num, a.den * b.den);
          return {
            prompt: `Što se dogodi kad pomnožiš ${a.num}/${a.den} × ${b.num}/${b.den}?`,
            options: shuffle([
              `Dobiješ ${product} — umnožak je manji od svakog faktora`,
              'Dobiješ veći broj jer množenje uvijek povećava',
              `Dobiješ ${a.num + b.num}/${a.den + b.den}`,
              'Ostaje veći razlomak od ta dva',
            ]),
            correct: `Dobiješ ${product} — umnožak je manji od svakog faktora`,
            explain: 'Kod cijelih brojeva množenje povećava. Ovdje su oba faktora manja od 1, pa umnožak još manji.',
            visual: { type: 'pie', num: a.num * b.num, den: a.den * b.den },
          };
        },
        () => {
          const den = randomInt(4, 8);
          const n = randomInt(2, den - 1);
          const correct = formatFraction(n + n, den);
          const trap = formatFraction(n + n, den + den);
          return {
            prompt: `Koliko je ${n}/${den} + ${n}/${den}? (Pazi: ne zbrajaj kao cijele „gore i dolje“.)`,
            options: options(correct, [trap, `${n + n}`, `${n}/${den}`]),
            correct,
            explain: `Kod cijelih  ${n}+${n}=${n * 2}. Kod razlomaka isti nazivnik ostaje: ${n}+${n}=${n * 2} dijelova od ${den}, dakle ${correct} — ne ${trap}.`,
            visual: { type: 'pie', num: Math.min(n * 2, den), den },
          };
        },
        () => ({
          prompt: 'Što je veće: 1/2 od jabuke ili 1/2 od 8 kolačića? Čekaj — što prvo moraš znati?',
          options: shuffle([
            'Koja je cjelina — polovica različitih cjelina nisu iste količine',
            'Ništa, 1/2 je uvijek isto jer je 2 veći od 1',
            '1/2 od 8 je manje jer pravilo cijelih kaže da je 8 veliko',
            'Uvijek je veći veći nazivnik',
          ]),
          correct: 'Koja je cjelina — polovica različitih cjelina nisu iste količine',
          explain: 'Kod cijelih brojeva 8 > 1. Kod razlomaka 1/2 nema smisla dok ne kažeš 1/2 čega. Cjelina određuje količinu.',
          visual: { type: 'none' },
        }),
      ]),
  },
];

export function topicById(id) {
  return TOPICS.find((t) => t.id === id);
}
