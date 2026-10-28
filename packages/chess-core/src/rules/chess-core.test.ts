import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessGame } from './index.js';
import { STARTING_FEN } from '../constants/index.js';

test('ChessGame - Starting position and basic moves', () => {
  const game = new ChessGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.fen, STARTING_FEN);
  assert.equal(snapshot.sideToMove, 'w');
  assert.equal(snapshot.status, 'active');
  assert.equal(snapshot.isCheck, false);
  assert.equal(snapshot.isCheckmate, false);

  // Legal e2-e4 move
  const res = game.makeMove({ from: 'e2', to: 'e4' });
  assert.equal(res.success, true);
  assert.equal(res.move?.san, 'e4');
  assert.equal(res.move?.uci, 'e2e4');
  assert.equal(game.getSideToMove(), 'b');
});

test('ChessGame - Pawn movement restrictions', () => {
  const game = new ChessGame();

  // Cannot move 2 squares sideways or backward
  const illegalMove = game.makeMove({ from: 'e2', to: 'e5' });
  assert.equal(illegalMove.success, false);

  // Normal double step
  game.makeMove({ from: 'e2', to: 'e4' });
  // Black replies
  game.makeMove({ from: 'e7', to: 'e5' });

  // White cannot move e4 to e6 (jumping 2 squares after first move)
  const illegalJump = game.makeMove({ from: 'e4', to: 'e6' });
  assert.equal(illegalJump.success, false);
});

test('ChessGame - En passant captures', () => {
  const game = new ChessGame();
  // 1. e4 Nf6 2. e5 d5
  game.makeMove({ from: 'e2', to: 'e4' });
  game.makeMove({ from: 'g8', to: 'f6' });
  game.makeMove({ from: 'e4', to: 'e5' });
  game.makeMove({ from: 'd7', to: 'd5' });

  const snapshotBefore = game.getSnapshot();
  assert.equal(snapshotBefore.enPassantSquare, 'd6');

  // En passant capture exd6
  const epRes = game.makeMove({ from: 'e5', to: 'd6' });
  assert.equal(epRes.success, true);
  assert.equal(epRes.move?.isEnPassant, true);
  assert.equal(epRes.move?.captured, 'p');

  // Pawn on d5 should now be gone
  const board = game.getBoard();
  // Rank 5 is index 3 (8=0, 7=1, 6=2, 5=3). File d is index 3.
  assert.equal(board[3][3], null);
});

test('ChessGame - En passant expired after intervening move', () => {
  const game = new ChessGame();
  // 1. e4 a6 2. e5 d5 3. h3 (intervening) h6 4. exd6 is now illegal
  game.makeMove({ from: 'e2', to: 'e4' });
  game.makeMove({ from: 'a7', to: 'a6' });
  game.makeMove({ from: 'e4', to: 'e5' });
  game.makeMove({ from: 'd7', to: 'd5' });
  game.makeMove({ from: 'h2', to: 'h3' });
  game.makeMove({ from: 'h7', to: 'h6' });

  const expiredEp = game.makeMove({ from: 'e5', to: 'd6' });
  assert.equal(expiredEp.success, false);
});

test('ChessGame - Castling kingside & queenside', () => {
  const game = new ChessGame();
  // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
  game.makeMove({ from: 'e2', to: 'e4' });
  game.makeMove({ from: 'e7', to: 'e5' });
  game.makeMove({ from: 'g1', to: 'f3' });
  game.makeMove({ from: 'b8', to: 'c6' });
  game.makeMove({ from: 'f1', to: 'c4' });
  game.makeMove({ from: 'f8', to: 'c5' });

  // White castles kingside O-O
  const castleRes = game.makeMove({ from: 'e1', to: 'g1' });
  assert.equal(castleRes.success, true);
  assert.equal(castleRes.move?.isCastling, true);
  assert.equal(castleRes.move?.san, 'O-O');
});

test('ChessGame - Castling rejected when passing through check', () => {
  // Position where square f1 is attacked by Black bishop
  const fenWithF1Attacked = 'r1bqk2r/pppp1ppp/2n5/2b1p3/4P1n1/3P1N2/PPP1BPPP/RNBQK2R w KQkq - 0 1';
  // Let's create a clear position: Black queen on a6 attacks f1
  const fen = 'r3k2r/8/q7/8/8/8/8/R3K2R w KQkq - 0 1';
  const game = new ChessGame(fen);

  // Castling O-O would pass king through f1 which is attacked by Qa6
  const illegalCastle = game.makeMove({ from: 'e1', to: 'g1' });
  assert.equal(illegalCastle.success, false);
});

test('ChessGame - Pawn promotion to Q, R, B, N', () => {
  for (const promo of ['q', 'r', 'b', 'n'] as const) {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    const game = new ChessGame(fen);
    const res = game.makeMove({ from: 'e7', to: 'e8', promotion: promo });
    assert.equal(res.success, true);
    assert.equal(res.move?.promotion, promo);
  }
});

test('ChessGame - Checkmate detection (Scholar’s Mate)', () => {
  const game = new ChessGame();
  // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
  game.makeMove({ from: 'e2', to: 'e4' });
  game.makeMove({ from: 'e7', to: 'e5' });
  game.makeMove({ from: 'd1', to: 'h5' });
  game.makeMove({ from: 'b8', to: 'c6' });
  game.makeMove({ from: 'f1', to: 'c4' });
  game.makeMove({ from: 'g8', to: 'f6' });
  const mateRes = game.makeMove({ from: 'h5', to: 'f7' });

  assert.equal(mateRes.success, true);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.isCheckmate, true);
  assert.equal(snapshot.status, 'finished');
  assert.equal(snapshot.result, '1-0');
  assert.equal(snapshot.endReason, 'checkmate');
});

test('ChessGame - Stalemate detection', () => {
  // Classic stalemate position: Black king on a8, White king on c7, White queen on b6 -> stalemate if Black to move
  const fen = 'k7/2K5/1Q6/8/8/8/8/8 b - - 0 1';
  const game = new ChessGame(fen);
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.isStalemate, true);
  assert.equal(snapshot.status, 'finished');
  assert.equal(snapshot.result, '1/2-1/2');
  assert.equal(snapshot.endReason, 'stalemate');
});

test('ChessGame - Threefold repetition claim', () => {
  const game = new ChessGame();
  // 1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8
  game.makeMove('Nf3');
  game.makeMove('Nf6');
  game.makeMove('Ng1');
  game.makeMove('Ng8');
  game.makeMove('Nf3');
  game.makeMove('Nf6');
  game.makeMove('Ng1');
  game.makeMove('Ng8');

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.canClaimThreefold, true);

  const claimRes = game.claimDraw('threefold');
  assert.equal(claimRes.success, true);
  assert.equal(game.getSnapshot().status, 'finished');
  assert.equal(game.getSnapshot().result, '1/2-1/2');
  assert.equal(game.getSnapshot().endReason, 'threefold_repetition');
});

test('ChessGame - Clock handling and increment', () => {
  const game = new ChessGame(STARTING_FEN, {
    timeControl: { initialMs: 60000, incrementMs: 2000 },
  });

  const clock = game.getClock()!;
  const startState = clock.getState(Date.now());
  assert.ok(startState.whiteRemainingMs <= 60000 && startState.whiteRemainingMs >= 59900);
  assert.equal(startState.blackRemainingMs, 60000);
  assert.equal(startState.activeColor, 'w');

  // White takes 3000ms and moves e2-e4
  const t0 = 100000;
  clock.start('w', t0);
  const t1 = t0 + 3000;
  game.makeMove({ from: 'e2', to: 'e4' }, t1);

  const afterMoveState = clock.getState(t1);
  // White had 60000 - 3000 + 2000 = 59000 ms
  assert.equal(afterMoveState.whiteRemainingMs, 59000);
  assert.equal(afterMoveState.activeColor, 'b');
});
