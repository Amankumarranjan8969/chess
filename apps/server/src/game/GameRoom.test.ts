import test from 'node:test';
import assert from 'node:assert/strict';
import { GameRoom } from './GameRoom.js';

test('GameRoom - Room assignment and turn enforcement', () => {
  const room = new GameRoom('TEST01');

  // Player 1 joins as White
  const p1 = room.addPlayer('socket-1', 'Alice', 'w');
  assert.equal(p1.role, 'player');
  assert.equal(p1.color, 'w');

  // Player 2 joins as Black
  const p2 = room.addPlayer('socket-2', 'Bob');
  assert.equal(p2.role, 'player');
  assert.equal(p2.color, 'b');

  // Player 3 joins as Spectator
  const p3 = room.addPlayer('socket-3', 'Charlie');
  assert.equal(p3.role, 'spectator');

  // Bob (Black) attempts to move out of turn -> rejected
  const illegalTurn = room.makeMove('socket-2', { from: 'e7', to: 'e5' });
  assert.equal(illegalTurn.success, false);
  assert.equal(illegalTurn.error, 'Not your turn');

  // Alice (White) moves e2-e4 -> accepted
  const legalMove = room.makeMove('socket-1', { from: 'e2', to: 'e4' });
  assert.equal(legalMove.success, true);
  assert.equal(legalMove.move?.san, 'e4');

  // Spectator Charlie tries to move -> rejected
  const spectatorMove = room.makeMove('socket-3', { from: 'e7', to: 'e5' });
  assert.equal(spectatorMove.success, false);
  assert.equal(spectatorMove.error, 'You are not a participant in this game');

  // Bob moves e7-e5 -> accepted
  const bobMove = room.makeMove('socket-2', { from: 'e7', to: 'e5' });
  assert.equal(bobMove.success, true);

  room.destroy();
});

test('GameRoom - Draw offers and resignation', () => {
  const room = new GameRoom('TEST02');
  room.addPlayer('socket-1', 'Alice', 'w');
  room.addPlayer('socket-2', 'Bob', 'b');

  // Alice offers draw
  const offerRes = room.offerDraw('socket-1');
  assert.equal(offerRes.success, true);

  // Bob accepts draw
  const acceptRes = room.respondDraw('socket-2', true);
  assert.equal(acceptRes.success, true);
  assert.equal(acceptRes.accepted, true);

  const snap = room.getSerializedState();
  assert.equal(snap.gameState.status, 'finished');
  assert.equal(snap.gameState.result, '1/2-1/2');
  assert.equal(snap.gameState.endReason, 'agreement');

  room.destroy();
});

test('GameRoom - Resignation finishes game immediately', () => {
  const room = new GameRoom('TEST03');
  room.addPlayer('socket-1', 'Alice', 'w');
  room.addPlayer('socket-2', 'Bob', 'b');

  // Alice resigns
  const resignRes = room.resign('socket-1');
  assert.equal(resignRes.success, true);

  const snap = room.getSerializedState();
  assert.equal(snap.gameState.status, 'finished');
  assert.equal(snap.gameState.result, '0-1');
  assert.equal(snap.gameState.endReason, 'resignation');

  room.destroy();
});
