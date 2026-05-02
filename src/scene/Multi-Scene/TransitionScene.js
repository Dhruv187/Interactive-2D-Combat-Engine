import { ContextHandler } from "../../engine/contextHandler.js";
import { gameState } from "../../states/gameState.js";
import { getStageClass } from "../stageSelection.js";
import { playSound, stopSound } from "../../engine/soundHandler.js";
import { setCurrentScene } from "../../mobileControls.js";
import { MultiBattleScene } from "./MultiBattleScene.js";
import { socket } from "../../engine/socket.js";

export class TransitionScene {
  image = document.getElementById("versusScene");
  image1 = document.getElementById("hud");
  music = document.getElementById("versus-screen");

  frames = new Map([
    ["background", [0, 0, 385, 225]],
    ["Ryu-image", [386, 140, 129, 126]],
    ["Ken-image", [385, 266, 130, 129]],
    ["Ryu-tag", [387, 35, 126, 17]],
    ["Ken-tag", [388, 69, 124, 18]],
  ]);

  frames_2 = new Map([
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

    // Start fading in from black
    this.contextHandler.brightness = 0;
    this.contextHandler.startGlowUp();

    this.setupEventListeners();
    this.setupSocketListeners();
    setCurrentScene(this);
  }

  // ─── Socket listeners ────────────────────────────────────────────────────────

  setupSocketListeners() {
    if (gameState.mode === "multi" && gameState.playerId === 0) {
      // HOST path
      // HostScene already registered a bothJoined listener and sets
      // gameState._bothJoinedReceived = true when the event arrives.
      // Check if it already fired while we were fading in.
      if (gameState._bothJoinedReceived) {
        console.log(
          "[TRANSITION] ⚡ Host: bothJoined already received, starting battle immediately.",
        );
        // Small delay so the fade-in animation looks nice
        setTimeout(() => this.startTransition(), 300);
      } else {
        console.log(
          "[TRANSITION] 🔁 Host is waiting for joiner (bothJoined)...",
        );
        // Re-attach a fresh listener in case the HostScene one fired before
        // TransitionScene was mounted (belt-and-suspenders).
        this.onBothJoined = ({ roomId, mapping, selectedStage }) => {
          console.log(
            "[TRANSITION] ✅ bothJoined received on host side",
            mapping,
          );
          if (selectedStage) gameState.selectedStage = selectedStage;
          gameState._bothJoinedReceived = true;
          this.startTransition();
        };
        socket.on("bothJoined", this.onBothJoined);
      }
    } else if (gameState.mode === "multi" && gameState.playerId === 1) {
      // JOINER path: bothJoined already handled in JoinScene—go straight to battle
      console.log("[TRANSITION] ⚡ Joiner auto-starting battle...");
      setTimeout(() => this.startTransition(), 500);
    } else {
      // Non-multiplayer (pvp / ai) — original behaviour: Enter key to proceed
      this.setupKeyListeners();
    }
  }

  cleanupSocketListeners() {
    if (this.onBothJoined) {
      socket.off("bothJoined", this.onBothJoined);
      this.onBothJoined = null;
    }
    // Reset the flag so the next multiplayer session starts clean
    gameState._bothJoinedReceived = false;
  }

  // ─── Event listeners (non-multi only) ────────────────────────────────────────

  setupEventListeners() {
    this.canvas = document.querySelector("canvas");
    // We bind these but only attach them in setupKeyListeners for non-multi
    this.clickHandler = this.handleClick.bind(this);
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  setupKeyListeners() {
    this.canvas.addEventListener("click", this.clickHandler);
    window.addEventListener("keydown", this.keyHandler);
  }

  handleClick(event) {
    if (this.isTransitioning) return;
    this.startTransition();
  }

  handleMobileInput(key, code) {
    if (this.isTransitioning) return;
    if (key === "Enter") this.startTransition();
  }

  handleKeyDown(event) {
    if (this.isTransitioning) return;
    if (event.key === "Enter" || event.key === " ") {
      this.startTransition();
    }
  }

  // ─── Transition to MultiBattleScene ──────────────────────────────────────────

  startTransition() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.contextHandler.startDimDown();

    setTimeout(() => {
      // Clean up listeners
      this.canvas.removeEventListener("click", this.clickHandler);
      window.removeEventListener("keydown", this.keyHandler);
      this.cleanupSocketListeners();

      const StageClass = getStageClass(gameState.selectedStage);
      const battleScene = new MultiBattleScene(
        this.changeScene,
        new StageClass(),
      );
      stopSound(this.music);
      this.changeScene(battleScene);
    }, 1000);
  }

  // ─── Draw helpers ─────────────────────────────────────────────────────────────

  update(time) {
    this.contextHandler.update(time);
  }

  drawText(context, text, startX, startY, spacing = 12) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      const frameKey = `score-${char}`;
      const frameData = this.frames_2.get(frameKey);
      if (!frameData) continue;
      const [sx, sy, sw, sh] = frameData;
      context.drawImage(
        this.image1,
        sx,
        sy,
        sw,
        sh,
        startX + i * spacing,
        startY,
        sw,
        sh,
      );
    }
  }

  drawFrame(context, frameKey, x, y, scaleX = 1, scaleY = 1, direction = 1) {
    const frameData = this.frames.get(frameKey);
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

  draw(context) {
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#111";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    this.drawFrame(context, "background", 0, 0);
    this.drawFrame(context, "Ryu-image", 10, 11);
    this.drawFrame(context, "Ryu-tag", 17, 140);
    this.drawFrame(context, "Ken-image", 375, 9, 1, 1, -1);
    this.drawFrame(context, "Ken-tag", 245, 140);

    // Show appropriate status text
    if (
      gameState.mode === "multi" &&
      gameState.playerId === 0 &&
      !this.isTransitioning
    ) {
      this.drawText(context, "WAITING FOR PLAYER", 100, 10);
    } else {
      this.drawText(context, "PRESS START", 130, 10);
    }

    if (this.isTransitioning) {
      context.fillStyle = `rgba(0, 0, 0, ${1 - this.contextHandler.brightness})`;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }
}
