// src/ai.js
import { FighterState } from "../constants/fighter.js";
import { getAcutalBoxDimensions } from "../utils/collision.js";

export class SimpleAI {
  constructor(fighter, opponent) {
    this.fighter = fighter;
    this.opponent = opponent;
    this.combo1 = [
      FighterState.LIGHT_PUNCH,
      FighterState.MEDIUM_PUNCH,
      FighterState.HEAVY_KICK,
    ];
    this.combo2 = [
      FighterState.HEAVY_PUNCH,
      FighterState.LIGHT_KICK,
      FighterState.MEDIUM_KICK,
    ];
    this.isAttacking = false;
    this.cooldown = false;
    this.cooldownTime = 1500; // 1.5 seconds
  }

  update() {
    if (!this.fighter || !this.opponent) return;

    const aiBox = getAcutalBoxDimensions(
      this.fighter.position,
      this.fighter.direction,
      this.fighter.boxes.push
    );
    const oppBox = getAcutalBoxDimensions(
      this.opponent.position,
      this.opponent.direction,
      this.opponent.boxes.push
    );

    const touching =
      aiBox.x <= oppBox.x + oppBox.width &&
      aiBox.x + aiBox.width >= oppBox.x &&
      aiBox.y <= oppBox.y + oppBox.height &&
      aiBox.y + aiBox.height >= oppBox.y;

    if (touching && !this.isAttacking && !this.cooldown) {
      // Switch to idle to stop pushing
      this.fighter.changeState(FighterState.IDLE);
      this.startCombo();
    } else if (!touching && !this.isAttacking && !this.cooldown) {
      // Keep your walking logic exactly as is
      this.moveForward();
    }
  }

  async startCombo() {
    this.isAttacking = true;

    const combo = Math.random() > 0.5 ? this.combo1 : this.combo2;

    for (const move of combo) {
      this.fighter.changeState(move);
      await this.waitUntilIdle();
    }

    this.isAttacking = false;
    this.startCooldown();
  }

  waitUntilIdle() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.fighter.CurrentState === FighterState.IDLE) resolve();
        else requestAnimationFrame(check);
      };
      check();
    });
  }

  startCooldown() {
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, this.cooldownTime);
  }

  moveForward() {
    if (this.fighter.CurrentState !== FighterState.WALK_FORWARDS) {
      this.fighter.changeState(FighterState.WALK_FORWARDS);
    }
  }

  idle() {
    if (this.fighter.CurrentState !== FighterState.IDLE) {
      this.fighter.changeState(FighterState.IDLE);
    }
  }
}
