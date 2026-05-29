import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.add
      .text(300, 280, "Connect your wallet\nto enter the arena", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#8a8a93",
        align: "center",
      })
      .setOrigin(0.5);
  }
}
