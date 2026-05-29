import { Room } from "@colyseus/core";
import { Schema, MapSchema, type } from "@colyseus/schema";
import { FloorDrops } from "./rounds/floorDrops.js";
import { submitResult, pickNextRound } from "./chain/submitResult.js";

/* ------------------------------------------------------------------ *
 *  Networked state (auto-synced to every client by Colyseus)
 * ------------------------------------------------------------------ */
class Player extends Schema {}
type("string")(Player.prototype, "address");
type("string")(Player.prototype, "name");
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("boolean")(Player.prototype, "alive");

class ArenaState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.phase = "lobby"; // lobby | countdown | playing | over
    this.round = "floor_drops";
    this.taunt = "";
    this.tilesRemoved = "[]";
    this.winner = "";
  }
}
type({ map: Player })(ArenaState.prototype, "players");
type("string")(ArenaState.prototype, "phase");
type("string")(ArenaState.prototype, "round");
type("string")(ArenaState.prototype, "taunt");
type("string")(ArenaState.prototype, "tilesRemoved");
type("string")(ArenaState.prototype, "winner");

/* ------------------------------------------------------------------ */
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 16;
const COUNTDOWN_MS = 5000;
const TICK_HZ = 20;
const ROUNDS = ["floor_drops"]; // only floor_drops is implemented so far

export class ArenaRoom extends Room {
  onCreate() {
    this.maxClients = MAX_PLAYERS;
    this.setState(new ArenaState());

    this.onMessage("input", (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.alive || this.state.phase !== "playing") return;
      p.x = Math.max(0, Math.min(this.round.cols - 1, msg.x | 0));
      p.y = Math.max(0, Math.min(this.round.rows - 1, msg.y | 0));
    });

    this.setSimulationInterval((dt) => this.update(dt), 1000 / TICK_HZ);
  }

  onJoin(client, options) {
    const p = new Player();
    p.address = options?.address ?? "";
    p.name = options?.name ?? "anon";
    p.x = 0;
    p.y = 0;
    p.alive = true;
    this.state.players.set(client.sessionId, p);

    if (this.state.players.size >= MIN_PLAYERS && this.state.phase === "lobby") {
      this.startCountdown();
    }
  }

  onLeave(client) {
    const p = this.state.players.get(client.sessionId);
    if (p) p.alive = false;
    this.checkForWinner();
  }

  /* -------------------------------------------------------------- */
  async startCountdown() {
    this.state.phase = "countdown";

    // Ask GenLayer's LLM to pick the round + taunt. Non-blocking: if the chain
    // is slow or unreachable, fall back to a local random round so play never
    // stalls. This is the signature GenLayer touch.
    let pick = null;
    try {
      pick = await Promise.race([
        pickNextRound(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("chain timeout")), 4000)),
      ]);
    } catch (e) {
      console.warn("AI round pick unavailable, using local fallback:", e.message);
    }

    this.state.round = pick?.round && isImplemented(pick.round) ? pick.round
      : ROUNDS[Math.floor(Math.random() * ROUNDS.length)];
    this.state.taunt = pick?.taunt ?? "";

    this.broadcast("countdown", { ms: COUNTDOWN_MS, round: this.state.round, taunt: this.state.taunt });
    this.clock.setTimeout(() => this.startMatch(), COUNTDOWN_MS);
  }

  startMatch() {
    this.round = new FloorDrops();
    this.round.placePlayers([...this.state.players.values()]);
    this.state.tilesRemoved = "[]";
    this.state.winner = "";
    this.state.phase = "playing";
    this.broadcast("round_start", { round: this.state.round, ...this.round.config() });
  }

  update(dt) {
    if (this.state.phase !== "playing") return;

    const removed = this.round.tick(dt);
    if (removed.length) {
      const all = JSON.parse(this.state.tilesRemoved);
      all.push(...removed);
      this.state.tilesRemoved = JSON.stringify(all);
      this.broadcast("tiles_removed", { tiles: removed });
    }

    for (const [sid, p] of this.state.players) {
      if (p.alive && this.round.isFatal(p.x, p.y)) {
        p.alive = false;
        this.broadcast("eliminated", { sessionId: sid });
      }
    }
    this.checkForWinner();
  }

  checkForWinner() {
    if (this.state.phase !== "playing") return;
    const alive = [...this.state.players.entries()].filter(([, p]) => p.alive);
    if (alive.length > 1) return;

    this.state.phase = "over";
    const winner = alive[0]?.[1] ?? null;
    this.state.winner = winner?.address ?? "";

    const players = [...this.state.players.values()].map((p) => ({
      addr: p.address,
      name: p.name,
    }));
    this.broadcast("match_over", { winner: this.state.winner, players });

    // Record the result on GenLayer (server pays gas; players need no tokens).
    if (winner?.address) {
      submitResult(winner.address, players, this.state.round)
        .then((txHash) => this.broadcast("result_onchain", { txHash }))
        .catch((err) => console.error("submitResult failed:", err));
    }

    this.clock.setTimeout(() => {
      for (const p of this.state.players.values()) {
        p.alive = true;
        p.x = 0;
        p.y = 0;
      }
      this.state.phase = "lobby";
      if (this.state.players.size >= MIN_PLAYERS) this.startCountdown();
    }, 6000);
  }
}

function isImplemented(round) {
  return ROUNDS.includes(round);
}
