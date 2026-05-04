import { simulateKeyDown, simulateKeyUp } from "./inputHandler.js";
import { controls, Control } from "../constants/control.js";
import { gameState } from "../states/gameState.js";

const VALID_COMMANDS = new Set([
  "LIGHT_PUNCH",
  "MEDIUM_PUNCH",
  "HEAVY_PUNCH",
  "MEDIUM_KICK",
  "NEUTRAL",
]);

export class SerialInputLeft {
  constructor() {
    this.port = null;
    this.reader = null;
    this.buffer = "";
  }

  async connect() {
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: 19200 });

    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable);
    this.reader = decoder.readable.getReader();

    this.readLoop();
  }

  async readLoop() {
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      if (!value) continue;

      this.handleChunk(value);
    }
  }

  handleChunk(chunk) {
    this.buffer += chunk;

    const lines = this.buffer.split(/\r\n|\n|\r/);
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      const cmd = line.trim().toUpperCase();
      if (cmd) this.handleSerial(cmd);
    }

    if (this.buffer.length > 256) {
      this.buffer = "";
    }
  }

  getPlayerKeyboard() {
    const playerId =
      gameState.mode === "multi" && gameState.playerId !== null
        ? gameState.playerId
        : 0;

    return (controls[playerId] ?? controls[0]).keyboard;
  }

  handleSerial(cmd) {
    if (!VALID_COMMANDS.has(cmd)) return;

    const playerKeyboard = this.getPlayerKeyboard();
    console.log("[LEFT]", cmd);

    if (cmd === "LIGHT_PUNCH") {
      simulateKeyDown(null, playerKeyboard[Control.LIGHT_PUNCH]);
      setTimeout(
        () => simulateKeyUp(null, playerKeyboard[Control.LIGHT_PUNCH]),
        50,
      );
    } else if (cmd === "MEDIUM_PUNCH") {
      simulateKeyDown(null, playerKeyboard[Control.MEDIUM_PUNCH]);
      setTimeout(
        () => simulateKeyUp(null, playerKeyboard[Control.MEDIUM_PUNCH]),
        50,
      );
    } else if (cmd === "HEAVY_PUNCH") {
      simulateKeyDown(null, playerKeyboard[Control.HEAVY_PUNCH]);
      setTimeout(
        () => simulateKeyUp(null, playerKeyboard[Control.HEAVY_PUNCH]),
        50,
      );
    } else if (cmd === "MEDIUM_KICK") {
      simulateKeyDown(null, playerKeyboard[Control.MEDIUM_KICK]);
      setTimeout(
        () => simulateKeyUp(null, playerKeyboard[Control.MEDIUM_KICK]),
        50,
      );
    } else if (cmd === "NEUTRAL") {
      // No attack keys held in neutral
      simulateKeyUp(null, playerKeyboard[Control.LIGHT_PUNCH]);
      simulateKeyUp(null, playerKeyboard[Control.MEDIUM_PUNCH]);
      simulateKeyUp(null, playerKeyboard[Control.HEAVY_PUNCH]);
      simulateKeyUp(null, playerKeyboard[Control.MEDIUM_KICK]);
    }
  }
}

export const serialLeft = new SerialInputLeft();
