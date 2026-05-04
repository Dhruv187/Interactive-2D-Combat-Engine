import { simulateKeyDown, simulateKeyUp } from "./inputHandler.js";
import { controls, Control } from "../constants/control.js";
import { gameState } from "../states/gameState.js";

const VALID_COMMANDS = new Set(["FORWARD", "BACKWARD", "NEUTRAL"]);

export class SerialInputRight {
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
    console.log("[RIGHT]", cmd);

    if (cmd === "FORWARD") {
      simulateKeyDown(null, playerKeyboard[Control.RIGHT]);
      simulateKeyUp(null, playerKeyboard[Control.LEFT]);
    } else if (cmd === "BACKWARD") {
      simulateKeyDown(null, playerKeyboard[Control.LEFT]);
      simulateKeyUp(null, playerKeyboard[Control.RIGHT]);
    } else if (cmd === "NEUTRAL") {
      simulateKeyUp(null, playerKeyboard[Control.RIGHT]);
      simulateKeyUp(null, playerKeyboard[Control.LEFT]);
    }
  }
}

export const serialRight = new SerialInputRight();
