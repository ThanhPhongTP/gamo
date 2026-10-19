/**
 * =============================================
 * GAMO - Core Game Engine ("Ruột")
 * =============================================
 * This is the shared core that every game "skin" plugs into.
 * Each game only needs to define: questions, visuals, interaction type.
 * The engine handles: scoring, timer, audio, events, state, analytics.
 */

class GameEngine {
  constructor(config = {}) {
    this.config = {
      timeLimit: config.timeLimit || 60,       // seconds per round
      lives: config.lives || 3,
      pointsCorrect: config.pointsCorrect || 10,
      pointsWrong: config.pointsWrong || -2,
      pointsTimeBonus: config.pointsTimeBonus || true,
      soundEnabled: config.soundEnabled !== false,
      ...config,
    };

    // State
    this.state = {
      score: 0,
      lives: this.config.lives,
      timeLeft: this.config.timeLimit,
      round: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
    };

    this.questions = [];
    this.currentQuestion = null;
    this.timerInterval = null;
    this.listeners = {};

    // Audio system
    this.audio = new AudioSystem();

    // Analytics collector
    this.analytics = {
      sessionId: this._generateId(),
      answers: [],
      startedAt: null,
      endedAt: null,
    };
  }

  // ─── Event System ───────────────────────────────
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  // ─── Game Lifecycle ──────────────────────────────
  loadQuestions(questions) {
    this.questions = this._shuffle([...questions]);
    this.state.totalQuestions = questions.length;
    return this;
  }

  start() {
    if (this.questions.length === 0) {
      console.warn('GameEngine: No questions loaded!');
      return;
    }
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.analytics.startedAt = new Date().toISOString();
    this._startTimer();
    this._nextQuestion();
    this.emit('game:start', { ...this.state });
  }

  pause() {
    if (!this.state.isRunning) return;
    this.state.isPaused = true;
    clearInterval(this.timerInterval);
    this.emit('game:pause', { ...this.state });
  }

  resume() {
    if (!this.state.isPaused) return;
    this.state.isPaused = false;
    this._startTimer();
    this.emit('game:resume', { ...this.state });
  }

  end(reason = 'completed') {
    clearInterval(this.timerInterval);
    this.state.isRunning = false;
    this.analytics.endedAt = new Date().toISOString();

    const summary = this._buildSummary(reason);
    this.emit('game:end', summary);
    return summary;
  }

  // ─── Answer Handling ─────────────────────────────
  answer(value) {
    if (!this.state.isRunning || this.state.isPaused) return;
    if (!this.currentQuestion) return;

    const isCorrect = this._checkAnswer(value);
    const timeBonus = this.config.pointsTimeBonus
      ? Math.floor(this.state.timeLeft * 0.1)
      : 0;

    if (isCorrect) {
      this.state.score += this.config.pointsCorrect + timeBonus;
      this.state.correctAnswers++;
      this.audio.play('correct');
      this.emit('answer:correct', {
        question: this.currentQuestion,
        answer: value,
        score: this.state.score,
        timeBonus,
      });
    } else {
      this.state.score = Math.max(0, this.state.score + this.config.pointsWrong);
      this.state.wrongAnswers++;
      this.state.lives--;
      this.audio.play('wrong');
      this.emit('answer:wrong', {
        question: this.currentQuestion,
        answer: value,
        correctAnswer: this.currentQuestion.answer,
        livesLeft: this.state.lives,
      });

      if (this.state.lives <= 0) {
        this.end('no-lives');
        return;
      }
    }

    // Record for analytics
    this.analytics.answers.push({
      questionId: this.currentQuestion.id,
      question: this.currentQuestion.question,
      userAnswer: value,
      correctAnswer: this.currentQuestion.answer,
      isCorrect,
      timestamp: Date.now(),
    });

    this._nextQuestion();
  }

  // ─── Internal Methods ────────────────────────────
  _nextQuestion() {
    if (this.state.round >= this.questions.length) {
      this.end('completed');
      return;
    }

    this.currentQuestion = this.questions[this.state.round];
    this.state.round++;
    this.emit('question:new', {
      question: this.currentQuestion,
      round: this.state.round,
      total: this.questions.length,
    });
  }

  _checkAnswer(value) {
    const correct = this.currentQuestion.answer;
    if (typeof correct === 'string') {
      return value.toString().toLowerCase().trim() === correct.toLowerCase().trim();
    }
    return value === correct;
  }

  _startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.isPaused) return;
      this.state.timeLeft--;
      this.emit('timer:tick', { timeLeft: this.state.timeLeft });

      if (this.state.timeLeft <= 0) {
        this.end('timeout');
      }
    }, 1000);
  }

  _buildSummary(reason) {
    const accuracy = this.state.totalQuestions > 0
      ? Math.round((this.state.correctAnswers / this.state.round) * 100)
      : 0;

    return {
      reason,
      score: this.state.score,
      correctAnswers: this.state.correctAnswers,
      wrongAnswers: this.state.wrongAnswers,
      totalAnswered: this.state.round,
      accuracy,
      timeUsed: this.config.timeLimit - this.state.timeLeft,
      analytics: this.analytics,
    };
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
}

// ─── Audio System ─────────────────────────────────
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const sounds = {
      correct: () => this._playTone(523.25, 'sine', 0.15, 0, 0.3),   // C5
      wrong:   () => this._playTone(220, 'sawtooth', 0.1, 0, 0.2),    // A3 buzz
      pop:     () => this._playTone(800, 'sine', 0.08, 0, 0.1),        // bubble pop
      tick:    () => this._playTone(440, 'sine', 0.03, 0, 0.05),       // tick
      win:     () => this._playWinFanfare(),
    };

    if (sounds[type]) sounds[type]();
  }

  _playTone(frequency, type, gain, delay, duration) {
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime + delay);
    gainNode.gain.setValueAtTime(gain, this.ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    oscillator.start(this.ctx.currentTime + delay);
    oscillator.stop(this.ctx.currentTime + delay + duration);
  }

  _playWinFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      this._playTone(freq, 'sine', 0.15, i * 0.12, 0.2);
    });
  }
}

// ES Module exports (used by Vite + all games)
export { GameEngine, AudioSystem };
