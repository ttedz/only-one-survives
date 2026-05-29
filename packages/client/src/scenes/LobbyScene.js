import Phaser from "phaser";
import { joinArena } from "../net/room.js";
import { session } from "../main.js";

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super("LobbyScene");
  }

  async create() {
    this.statusText = this.add
      .text(300, 250, "Joining arena…", {
        fontFamily: "monospace", fontSize: "18px", color: "#e7e7ea", align: "center",
      })
      .setOrigin(0.5);

    // AI-generated taunt from the GenLayer contract shows here
    this.tauntText = this.add
      .text(300, 300, "", {
        fontFamily: "monospace", fontSize: "14px", color: "#d1a86a",
        align: "center", wordWrap: { width: 480 }, fontStyle: "italic",
      })
      .setOrigin(0.5);

    this.countText = this.add
      .text(300, 360, "", { fontFamily: "monospace", fontSize: "40px", color: "#6ad19b" })
      .setOrigin(0.5);

    try {
      this.room = await joinArena({ address: session.address, name: session.name });
    } catch (e) {
      this.statusText.setText("Could not reach server.\nIs it running?");
      return;
    }

    this.room.onStateChange((state) => {
      if (state.phase === "lobby") {
        this.statusText.setText(`Waiting for players… (${state.players.size})`);
        this.countText.setText("");
      }
    });

    this.room.onMessage("countdown", ({ ms, round, taunt }) => {
      this.statusText.setText(`Next round: ${prettyRound(round)}`);
      if (taunt) this.tauntText.setText(`"${taunt}"`);
      let remaining = Math.ceil(ms / 1000);
      this.countText.setText(String(remaining));
      this.time.addEvent({
        delay: 1000, repeat: remaining - 1,
        callback: () => {
          remaining -= 1;
          this.countText.setText(remaining > 0 ? String(remaining) : "GO");
        },
      });
    });

    this.room.onMessage("round_start", (cfg) => {
      this.scene.start("ArenaScene", { room: this.room, cfg });
    });
  }
}

function prettyRound(r) {
  return (r || "floor_drops").replace(/_/g, " ");
}
