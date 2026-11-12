export const CATEGORIES = [
  { id: 'avontuur', label: 'Avontuur', icon: 'mountain', tone: 'purple' },
  { id: 'sport', label: 'Sport', icon: 'dumbbell', tone: 'orange' },
  { id: 'sociaal', label: 'Sociaal', icon: 'users', tone: 'blue' },
  { id: 'grappig', label: 'Grappig', icon: 'party-popper', tone: 'pink' },
  { id: 'overig', label: 'Overig', icon: 'sparkles', tone: 'green' }
];

export const DAILY_CHALLENGE_BONUS = 25;

export const categoryFor = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[4];

export function ranking(members, challenges, participations, dailyBonuses = []) {
  const pointsByChallenge = new Map(challenges.map((c) => [c.id, Number(c.points) || 0]));
  const ranked = members.map((m) => ({
    ...m,
    points: participations.reduce((total, p) => total + (p.user_id === m.id && p.status === 'approved' ? (pointsByChallenge.get(p.challenge_id) || 0) : 0), 0)
      + dailyBonuses.reduce((total, bonus) => total + (bonus.user_id === m.id ? Number(bonus.points) || 0 : 0), 0),
    completed: participations.filter((p) => p.user_id === m.id && p.status === 'approved').length
  }));
  return ranked.sort((a, b) => b.points - a.points || b.completed - a.completed || a.display_name.localeCompare(b.display_name, 'nl'));
}

export function challengeState(challengeId, userId, participations) {
  return participations.find((p) => p.challenge_id === challengeId && p.user_id === userId) || null;
}

export function shortName(displayName = '') {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts.slice(0, 2).map((p) => p[0]) : [parts[0]?.slice(0, 2) || '?']).join('').toUpperCase();
}

export function formatDate(input) {
  if (!input) return '';
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(input));
}

export function inviteLink(code) {
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('invite', code);
  return u.toString();
}

export function amsterdamDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function validChallenge({title, description, points, reward_slots}) {
  if (!title || title.trim().length < 3 || title.trim().length > 80) return 'Gebruik een titel van 3 tot 80 tekens.';
  if ((description || '').length > 600) return 'De beschrijving mag maximaal 600 tekens bevatten.';
  if (!Number.isInteger(Number(points)) || Number(points) < 1 || Number(points) > 1000) return 'Kies tussen 1 en 1000 punten.';
  if (!Number.isInteger(Number(reward_slots)) || Number(reward_slots) < 1 || Number(reward_slots) > 100) return 'Kies tussen 1 en 100 betaalde plekken.';
  return '';
}

const ROULETTE_RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const ROULETTE_GROSS_MULTIPLIERS = {
  number: 36,
  red: 2,
  black: 2,
  even: 2,
  odd: 2,
  low: 2,
  high: 2,
  dozen1: 3,
  dozen2: 3,
  dozen3: 3,
  column1: 3,
  column2: 3,
  column3: 3
};

export function validRouletteBets(bets, balance = Number.MAX_SAFE_INTEGER) {
  if (!Array.isArray(bets) || bets.length < 1 || bets.length > 100) return 'Plaats minimaal één en maximaal 100 inzetten.';
  let total = 0;
  for (const bet of bets) {
    if (!bet || !Object.prototype.hasOwnProperty.call(ROULETTE_GROSS_MULTIPLIERS, bet.type)) return 'Deze roulette-inzet is ongeldig.';
    if (!Number.isSafeInteger(Number(bet.stake)) || Number(bet.stake) < 1) return 'Elke inzet moet minimaal 1 punt zijn.';
    if (bet.type === 'number' && (!Number.isInteger(Number(bet.value)) || Number(bet.value) < 0 || Number(bet.value) > 36)) {
      return 'Kies voor een nummerinzet een getal van 0 tot en met 36.';
    }
    total += Number(bet.stake);
    if (!Number.isSafeInteger(total)) return 'Het totale inzetbedrag is te hoog.';
  }
  if (!Number.isSafeInteger(Number(balance)) || total > Number(balance)) return 'Je hebt niet genoeg punten voor deze totale inzet.';
  return '';
}

export function rouletteBetWins(type, value, winningNumber) {
  if (!Number.isInteger(winningNumber) || winningNumber < 0 || winningNumber > 36) return false;
  const isRed = ROULETTE_RED_NUMBERS.has(winningNumber);
  switch (type) {
    case 'number': return Number(value) === winningNumber;
    case 'red': return isRed;
    case 'black': return winningNumber !== 0 && !isRed;
    case 'even': return winningNumber !== 0 && winningNumber % 2 === 0;
    case 'odd': return winningNumber % 2 === 1;
    case 'low': return winningNumber >= 1 && winningNumber <= 18;
    case 'high': return winningNumber >= 19 && winningNumber <= 36;
    case 'dozen1': return winningNumber >= 1 && winningNumber <= 12;
    case 'dozen2': return winningNumber >= 13 && winningNumber <= 24;
    case 'dozen3': return winningNumber >= 25 && winningNumber <= 36;
    case 'column1': return winningNumber > 0 && winningNumber % 3 === 1;
    case 'column2': return winningNumber > 0 && winningNumber % 3 === 2;
    case 'column3': return winningNumber > 0 && winningNumber % 3 === 0;
    default: return false;
  }
}

export function rouletteColor(number) {
  if (!Number.isInteger(number) || number < 0 || number > 36) return 'green';
  return number === 0 ? 'green' : ROULETTE_RED_NUMBERS.has(number) ? 'red' : 'black';
}

export function rouletteGrossPayout(bets, winningNumber) {
  const error = validRouletteBets(bets);
  if (error) throw new Error(error);
  if (!Number.isInteger(winningNumber) || winningNumber < 0 || winningNumber > 36) {
    throw new Error('Het roulette-resultaat moet tussen 0 en 36 liggen.');
  }
  return bets.reduce((total, bet) => (
    total + (rouletteBetWins(bet.type, bet.value, winningNumber)
      ? Number(bet.stake) * ROULETTE_GROSS_MULTIPLIERS[bet.type]
      : 0)
  ), 0);
}

export function pointBalance(userId, challenges, participations, purchases, challengeFunds = [], challengeAwards = [], dailyBonuses = [], rouletteSpins = []) {
  const pointsByChallenge = new Map(challenges.map((challenge) => [challenge.id, Number(challenge.points) || 0]));
  const fundedChallenges = new Set(challengeFunds.map((fund) => fund.challenge_id));
  const earned = participations.reduce((total, participation) => total + (
    participation.user_id === userId && participation.status === 'approved' && !fundedChallenges.has(participation.challenge_id)
      ? pointsByChallenge.get(participation.challenge_id) || 0
      : 0
  ), 0);
  const payouts = challengeAwards.reduce((total, award) => total + (award.recipient_id === userId ? Number(award.points) : 0), 0);
  const funded = challengeFunds.reduce((total, fund) => total + (
    fund.creator_id === userId
      ? Number(fund.points_per_slot) * (Number(fund.slots_total) - Number(fund.refunded_slots || 0))
      : 0
  ), 0);
  const shopBalance = purchases.reduce((balance, purchase) => {
    if (purchase.seller_id === userId) return balance + Number(purchase.price);
    if (purchase.buyer_id === userId) return balance - Number(purchase.price);
    return balance;
  }, 0);
  const dailyBonus = dailyBonuses.reduce((total, bonus) => total + (
    bonus.user_id === userId ? Number(bonus.points) || 0 : 0
  ), 0);
  const rouletteBalance = rouletteSpins.reduce((total, spin) => total + (
    spin.user_id === userId ? Number(spin.payout || 0) - Number(spin.stake || 0) : 0
  ), 0);
  return earned + payouts - funded + shopBalance + dailyBonus + rouletteBalance;
}

export function validShopItem({title, description, price, stock}) {
  if (!title || title.trim().length < 3 || title.trim().length > 80) return 'Gebruik een naam van 3 tot 80 tekens.';
  if ((description || '').length > 600) return 'De beschrijving mag maximaal 600 tekens bevatten.';
  if (!Number.isInteger(Number(price)) || Number(price) < 1 || Number(price) > 100000) return 'Kies een prijs tussen 1 en 100.000 punten.';
  if (!Number.isInteger(Number(stock)) || Number(stock) < 1 || Number(stock) > 10000) return 'Kies een voorraad tussen 1 en 10.000.';
  return '';
}
