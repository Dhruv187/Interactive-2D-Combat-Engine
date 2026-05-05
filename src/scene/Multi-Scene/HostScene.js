import { ContextHandler } from "../../engine/contextHandler.js";
import { gameState } from "../../states/gameState.js";
import { playSound, stopSound } from "../../engine/soundHandler.js";
import { setCurrentScene } from "../../mobileControls.js";
import { TransitionScene } from "./TransitionScene.js";
import { connectSocket, socket } from "../../engine/socket.js";

export class HostScene {
  image = document.getElementById("roomScene");
  kenStageImg = document.getElementById("kenStagePre");
  ryuStageImg = document.getElementById("ryuStagePre");
  sagatStageImg = document.getElementById("sagatStagePre");
  vegasStageImg = document.getElementById("vegasStagePre");
  music = document.getElementById("versus-screen");
  frames = new Map([["background", [1536, 1024, 0, 0]]]);

  constructor(changeScene) {
    playSound(this.music, 0.3);
    this.changeScene = changeScene;
    this.contextHandler = new ContextHandler();
    this.isTransitioning = false;
    this.contextHandler.brightness = 0;
    this.contextHandler.startGlowUp();

    this.setupEventListeners();
    this.createUI();
    this.setupSocketListeners();
    setCurrentScene(this);
  }

  setupSocketListeners() {
    connectSocket();

    this.onRoomCreated = ({ roomId, playerId }) => {
      console.log(`[HOST] Room created: ${roomId}, I am player ${playerId}`);
      gameState.roomId = String(roomId);
      gameState.playerId = playerId;
      gameState.mode = "multi";

      this.onBothJoined = ({ mapping, selectedStage }) => {
        console.log("[HOST] bothJoined received in HostScene", mapping);
        if (selectedStage) gameState.selectedStage = selectedStage;
        gameState._bothJoinedReceived = true;
      };
      socket.on("bothJoined", this.onBothJoined);

      this.doTransition();
    };

    this.onErrMessage = (msg) => {
      console.warn("[HOST] Server error:", msg);
      this.showError(msg);
      this.submitBtn.disabled = false;
      this.submitBtn.innerText = "Generate";
    };

    socket.on("roomCreated", this.onRoomCreated);
    socket.on("errMessage", this.onErrMessage);
  }

  cleanupSocketListeners() {
    socket.off("roomCreated", this.onRoomCreated);
    socket.off("errMessage", this.onErrMessage);
    if (this.onBothJoined) socket.off("bothJoined", this.onBothJoined);
  }

  setupEventListeners() {
    this.canvas = document.querySelector("canvas");
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "0";

    this.clickHandler = this.handleClick.bind(this);
    this.keyHandler = this.handleKeyDown.bind(this);
    this.canvas.addEventListener("click", this.clickHandler);
    window.addEventListener("keydown", this.keyHandler);
  }

  createUI() {
    const screen = document.querySelector(".screen");
    screen.style.position = "relative";

    this.uiContainer = document.createElement("div");
    Object.assign(this.uiContainer.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      pointerEvents: "auto",
      textAlign: "center",
      zIndex: "10",
    });

    this.formPanel = document.createElement("div");
    Object.assign(this.formPanel.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontFamily: '"Pixelify Sans", Georgia, serif',
    });

    this.title = document.createElement("h1");
    this.title.innerText = "HOST";
    Object.assign(this.title.style, {
      fontSize: "clamp(40px, 8vw, 80px)",
      fontWeight: "bold",
      textShadow: "3px 3px 0 gold",
      marginBottom: "30px",
      color: "gold",
      fontFamily: '"Pixelify Sans", Georgia, serif',
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      filter: "drop-shadow(0 0 10px #FF4500)",
    });

    this.roomLabel = document.createElement("div");
    this.roomLabel.innerText = "ROOM ID";
    Object.assign(this.roomLabel.style, {
      color: "#fff",
      textShadow: "2px 2px 0 #000",
      lineHeight: "1",
    });

    this.input = document.createElement("input");
    Object.assign(this.input.style, {
      textAlign: "center",
      border: "3px solid #FFD700",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: "6px",
      outline: "none",
      boxShadow: "0 0 10px #FF4500 inset",
      maxWidth: "92%",
    });
    this.input.placeholder = "Enter Room ID (numbers only)";
    this.input.type = "number";
    setTimeout(() => this.input.focus(), 50);
    this.input.addEventListener("keydown", (e) => e.stopPropagation());

    this.errorDiv = document.createElement("div");
    Object.assign(this.errorDiv.style, {
      color: "#FF4444",
      minHeight: "1em",
      textShadow: "1px 1px 0 #000",
      maxWidth: "92%",
      lineHeight: "1.1",
    });

    this.stageLabel = document.createElement("div");
    this.stageLabel.innerText = "SELECT STAGE";
    Object.assign(this.stageLabel.style, {
      color: "#fff",
      textShadow: "2px 2px 0 #000",
      lineHeight: "1",
    });

    this.stageContainer = document.createElement("div");
    Object.assign(this.stageContainer.style, {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      justifyContent: "center",
      alignItems: "center",
      maxWidth: "94%",
    });

    this.stageCards = [];
    const stages = [
      { id: "ken", img: this.kenStageImg },
      { id: "ryu", img: this.ryuStageImg },
      { id: "sagat", img: this.sagatStageImg },
      { id: "vegas", img: this.vegasStageImg },
    ];

    stages.forEach((stage) => {
      const stageDiv = document.createElement("div");
      Object.assign(stageDiv.style, {
        border: "3px solid #444",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        background: "#111",
      });

      const img = stage.img.cloneNode(true);
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
      });

      stageDiv.appendChild(img);
      this.stageContainer.appendChild(stageDiv);
      this.stageCards.push({ id: stage.id, element: stageDiv });

      stageDiv.addEventListener("click", () => {
        gameState.selectedStage = stage.id;
        this.updateSelectedStage();
      });
    });

    this.submitBtn = document.createElement("button");
    this.submitBtn.innerText = "Generate";
    Object.assign(this.submitBtn.style, {
      background: "linear-gradient(180deg, #FF4500, #B22222)",
      color: "white",
      border: "2px solid #FFD700",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      textShadow: "1px 1px 0 black",
      fontFamily: '"Pixelify Sans", Georgia, serif',
      marginBottom: "50px",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });
    this.submitBtn.onclick = () => this.handleGenerate();

    this.formPanel.append(
      this.title,
      this.roomLabel,
      this.input,
      this.errorDiv,
      this.stageLabel,
      this.stageContainer,
      this.submitBtn,
    );

    this.uiContainer.append(this.formPanel);
    screen.appendChild(this.uiContainer);

    gameState.selectedStage = gameState.selectedStage || "ken";
    this.updateSelectedStage();
    this.applyResponsiveLayout();

    this.resizeHandler = this.applyResponsiveLayout.bind(this);
    window.addEventListener("resize", this.resizeHandler);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  applyResponsiveLayout() {
    if (!this.uiContainer) return;

    const screen = document.querySelector(".screen");
    const { width, height } = screen.getBoundingClientRect();
    const compact = width < 420 || height < 260;
    const gap = this.clamp(height * (compact ? 0.016 : 0.022), 3, 14);
    const titleSize = this.clamp(
      Math.min(
        width * (compact ? 0.11 : 0.16),
        height * (compact ? 0.11 : 0.2),
      ),
      compact ? 18 : 30,
      compact ? 34 : 82,
    );
    const labelSize = this.clamp(
      Math.min(width * 0.055, height * 0.085),
      14,
      28,
    );
    const inputHeight = this.clamp(height * 0.11, 24, 44);
    const inputWidth = this.clamp(width * 0.68, 170, 360);
    const stageGap = this.clamp(width * 0.018, 4, 14);
    const stageWidth = this.clamp(
      (Math.min(width * 0.92, 560) - stageGap * 3) / 4,
      48,
      124,
    );
    const stageHeight = this.clamp(stageWidth * 0.58, 28, 72);
    const buttonFontSize = this.clamp(
      Math.min(width * 0.05, height * 0.08),
      12,
      20,
    );
    const buttonWidth = this.clamp(
      compact ? width * 0.42 : width * 0.34,
      118,
      210,
    );
    const buttonHeight = this.clamp(height * (compact ? 0.13 : 0.1), 30, 48);

    Object.assign(this.uiContainer.style, {
      padding: `${this.clamp(height * 0.035, 6, 28)}px ${this.clamp(
        width * 0.04,
        8,
        34,
      )}px`,
    });

    this.formPanel.style.gap = `${gap}px`;
    this.formPanel.style.justifyContent = compact ? "flex-start" : "center";
    this.title.style.fontSize = `${titleSize}px`;
    this.title.style.padding = compact ? "3px 10px" : "0";
    this.title.style.marginBottom = compact ? "1px" : "0";
    this.title.style.border = compact
      ? "2px solid rgba(255, 210, 63, 0.9)"
      : "none";
    this.title.style.borderRadius = compact ? "999px" : "0";
    this.title.style.backgroundColor = compact
      ? "rgba(9, 24, 23, 0.88)"
      : "transparent";
    this.title.style.boxShadow = compact
      ? "0 0 0 2px rgba(58, 23, 0, 0.45)"
      : "none";
    this.roomLabel.style.fontSize = `${labelSize}px`;
    this.stageLabel.style.fontSize = `${labelSize}px`;
    this.errorDiv.style.fontSize = `${this.clamp(labelSize * 0.7, 10, 16)}px`;

    Object.assign(this.input.style, {
      width: `${inputWidth}px`,
      height: `${inputHeight}px`,
      fontSize: `${this.clamp(buttonFontSize * 0.9, 12, 18)}px`,
    });

    Object.assign(this.stageContainer.style, {
      gap: `${stageGap}px`,
      width: `${stageWidth * 4 + stageGap * 3}px`,
    });

    for (const { element } of this.stageCards) {
      Object.assign(element.style, {
        width: `${stageWidth}px`,
        height: `${stageHeight}px`,
        borderWidth: width < 420 ? "2px" : "3px",
      });
    }

    Object.assign(this.submitBtn.style, {
      width: `${buttonWidth}px`,
      minWidth: `${buttonWidth}px`,
      height: `${buttonHeight}px`,
      padding: "0 16px",
      fontSize: `${buttonFontSize}px`,
      alignSelf: "center",
    });
  }

  updateSelectedStage() {
    const selectedStage = gameState.selectedStage || "ken";

    for (const { id, element } of this.stageCards) {
      const isSelected = id === selectedStage;
      element.style.borderColor = isSelected ? "#FFD700" : "#444";
      element.style.boxShadow = isSelected
        ? "0 0 0 2px rgba(255, 69, 0, 0.75)"
        : "none";
    }
  }

  showError(msg) {
    this.errorDiv.innerText = "Warning: " + msg;
  }

  clearError() {
    this.errorDiv.innerText = "";
  }

  handleClick(event) {
    // Canvas click intentionally does nothing in the host scene.
  }

  handleMobileInput(key, code) {
    if (this.isTransitioning) return;
    if (key === "Enter") this.handleGenerate();
  }

  handleKeyDown(event) {
    if (document.activeElement === this.input) return;
    if (this.isTransitioning) return;
    if (event.key === "Enter") this.handleGenerate();
  }

  handleGenerate() {
    if (this.isTransitioning) return;

    const roomId = this.input.value.trim();
    if (!roomId) {
      this.showError("Please enter a Room ID first!");
      return;
    }

    if (!gameState.selectedStage) {
      gameState.selectedStage = "ken";
    }

    this.clearError();
    this.submitBtn.disabled = true;
    this.submitBtn.innerText = "Creating...";

    console.log(
      `[HOST] Emitting createRoom with ID: ${roomId}, stage: ${gameState.selectedStage}`,
    );
    socket.emit("createRoom", {
      roomId,
      selectedStage: gameState.selectedStage,
    });
  }

  doTransition() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.contextHandler.startDimDown();

    if (this.uiContainer) this.uiContainer.remove();
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    this.canvas.style.pointerEvents = "auto";

    setTimeout(() => {
      this.canvas.removeEventListener("click", this.clickHandler);
      window.removeEventListener("keydown", this.keyHandler);
      this.cleanupSocketListeners();
      stopSound(this.music);
      this.changeScene(new TransitionScene(this.changeScene));
    }, 1000);
  }

  update(time) {
    this.contextHandler.update(time);
  }

  draw(context) {
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#111";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.drawImage(
      this.image,
      0,
      0,
      1536,
      1024,
      0,
      0,
      context.canvas.width,
      context.canvas.height,
    );

    if (this.isTransitioning) {
      context.fillStyle = `rgba(0, 0, 0, ${1 - this.contextHandler.brightness})`;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }
}
