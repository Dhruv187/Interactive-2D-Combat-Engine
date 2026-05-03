import { simulateKeyDown, simulateKeyUp } from "./inputHandler.js";
import { controls, Control } from "../constants/control.js";

export class SerialInputRight {
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
    console.log("[RIGHT]", cmd);

    if (cmd === "FORWARD") {
      simulateKeyDown(null, P0[Control.RIGHT]);
      simulateKeyUp(null, P0[Control.LEFT]);
    } else if (cmd === "BACKWARD") {
      simulateKeyDown(null, P0[Control.LEFT]);
      simulateKeyUp(null, P0[Control.RIGHT]);
    } else if (cmd === "NEUTRAL") {
      simulateKeyUp(null, P0[Control.RIGHT]);
      simulateKeyUp(null, P0[Control.LEFT]);
    }
  }
}

export const serialRight = new SerialInputRight();
