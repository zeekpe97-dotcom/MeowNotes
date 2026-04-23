/* ============================================
   MeowNotes - Living Cat Behavior System
   Random behaviors: walk, sit, lick, stretch, sleep
   ============================================ */

class CatAnimator {
  constructor() {
    this.stage = document.querySelector('.cat-stage');
    this.actor = document.querySelector('.cat-actor');
    this.shadow = document.querySelector('.cat-shadow');
    this.panel = document.querySelector('.ai-panel');
    this.sendBtn = document.querySelector('.chat__send-btn');
    this.statusMood = document.querySelector('.cat-status__mood');
    this.statusActivity = document.querySelector('.cat-status__activity');

    // Position tracking (percentage of stage width)
    this.posX = 50; // start centered
    this.facingLeft = false;

    // Timers
    this.behaviorTimer = null;
    this.sleepTimer = null;
    this.activeTimer = null;
    this.walkInterval = null;

    // Config
    this.SLEEP_DELAY = 35000;     // 35s idle → sleep
    this.MIN_BEHAVIOR = 3000;     // min time between behaviors
    this.MAX_BEHAVIOR = 7000;     // max time between behaviors
    this.WALK_SPEED = 60;         // ms per position tick
    this.WALK_STEP = 0.5;         // % per tick

    this.state = 'idle';
    this.init();
  }

  init() {
    if (!this.actor || !this.stage) return;

    this.setState('idle');
    this.scheduleBehavior();
    this.resetSleepTimer();

    // --- User interactions ---
    if (this.actor) {
      this.actor.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onInteract();
      });
    }

    if (this.panel) {
      this.panel.addEventListener('mouseenter', () => {
        if (this.state === 'sleep') {
          this.wakeUp();
        }
        this.resetSleepTimer();
      });
    }

    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => {
        this.onInteract();
      });
    }

    document.addEventListener('click', () => {
      this.resetSleepTimer();
    });
  }

  /* ============================
     State Management
     ============================ */
  setState(newState) {
    this.state = newState;
    this.actor.setAttribute('data-state', newState);

    // Handle facing direction class
    if (this.facingLeft) {
      this.actor.classList.add('facing-left');
    } else {
      this.actor.classList.remove('facing-left');
    }

    this.updatePosition();
    this.updateStatus();
  }

  updatePosition() {
    this.actor.style.left = this.posX + '%';
    if (this.shadow) {
      this.shadow.style.left = this.posX + '%';
    }
  }

  /* ============================
     Behavior Scheduler
     Randomly picks next action
     ============================ */
  scheduleBehavior() {
    clearTimeout(this.behaviorTimer);
    const delay = this.MIN_BEHAVIOR + Math.random() * (this.MAX_BEHAVIOR - this.MIN_BEHAVIOR);
    this.behaviorTimer = setTimeout(() => {
      if (this.state === 'sleep' || this.state === 'active') return;
      this.pickBehavior();
    }, delay);
  }

  pickBehavior() {
    // Weighted random selection
    const roll = Math.random();
    if (roll < 0.35) {
      this.doWalk();
    } else if (roll < 0.55) {
      this.doLick();
    } else if (roll < 0.70) {
      this.doStretch();
    } else {
      // Stay idle, just reschedule
      this.setState('idle');
      this.scheduleBehavior();
    }
  }

  /* ============================
     Walk Behavior
     ============================ */
  doWalk() {
    // Pick a random destination
    const minX = 15;
    const maxX = 85;
    const targetX = minX + Math.random() * (maxX - minX);

    // Determine direction
    this.facingLeft = targetX < this.posX;
    this.setState('walk');

    // Animate walking step by step
    const direction = targetX > this.posX ? 1 : -1;
    clearInterval(this.walkInterval);

    this.walkInterval = setInterval(() => {
      this.posX += this.WALK_STEP * direction;

      // Check if arrived
      if ((direction > 0 && this.posX >= targetX) ||
          (direction < 0 && this.posX <= targetX)) {
        this.posX = targetX;
        clearInterval(this.walkInterval);
        this.walkInterval = null;

        // Arrived: go back to idle
        this.setState('idle');
        this.scheduleBehavior();
        this.resetSleepTimer();
        return;
      }

      this.updatePosition();
    }, this.WALK_SPEED);
  }

  /* ============================
     Lick Behavior
     ============================ */
  doLick() {
    this.setState('lick');
    this.updateStatusCustom('😺 舔爪子中', '梳理毛发是很重要的...');

    // Lick for 3-5 seconds
    const duration = 3000 + Math.random() * 2000;
    setTimeout(() => {
      if (this.state === 'lick') {
        this.setState('idle');
        this.scheduleBehavior();
        this.resetSleepTimer();
      }
    }, duration);
  }

  /* ============================
     Stretch Behavior
     ============================ */
  doStretch() {
    this.setState('stretch');
    this.updateStatusCustom('😸 伸懒腰~', '好舒服啊...');

    // Stretch for 2-3 seconds
    const duration = 2000 + Math.random() * 1500;
    setTimeout(() => {
      if (this.state === 'stretch') {
        this.setState('idle');
        this.scheduleBehavior();
        this.resetSleepTimer();
      }
    }, duration);
  }

  /* ============================
     Sleep
     ============================ */
  enterSleep() {
    // Stop any current behavior
    clearInterval(this.walkInterval);
    clearTimeout(this.behaviorTimer);

    // Walk to center first if not already there
    this.posX = 50;
    this.facingLeft = false;
    this.setState('sleep');
  }

  wakeUp() {
    if (this.state !== 'sleep') return;
    this.setState('idle');
    this.scheduleBehavior();
    this.resetSleepTimer();
  }

  /* ============================
     User Interaction: Active
     ============================ */
  onInteract() {
    clearInterval(this.walkInterval);
    clearTimeout(this.behaviorTimer);
    clearTimeout(this.activeTimer);

    if (this.state === 'sleep') {
      this.wakeUp();
      return;
    }

    this.setState('active');

    this.activeTimer = setTimeout(() => {
      if (this.state === 'active') {
        this.setState('idle');
        this.scheduleBehavior();
        this.resetSleepTimer();
      }
    }, 2500);
  }

  /* ============================
     Status Text
     ============================ */
  updateStatus() {
    const states = {
      idle: {
        moods: ['好奇中', '放松中', '悠然自得', '观察中', '发呆中'],
        activities: ['正在看你写字...', '安静地坐着...', '欣赏窗外风景...', '等待新任务...', '望着你微笑...']
      },
      walk: {
        moods: ['探索中', '悠闲散步', '溜达溜达'],
        activities: ['在面板里散步...', '东走走西看看...', '找个好位置坐下...']
      },
      lick: {
        moods: ['爱干净', '梳妆中', '舔爪子中'],
        activities: ['梳理毛发是很重要的...', '今天也要漂漂亮亮...', '洗洗爪子再干活...']
      },
      stretch: {
        moods: ['伸懒腰~', '好舒服', '打哈欠~'],
        activities: ['好舒服啊...', '活动活动筋骨...', '伸展一下身体...']
      },
      sleep: {
        moods: ['犯困了', '做梦中', '打盹中'],
        activities: ['正在猫咪午睡...', '甜甜的梦乡...', '呼噜呼噜...']
      },
      active: {
        moods: ['兴奋！', '精神抖擞！', '想玩耍！'],
        activities: ['随时准备帮忙！', '为您效劳！', '一起加油吧！']
      }
    };

    const emojis = {
      idle: '😺', walk: '🐾', lick: '😺',
      stretch: '😸', sleep: '😴', active: '😸'
    };

    const s = states[this.state];
    if (!s) return;
    const mood = s.moods[Math.floor(Math.random() * s.moods.length)];
    const activity = s.activities[Math.floor(Math.random() * s.activities.length)];

    if (this.statusMood) this.statusMood.textContent = `${emojis[this.state]} ${mood}`;
    if (this.statusActivity) this.statusActivity.textContent = activity;
  }

  updateStatusCustom(mood, activity) {
    if (this.statusMood) this.statusMood.textContent = mood;
    if (this.statusActivity) this.statusActivity.textContent = activity;
  }

  /* ============================
     Sleep Timer
     ============================ */
  resetSleepTimer() {
    clearTimeout(this.sleepTimer);
    this.sleepTimer = setTimeout(() => {
      if (this.state !== 'sleep' && this.state !== 'active') {
        this.enterSleep();
      }
    }, this.SLEEP_DELAY);
  }
}
