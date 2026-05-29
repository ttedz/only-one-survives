import Phaser from "phaser";
import { FloorDropsRenderer } from "../rounds/FloorDrops.js";

const PADDING = 40;

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super("ArenaScene");
  }

  init(data) {
    this.room = data.room;
    this.cfg = data.cfg; // { cols, rows }
  }

  create() {
    const { cols, rows } = this.cfg;
    this.cell = Math.floor((600 - PADDING * 2) / Math.max(cols, rows));

    this.renderer = new FloorDropsRenderer(this, cols, rows, this.cell, PADDING);
    this.renderer.drawGrid();

    this.sprites = new Map(); // sessionId -> rectangle

    // server tells us which tiles fell
    this.room.onMessage("tiles_removed", ({ tiles }) => {
      tiles.forEach(([c, r]) => this.renderer.removeTile(c, r));
    });

    this.room.onMessage("eliminated", ({ sessionId }) => {
      const s = this.sprites.get(sessionId);
      if (s) s.setFillStyle(0x44444c);
    });

    this.room.onMessage("match_over", (result) => {
      this.scene.start("ResultScene", { room: this.room, result });
    });

    // keyboard input -> grid moves, throttled to the server tick
    this.cursors = this.input.keyboard.createCursorKeys();
    this.myX = 0;
    this.myY = 0;
    this.lastSent = 0;
  }

  update(time) {
    // sync sprite positions from server state every frame
    this.room.state.players.forEach((p, sid) => {
      let rect = this.sprites.get(sid);
      if (!rect) {
        const isMe = sid === this.room.sessionId;
        rect = this.add.rectangle(0, 0, this.cell * 0.6, this.cell * 0.6, isMe ? 0x6ad19b : 0xd16a9b);
        this.sprites.set(sid, rect);
      }
      const px = PADDING + p.x * this.cell + this.cell / 2;
      const py = PADDING + p.y * this.cell + this.cell / 2;
      rect.setPosition(px, py);
      rect.setAlpha(p.alive ? 1 : 0.35);
      if (sid === this.room.sessionId) {
        this.myX = p.x;
        this.myY = p.y;
      }
    });

    // movement: step one cell on key press, send to server ~20/s
    if (time - this.lastSent > 50) {
      let nx = this.myX;
      let ny = this.myY;
      if (this.cursors.left.isDown) nx -= 1;
      else if (this.cursors.right.isDown) nx += 1;
      else if (this.cursors.up.isDown) ny -= 1;
      else if (this.cursors.down.isDown) ny += 1;

      if (nx !== this.myX || ny !== this.myY) {
        this.room.send("input", { x: nx, y: ny });
        this.lastSent = time;
      }
    }
  }
}
