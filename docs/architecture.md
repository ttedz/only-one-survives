# Architecture

## Overview

Only One Survives is a real-time, last-player-standing elimination game. The
game runs in the browser; an authoritative Node server runs the real
simulation; and a GenLayer Intelligent Contract holds the leaderboard and picks
each round with its built-in LLM. It is **free to play** — no staking, no payouts.

```
Players (browser)  <-- live inputs/state -->  Game server (authoritative)
   (wallet = identity)                                |
                                          records result + reads AI round
                                                       v
        GenLayer contract: on-chain leaderboard + AI round picker
```

## Why three layers

- **Browser** can't be trusted to decide who won (lag, tampering), so it never
  does. It renders what the server reports and sends intent ("move here"). The
  player's wallet is used only for identity on the leaderboard.
- **Server** is authoritative for gameplay: tile state, collisions, elimination
  order. This is what makes true real-time multiplayer fair. It also pays the
  gas for on-chain writes, so players need no tokens.
- **GenLayer** stores the leaderboard on-chain (permanent, anyone can read it —
  not a server database you have to trust) and runs the AI round picker, an
  LLM-driven decision reached by validator consensus. That's the part a normal
  blockchain can't do.

## Free-to-play model

1. Player connects a wallet (free) — address = leaderboard identity.
2. Players are matched into an arena and play.
3. At each round start, the server asks the contract's LLM to pick the round +
   write a taunt (`pick_next_round`). Non-blocking: if the chain is slow, the
   server falls back to a local random round so play never stalls.
4. When a match ends, the server calls `report_result` with the winner, the
   players (+ display names), and the round. The contract records the match and
   updates the on-chain leaderboard. The server signs and pays gas; players
   send nothing.

## Round system

Each round is a pair:

- `server/src/rounds/<round>.js` — authoritative sim: owns hazard state, exposes
  `tick(dt)` (what changed) and `isFatal(x, y)` (who dies).
- `client/src/rounds/<Round>.js` — pure renderer: draws what the server reports.

To add **Laser Spin**, **Shrink Zone**, etc., implement those two files and add
the round name to the `ROUNDS` list in `ArenaRoom.js` (so the AI picker is
allowed to choose it). The lobby, sync, elimination, and on-chain flow are all
round-agnostic.

## Message protocol (Colyseus)

Synced state: `players` (map), `phase`, `round`, `taunt`, `tilesRemoved`, `winner`.

| Direction | Message | Payload |
|---|---|---|
| client → server | `input` | `{ x, y }` desired cell |
| server → client | `countdown` | `{ ms, round, taunt }` |
| server → client | `round_start` | `{ round, cols, rows }` |
| server → client | `tiles_removed` | `{ tiles: [[c,r], …] }` |
| server → client | `eliminated` | `{ sessionId }` |
| server → client | `match_over` | `{ winner, players }` |
| server → client | `result_onchain` | `{ txHash }` |
