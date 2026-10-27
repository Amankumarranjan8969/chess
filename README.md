# Grandmaster Arena: Full-Stack Chess Platform

A production-grade, authoritative full-stack chess platform built strictly adhering to the architectural separation of concerns:
- **Chess Engine / Rules Authority**: Understands chess rules, legal moves, special moves, FIDE draws, and state transitions (`packages/chess-core`).
- **Computer Opponent**: Search-based minimax AI with alpha-beta pruning, piece-square tables, and move ordering (`packages/chess-core/src/ai`).
- **Authoritative Online Backend**: Node.js + Express + Socket.IO server managing private rooms, turns, monotonic clocks, and move verification (`apps/server`).
- **Interactive Frontend**: React 19 + TypeScript + Vite + Tailwind CSS featuring click-to-move, drag-and-drop, audio effects, smooth clock countdowns, and SAN move history (`apps/web`).
- **Persistence Layer**: PostgreSQL schema with Prisma ORM (`apps/server/prisma/schema.prisma`).

---

## Workspace Structure

```
chess/
├── packages/
│   └── chess-core/          # Authoritative rules, types, timers & Minimax AI
│       ├── src/
│       │   ├── types/       # Domain interfaces (Square, Color, Piece, DetailedMove, etc.)
│       │   ├── rules/       # ChessGame engine wrapper & Perft test suite
│       │   ├── clock/       # Monotonic ChessClock implementation
│       │   ├── constants/   # Starting FEN, piece values & square maps
│       │   └── ai/          # Minimax AI with Alpha-Beta pruning & PSTs
│       └── dist/
├── apps/
│   ├── web/                 # React + TypeScript + Vite frontend
│   │   ├── src/
│   │   │   ├── components/  # Chessboard, ClockDisplay, MoveHistory, ChessPiece
│   │   │   ├── hooks/       # useChessAI, useChessSocket
│   │   │   ├── audio/       # Web Audio API sound effects synthesizer
│   │   │   └── App.tsx      # Main application with Play vs Computer / Online / Pass & Play
│   └── server/              # Authoritative real-time Node.js + Socket.IO backend
│       ├── src/
│       │   ├── game/        # GameRoom, RoomManager
│       │   ├── sockets/     # Real-time WebSocket event gateway
│       │   └── server.ts    # HTTP & Socket.IO server entrypoint
│       └── prisma/
│           └── schema.prisma# PostgreSQL relational schema (users, games, moves, ratings)
└── package.json             # Root npm workspaces
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
Verifies all 15 chess rules tests, en passant edge cases, castling through check, checkmate, stalemate, 3-fold repetition, and KiwiPete perft validation:
```bash
npm run test --workspace=@chess/core
npm run test --workspace=@chess/server
```

### 3. Launch Development Servers
- Authoritative Backend (Port 4000):
  ```bash
  npm run dev:server
  ```
- React Frontend (Port 3000):
  ```bash
  npm run dev:web
  ```

---

## Implemented FIDE Rules Checklist

- [x] 8x8 Board & starting standard FEN
- [x] Piece movement mechanics (Pawn single/double, Knight jumping, Rook, Bishop, Queen, King safety)
- [x] En passant (only valid immediately on the next ply)
- [x] Castling (Kingside and Queenside; disallowed if king or rook moved, when in check, or through check)
- [x] Promotion to Queen, Rook, Bishop, or Knight
- [x] Checkmate & Stalemate detection
- [x] Threefold repetition (claimable)
- [x] Fivefold repetition (automatic FIDE draw)
- [x] Fifty-move rule (claimable)
- [x] Seventy-five-move rule (automatic FIDE draw)
- [x] Insufficient material dead positions & timeout insufficient material draw
- [x] Authoritative monotonic clock countdown with increment and lag compensation
- [x] Disconnect retention and state recovery over WebSockets
