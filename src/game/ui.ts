// ============================================================
// UI - HUD, Menus, Dialogue, Inventory rendering
// ============================================================
import {
  INTERNAL_W, INTERNAL_H, PALETTE,
  Quest
} from './constants';
import { SpriteSheet } from './sprites';
import { Inventory, SHOP_ITEMS, ITEMS } from './systems';

export class UI {
  // Dialogue state
  dialogueActive: boolean = false;
  dialogueText: string = '';
  dialogueName: string = '';
  dialogueCharIndex: number = 0;
  dialogueTimer: number = 0;
  dialogueSpeed: number = 2; // chars per tick
  dialogueLines: string[] = [];
  dialogueLineIndex: number = 0;
  dialogueCallback: (() => void) | null = null;
  dialogueChoices: string[] | null = null;
  dialogueChoiceIndex: number = 0;
  lastChoice: string = '';

  // Menu state
  menuItems: string[] = [];
  menuIndex: number = 0;
  menuTitle: string = '';

  // Inventory UI
  inventoryOpen: boolean = false;
  inventoryCursor: number = 0;
  inventoryTooltip: string = '';

  // Shop UI
  shopOpen: boolean = false;
  shopCursor: number = 0;
  shopMessage: string = '';

  // Notification
  notification: string = '';
  notificationTimer: number = 0;

  // Transition
  transitionAlpha: number = 0;
  transitionTarget: number = 0; // 0 = clear, 1 = black
  transitionCallback: (() => void) | null = null;

  // Title screen particles
  titleParticles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  constructor() {
    // Init title particles
    for (let i = 0; i < 30; i++) {
      this.titleParticles.push({
        x: Math.random() * INTERNAL_W,
        y: Math.random() * INTERNAL_H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        life: Math.random() * 100 + 50,
        color: [PALETTE.blue, PALETTE.indigo, PALETTE.darkPurple, PALETTE.darkBlue][Math.floor(Math.random() * 4)],
      });
    }
  }

  // ---- DIALOGUE ----
  startDialogue(name: string, lines: string[], callback?: () => void, choices?: string[]): void {
    this.dialogueActive = true;
    this.dialogueName = name;
    this.dialogueLines = lines;
    this.dialogueLineIndex = 0;
    this.dialogueText = lines[0];
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;
    this.dialogueCallback = callback || null;
    this.dialogueChoices = choices || null;
    this.dialogueChoiceIndex = 0;
  }

  updateDialogue(advancePressed: boolean, upPressed: boolean, downPressed: boolean): boolean {
    if (!this.dialogueActive) return false;

    this.dialogueTimer++;

    // Typewriter effect
    if (this.dialogueCharIndex < this.dialogueText.length) {
      this.dialogueCharIndex += this.dialogueSpeed;
      if (this.dialogueCharIndex >= this.dialogueText.length) {
        this.dialogueCharIndex = this.dialogueText.length;
      }
      // Skip on press
      if (advancePressed) {
        this.dialogueCharIndex = this.dialogueText.length;
        return true;
      }
    } else {
      // Text fully displayed
      if (this.dialogueChoices && this.dialogueCharIndex >= this.dialogueText.length) {
        // Choice selection
        if (upPressed) {
          this.dialogueChoiceIndex = Math.max(0, this.dialogueChoiceIndex - 1);
        }
        if (downPressed) {
          this.dialogueChoiceIndex = Math.min(this.dialogueChoices.length - 1, this.dialogueChoiceIndex + 1);
        }
        if (advancePressed) {
          this.lastChoice = this.dialogueChoices[this.dialogueChoiceIndex];
          this.dialogueActive = false;
          this.dialogueChoices = null;
          if (this.dialogueCallback) this.dialogueCallback();
          return true;
        }
      } else if (advancePressed) {
        // Advance to next line
        this.dialogueLineIndex++;
        if (this.dialogueLineIndex >= this.dialogueLines.length) {
          this.dialogueActive = false;
          if (this.dialogueCallback) this.dialogueCallback();
        } else {
          this.dialogueText = this.dialogueLines[this.dialogueLineIndex];
          this.dialogueCharIndex = 0;
        }
        return true;
      }
    }
    return true; // Consumed input
  }

  // ---- NOTIFICATIONS ----
  showNotification(text: string, duration: number = 120): void {
    this.notification = text;
    this.notificationTimer = duration;
  }

  // ---- TRANSITIONS ----
  startTransition(callback: () => void): void {
    this.transitionTarget = 1;
    this.transitionCallback = callback;
  }

  updateTransition(): boolean {
    if (this.transitionTarget === 1) {
      this.transitionAlpha += 0.05;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        if (this.transitionCallback) {
          this.transitionCallback();
          this.transitionCallback = null;
        }
        this.transitionTarget = 0;
      }
    } else if (this.transitionAlpha > 0) {
      this.transitionAlpha -= 0.05;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        return false; // Transition complete
      }
    }
    return this.transitionAlpha > 0;
  }

  // ---- DRAWING ----
  drawHUD(ctx: CanvasRenderingContext2D, sprites: Map<string, SpriteSheet>,
    hp: number, maxHp: number, coins: number, quest: Quest | null,
    equippedWeapon: string, bossHp: number, bossMaxHp: number): void {

    // Hearts (top left)
    const heartSize = 8;
    const heartsPerRow = 6;
    for (let i = 0; i < maxHp; i++) {
      const row = Math.floor(i / heartsPerRow);
      const col = i % heartsPerRow;
      const hx = 4 + col * (heartSize + 1);
      const hy = 4 + row * (heartSize + 1);

      // Background (empty heart)
      ctx.fillStyle = PALETTE.darkGray;
      this.drawHeart(ctx, hx, hy, heartSize);

      // Filled portion
      if (i < hp) {
        ctx.fillStyle = PALETTE.red;
        this.drawHeart(ctx, hx, hy, heartSize);
      } else if (i === hp && hp % 1 !== 0) {
        // Half heart
        ctx.fillStyle = PALETTE.red;
        ctx.save();
        ctx.beginPath();
        ctx.rect(hx, hy, heartSize / 2, heartSize);
        ctx.clip();
        this.drawHeart(ctx, hx, hy, heartSize);
        ctx.restore();
      }
    }

    // Quest objective (top right)
    if (quest) {
      const obj = quest.objectives.find(o => o.current < o.max) || quest.objectives[quest.objectives.length - 1];
      if (obj) {
        const text = `${this.objTypeLabel(obj.type)}: ${obj.current}/${obj.max}`;
        ctx.fillStyle = PALETTE.white;
        ctx.font = '8px monospace';
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, INTERNAL_W - tw - 4, 10);
      }
    }

    // Coins (bottom right)
    const coinSprite = sprites.get('icon_coin');
    if (coinSprite) {
      ctx.drawImage(coinSprite.frames[0], INTERNAL_W - 40, INTERNAL_H - 12);
    }
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '8px monospace';
    ctx.fillText(`${coins}`, INTERNAL_W - 28, INTERNAL_H - 4);

    // Equipped weapon (bottom left)
    const weaponSprite = sprites.get(equippedWeapon === 'sword_2' ? 'icon_sword2' : 'icon_sword');
    if (weaponSprite) {
      ctx.drawImage(weaponSprite.frames[0], 4, INTERNAL_H - 12);
    }

    // Boss HP bar
    if (bossMaxHp > 0 && bossHp > 0) {
      const barW = 120;
      const barH = 6;
      const barX = (INTERNAL_W - barW) / 2;
      const barY = INTERNAL_H - 16;

      ctx.fillStyle = PALETTE.darkGray;
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = PALETTE.darkPurple;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(barX, barY, Math.floor((bossHp / bossMaxHp) * barW), barH);

      ctx.fillStyle = PALETTE.white;
      ctx.font = '6px monospace';
      const bossText = 'RUINS GUARDIAN';
      const btw = ctx.measureText(bossText).width;
      ctx.fillText(bossText, barX + (barW - btw) / 2, barY - 2);
    }

    // Menu button (top-right corner)
    this.drawMenuButton(ctx);
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const s = size / 8;
    ctx.fillRect(x + 1 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x, y + 1 * s, 8 * s, 1 * s);
    ctx.fillRect(x, y + 2 * s, 8 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 5 * s, 2 * s, 1 * s);
  }

  private objTypeLabel(type: string): string {
    switch (type) {
      case 'kill': return 'Defeat';
      case 'collect': return 'Find';
      case 'talk': return 'Talk to';
      case 'reach': return 'Reach';
      default: return type;
    }
  }

  drawDialogue(ctx: CanvasRenderingContext2D): void {
    if (!this.dialogueActive) return;

    // Dialogue box - larger and more visible
    const boxH = 56;
    const boxY = INTERNAL_H - boxH - 4;
    const boxX = 8;
    const boxW = INTERNAL_W - 16;

    // Background with border
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // Name tag - more prominent
    if (this.dialogueName) {
      const nameW = ctx.measureText(this.dialogueName).width + 16;
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(boxX + 3, boxY - 12, nameW + 2, 14);
      ctx.fillStyle = PALETTE.darkPurple;
      ctx.fillRect(boxX + 4, boxY - 11, nameW, 12);
      ctx.fillStyle = PALETTE.yellow;
      ctx.font = '8px monospace';
      ctx.fillText(this.dialogueName, boxX + 12, boxY - 2);
    }

    // Text with typewriter
    const displayText = this.dialogueText.substring(0, Math.floor(this.dialogueCharIndex));
    ctx.fillStyle = PALETTE.white;
    ctx.font = '8px monospace';

    // Word wrap
    const maxW = boxW - 20;
    const words = displayText.split(' ');
    let line = '';
    let lineY = boxY + 16;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxW) {
        ctx.fillText(line, boxX + 10, lineY);
        line = word;
        lineY += 11;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, boxX + 10, lineY);

    // Advance indicator
    if (this.dialogueCharIndex >= this.dialogueText.length) {
      const blink = Math.floor(Date.now() / 300) % 2;
      if (blink) {
        ctx.fillStyle = PALETTE.yellow;
        ctx.font = '10px monospace';
        ctx.fillText('▼', boxX + boxW - 14, boxY + boxH - 6);
      }
    }

    // Choices
    if (this.dialogueChoices) {
      const choiceX = boxX + boxW - 100;
      const choiceY = boxY - 12 - this.dialogueChoices.length * 13;
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(choiceX - 5, choiceY - 3, 105, this.dialogueChoices.length * 13 + 6);
      ctx.fillStyle = PALETTE.darkBlue;
      ctx.fillRect(choiceX - 4, choiceY - 2, 103, this.dialogueChoices.length * 13 + 4);
      for (let i = 0; i < this.dialogueChoices.length; i++) {
        ctx.fillStyle = i === this.dialogueChoiceIndex ? PALETTE.yellow : PALETTE.white;
        ctx.font = '8px monospace';
        const prefix = i === this.dialogueChoiceIndex ? '▶ ' : '  ';
        ctx.fillText(prefix + this.dialogueChoices[i], choiceX, choiceY + 9 + i * 13);
      }
    }
  }

  drawInventory(ctx: CanvasRenderingContext2D, inventory: Inventory, sprites: Map<string, SpriteSheet>): void {
    if (!this.inventoryOpen) return;

    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    // Inventory panel
    const panelW = 200;
    const panelH = 140;
    const panelX = (INTERNAL_W - panelW) / 2;
    const panelY = (INTERNAL_H - panelH) / 2;

    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = PALETTE.white;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '8px monospace';
    ctx.fillText('INVENTORY', panelX + 4, panelY + 10);

    // Slots (4x4 grid)
    const slotSize = 20;
    const slotGap = 2;
    const gridX = panelX + 8;
    const gridY = panelY + 18;

    for (let i = 0; i < 16; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const sx = gridX + col * (slotSize + slotGap);
      const sy = gridY + row * (slotSize + slotGap);

      // Slot background
      ctx.fillStyle = i === this.inventoryCursor ? PALETTE.indigo : PALETTE.darkGray;
      ctx.fillRect(sx, sy, slotSize, slotSize);
      ctx.strokeStyle = PALETTE.lightGray;
      ctx.strokeRect(sx + 0.5, sy + 0.5, slotSize - 1, slotSize - 1);

      // Item icon
      if (i < inventory.slots.length) {
        const slot = inventory.slots[i];
        const item = ITEMS[slot.itemId];
        if (item) {
          const iconSprite = sprites.get(item.icon);
          if (iconSprite) {
            ctx.drawImage(iconSprite.frames[0], sx + 6, sy + 6, 8, 8);
          }
          // Count
          if (slot.count > 1) {
            ctx.fillStyle = PALETTE.white;
            ctx.font = '6px monospace';
            ctx.fillText(`${slot.count}`, sx + 2, sy + slotSize - 2);
          }
        }
      }
    }

    // Tooltip
    if (this.inventoryCursor < inventory.slots.length) {
      const slot = inventory.slots[this.inventoryCursor];
      const item = ITEMS[slot.itemId];
      if (item) {
        ctx.fillStyle = PALETTE.white;
        ctx.font = '8px monospace';
        ctx.fillText(item.name, panelX + 100, panelY + 20);
        ctx.fillStyle = PALETTE.lightGray;
        ctx.font = '6px monospace';
        // Word wrap description
        const words = item.description.split(' ');
        let line = '';
        let ly = panelY + 32;
        for (const word of words) {
          const test = line + (line ? ' ' : '') + word;
          if (ctx.measureText(test).width > 90) {
            ctx.fillText(line, panelX + 100, ly);
            line = word;
            ly += 8;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, panelX + 100, ly);
      }
    }

    ctx.fillStyle = PALETTE.lightGray;
    ctx.font = '6px monospace';
    ctx.fillText('Arrow keys: move  Enter: use  I: close', panelX + 8, panelY + panelH - 6);
  }

  drawShop(ctx: CanvasRenderingContext2D, coins: number, inventory: Inventory, sprites: Map<string, SpriteSheet>): void {
    if (!this.shopOpen) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    const panelW = 180;
    const panelH = 120;
    const panelX = (INTERNAL_W - panelW) / 2;
    const panelY = (INTERNAL_H - panelH) / 2;

    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '8px monospace';
    ctx.fillText('SHOP', panelX + 4, panelY + 12);
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(`Coins: ${coins}`, panelX + 80, panelY + 12);

    // Items
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const si = SHOP_ITEMS[i];
      const item = ITEMS[si.itemId];
      const iy = panelY + 22 + i * 16;
      const selected = i === this.shopCursor;

      if (selected) {
        ctx.fillStyle = PALETTE.indigo;
        ctx.fillRect(panelX + 4, iy - 2, panelW - 8, 14);
      }

      ctx.fillStyle = selected ? PALETTE.yellow : PALETTE.white;
      ctx.font = '8px monospace';
      const prefix = selected ? '▶ ' : '  ';
      ctx.fillText(`${prefix}${item.name}`, panelX + 8, iy + 8);
      ctx.fillStyle = coins >= si.price ? PALETTE.green : PALETTE.red;
      ctx.fillText(`${si.price}g`, panelX + 140, iy + 8);
    }

    // Message
    if (this.shopMessage) {
      ctx.fillStyle = PALETTE.yellow;
      ctx.font = '6px monospace';
      ctx.fillText(this.shopMessage, panelX + 8, panelY + panelH - 20);
    }

    ctx.fillStyle = PALETTE.lightGray;
    ctx.font = '6px monospace';
    ctx.fillText('Up/Down: select  Enter: buy  E: close', panelX + 8, panelY + panelH - 6);
  }

  drawMainMenu(ctx: CanvasRenderingContext2D, menuIndex: number, hasSave: boolean): void {
    // Background
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    // Particles
    for (const p of this.titleParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0 || p.y < 0) {
        p.y = INTERNAL_H;
        p.x = Math.random() * INTERNAL_W;
        p.life = Math.random() * 100 + 50;
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }

    // Title
    ctx.fillStyle = PALETTE.white;
    ctx.font = '16px monospace';
    const title = 'SHADOWS OF';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (INTERNAL_W - tw) / 2, 60);

    ctx.fillStyle = PALETTE.red;
    ctx.font = '20px monospace';
    const title2 = 'THE RUINS';
    const tw2 = ctx.measureText(title2).width;
    ctx.fillText(title2, (INTERNAL_W - tw2) / 2, 85);

    // Menu items
    const items = ['New Game', hasSave ? 'Continue' : 'Continue (no save)', 'Settings', 'Credits'];
    const startY = 120;
    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = i === menuIndex ? PALETTE.yellow : PALETTE.lightGray;
      ctx.font = '10px monospace';
      const prefix = i === menuIndex ? '▶ ' : '  ';
      const text = prefix + items[i];
      const iw = ctx.measureText(text).width;
      ctx.fillText(text, (INTERNAL_W - iw) / 2, startY + i * 18);
    }

    // Controls hint
    ctx.fillStyle = PALETTE.darkGray;
    ctx.font = '6px monospace';
    const hint = 'Arrow keys to select, Enter to confirm';
    const hw = ctx.measureText(hint).width;
    ctx.fillText(hint, (INTERNAL_W - hw) / 2, INTERNAL_H - 10);

    // Settings gear icon (bottom-right corner)
    this.drawSettingsButton(ctx, INTERNAL_W - 20, INTERNAL_H - 20);
  }

  drawPauseMenu(ctx: CanvasRenderingContext2D, menuIndex: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '12px monospace';
    const title = 'PAUSED';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (INTERNAL_W - tw) / 2, 60);

    const items = ['Resume', 'Save', 'Settings', 'Main Menu'];
    const startY = 90;
    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = i === menuIndex ? PALETTE.yellow : PALETTE.lightGray;
      ctx.font = '10px monospace';
      const prefix = i === menuIndex ? '▶ ' : '  ';
      const text = prefix + items[i];
      const iw = ctx.measureText(text).width;
      ctx.fillText(text, (INTERNAL_W - iw) / 2, startY + i * 18);
    }

    // Settings gear icon (bottom-right corner)
    this.drawSettingsButton(ctx, INTERNAL_W - 20, INTERNAL_H - 20);
  }

  drawSettings(ctx: CanvasRenderingContext2D, menuIndex: number, volumes: number[], keybinds: any, rebindingKey: string | null): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '12px monospace';
    const title = 'SETTINGS';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (INTERNAL_W - tw) / 2, 20);

    // Volume section
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '8px monospace';
    ctx.fillText('VOLUME', 20, 35);

    const volumeLabels = ['Master', 'Music', 'SFX'];
    const startY = 45;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === menuIndex ? PALETTE.yellow : PALETTE.lightGray;
      ctx.font = '8px monospace';
      const prefix = i === menuIndex ? '▶ ' : '  ';
      ctx.fillText(prefix + volumeLabels[i], 25, startY + i * 14);

      // Volume bar
      const barX = 100;
      const barW = 80;
      const barY = startY + i * 14 - 5;
      ctx.fillStyle = PALETTE.darkGray;
      ctx.fillRect(barX, barY, barW, 6);
      ctx.fillStyle = PALETTE.green;
      ctx.fillRect(barX, barY, Math.floor(volumes[i] * barW), 6);
      
      // Percentage
      ctx.fillStyle = PALETTE.white;
      ctx.fillText(`${Math.floor(volumes[i] * 100)}%`, barX + barW + 5, startY + i * 14);
    }

    // Keybinds section
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '8px monospace';
    ctx.fillText('KEYBINDS', 20, startY + 50);

    const keybindLabels = ['Move Up', 'Move Down', 'Move Left', 'Move Right', 'Attack', 'Jump', 'Interact', 'Inventory', 'Pause'];
    const keybindKeys = ['up', 'down', 'left', 'right', 'attack', 'jump', 'interact', 'inventory', 'pause'];
    const keybindStartY = startY + 60;

    for (let i = 0; i < keybindLabels.length; i++) {
      const itemIndex = i + 3; // Offset by volume items
      const isSelected = itemIndex === menuIndex;
      const isRebinding = rebindingKey === keybindKeys[i];
      
      ctx.fillStyle = isSelected ? PALETTE.yellow : PALETTE.lightGray;
      ctx.font = '7px monospace';
      const prefix = isSelected ? '▶ ' : '  ';
      ctx.fillText(prefix + keybindLabels[i], 25, keybindStartY + i * 11);

      // Key display
      const keyText = isRebinding ? '[ PRESS KEY ]' : (keybinds[keybindKeys[i]]?.[0] || 'NONE');
      ctx.fillStyle = isRebinding ? PALETTE.red : (isSelected ? PALETTE.yellow : PALETTE.white);
      ctx.font = '7px monospace';
      const keyX = 200;
      ctx.fillText(keyText, keyX, keybindStartY + i * 11);
    }

    // Back button
    const backIndex = 12; // After all keybinds
    ctx.fillStyle = backIndex === menuIndex ? PALETTE.yellow : PALETTE.lightGray;
    ctx.font = '8px monospace';
    const backPrefix = backIndex === menuIndex ? '▶ ' : '  ';
    ctx.fillText(backPrefix + 'Back', 25, keybindStartY + keybindLabels.length * 11 + 5);

    // Instructions
    ctx.fillStyle = PALETTE.darkGray;
    ctx.font = '6px monospace';
    ctx.fillText('↑↓ Navigate  ←→ Adjust volume  Enter: Rebind key  ESC: Back', 40, INTERNAL_H - 10);
  }

  drawMenuButton(ctx: CanvasRenderingContext2D): void {
    // Draw a small gear/menu icon in top-right corner
    const x = INTERNAL_W - 14;
    const y = 4;
    
    // Background
    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(x - 1, y - 1, 12, 12);
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, 11, 11);
    
    // Hamburger menu icon
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(x + 1, y + 2, 8, 1);
    ctx.fillRect(x + 1, y + 5, 8, 1);
    ctx.fillRect(x + 1, y + 8, 8, 1);
  }

  drawSettingsButton(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Draw a gear icon
    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(x - 1, y - 1, 14, 14);
    ctx.strokeStyle = PALETTE.lightGray;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, 13, 13);
    
    // Gear shape
    ctx.fillStyle = PALETTE.lightGray;
    // Center
    ctx.fillRect(x + 4, y + 4, 4, 4);
    // Teeth
    ctx.fillRect(x + 5, y + 1, 2, 2);
    ctx.fillRect(x + 5, y + 9, 2, 2);
    ctx.fillRect(x + 1, y + 5, 2, 2);
    ctx.fillRect(x + 9, y + 5, 2, 2);
    // Diagonal teeth
    ctx.fillRect(x + 2, y + 2, 2, 1);
    ctx.fillRect(x + 8, y + 2, 2, 1);
    ctx.fillRect(x + 2, y + 9, 2, 1);
    ctx.fillRect(x + 8, y + 9, 2, 1);
    // Center hole
    ctx.fillStyle = PALETTE.darkBlue;
    ctx.fillRect(x + 5, y + 5, 2, 2);
  }

  drawGameOver(ctx: CanvasRenderingContext2D, menuIndex: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    ctx.fillStyle = PALETTE.red;
    ctx.font = '16px monospace';
    const title = 'YOU DIED';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (INTERNAL_W - tw) / 2, 70);

    const items = ['Reload Checkpoint', 'Main Menu'];
    const startY = 110;
    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = i === menuIndex ? PALETTE.yellow : PALETTE.lightGray;
      ctx.font = '10px monospace';
      const prefix = i === menuIndex ? '▶ ' : '  ';
      const text = prefix + items[i];
      const iw = ctx.measureText(text).width;
      ctx.fillText(text, (INTERNAL_W - iw) / 2, startY + i * 20);
    }
  }

  drawVictory(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '14px monospace';
    const title = 'VICTORY!';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, (INTERNAL_W - tw) / 2, 60);

    ctx.fillStyle = PALETTE.white;
    ctx.font = '8px monospace';
    const msg1 = 'The Ruins Guardian has been defeated!';
    const mw1 = ctx.measureText(msg1).width;
    ctx.fillText(msg1, (INTERNAL_W - mw1) / 2, 90);

    const msg2 = 'Peace returns to the land.';
    const mw2 = ctx.measureText(msg2).width;
    ctx.fillText(msg2, (INTERNAL_W - mw2) / 2, 105);

    ctx.fillStyle = PALETTE.lightGray;
    ctx.font = '8px monospace';
    const hint = 'Press Enter to return to menu';
    const hw = ctx.measureText(hint).width;
    ctx.fillText(hint, (INTERNAL_W - hw) / 2, 150);
  }

  drawNotification(ctx: CanvasRenderingContext2D): void {
    if (this.notificationTimer <= 0) return;
    const alpha = Math.min(1, this.notificationTimer / 20);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.darkBlue;
    const tw = ctx.measureText(this.notification).width + 16;
    const nx = (INTERNAL_W - tw) / 2;
    ctx.fillRect(nx, 30, tw, 14);
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '8px monospace';
    ctx.fillText(this.notification, nx + 8, 40);
    ctx.globalAlpha = 1;
  }

  drawTransition(ctx: CanvasRenderingContext2D): void {
    if (this.transitionAlpha > 0) {
      ctx.globalAlpha = this.transitionAlpha;
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
      ctx.globalAlpha = 1;
    }
  }

  drawInteractionPrompt(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '6px monospace';
    ctx.fillText('[E]', Math.floor(x), Math.floor(y));
  }

  update(): void {
    if (this.notificationTimer > 0) this.notificationTimer--;
  }
}
