import { Puzzle } from '../types/platform.js';

export const INITIAL_PUZZLES: Puzzle[] = [
  {
    id: 'puz-1',
    title: 'Queen & Bishop Mate in 1',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    sideToMove: 'w',
    rating: 800,
    theme: 'Scholar Mate Pattern',
    category: 'mate_in_1',
    difficulty: 'beginner',
    solutionMoves: [{ from: 'h5', to: 'f7', san: 'Qxf7#' }],
    hint: 'Target the weak f7 square with your queen and bishop battery.',
    explanation:
      'Qxf7# attacks the black king while protected by the light-squared bishop on c4. The king has no legal escape squares and cannot capture the protected queen, resulting in immediate checkmate.',
  },
  {
    id: 'puz-2',
    title: 'Back-Rank Smothered Mate',
    fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
    sideToMove: 'w',
    rating: 950,
    theme: 'Back-Rank Weakness',
    category: 'back_rank',
    difficulty: 'beginner',
    solutionMoves: [{ from: 'e2', to: 'e8', san: 'Qe8#' }],
    hint: 'Black pawns on f7, g7, and h7 block their king from escaping forward.',
    explanation:
      'Qe8# delivers back-rank checkmate. Black has made no "luft" (escape hatch) for their king, so any heavy piece infiltrating the 8th rank seals victory immediately.',
  },
  {
    id: 'puz-3',
    title: 'Royal Knight Fork',
    fen: 'r1b1k2r/pp3ppp/2n5/3p4/1b1N4/2N1B3/PPP2PPP/R3KB1R w KQkq - 0 1',
    sideToMove: 'w',
    rating: 1200,
    theme: 'Knight Fork',
    category: 'fork',
    difficulty: 'intermediate',
    solutionMoves: [
      { from: 'd4', to: 'b5', san: 'Nb5' },
    ],
    hint: 'Look for an aggressive square where your knight threatens both c7 (forking king & rook) and opens tactical avenues.',
    explanation:
      'Nb5 threatens Nc7+ with a deadly royal fork targeting king and rook on a8 simultaneously, forcing Black into defensive retreat.',
  },
  {
    id: 'puz-4',
    title: 'Absolute Pin on the Queen',
    fen: 'r1b1k2r/pp3ppp/4p3/3p4/1b6/2q1B3/PPP2PPP/R2QKB1R w KQkq - 0 1',
    sideToMove: 'w',
    rating: 1100,
    theme: 'Pin & Removal of Defender',
    category: 'pin',
    difficulty: 'beginner',
    solutionMoves: [
      { from: 'e3', to: 'd2', san: 'Bd2' },
    ],
    hint: 'Counter-attack the invading queen while shielding your king from check.',
    explanation:
      'Bd2 resolves the check on the white king while simultaneously counter-attacking Black’s exposed queen on c3, winning vital tempo.',
  },
  {
    id: 'puz-5',
    title: 'Greek Gift Sacrifice Follow-up',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N2N2/PP1QPPPP/R3KB1R w KQ - 0 7',
    sideToMove: 'w',
    rating: 1450,
    theme: 'Center Break',
    category: 'sacrifice',
    difficulty: 'intermediate',
    solutionMoves: [
      { from: 'e2', to: 'e4', san: 'e4' },
    ],
    hint: 'Blow open the center files while your pieces are superiorly coordinated.',
    explanation:
      'e4! creates an explosive central pawn lever, prying open diagonal lines for the bishops and pinning Black’s knights to passive defensive duty.',
  },
  {
    id: 'puz-6',
    title: 'Discovered Check Combination',
    fen: 'r1b2rk1/pp3ppp/4p3/3p4/1b1B4/8/PPPN1PPP/R3KB1R w KQ - 0 1',
    sideToMove: 'w',
    rating: 1350,
    theme: 'Discovered Attack',
    category: 'discovered_attack',
    difficulty: 'intermediate',
    solutionMoves: [
      { from: 'c2', to: 'c3', san: 'c3' },
    ],
    hint: 'Kick the pinned bishop and reinforce central pawn control.',
    explanation:
      'c3 drives Black’s bishop away from its pinning outpost, simultaneously preparing b4 and cementing complete queenside spatial dominance.',
  },
  {
    id: 'puz-7',
    title: 'Skewer on King and Heavy Piece',
    fen: '4k3/8/8/8/8/8/1r6/R3K3 w - - 0 1',
    sideToMove: 'w',
    rating: 1550,
    theme: 'Endgame Skewer',
    category: 'skewer',
    difficulty: 'advanced',
    solutionMoves: [
      { from: 'a1', to: 'a8', san: 'Ra8+' },
    ],
    hint: 'Check the king along the back rank to skewer or coordinate rook activity.',
    explanation:
      'Ra8+ drives the enemy king out of active centralization and forces passive squares, transitioning easily into a technically won endgame.',
  },
  {
    id: 'puz-8',
    title: 'Corridor Deflection',
    fen: '5rk1/5ppp/8/8/8/1Q6/5PPP/5RK1 w - - 0 1',
    sideToMove: 'w',
    rating: 1650,
    theme: 'Deflection',
    category: 'deflection',
    difficulty: 'advanced',
    solutionMoves: [
      { from: 'b3', to: 'a3', san: 'Qa3' },
    ],
    hint: 'Reposition the queen along the long diagonal and file to restrict Black rook mobility.',
    explanation:
      'Qa3 dominates both the open a-file and the 8th rank infiltration paths, tying down Black’s rook to the back rank.',
  },
];
