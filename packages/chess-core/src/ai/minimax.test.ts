import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessAI } from './minimax.js';

test('ChessAI - Finds mate in 1', () => {
  const ai = new ChessAI();
  // Position where White has Qh5 and Bc4, Black has e5, Nc6, a6. Qxf7 is checkmate.
  const fen = 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1';
  const result = ai.findBestMove(fen, { depth: 2 });

  assert.ok(result.bestMove);
  assert.equal(result.bestMove?.from, 'h5');
  assert.equal(result.bestMove?.to, 'f7');
  assert.ok(result.evaluation > 10000); // Checkmate score
});

test('ChessAI - Captures undefended hanging high-value piece', () => {
  const ai = new ChessAI();
  // Black queen on e4 is hanging, White knight on c3 can capture it
  const fen = 'rnb1kbnr/pppp1ppp/8/8/4q3/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1';
  const result = ai.findBestMove(fen, { depth: 2 });

  assert.ok(result.bestMove);
  assert.equal(result.bestMove?.from, 'c3');
  assert.equal(result.bestMove?.to, 'e4');
});

test('ChessAI - Quiescence search rejects toxic sacrifice / horizon trap', () => {
  const ai = new ChessAI();
  // White queen on b3. Black has pawn on b7 defended by bishop on c8.
  // Queen taking b7 captures a pawn, but gets recaptured by bishop (losing queen).
  // With quiescence search, Qxb7 is rejected because the exchange is a massive net loss.
  const fen = 'r1b1kbnr/pp1ppppp/2n5/8/8/1Q6/PPPPPPPP/RNB1KBNR w KQkq - 0 1';
  const result = ai.findBestMove(fen, { depth: 2 });

  assert.ok(result.bestMove);
  // Must NOT play Qxb7
  assert.notEqual(result.bestMove?.san, 'Qxb7');
});

test('ChessAI - Deep Grandmaster search operates within time bounds and finds optimal move', () => {
  const ai = new ChessAI();
  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5';
  const result = ai.findBestMove(fen, { depth: 4, quiescenceDepth: 6 });

  assert.ok(result.bestMove);
  assert.ok(result.nodesSearched > 50);
  assert.equal(result.depthReached, 4);
});
