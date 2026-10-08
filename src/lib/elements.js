/** Couleurs (palette Jmol) et rayons d'affichage (Å) des éléments courants. Affichage uniquement, pas de la chimie. */
const DATA = {
  H: ['#ffffff', 0.5], Li: ['#cc80ff', 1.1], Be: ['#c2ff00', 0.9], B: ['#ffb5b5', 0.85], C: ['#909090', 0.75], N: ['#3050f8', 0.7],
  O: ['#ff0d0d', 0.65], F: ['#90e050', 0.6], Na: ['#ab5cf2', 1.3], Mg: ['#8aff00', 1.2], Al: ['#bfa6a6', 1.15], Si: ['#f0c8a0', 1.1],
  P: ['#ff8000', 1.0], S: ['#ffff30', 1.0], Cl: ['#1ff01f', 1.0], K: ['#8f40d4', 1.6], Ca: ['#3dff00', 1.4], Sc: ['#e6e6e6', 1.3],
  Ti: ['#bfc2c7', 1.25], V: ['#a6a6ab', 1.2], Cr: ['#8a99c7', 1.2], Mn: ['#9c7ac7', 1.2], Fe: ['#e06633', 1.2], Co: ['#f090a0', 1.15],
  Ni: ['#50d050', 1.15], Cu: ['#c88033', 1.15], Zn: ['#7d80b0', 1.15], Ga: ['#c28f8f', 1.2], Ge: ['#668f8f', 1.15], As: ['#bd80e3', 1.1],
  Se: ['#ffa100', 1.1], Br: ['#a62929', 1.1], Rb: ['#702eb0', 1.8], Sr: ['#00ff00', 1.5], Y: ['#94ffff', 1.4], Zr: ['#94e0e0', 1.35],
  Nb: ['#73c2c9', 1.3], Mo: ['#54b5b5', 1.3], Ru: ['#248f8f', 1.25], Rh: ['#0a7d8c', 1.25], Pd: ['#006985', 1.25], Ag: ['#c0c0c0', 1.3],
  Cd: ['#ffd98f', 1.3], In: ['#a67573', 1.35], Sn: ['#668080', 1.3], Sb: ['#9e63b5', 1.25], Te: ['#d47a00', 1.25], I: ['#940094', 1.25],
  Cs: ['#57178f', 1.9], Ba: ['#00c900', 1.6], La: ['#70d4ff', 1.5], Ce: ['#ffffc7', 1.45], Hf: ['#4dc2ff', 1.35], Ta: ['#4da6ff', 1.3],
  W: ['#2194d6', 1.3], Re: ['#267dab', 1.25], Os: ['#266696', 1.25], Ir: ['#175487', 1.25], Pt: ['#d0d0e0', 1.25], Au: ['#ffd123', 1.25],
  Hg: ['#b8b8d0', 1.3], Tl: ['#a6544d', 1.35], Pb: ['#575961', 1.35], Bi: ['#9e4fb5', 1.35]
};

export function elementStyle(symbol) {
  const [color, radius] = DATA[symbol] ?? ['#9aa4b5', 1.2];
  return { color, radius };
}
