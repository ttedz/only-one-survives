import Phaser from "phaser";

/**
 * Pure rendering for the Floor Drops round. All authority lives on the server;
 * this class only draws what the server reports (tile removals).
 */
export class FloorDropsRenderer {
  constructor(scene, cols, rows, cell, padding) {
    this.scene = scene;
    this.cols = cols;
    this.rows = rows;
    this.cell = cell;
    this.padding = padding;
    this.tiles = new Map(); // "c,r" -> rectangle
  }

  drawGrid() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const x = this.padding + c * this.cell + this.cell / 2;
        const y = this.padding + r * this.cell + this.cell / 2;
        const tile = this.scene.add
          .rectangle(x, y, this.cell - 3, this.cell - 3, 0x1b1b22)
          .setStrokeStyle(1, 0x2c2c36);
        this.tiles.set(`${c},${r}`, tile);
      }
    }
  }

  removeTile(c, r) {
    const tile = this.tiles.get(`${c},${r}`);
    if (!tile) return;
    // warn flash, then drop
    this.scene.tweens.add({
      targets: tile,
      alpha: 0,
      duration: 220,
      onComplete: () => tile.destroy(),
    });
  }
}
