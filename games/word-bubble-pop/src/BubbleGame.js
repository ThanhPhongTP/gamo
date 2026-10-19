/**
 * =============================================
 * BubbleGame.js — "Vỏ" Game Word Bubble Pop
 * =============================================
 * Plugs into GameEngine.js (the "ruột").
 * Handles: Canvas rendering, bubble physics, 
 *          animations, click/touch detection.
 */

class BubbleGame {
  constructor(canvas, engine) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.engine  = engine;
    this.bubbles = [];
    this.particles = [];
    this.bgClouds = [];
    this.animFrame = null;

    // Config per difficulty (Tốc độ êm dịu, bồng bềnh vừa tầm mắt và cực dễ bấm)
    this.difficultyConfig = {
      easy:   { count: 4, speed: 0.85, size: { min: 66, max: 86 } },
      medium: { count: 6, speed: 1.15, size: { min: 58, max: 80 } },
      hard:   { count: 8, speed: 1.55, size: { min: 50, max: 72 } },
    };
    this.difficulty = 'medium';

    this.colors = [
      '#EC4899', '#2563EB', '#10B981', '#D97706',
      '#8B5CF6', '#0284C7', '#EA580C', '#0D9488',
    ];

    this._resize = this._resize.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._handleTouch = this._handleTouch.bind(this);
  }

  // ─── Setup ───────────────────────────────────
  setup(difficulty = 'medium') {
    this.difficulty = difficulty;
    this._resize();
    this._generateClouds();
    window.addEventListener('resize', this._resize);
    this.canvas.addEventListener('click', this._handleClick);
    this.canvas.addEventListener('touchend', this._handleTouch);
  }

  destroy() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this._resize);
    this.canvas.removeEventListener('click', this._handleClick);
    this.canvas.removeEventListener('touchend', this._handleTouch);
    this.bubbles = [];
    this.particles = [];
  }

  // ─── Question Loading ─────────────────────────
  loadQuestion(questionData) {
    const cfg = this.difficultyConfig[this.difficulty];
    this.bubbles = [];

    const correctWord = questionData.answer;
    // Fill remaining with wrong answers from pool
    const wrongOptions = (questionData.distractors || [])
      .filter(d => d !== correctWord)
      .slice(0, cfg.count - 1);

    // Pad if not enough distractors
    while (wrongOptions.length < cfg.count - 1) {
      wrongOptions.push(this._randomWord());
    }

    const allOptions = this._shuffle([correctWord, ...wrongOptions]);

    allOptions.forEach((word, i) => {
      const color = this.colors[i % this.colors.length];
      const size  = this._random(cfg.size.min, cfg.size.max);
      this.bubbles.push(this._createBubble(word, word === correctWord, size, color));
    });

    if (!this.animFrame) this._loop();
  }

  // ─── Bubble Creation ──────────────────────────
  _createBubble(text, isCorrect, radius, color) {
    const margin = radius + 20;
    const x = this._random(margin, this.canvas.width - margin);
    const y = this._random(margin + 60, this.canvas.height - margin - 40);

    const baseSpeed = this.difficultyConfig[this.difficulty].speed;
    const speed = baseSpeed * (0.9 + Math.random() * 0.25);
    const angle = Math.random() * Math.PI * 2;

    return {
      x, y, radius,
      speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      text, isCorrect, color,
      opacity: 0,        // fade in
      scale:   0,        // pop in
      wobble:  Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.02,
      state: 'appearing', // appearing | idle | popping | dead
      popProgress: 0,
    };
  }

  // ─── Main Loop ────────────────────────────────
  _loop() {
    this.animFrame = requestAnimationFrame(() => this._loop());
    this._update();
    this._draw();
  }

  _update() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    this.bubbles.forEach(b => {
      if (b.state === 'dead') return;

      if (b.state === 'appearing') {
        b.opacity += 0.06;
        b.scale   += 0.06;
        if (b.scale >= 1) { b.scale = 1; b.opacity = 1; b.state = 'idle'; }
        return;
      }

      if (b.state === 'popping') {
        b.popProgress += 0.08;
        if (b.popProgress >= 1) b.state = 'dead';
        return;
      }

      // Movement
      b.x += b.vx;
      b.y += b.vy;
      b.wobble += b.wobbleSpeed;

      // Wall bounce with bounds protection
      if (b.x - b.radius < 10) {
        b.x = b.radius + 10;
        b.vx = Math.abs(b.vx);
      } else if (b.x + b.radius > W - 10) {
        b.x = W - b.radius - 10;
        b.vx = -Math.abs(b.vx);
      }

      if (b.y - b.radius < 100) {
        b.y = b.radius + 100;
        b.vy = Math.abs(b.vy);
      } else if (b.y + b.radius > H - 60) {
        b.y = H - b.radius - 60;
        b.vy = -Math.abs(b.vy);
      }

      // Bubble-bubble separation & elastic bounce (không triệt tiêu động năng)
      this.bubbles.forEach(other => {
        if (other === b || other.state === 'dead' || other.state === 'popping') return;
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b.radius + other.radius + 4;
        if (dist < minDist && dist > 0) {
          const push = (minDist - dist) / dist * 0.5;
          b.x -= dx * push;
          b.y -= dy * push;
          other.x += dx * push;
          other.y += dy * push;

          // Elastic collision bounce
          const nx = dx / dist;
          const ny = dy / dist;
          const kx = b.vx - other.vx;
          const ky = b.vy - other.vy;
          const p = nx * kx + ny * ky;
          b.vx -= p * nx;
          b.vy -= p * ny;
          other.vx += p * nx;
          other.vy += p * ny;
        }
      });

      // Maintain constant lively speed (loại bỏ hoàn toàn hiện tượng bóng bị đứng yên)
      const currentSpeed = Math.hypot(b.vx, b.vy);
      if (currentSpeed < 0.2) {
        const randAngle = Math.random() * Math.PI * 2;
        b.vx = Math.cos(randAngle) * b.speed;
        b.vy = Math.sin(randAngle) * b.speed;
      } else {
        const factor = b.speed / currentSpeed;
        b.vx *= factor;
        b.vy *= factor;
      }
    });

    // Update particles
    this.particles.forEach(p => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.12; // gravity
      p.vx   *= 0.98;
      p.life -= 0.02;
      p.size *= 0.97;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  _draw() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    // Background: Bright, calming educational sky gradient
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#E0F2FE'); // Sky 100
    grad.addColorStop(0.5, '#BAE6FD'); // Sky 200
    grad.addColorStop(1, '#93C5FD'); // Sky 300
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Soft clouds
    this._drawClouds(ctx);

    // Particles
    this._drawParticles(ctx);

    // Bubbles
    this.bubbles.forEach(b => this._drawBubble(ctx, b));
  }

  _drawBubble(ctx, b) {
    if (b.state === 'dead') return;

    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.state === 'appearing') {
      ctx.scale(b.scale, b.scale);
      ctx.globalAlpha = b.opacity;
    }

    if (b.state === 'popping') {
      const s = 1 + b.popProgress * 0.5;
      ctx.scale(s, s);
      ctx.globalAlpha = 1 - b.popProgress;
    }

    if (b.state === 'idle') {
      const wobble = Math.sin(b.wobble) * 3;
      ctx.rotate(wobble * 0.02);
    }

    const r = b.radius;

    // Shadow / glow
    ctx.shadowColor = b.color;
    ctx.shadowBlur  = 20;

    // Main bubble circle
    const bubbleGrad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.05, 0, 0, r);
    bubbleGrad.addColorStop(0, this._lighten(b.color, 40));
    bubbleGrad.addColorStop(0.6, b.color);
    bubbleGrad.addColorStop(1, this._darken(b.color, 30));

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = bubbleGrad;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Shine highlight (top-left)
    const shineGrad = ctx.createRadialGradient(-r*0.35, -r*0.35, 0, -r*0.35, -r*0.35, r*0.6);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = shineGrad;
    ctx.fill();

    // Small specular dot
    ctx.beginPath();
    ctx.arc(-r*0.35, -r*0.35, r*0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Text
    ctx.shadowBlur = 0;
    ctx.globalAlpha = b.state === 'idle' ? 1 : ctx.globalAlpha;
    const fontSize = Math.max(14, Math.min(r * 0.44, 24));
    ctx.font = `800 ${fontSize}px 'Lexend', 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Truncate long text
    let displayText = b.text;
    while (ctx.measureText(displayText).width > r * 1.55 && displayText.length > 3) {
      displayText = displayText.slice(0, -1);
    }
    if (displayText !== b.text) displayText += '…';

    // Clear outline & crisp text
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillText(displayText, 0, 1.5);
    ctx.fillStyle = 'white';
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
  }

  _drawClouds(ctx) {
    if (!this.bgClouds) return;
    this.bgClouds.forEach(c => {
      c.x += c.speed;
      if (c.x - c.radius * 2 > this.canvas.width) {
        c.x = -c.radius * 2;
      }
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.arc(c.x + c.radius * 0.7, c.y - c.radius * 0.3, c.radius * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x + c.radius * 1.4, c.y, c.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── Interaction ──────────────────────────────
  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this._checkHit(x, y);
  }

  _handleTouch(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const touch = e.changedTouches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    this._checkHit(x, y);
  }

  _checkHit(x, y) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.state !== 'idle') continue;
      const dist = Math.hypot(x - b.x, y - b.y);
      // Dung sai +10px giúp học sinh bấm chạm mép bóng vẫn trúng ngon lành
      if (dist <= b.radius + 10) {
        this._popBubble(b);
        this.engine.answer(b.text);
        return;
      }
    }
  }

  _popBubble(bubble) {
    bubble.state = 'popping';
    this.engine.audio.play('pop');
    this._spawnParticles(bubble.x, bubble.y, bubble.color, bubble.isCorrect);
  }

  _spawnParticles(x, y, color, isCorrect) {
    const count = isCorrect ? 20 : 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = isCorrect
        ? 3 + Math.random() * 5
        : 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isCorrect ? 2 : 0),
        size:  isCorrect ? 6 + Math.random() * 6 : 3 + Math.random() * 4,
        color: isCorrect
          ? ['#43E97B', '#FFD93D', '#7C6FFF', '#FFFFFF'][Math.floor(Math.random() * 4)]
          : color,
        life: 1,
      });
    }
  }

  // ─── Screen Flash ─────────────────────────────
  flashScreen(isCorrect) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;pointer-events:none;z-index:200;
      background:${isCorrect ? 'rgba(67,233,123,0.15)' : 'rgba(255,71,87,0.15)'};
      animation: flashFade 0.4s ease forwards;
    `;
    document.body.appendChild(overlay);

    // Inject keyframe once
    if (!document.getElementById('flash-style')) {
      const style = document.createElement('style');
      style.id = 'flash-style';
      style.textContent = '@keyframes flashFade { 0%{opacity:1} 100%{opacity:0} }';
      document.head.appendChild(style);
    }

    setTimeout(() => overlay.remove(), 400);
  }

  // ─── Helpers ──────────────────────────────────
  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _generateClouds() {
    this.bgClouds = [];
    for (let i = 0; i < 6; i++) {
      this.bgClouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.7),
        radius: 35 + Math.random() * 45,
        speed: 0.15 + Math.random() * 0.25,
        opacity: 0.35 + Math.random() * 0.25,
      });
    }
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  _random(min, max) {
    return min + Math.random() * (max - min);
  }

  _randomWord() {
    const filler = ['jump', 'run', 'fly', 'swim', 'read', 'write', 'sing', 'dance',
                    'eat', 'sleep', 'play', 'draw', 'talk', 'walk', 'look', 'smile'];
    return filler[Math.floor(Math.random() * filler.length)];
  }

  _lighten(hex, amount) {
    return this._adjustColor(hex, amount);
  }
  _darken(hex, amount) {
    return this._adjustColor(hex, -amount);
  }
  _adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
    return `rgb(${r},${g},${b})`;
  }
}

// ES Module export
export { BubbleGame };
