export interface OpeningInfo {
  eco: string;
  name: string;
}

// Prefix tree or lookup map from SAN move sequence
const OPENINGS: { moves: string[]; eco: string; name: string }[] = [
  // Italian & Ruy Lopez
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'], eco: 'C68', name: 'Ruy Lopez: Morphy Defense' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], eco: 'C60', name: 'Ruy Lopez' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], eco: 'C50', name: 'Italian Game: Giuoco Piano' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'], eco: 'C55', name: 'Two Knights Defense' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], eco: 'C50', name: 'Italian Game' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], eco: 'C44', name: 'Scotch Game' },
  { moves: ['e4', 'e5', 'Nf3', 'Nf6'], eco: 'C42', name: "Petrov's Defense" },
  { moves: ['e4', 'e5', 'Nf3', 'd6'], eco: 'C41', name: 'Philidor Defense' },
  { moves: ['e4', 'e5', 'f4'], eco: 'C30', name: "King's Gambit" },
  { moves: ['e4', 'e5', 'Nc3'], eco: 'C25', name: 'Vienna Game' },

  // Sicilian Defense
  { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], eco: 'B90', name: 'Sicilian Defense: Najdorf Variation' },
  { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], eco: 'B70', name: 'Sicilian Defense: Dragon Variation' },
  { moves: ['e4', 'c5', 'Nf3', 'e6'], eco: 'B40', name: 'Sicilian Defense: French Variation' },
  { moves: ['e4', 'c5', 'Nf3', 'Nc6'], eco: 'B30', name: 'Sicilian Defense: Old Sicilian' },
  { moves: ['e4', 'c5', 'c3'], eco: 'B22', name: 'Sicilian Defense: Alapin Variation' },
  { moves: ['e4', 'c5', 'Nc3'], eco: 'B23', name: 'Sicilian Defense: Closed' },
  { moves: ['e4', 'c5'], eco: 'B20', name: 'Sicilian Defense' },

  // French & Caro-Kann
  { moves: ['e4', 'e6', 'd4', 'd5', 'Nc3'], eco: 'C10', name: 'French Defense: Paulsen Variation' },
  { moves: ['e4', 'e6', 'd4', 'd5', 'e5'], eco: 'C02', name: 'French Defense: Advance Variation' },
  { moves: ['e4', 'e6'], eco: 'C00', name: 'French Defense' },
  { moves: ['e4', 'c6', 'd4', 'd5', 'Nc3'], eco: 'B15', name: 'Caro-Kann Defense: Main Line' },
  { moves: ['e4', 'c6', 'd4', 'd5', 'e5'], eco: 'B12', name: 'Caro-Kann Defense: Advance Variation' },
  { moves: ['e4', 'c6'], eco: 'B10', name: 'Caro-Kann Defense' },
  { moves: ['e4', 'd5'], eco: 'B01', name: 'Scandinavian Defense' },
  { moves: ['e4', 'Nf6'], eco: 'B02', name: "Alekhine's Defense" },
  { moves: ['e4', 'g6'], eco: 'B06', name: 'Modern Defense' },
  { moves: ['e4', 'd6'], eco: 'B07', name: 'Pirc Defense' },

  // Queen's Pawn & Flank Openings
  { moves: ['d4', 'd5', 'c4', 'e6'], eco: 'D30', name: "Queen's Gambit Declined" },
  { moves: ['d4', 'd5', 'c4', 'c6'], eco: 'D10', name: 'Slav Defense' },
  { moves: ['d4', 'd5', 'c4', 'dxc4'], eco: 'D20', name: "Queen's Gambit Accepted" },
  { moves: ['d4', 'd5', 'c4'], eco: 'D06', name: "Queen's Gambit" },
  { moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], eco: 'D02', name: 'London System' },
  { moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'], eco: 'E60', name: "King's Indian Defense" },
  { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], eco: 'E20', name: 'Nimzo-Indian Defense' },
  { moves: ['d4', 'Nf6', 'c4', 'c5'], eco: 'A60', name: 'Benoni Defense' },
  { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'], eco: 'E12', name: "Queen's Indian Defense" },
  { moves: ['d4', 'Nf6', 'Bg5'], eco: 'A45', name: 'Trompowsky Attack' },
  { moves: ['d4', 'f5'], eco: 'A80', name: 'Dutch Defense' },
  { moves: ['c4', 'e5'], eco: 'A20', name: 'English Opening: King’s English' },
  { moves: ['c4'], eco: 'A10', name: 'English Opening' },
  { moves: ['Nf3', 'd5', 'g3'], eco: 'A07', name: "King's Indian Attack" },
  { moves: ['Nf3'], eco: 'A04', name: 'Réti Opening' },
  { moves: ['f4'], eco: 'A02', name: "Bird's Opening" },
  { moves: ['b3'], eco: 'A01', name: 'Nimzo-Larsen Attack' },
  { moves: ['e4', 'e5'], eco: 'C20', name: "King's Pawn Game" },
  { moves: ['d4', 'd5'], eco: 'D00', name: "Queen's Pawn Game" },
  { moves: ['e4'], eco: 'B00', name: "King's Pawn Opening" },
  { moves: ['d4'], eco: 'A40', name: "Queen's Pawn Opening" },
];

export function detectOpening(sans: string[]): OpeningInfo | null {
  if (sans.length === 0) return null;

  // Find longest matching prefix
  for (const op of OPENINGS) {
    if (sans.length >= op.moves.length) {
      const match = op.moves.every((m, idx) => m === sans[idx]);
      if (match) {
        return { eco: op.eco, name: op.name };
      }
    }
  }

  return null;
}
