const ADJECTIVES = [
  'Swift', 'Calm', 'Bright', 'Bold', 'Wise', 'Kind', 'Fast', 'Cool',
  'Sharp', 'Clever', 'Agile', 'Quiet', 'Sunny', 'Lively', 'Gentle', 'Brave',
  'Eager', 'Happy', 'Lucky', 'Witty', 'Zesty', 'Nimble', 'Vivid', 'Daring',
];

const NOUNS = [
  'Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lynx', 'Deer', 'Hare',
  'Seal', 'Crow', 'Dove', 'Fawn', 'Kite', 'Mole', 'Newt', 'Orca',
  'Puma', 'Rook', 'Swan', 'Toad', 'Vole', 'Wren', 'Ibis', 'Quail',
];

export function nameFromSeed(seed: number): string {
  const adj = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  return `${adj} ${noun}`;
}

export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) >>> 0;
  }
  return h;
}
