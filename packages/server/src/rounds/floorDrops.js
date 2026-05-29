/**
 * Floor Drops — server-authoritative round.
 *
 * A grid of tiles. Over time tiles are removed at an accelerating rate.
 * A player standing on a removed tile is eliminated. Last one standing wins.
 *
 * The server is the single source of truth for which tiles are gone; clients
 * only render what the server tells them. This prevents "I wasn't on that tile"
 * cheating and keeps everyone in sync.
 */

const COLS = 10;
const ROWS = 10;
const START_INTERVAL_MS = 1200; // time between drops at the start
const MIN_INTERVAL_MS = 250;    // fastest drop interval
const RAMP = 0.94;              // interval multiplier each drop (accelerates)

export class FloorDrops {
  constructor() {
    this.cols = COLS;
    this.rows = ROWS;
    this.removed = new Set();    // "col,row" keys
    this.elapsed = 0;
    this.sinceLast = 0;
    this.interval = START_INTERVAL_MS;
  }

  config() {
    return { cols: this.cols, rows: this.rows };
  }

  placePlayers(players) {
    // spread players out on a ring so nobody starts on top of each other
    const n = players.length;
    players.forEach((p, i) => {
      const angle = (i / n) * Math.PI * 2;
      p.x = Math.round((this.cols - 1) / 2 + Math.cos(angle) * (this.cols / 3));
      p.y = Math.round((this.rows - 1) / 2 + Math.sin(angle) * (this.rows / 3));
    });
  }

  /** advance the sim; returns the list of [col,row] tiles removed this tick */
  tick(dt) {
    this.elapsed += dt;
    this.sinceLast += dt;
    const newlyRemoved = [];

    while (this.sinceLast >= this.interval) {
      this.sinceLast -= this.interval;
      const tile = this._pickTile();
      if (tile) {
        this.removed.add(`${tile[0]},${tile[1]}`);
        newlyRemoved.push(tile);
      }
      this.interval = Math.max(MIN_INTERVAL_MS, this.interval * RAMP);
    }
    return newlyRemoved;
  }

  isFatal(col, row) {
    return this.removed.has(`${col},${row}`);
  }

  _pickTile() {
    // pick a random still-standing tile
    const remaining = [];
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.removed.has(`${c},${r}`)) remaining.push([c, r]);
      }
    }
    if (!remaining.length) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  }
}
