import { ContextHandler } from "../../engine/contextHandler.js";
import { BattleScene } from "../BattleScene.js";
import { gameState } from "../../states/gameState.js";
import { getStageClass } from "../stageSelection.js";
import { playSound, stopSound } from "../../engine/soundHandler.js";
import { setCurrentScene } from "../../mobileControls.js";
import { JoinScene } from "./JoinScene.js";
import { HostScene } from "./HostScene.js";

export class OptionScene {
  image = document.getElementById("hud");
  music = document.getElementById("versus-screen");
  frames = new Map([
    ["score-@", [17, 113, 10, 10]],
    ["score-A", [29, 113, 10, 10]],
    ["score-B", [41, 113, 10, 10]],
    ["score-C", [53, 113, 10, 10]],
    ["score-D", [65, 113, 10, 10]],
    ["score-E", [77, 113, 10, 10]],
    ["score-F", [89, 113, 10, 10]],
    ["score-G", [101, 113, 10, 10]],
    ["score-H", [113, 113, 10, 10]],
    ["score-I", [125, 113, 10, 10]],
    ["score-J", [136, 113, 10, 10]],
    ["score-K", [149, 113, 10, 10]],
    ["score-L", [161, 113, 10, 10]],
    ["score-M", [173, 113, 10, 10]],
    ["score-N", [185, 113, 10, 10]],
    ["score-O", [197, 113, 10, 10]],
    ["score-P", [17, 125, 10, 10]],
    ["score-Q", [29, 125, 10, 10]],
    ["score-R", [41, 125, 10, 10]],
    ["score-S", [53, 125, 10, 10]],
    ["score-T", [65, 125, 10, 10]],
    ["score-U", [77, 125, 10, 10]],
    ["score-V", [89, 125, 10, 10]],
    ["score-W", [101, 125, 10, 10]],
    ["score-X", [113, 125, 10, 10]],
    ["score-Y", [125, 125, 10, 10]],
    ["score-Z", [136, 125, 10, 10]],
    ["score- ", [0, 0, 10, 10]],
    ["arrow", [176, 93, 4, 4]],
    ["score-|", [167, 149, 4, 11]],
  ]);

  constructor(changeScene) {
    playSound(this.music, 0.3);

    this.changeScene = changeScene;
    this.contextHandler = new ContextHandler();
    this.isTransitioning = false;

    this.selectedOption = 0; // 0 = Host, 1 = Join
    this.optionYPositions = [100, 115]; // y-coordinates for the text

    this.contextHandler.brightness = 0;
    this.contextHandler.startGlowUp();

    this.setupEventListeners();
    setCurrentScene(this);
  }

  setupEventListeners() {
    this.canvas = document.querySelector("canvas");
    this.clickHandler = this.handleClick.bind(this);
    this.keyHandler = this.handleKeyDown.bind(this);
    this.canvas.addEventListener("click", this.clickHandler);
    window.addEventListener("keydown", this.keyHandler);
  }

  handleClick(event) {
    if (this.isTransitioning) return;
    this.startTransition();
  }

  handleMobileInput(key) {
    if (this.isTransitioning) return;

    switch (key) {
      case "ArrowUp":
        this.selectedOption = Math.max(0, this.selectedOption - 1);
        break;
      case "ArrowDown":
        this.selectedOption = Math.min(1, this.selectedOption + 1);
        break;
      case "Enter":
        this.startTransition();
        break;
    }
  }

  handleKeyDown(event) {
    if (this.isTransitioning) return;

    switch (event.key) {
      case "ArrowUp":
        this.selectedOption = Math.max(0, this.selectedOption - 1);
        break;
      case "ArrowDown":
        this.selectedOption = Math.min(1, this.selectedOption + 1);
        break;
      case "Enter":
      case " ":
        this.startTransition();
        break;
    }
  }

  startTransition() {
    this.isTransitioning = true;
    this.contextHandler.startDimDown();

    setTimeout(() => {
      this.canvas.removeEventListener("click", this.clickHandler);
      window.removeEventListener("keydown", this.keyHandler);

      stopSound(this.music);

      if (this.selectedOption === 0) {
        // Host option
        const hostScene = new HostScene(this.changeScene);
        this.changeScene(hostScene);
      } else if (this.selectedOption === 1) {
        // Join option → Go to JoinScene
        const joinScene = new JoinScene(this.changeScene);
        this.changeScene(joinScene);
      }
    }, 1000);
  }

  update(time) {
    this.contextHandler.update(time);
  }

  drawFrame(context, frameKey, x, y, scaleX = 1, scaleY = 1, direction = 1) {
    const frameData = this.frames.get(frameKey);
    if (!frameData) return;

    const [sourceX, sourceY, sourceWidth, sourceHeight] = frameData;

    context.scale(direction, 1);
    context.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x * direction,
      y,
      sourceWidth * scaleX,
      sourceHeight * scaleY,
    );
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawTitle(context, label, x, y = 1, scaleX = 1, scaleY = 1) {
    const safeLabel = label.toUpperCase();
    for (const index in safeLabel) {
      const char = safeLabel.charAt(index);
      const frameKey = `score-${char}`;
      this.drawFrame(
        context,
        frameKey,
        x + index * (12 * scaleX),
        y,
        scaleX,
        scaleY,
      );
    }
  }

  drawArrow(context) {
    const arrowX = 143; // arrow position
    const arrowY = this.optionYPositions[this.selectedOption];
    this.drawFrame(context, "arrow", arrowX, arrowY, 1, 1);
  }

  draw(context) {
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#111";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    this.drawTitle(context, "HOST ROOM", 150, 100, 1, 1);
    this.drawTitle(context, "JOIN ROOM", 150, 115, 1, 1);

    this.drawArrow(context);

    if (this.isTransitioning) {
      context.fillStyle = `rgba(0, 0, 0, ${
        1 - this.contextHandler.brightness
      })`;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }
}
