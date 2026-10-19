/**
 * =========================================================
 * BridgeGame.js — "Vỏ" Game Sentence Bridge Builder (Xây Cầu)
 * =========================================================
 * Plugs into GameEngine.js (the "ruột").
 * Renders: Scenic River, Left & Right Banks, Animated Froggy Character,
 *          Stepping Stone Piers, Floating Word Bricks, Water Physics,
 *          Splash & Confetti Particles.
 */

export class BridgeGame {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    // Dimensions
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Animation & State
    this.animFrame = null;
    this.lastTime = performance.now();
    this.time = 0;

    // Question & Bridge State
    this.currentQuestion = null;
    this.targetChunks = [];      // ['She', 'is', 'reading', 'a book']
    this.currentStep = 0;        // current chunk index to place (0 to targetChunks.length - 1)
    this.placedBricks = [];      // list of successfully placed stones
    this.floatingBricks = [];    // list of selectable bricks currently in the river tray
    this.flyingBricks = [];      // bricks currently animating to the bridge

    // Visual Elements
    this.clouds = [];
    this.waterLilies = [];
    this.particles = [];
    this.ripples = [];
    this.confetti = [];

    // Character State (Froggy 🐸)
    this.character = {
      x: 80,
      y: 0,
      targetX: 80,
      targetY: 0,
      vx: 0,
      vy: 0,
      isJumping: false,
      jumpProgress: 0,
      startX: 80,
      startY: 0,
      destX: 80,
      destY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      mood: 'idle', // idle | happy | shocked | victory
      blinkTimer: 0,
      isBlinking: false,
    };

    // Bridge Layout
    this.leftBankWidth = 140;
    this.rightBankWidth = 140;
    this.bridgeY = 0;
    this.pierSlots = [];

    // Colors
    this.colors = {
      skyTop: '#BAE6FD',
      skyBottom: '#E0F2FE',
      hillFar: '#A7F3D0',
      hillNear: '#6EE7B7',
      grass: '#34D399',
      grassDark: '#10B981',
      dirt: '#92400E',
      riverDeep: '#0284C7',
      riverSurface: '#38BDF8',
      riverWave: 'rgba(255, 255, 255, 0.35)',
      stoneNormal: '#64748B',
      stoneTop: '#94A3B8',
      stonePlaced: '#F59E0B',
      stonePlacedTop: '#FCD34D',
      brickColors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4'],
    };

    // Handlers
    this._resize = this._resize.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._handleTouch = this._handleTouch.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);

    this.mouse = { x: -100, y: -100, isHoveringBrick: false };
  }

  // ─── Setup & Teardown ──────────────────────────────
  setup() {
    this._resize();
    this._initScenery();
    window.addEventListener('resize', this._resize);
    this.canvas.addEventListener('click', this._handleClick);
    this.canvas.addEventListener('mousemove', this._handleMouseMove);
    this.canvas.addEventListener('touchend', this._handleTouch);

    if (!this.animFrame) {
      this.lastTime = performance.now();
      this._loop();
    }
  }

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.animFrame = null;
    window.removeEventListener('resize', this._resize);
    this.canvas.removeEventListener('click', this._handleClick);
    this.canvas.removeEventListener('mousemove', this._handleMouseMove);
    this.canvas.removeEventListener('touchend', this._handleTouch);
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    // Calculate layout geometry
    this.leftBankWidth = Math.max(90, Math.min(180, this.width * 0.16));
    this.rightBankWidth = Math.max(90, Math.min(180, this.width * 0.16));
    this.bridgeY = this.height * 0.48;

    this._calculatePierSlots();

    // Position character if not jumping
    if (!this.character.isJumping) {
      if (this.currentStep === 0) {
        this.character.x = this.leftBankWidth * 0.55;
        this.character.y = this.bridgeY - 10;
      } else if (this.currentStep <= this.pierSlots.length) {
        const slot = this.pierSlots[this.currentStep - 1];
        if (slot) {
          this.character.x = slot.x;
          this.character.y = slot.y - 12;
        }
      }
    }

    this._layoutFloatingBricks();
  }

  _initScenery() {
    // Clouds
    this.clouds = [
      { x: this.width * 0.1, y: 40, speed: 0.15, size: 45 },
      { x: this.width * 0.45, y: 70, speed: 0.22, size: 60 },
      { x: this.width * 0.75, y: 35, speed: 0.18, size: 50 },
    ];

    // Water lilies
    this.waterLilies = [
      { x: this.width * 0.25, y: this.bridgeY + 60, size: 24, bobOffset: 0 },
      { x: this.width * 0.42, y: this.bridgeY + 110, size: 28, bobOffset: 1.5 },
      { x: this.width * 0.65, y: this.bridgeY + 70, size: 22, bobOffset: 3.2 },
      { x: this.width * 0.8, y: this.bridgeY + 120, size: 26, bobOffset: 4.8 },
    ];
  }

  // ─── Question Loading ──────────────────────────────
  loadQuestion(questionData) {
    this.currentQuestion = questionData;
    this.targetChunks = Array.isArray(questionData.chunks) ? questionData.chunks : [];
    this.currentStep = 0;
    this.placedBricks = [];
    this.flyingBricks = [];
    this.confetti = [];

    this._calculatePierSlots();

    // Reset Character to left bank
    this.character.x = this.leftBankWidth * 0.55;
    this.character.y = this.bridgeY - 10;
    this.character.startX = this.character.x;
    this.character.startY = this.character.y;
    this.character.destX = this.character.x;
    this.character.destY = this.character.y;
    this.character.isJumping = false;
    this.character.mood = 'idle';

    // Build selectable bricks pool
    const allBrickItems = Array.isArray(questionData.bricks) ? questionData.bricks : [];
    this.floatingBricks = allBrickItems.map((b, i) => {
      return {
        id: b.id || `brick_${i}`,
        text: b.text,
        isTarget: b.isTarget,
        targetIndex: b.targetIndex,
        color: this.colors.brickColors[i % this.colors.brickColors.length],
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        width: 80,
        height: 48,
        scale: 1,
        opacity: 1,
        bobSpeed: 0.002 + Math.random() * 0.001,
        bobOffset: Math.random() * Math.PI * 2,
        isWrong: false,
        shakeOffset: 0,
        fallSpeed: 0,
        isSinking: false,
      };
    });

    this._layoutFloatingBricks();
  }

  _calculatePierSlots() {
    if (!this.targetChunks || this.targetChunks.length === 0) {
      this.pierSlots = [];
      return;
    }

    const n = this.targetChunks.length;
    const riverStart = this.leftBankWidth + 24;
    const riverEnd = this.width - this.rightBankWidth - 24;
    const riverSpan = riverEnd - riverStart;

    // TẤT CẢ các mố cầu đều có kích thước ĐỒNG NHẤT 100% và KHOẢNG CÁCH ĐỀU NHAU
    // Người chơi không thể nhìn chiều rộng mố cầu để đoán độ dài từ!
    const maxSlotWidth = 108;
    const minSlotWidth = 70;
    const rawWidth = (riverSpan / (n + 0.5)) - 14;
    const uniformWidth = Math.max(minSlotWidth, Math.min(maxSlotWidth, rawWidth));

    const totalSlotsWidth = n * uniformWidth;
    const remainingSpace = riverSpan - totalSlotsWidth;
    const gap = Math.max(8, remainingSpace / (n + 1));

    this.pierSlots = [];
    for (let i = 0; i < n; i++) {
      const x = riverStart + gap * (i + 1) + uniformWidth * (i + 0.5);
      const text = this.targetChunks[i];
      this.pierSlots.push({
        index: i,
        x,
        y: this.bridgeY,
        width: uniformWidth, // ĐỒNG NHẤT
        height: 44,
        targetText: text,
      });
    }
  }

  _layoutFloatingBricks() {
    if (!this.floatingBricks || this.floatingBricks.length === 0) return;

    // Tính kích thước ĐỒNG NHẤT cho tất cả các viên gạch ở khay dưới
    this.ctx.save();
    this.ctx.font = 'bold 15px "Lexend", sans-serif';
    let maxTextWidth = 0;
    this.floatingBricks.forEach(b => {
      const w = this.ctx.measureText(b.text).width;
      if (w > maxTextWidth) maxTextWidth = w;
    });
    this.ctx.restore();

    // Mọi viên gạch đều có cùng chiều rộng chuẩn
    const uniformBrickWidth = Math.max(82, Math.min(125, maxTextWidth + 30));

    this.floatingBricks.forEach(b => {
      b.width = uniformBrickWidth;
      b.height = 46;
    });

    // Layout in a neat river floating dock below the bridge
    const trayY = Math.max(this.bridgeY + 90, this.height * 0.73);
    const availableWidth = this.width - 40;

    // Check if single row or two rows
    const totalWidth = this.floatingBricks.reduce((acc, b) => acc + b.width + 12, 0) - 12;

    if (totalWidth <= availableWidth) {
      // Single row centered
      let currentX = (this.width - totalWidth) / 2;
      this.floatingBricks.forEach(b => {
        b.x = currentX;
        b.y = trayY;
        b.targetX = currentX;
        b.targetY = trayY;
        currentX += b.width + 12;
      });
    } else {
      // Split into 2 rows
      const half = Math.ceil(this.floatingBricks.length / 2);
      const row1 = this.floatingBricks.slice(0, half);
      const row2 = this.floatingBricks.slice(half);

      const w1 = row1.reduce((acc, b) => acc + b.width + 10, 0) - 10;
      let startX1 = Math.max(16, (this.width - w1) / 2);
      row1.forEach(b => {
        b.x = startX1;
        b.y = trayY - 26;
        b.targetX = startX1;
        b.targetY = trayY - 26;
        startX1 += b.width + 10;
      });

      const w2 = row2.reduce((acc, b) => acc + b.width + 10, 0) - 10;
      let startX2 = Math.max(16, (this.width - w2) / 2);
      row2.forEach(b => {
        b.x = startX2;
        b.y = trayY + 34;
        b.targetX = startX2;
        b.targetY = trayY + 34;
        startX2 += b.width + 10;
      });
    }
  }

  // ─── Interaction Handlers ──────────────────────────
  _handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    let hoverFound = false;
    for (const b of this.floatingBricks) {
      if (b.isSinking) continue;
      if (
        this.mouse.x >= b.x &&
        this.mouse.x <= b.x + b.width &&
        this.mouse.y >= b.y &&
        this.mouse.y <= b.y + b.height
      ) {
        hoverFound = true;
        break;
      }
    }
    this.canvas.style.cursor = hoverFound ? 'pointer' : 'default';
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    this._selectBrickAt(clickX, clickY);
  }

  _handleTouch(e) {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    this._selectBrickAt(touchX, touchY);
  }

  _selectBrickAt(x, y) {
    if (this.character.isJumping) return; // Wait for frog to finish jump

    for (let i = 0; i < this.floatingBricks.length; i++) {
      const brick = this.floatingBricks[i];
      if (brick.isSinking) continue;

      if (x >= brick.x && x <= brick.x + brick.width && y >= brick.y && y <= brick.y + brick.height) {
        this._processBrickChoice(brick, i);
        break;
      }
    }
  }

  _processBrickChoice(brick, brickIndex) {
    const expectedChunk = this.targetChunks[this.currentStep];

    // Verify if this brick matches the expected chunk
    const isCorrect = brick.text.trim().toLowerCase() === expectedChunk.trim().toLowerCase();

    if (isCorrect) {
      // ✅ CORRECT BRICK
      const slot = this.pierSlots[this.currentStep];
      this.engine.audio.play('brick');

      // Animate brick flying to pier
      this.flyingBricks.push({
        text: brick.text,
        color: brick.color,
        startX: brick.x,
        startY: brick.y,
        currentX: brick.x,
        currentY: brick.y,
        destX: slot.x - slot.width / 2,
        destY: slot.y - slot.height / 2,
        destWidth: slot.width,
        destHeight: slot.height,
        progress: 0,
        slotIndex: this.currentStep,
      });

      // Remove from floating array
      this.floatingBricks.splice(brickIndex, 1);

      // Trigger Froggy Jump
      const nextJumpX = slot.x;
      const nextJumpY = slot.y - 14;
      this._startCharacterJump(nextJumpX, nextJumpY);

      this.currentStep++;

      // Trigger Step Event
      const isSentenceFinished = this.currentStep >= this.targetChunks.length;
      if (this.onCorrectStep) {
        this.onCorrectStep(brick.text, this.currentStep, isSentenceFinished);
      }

      if (isSentenceFinished) {
        // Complete bridge! Victory sequence
        setTimeout(() => {
          this._celebrateVictory();
        }, 550);
      }
    } else {
      // ❌ WRONG BRICK
      this.engine.audio.play('splash');
      this.character.mood = 'shocked';
      setTimeout(() => {
        if (this.character.mood === 'shocked') this.character.mood = 'idle';
      }, 700);

      // Trigger sinking physics
      brick.isSinking = true;
      brick.isWrong = true;

      // Create splash ripples & droplets
      this._createWaterSplash(brick.x + brick.width / 2, brick.y + brick.height / 2);

      if (this.onWrongStep) {
        this.onWrongStep(brick.text);
      }
    }
  }

  _startCharacterJump(destX, destY) {
    this.engine.audio.play('jump');
    this.character.isJumping = true;
    this.character.jumpProgress = 0;
    this.character.startX = this.character.x;
    this.character.startY = this.character.y;
    this.character.destX = destX;
    this.character.destY = destY;
    this.character.mood = 'happy';
  }

  _celebrateVictory() {
    this.engine.audio.play('win');
    this.character.mood = 'victory';

    // Froggy jumps to the right bank
    const goalX = this.width - this.rightBankWidth * 0.55;
    const goalY = this.bridgeY - 10;
    this._startCharacterJump(goalX, goalY);

    // Spawn massive confetti celebration
    for (let i = 0; i < 70; i++) {
      this.confetti.push({
        x: this.width * 0.5 + (Math.random() - 0.5) * 300,
        y: this.bridgeY - 120 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 3,
        size: Math.random() * 8 + 6,
        color: ['#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E'][Math.floor(Math.random() * 6)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    if (this.onSentenceComplete) {
      this.onSentenceComplete(this.currentQuestion);
    }
  }

  _createWaterSplash(x, y) {
    // Water droplets
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 2;
      const speed = Math.random() * 5 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color: 'rgba(255, 255, 255, 0.85)',
        life: 1,
        decay: 0.04,
      });
    }

    // Expanding concentric ripples
    this.ripples.push({
      x,
      y,
      radius: 8,
      maxRadius: 45,
      alpha: 0.8,
    });
  }

  // ─── Main Render Loop ──────────────────────────────
  _loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.time += dt;

    this._update(dt);
    this._render();

    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    // Update Clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x - c.size * 2 > this.width) {
        c.x = -c.size * 2;
      }
    });

    // Update Flying Bricks
    for (let i = this.flyingBricks.length - 1; i >= 0; i--) {
      const fb = this.flyingBricks[i];
      fb.progress += dt * 3.2; // ~0.3s duration

      if (fb.progress >= 1) {
        // Landed on bridge pier
        const slot = this.pierSlots[fb.slotIndex];
        this.placedBricks.push({
          slotIndex: fb.slotIndex,
          text: fb.text,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
        });

        // Dust sparkles around pier
        for (let s = 0; s < 10; s++) {
          this.particles.push({
            x: slot.x + (Math.random() - 0.5) * slot.width,
            y: slot.y + (Math.random() - 0.5) * slot.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            radius: Math.random() * 3 + 1.5,
            color: '#FDE68A',
            life: 1,
            decay: 0.05,
          });
        }

        this.flyingBricks.splice(i, 1);
      } else {
        // Smooth ease-out quad curve
        const t = fb.progress;
        const ease = 1 - Math.pow(1 - t, 3);
        const arcY = Math.sin(t * Math.PI) * -60; // Parabolic jump upward
        fb.currentX = fb.startX + (fb.destX - fb.startX) * ease;
        fb.currentY = fb.startY + (fb.destY - fb.startY) * ease + arcY;
      }
    }

    // Update Floating Bricks
    this.floatingBricks.forEach(b => {
      if (b.isSinking) {
        b.fallSpeed += 12 * dt;
        b.y += b.fallSpeed;
        b.scale = Math.max(0, b.scale - dt * 1.5);
        b.opacity = Math.max(0, b.opacity - dt * 2.2);
        b.shakeOffset = (Math.random() - 0.5) * 8;
      } else {
        // Gentle bobbing on water
        const bob = Math.sin(this.time * 2.2 + b.bobOffset) * 4;
        b.y = b.targetY + bob;
      }
    });

    // Clean up sunken bricks
    this.floatingBricks = this.floatingBricks.filter(b => b.opacity > 0);

    // Update Character Jump
    if (this.character.isJumping) {
      this.character.jumpProgress += dt * 2.8;
      if (this.character.jumpProgress >= 1) {
        this.character.isJumping = false;
        this.character.x = this.character.destX;
        this.character.y = this.character.destY;
        this.character.scaleY = 0.8; // Landing squash
        setTimeout(() => {
          this.character.scaleY = 1.05;
          setTimeout(() => { this.character.scaleY = 1; }, 80);
        }, 80);
      } else {
        const t = this.character.jumpProgress;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const arc = Math.sin(t * Math.PI) * -55; // Cute high hop
        this.character.x = this.character.startX + (this.character.destX - this.character.startX) * ease;
        this.character.y = this.character.startY + (this.character.destY - this.character.startY) * ease + arc;
        this.character.scaleY = 1 + Math.sin(t * Math.PI) * 0.25;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 6 * dt; // gravity
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += dt * 35;
      r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
      if (r.radius >= r.maxRadius) this.ripples.splice(i, 1);
    }

    // Update Confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const cf = this.confetti[i];
      cf.x += cf.vx;
      cf.y += cf.vy;
      cf.vy += 7 * dt;
      cf.rotation += cf.rotSpeed;
      cf.opacity -= dt * 0.35;
      if (cf.opacity <= 0 || cf.y > this.height) this.confetti.splice(i, 1);
    }
  }

  // ─── Rendering Methods ─────────────────────────────
  _render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this._drawSky();
    this._drawHills();
    this._drawRiver();
    this._drawBanks();
    this._drawBridgePiers();
    this._drawCharacter();
    this._drawFlyingBricks();
    this._drawFloatingBricks();
    this._drawEffects();
  }

  _drawSky() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.bridgeY);
    skyGrad.addColorStop(0, this.colors.skyTop);
    skyGrad.addColorStop(1, this.colors.skyBottom);
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.bridgeY);

    // Sun / Warm glow
    const sunGrad = this.ctx.createRadialGradient(this.width * 0.85, 50, 10, this.width * 0.85, 50, 80);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.width * 0.85, 50, 80, 0, Math.PI * 2);
    this.ctx.fill();

    // Floating Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.clouds.forEach(c => {
      this._drawCloud(c.x, c.y, c.size);
    });
  }

  _drawCloud(x, y, s) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + s * 0.35, y - s * 0.2, s * 0.45, 0, Math.PI * 2);
    this.ctx.arc(x + s * 0.7, y, s * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _drawHills() {
    // Distant soft green hills
    this.ctx.fillStyle = this.colors.hillFar;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.bridgeY);
    this.ctx.quadraticCurveTo(this.width * 0.25, this.bridgeY - 70, this.width * 0.55, this.bridgeY);
    this.ctx.quadraticCurveTo(this.width * 0.8, this.bridgeY - 60, this.width, this.bridgeY);
    this.ctx.lineTo(this.width, this.bridgeY);
    this.ctx.lineTo(0, this.bridgeY);
    this.ctx.fill();

    // Near gentle hills
    this.ctx.fillStyle = this.colors.hillNear;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.bridgeY);
    this.ctx.quadraticCurveTo(this.width * 0.35, this.bridgeY - 45, this.width * 0.75, this.bridgeY);
    this.ctx.lineTo(this.width, this.bridgeY);
    this.ctx.lineTo(0, this.bridgeY);
    this.ctx.fill();
  }

  _drawRiver() {
    const riverHeight = this.height - this.bridgeY;
    const riverGrad = this.ctx.createLinearGradient(0, this.bridgeY, 0, this.height);
    riverGrad.addColorStop(0, this.colors.riverSurface);
    riverGrad.addColorStop(0.4, this.colors.riverDeep);
    riverGrad.addColorStop(1, '#0369A1');

    this.ctx.fillStyle = riverGrad;
    this.ctx.fillRect(0, this.bridgeY, this.width, riverHeight);

    // Multi-layered animated river waves
    this.ctx.fillStyle = this.colors.riverWave;
    for (let layer = 0; layer < 3; layer++) {
      const yOffset = this.bridgeY + 30 + layer * 35;
      const speed = (layer + 1) * 1.4;
      const waveFreq = 0.015;

      this.ctx.beginPath();
      this.ctx.moveTo(0, yOffset);
      for (let x = 0; x <= this.width; x += 15) {
        const wave = Math.sin(x * waveFreq + this.time * speed) * (4 + layer * 1.5);
        this.ctx.lineTo(x, yOffset + wave);
      }
      this.ctx.lineTo(this.width, yOffset + 4);
      this.ctx.lineTo(0, yOffset + 4);
      this.ctx.fill();
    }

    // Water Lilies
    this.waterLilies.forEach(lily => {
      const bob = Math.sin(this.time * 2 + lily.bobOffset) * 3;
      this._drawWaterLily(lily.x, lily.y + bob, lily.size);
    });

    // Draw Expanding Ripples
    this.ripples.forEach(r => {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.4, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }

  _drawWaterLily(x, y, s) {
    this.ctx.save();
    // Green pad with notch
    this.ctx.fillStyle = '#10B981';
    this.ctx.beginPath();
    this.ctx.arc(x, y, s, 0.25, Math.PI * 1.85);
    this.ctx.lineTo(x, y);
    this.ctx.fill();

    // Pink flower bud
    this.ctx.fillStyle = '#F472B6';
    this.ctx.beginPath();
    this.ctx.arc(x - 2, y - 2, s * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#FDF2F8';
    this.ctx.beginPath();
    this.ctx.arc(x - 2, y - 2, s * 0.18, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  _drawBanks() {
    // ── Left Bank (Start Platform) ──
    this.ctx.save();
    this.ctx.fillStyle = this.colors.dirt;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.bridgeY - 15);
    this.ctx.quadraticCurveTo(this.leftBankWidth * 0.7, this.bridgeY - 5, this.leftBankWidth, this.bridgeY + 45);
    this.ctx.lineTo(this.leftBankWidth - 25, this.height);
    this.ctx.lineTo(0, this.height);
    this.ctx.fill();

    // Grass Top
    this.ctx.fillStyle = this.colors.grass;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.bridgeY - 18);
    this.ctx.quadraticCurveTo(this.leftBankWidth * 0.7, this.bridgeY - 8, this.leftBankWidth, this.bridgeY + 12);
    this.ctx.lineTo(this.leftBankWidth - 10, this.bridgeY + 22);
    this.ctx.quadraticCurveTo(this.leftBankWidth * 0.5, this.bridgeY + 5, 0, this.bridgeY);
    this.ctx.fill();

    // Start Signpost
    const signX = this.leftBankWidth * 0.3;
    const signY = this.bridgeY - 45;
    this.ctx.fillStyle = '#78350F';
    this.ctx.fillRect(signX + 10, signY + 10, 6, 32);
    this.ctx.fillStyle = '#FBBF24';
    this._roundRect(signX - 10, signY - 4, 46, 22, 6);
    this.ctx.fill();
    this.ctx.fillStyle = '#78350F';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START', signX + 13, signY + 11);
    this.ctx.restore();

    // ── Right Bank (Goal Platform) ──
    this.ctx.save();
    const rightX = this.width - this.rightBankWidth;
    this.ctx.fillStyle = this.colors.dirt;
    this.ctx.beginPath();
    this.ctx.moveTo(rightX, this.bridgeY + 45);
    this.ctx.quadraticCurveTo(this.width - this.rightBankWidth * 0.7, this.bridgeY - 5, this.width, this.bridgeY - 15);
    this.ctx.lineTo(this.width, this.height);
    this.ctx.lineTo(rightX + 25, this.height);
    this.ctx.fill();

    // Grass Top
    this.ctx.fillStyle = this.colors.grass;
    this.ctx.beginPath();
    this.ctx.moveTo(rightX, this.bridgeY + 12);
    this.ctx.quadraticCurveTo(this.width - this.rightBankWidth * 0.7, this.bridgeY - 8, this.width, this.bridgeY - 18);
    this.ctx.lineTo(this.width, this.bridgeY);
    this.ctx.quadraticCurveTo(this.width - this.rightBankWidth * 0.5, this.bridgeY + 5, rightX + 10, this.bridgeY + 22);
    this.ctx.fill();

    // Victory Flag / Arch on right bank
    const flagX = this.width - this.rightBankWidth * 0.45;
    const flagY = this.bridgeY - 55;
    this.ctx.fillStyle = '#CBD5E1';
    this.ctx.fillRect(flagX, flagY, 5, 45);
    // Flag cloth
    this.ctx.fillStyle = '#EF4444';
    this.ctx.beginPath();
    this.ctx.moveTo(flagX + 5, flagY);
    this.ctx.lineTo(flagX + 32, flagY + 12);
    this.ctx.lineTo(flagX + 5, flagY + 24);
    this.ctx.fill();
    this.ctx.restore();
  }

  _drawBridgePiers() {
    this.pierSlots.forEach((slot, i) => {
      const isPlaced = this.placedBricks.some(pb => pb.slotIndex === i);

      if (isPlaced) {
        // Placed Solid Stone Pier
        this._drawStonePier(slot.x, slot.y, slot.width, slot.height, slot.targetText, true);
      } else {
        // Unplaced Outline / Placeholder Pier
        this._drawStonePier(slot.x, slot.y, slot.width, slot.height, `${i + 1}`, false);
      }
    });
  }

  _drawStonePier(x, y, w, h, text, isPlaced) {
    this.ctx.save();
    const halfW = w / 2;
    const halfH = h / 2;

    if (isPlaced) {
      // 3D Stone Block with shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      this._roundRect(x - halfW + 3, y - halfH + 8, w, h, 10);
      this.ctx.fill();

      // Stone Base Body (3D depth)
      this.ctx.fillStyle = '#D97706';
      this._roundRect(x - halfW, y - halfH + 6, w, h, 10);
      this.ctx.fill();

      // Stone Slab Top Surface
      const topGrad = this.ctx.createLinearGradient(x, y - halfH, x, y + halfH);
      topGrad.addColorStop(0, '#FEF3C7');
      topGrad.addColorStop(1, '#FDE68A');
      this.ctx.fillStyle = topGrad;
      this._roundRect(x - halfW, y - halfH, w, h, 10);
      this.ctx.fill();

      // Golden Edge Border
      this.ctx.strokeStyle = '#F59E0B';
      this.ctx.lineWidth = 2.5;
      this._roundRect(x - halfW, y - halfH, w, h, 10);
      this.ctx.stroke();

      // Text Label with auto-scale
      this.ctx.fillStyle = '#78350F';
      let fontSize = 15;
      this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
      let textWidth = this.ctx.measureText(text).width;
      while (textWidth > w - 12 && fontSize > 10) {
        fontSize--;
        this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
        textWidth = this.ctx.measureText(text).width;
      }
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, x, y + 1);
    } else {
      // Translucent Stepping Stone Placeholder
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      this._roundRect(x - halfW, y - halfH, w, h, 10);
      this.ctx.fill();

      // Dashed White Outline
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 5]);
      this._roundRect(x - halfW, y - halfH, w, h, 10);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Step Number indicator
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.font = 'bold 14px "Lexend", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, x, y);
    }

    this.ctx.restore();
  }

  _drawCharacter() {
    this.ctx.save();
    this.ctx.translate(this.character.x, this.character.y);
    this.ctx.scale(this.character.scaleX, this.character.scaleY);

    const c = this.character;

    // Character Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 8, 16, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 🐸 FROGGY BODY (Round cheerful frog)
    this.ctx.fillStyle = '#10B981'; // Emerald Green
    this.ctx.beginPath();
    this.ctx.arc(0, -12, 18, 0, Math.PI * 2);
    this.ctx.fill();

    // Belly (Soft yellow)
    this.ctx.fillStyle = '#ECFDF5';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -7, 11, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Rosy Cheeks
    this.ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(-11, -10, 4, 0, Math.PI * 2);
    this.ctx.arc(11, -10, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Big Frog Eyes on top
    this._drawFrogEye(-9, -26);
    this._drawFrogEye(9, -26);

    // Mouth / Mood Expression
    this.ctx.strokeStyle = '#065F46';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();

    if (c.mood === 'happy' || c.mood === 'victory') {
      // Big smiling mouth
      this.ctx.arc(0, -12, 7, 0.2, Math.PI - 0.2);
    } else if (c.mood === 'shocked') {
      // Small surprised 'O'
      this.ctx.arc(0, -8, 4, 0, Math.PI * 2);
    } else {
      // Gentle calm smile
      this.ctx.arc(0, -11, 5, 0.3, Math.PI - 0.3);
    }
    this.ctx.stroke();

    // Cute Little Explorer Hat 🎒
    this.ctx.fillStyle = '#F59E0B';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -31, 10, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(0, -32, 6, Math.PI, 0);
    this.ctx.fill();

    this.ctx.restore();
  }

  _drawFrogEye(ex, ey) {
    // Outer green bump
    this.ctx.fillStyle = '#10B981';
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, 7, 0, Math.PI * 2);
    this.ctx.fill();

    // White eyeball
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Black pupil with sparkle
    this.ctx.fillStyle = '#0F172A';
    this.ctx.beginPath();
    this.ctx.arc(ex + 0.5, ey, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Pupil white catchlight
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(ex - 0.8, ey - 1, 1.2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _drawFlyingBricks() {
    this.flyingBricks.forEach(fb => {
      this.ctx.save();
      this.ctx.fillStyle = '#F59E0B';
      this._roundRect(fb.currentX, fb.currentY, fb.destWidth, fb.destHeight, 10);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFFFFF';
      let fontSize = 15;
      this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
      let textWidth = this.ctx.measureText(fb.text).width;
      while (textWidth > fb.destWidth - 12 && fontSize > 10) {
        fontSize--;
        this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
        textWidth = this.ctx.measureText(fb.text).width;
      }
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(fb.text, fb.currentX + fb.destWidth / 2, fb.currentY + fb.destHeight / 2);
      this.ctx.restore();
    });
  }

  _drawFloatingBricks() {
    this.floatingBricks.forEach(b => {
      this.ctx.save();
      this.ctx.globalAlpha = b.opacity;

      const drawX = b.x + (b.isWrong ? b.shakeOffset : 0);
      const drawY = b.y;

      // Lily Pad / Floating Base underneath brick
      this.ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(drawX + b.width / 2, drawY + b.height + 3, b.width * 0.52, 9, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Brick 3D bottom edge
      this.ctx.fillStyle = b.isWrong ? '#B91C1C' : '#1E293B';
      this._roundRect(drawX, drawY + 4, b.width, b.height, 12);
      this.ctx.fill();

      // Brick Main Top Surface
      const grad = this.ctx.createLinearGradient(drawX, drawY, drawX, drawY + b.height);
      if (b.isWrong) {
        grad.addColorStop(0, '#EF4444');
        grad.addColorStop(1, '#DC2626');
      } else {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#F1F5F9');
      }

      this.ctx.fillStyle = grad;
      this._roundRect(drawX, drawY, b.width, b.height, 12);
      this.ctx.fill();

      // Border Outline (Crisp candy outline)
      this.ctx.strokeStyle = b.isWrong ? '#991B1B' : '#CBD5E1';
      this.ctx.lineWidth = 2.5;
      this._roundRect(drawX, drawY, b.width, b.height, 12);
      this.ctx.stroke();

      // Text inside Brick with auto-scaling font
      this.ctx.fillStyle = b.isWrong ? '#FFFFFF' : '#0F172A';
      let fontSize = 15;
      this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
      let textWidth = this.ctx.measureText(b.text).width;
      while (textWidth > b.width - 14 && fontSize > 10) {
        fontSize--;
        this.ctx.font = `bold ${fontSize}px "Lexend", sans-serif`;
        textWidth = this.ctx.measureText(b.text).width;
      }
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(b.text, drawX + b.width / 2, drawY + b.height / 2);

      this.ctx.restore();
    });
  }

  _drawEffects() {
    // Particles (Splash & Sparkles)
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Confetti
    this.confetti.forEach(cf => {
      this.ctx.save();
      this.ctx.globalAlpha = cf.opacity;
      this.ctx.translate(cf.x, cf.y);
      this.ctx.rotate(cf.rotation);
      this.ctx.fillStyle = cf.color;
      this.ctx.fillRect(-cf.size / 2, -cf.size / 3, cf.size, cf.size * 0.6);
      this.ctx.restore();
    });
  }

  _roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}
