export const CATEGORIES = [
  { id: 'avontuur', label: 'Avontuur', icon: 'mountain', tone: 'purple' },
  { id: 'sport', label: 'Sport', icon: 'dumbbell', tone: 'orange' },
  { id: 'sociaal', label: 'Sociaal', icon: 'users', tone: 'blue' },
  { id: 'grappig', label: 'Grappig', icon: 'party-popper', tone: 'pink' },
  { id: 'overig', label: 'Overig', icon: 'sparkles', tone: 'green' }
];

export const categoryFor = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[4];

export function ranking(members, challenges, participations) {
  const pointsByChallenge = new Map(challenges.map((c) => [c.id, Number(c.points) || 0]));
  const ranked = members.map((m) => ({
    ...m,
    points: participations.reduce((total, p) => total + (p.user_id === m.id && p.status === 'approved' ? (pointsByChallenge.get(p.challenge_id) || 0) : 0), 0),
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

export function validChallenge({title, description, points, reward_slots}) {
  if (!title || title.trim().length < 3 || title.trim().length > 80) return 'Gebruik een titel van 3 tot 80 tekens.';
  if ((description || '').length > 600) return 'De beschrijving mag maximaal 600 tekens bevatten.';
  if (!Number.isInteger(Number(points)) || Number(points) < 1 || Number(points) > 1000) return 'Kies tussen 1 en 1000 punten.';
  if (!Number.isInteger(Number(reward_slots)) || Number(reward_slots) < 1 || Number(reward_slots) > 100) return 'Kies tussen 1 en 100 betaalde plekken.';
  return '';
}

export function pointBalance(userId, challenges, participations, purchases, challengeFunds = [], challengeAwards = []) {
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
  return earned + payouts - funded + shopBalance;
}

export function validShopItem({title, description, price, stock}) {
  if (!title || title.trim().length < 3 || title.trim().length > 80) return 'Gebruik een naam van 3 tot 80 tekens.';
  if ((description || '').length > 600) return 'De beschrijving mag maximaal 600 tekens bevatten.';
  if (!Number.isInteger(Number(price)) || Number(price) < 1 || Number(price) > 100000) return 'Kies een prijs tussen 1 en 100.000 punten.';
  if (!Number.isInteger(Number(stock)) || Number(stock) < 1 || Number(stock) > 10000) return 'Kies een voorraad tussen 1 en 10.000.';
  return '';
}
