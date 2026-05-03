import { simulateKeyDown, simulateKeyUp } from "./inputHandler.js";
import { controls, Control } from "../constants/control.js";

export class SerialInputLeft {
  constructor() {
    this.port = null;
    this.reader = null;
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

      this.handleSerial(value.trim());
    }
  }

  handleSerial(cmd) {
    const P0 = controls[0].keyboard;
    console.log("[LEFT]", cmd);

    if (cmd === "LIGHT_PUNCH") {
      simulateKeyDown(null, P0[Control.LIGHT_PUNCH]);
      setTimeout(() => simulateKeyUp(null, P0[Control.LIGHT_PUNCH]), 50);
    } else if (cmd === "MEDIUM_PUNCH") {
      simulateKeyDown(null, P0[Control.MEDIUM_PUNCH]);
      setTimeout(() => simulateKeyUp(null, P0[Control.MEDIUM_PUNCH]), 50);
    } else if (cmd === "HEAVY_PUNCH") {
      simulateKeyDown(null, P0[Control.HEAVY_PUNCH]);
      setTimeout(() => simulateKeyUp(null, P0[Control.HEAVY_PUNCH]), 50);
    } else if (cmd === "MEDIUM_KICK") {
      simulateKeyDown(null, P0[Control.MEDIUM_KICK]);
      setTimeout(() => simulateKeyUp(null, P0[Control.MEDIUM_KICK]), 50);
    } else if (cmd === "NEUTRAL") {
      // No attack keys held in neutral
      simulateKeyUp(null, P0[Control.LIGHT_PUNCH]);
      simulateKeyUp(null, P0[Control.MEDIUM_PUNCH]);
      simulateKeyUp(null, P0[Control.HEAVY_PUNCH]);
      simulateKeyUp(null, P0[Control.MEDIUM_KICK]);
    }
  }
}

export const serialLeft = new SerialInputLeft();
