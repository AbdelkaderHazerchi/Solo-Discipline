/* ============================================================
   DISCIPLINE MANAGER — Complete Application Logic
   ============================================================ */

/* ============================================================
   1. DEFAULT STATE
   ============================================================ */
const DEFAULTS = {
  version: 5,
  user: {
    name: 'User',
    points: 0,
    level: 1,
    xp: 0,
    maxXp: 100,
    language: 'en',
    theme: 'dark',
    joinedAt: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0
  },
  tasks: { today: [], tomorrow: [], completed: [], failed: [] },
  goals: [],
  achievements: [],
  history: [],
  inventory: [],
  raids: {
    permanent: [
      { id: 'perm_e', rank: 'E', name: 'Goblin Nest', task: 'Complete 3 Pomodoro sessions', icon: '\u{1F3D8}\uFE0F', completed: false, points: 50, xp: 100 },
      { id: 'perm_c', rank: 'C', name: 'Golem Cave', task: 'Run 2 kilometers', icon: '\u{1FAA8}', completed: false, points: 120, xp: 240 },
      { id: 'perm_a', rank: 'A', name: 'Orc Territory', task: 'Finish a major project block', icon: '\u{2694}\uFE0F', completed: false, points: 250, xp: 500 }
    ],
    activeTimed: [],
    lastTimedRaidTimestamp: null,
    pendingTimedRaid: null
  },
  lastMigrationDate: null,
  habits: [],
  habitsLastResetDate: null,
  weeklySchedule: [],
  weeklyScheduleLastMigrationDayIndex: null
};

const RANK_TIERS = [
  { min: 1, max: 9, en: 'Rank E Hunter', ar: 'صياد المرتبة E', color: 'e' },
  { min: 10, max: 19, en: 'Rank D Hunter', ar: 'صياد المرتبة D', color: 'd' },
  { min: 20, max: 29, en: 'Rank C Hunter', ar: 'صياد المرتبة C', color: 'c' },
  { min: 30, max: 39, en: 'Rank B Hunter', ar: 'صياد المرتبة B', color: 'b' },
  { min: 40, max: 49, en: 'Rank A Hunter', ar: 'صياد المرتبة A', color: 'a' },
  { min: 50, max: 59, en: 'Rank S Hunter', ar: 'صياد المرتبة S', color: 's' },
  { min: 60, max: Infinity, en: 'National Level Hunter (Rank SS)', ar: 'صياد المستوى الوطني (المرتبة SS)', color: 'ss' }
];

const RANK_COLORS = {
  e: '#5a6a7a',
  d: '#4a7a9a',
  c: '#3a8aba',
  b: '#2a9ada',
  a: '#1aabfa',
  s: '#00d2ff',
  ss: '#8866ff'
};

const ACHIEVEMENT_DEFS = [
  {
    id: 'first_task',
    icon: '<i class="fa-solid fa-check-circle icon"></i>',
    title: { en: 'First Task', ar: 'أول مهمة' },
    desc: { en: 'Complete your first task', ar: 'أكمل مهمتك الأولى' },
    check: s => s.history.filter(h => h.type === 'completed').length >= 1
  },
  {
    id: 'task_machine_25',
    icon: '<i class="fa-solid fa-clipboard-list icon"></i>',
    title: { en: 'Task Machine', ar: 'آلة المهام' },
    desc: { en: 'Complete 25 tasks', ar: 'أكمل 25 مهمة' },
    check: s => s.history.filter(h => h.type === 'completed').length >= 25
  },
  {
    id: 'task_machine_100',
    icon: '<i class="fa-solid fa-clipboard-list icon"></i>',
    title: { en: 'Task Legend', ar: 'أسطورة المهام' },
    desc: { en: 'Complete 100 tasks', ar: 'أكمل 100 مهمة' },
    check: s => s.history.filter(h => h.type === 'completed').length >= 100
  },
  {
    id: 'first_goal',
    icon: '<i class="fa-solid fa-bullseye icon"></i>',
    title: { en: 'First Goal', ar: 'أول هدف' },
    desc: { en: 'Achieve your first goal', ar: 'حقق هدفك الأول' },
    check: s => s.goals.filter(g => g.completed).length >= 1
  },
  {
    id: 'five_goals',
    icon: '<i class="fa-solid fa-trophy icon"></i>',
    title: { en: 'Goal Crusher', ar: 'محطم الأهداف' },
    desc: { en: 'Complete 5 goals', ar: 'أكمل 5 أهداف' },
    check: s => s.goals.filter(g => g.completed).length >= 5
  },
  {
    id: 'rapid_progress',
    icon: '<i class="fa-solid fa-bolt icon"></i>',
    title: { en: 'Rapid Progress', ar: 'تقدم سريع' },
    desc: { en: 'Earn 1,000 points', ar: 'احصل على 1000 نقطة' },
    check: s => s.user.points >= 1000
  },
  {
    id: 'point_collector',
    icon: '<i class="fa-solid fa-coins icon"></i>',
    title: { en: 'Point Collector', ar: 'جامع النقاط' },
    desc: { en: 'Accumulate 5,000 points', ar: 'اجمع 5000 نقطة' },
    check: s => s.user.points >= 5000
  },
  {
    id: 'week_discipline',
    icon: '<i class="fa-solid fa-fire icon"></i>',
    title: { en: 'One Week of Discipline', ar: 'أسبوع من الانضباط' },
    desc: { en: '7-day discipline streak', ar: 'سلسلة انضباط 7 أيام' },
    check: s => s.user.currentStreak >= 7 || s.user.longestStreak >= 7
  },
  {
    id: 'two_weeks_discipline',
    icon: '<i class="fa-solid fa-fire icon"></i>',
    title: { en: 'Two Weeks of Discipline', ar: 'أسبوعان من الانضباط' },
    desc: { en: '14-day discipline streak', ar: 'سلسلة انضباط 14 يومًا' },
    check: s => s.user.currentStreak >= 14 || s.user.longestStreak >= 14
  },
  {
    id: 'month_discipline',
    icon: '<i class="fa-solid fa-gem icon"></i>',
    title: { en: 'One Month of Discipline', ar: 'شهر من الانضباط' },
    desc: { en: '30-day discipline streak', ar: 'سلسلة انضباط 30 يومًا' },
    check: s => s.user.currentStreak >= 30 || s.user.longestStreak >= 30
  },
  {
    id: 'two_months_discipline',
    icon: '<i class="fa-solid fa-gem icon"></i>',
    title: { en: 'Two Months of Discipline', ar: 'شهران من الانضباط' },
    desc: { en: '60-day discipline streak', ar: 'سلسلة انضباط 60 يومًا' },
    check: s => s.user.currentStreak >= 60 || s.user.longestStreak >= 60
  },
  {
    id: 'level_5',
    icon: '<i class="fa-solid fa-star icon"></i>',
    title: { en: 'Apprentice', ar: 'مبتدئ' },
    desc: { en: 'Reach level 5', ar: 'وصل إلى المستوى 5' },
    check: s => s.user.level >= 5
  },
  {
    id: 'level_10',
    icon: '<i class="fa-solid fa-star icon"></i>',
    title: { en: 'Warrior', ar: 'محارب' },
    desc: { en: 'Reach level 10', ar: 'وصل إلى المستوى 10' },
    check: s => s.user.level >= 10
  },
  {
    id: 'level_25',
    icon: '<i class="fa-solid fa-star icon"></i>',
    title: { en: 'Legend', ar: 'أسطورة' },
    desc: { en: 'Reach level 25', ar: 'وصل إلى المستوى 25' },
    check: s => s.user.level >= 25
  }
];

const QUOTES = [
  { ar: 'الانضباط هو الجسر بين الأهداف والإنجاز.', en: 'Discipline is the bridge between goals and accomplishment.' },
  { ar: 'سر المضي قدمًا هو البدء.', en: 'The secret of getting ahead is getting started.' },
  { ar: 'الأهداف العظيمة تتطلب انضباطًا عظيمًا.', en: 'Great goals require great discipline.' },
  { ar: 'لا تنتظر الدافع، اصنع الانضباط.', en: "Don't wait for motivation, create discipline." },
  { ar: 'النجاح ليس صدفة، بل هو خيار يومي.', en: 'Success is not an accident, it is a daily choice.' },
  { ar: 'الانضباط هو تفضيل ما تريده مستقبلاً على ما تريده الآن.', en: 'Discipline is choosing what you want most over what you want now.' },
  { ar: 'الأفعال الصغيرة المستمرة تحقق نتائج كبيرة.', en: 'Small, consistent actions yield big results.' },
  { ar: 'تحكم في عاداتك، وإلا ستحكمك هي.', en: 'Control your habits, or they will control you.' },
  { ar: 'الطريقة الوحيدة للفشل هي التوقف عن المحاولة.', en: 'The only way to fail is to stop trying.' },
  { ar: 'التركيز هو مفتاح تحويل الأحلام إلى واقع.', en: 'Focus is the key to turning dreams into reality.' },
  { ar: 'الانضباط يؤلم للحظات، لكن الندم يؤلم مدى الحياة.', en: 'Discipline hurts for a moment, regret hurts for a lifetime.' },
  { ar: 'النجاح يبدأ عندما تخرج من منطقة راحتك.', en: "Success begins where your comfort zone ends." },
  { ar: 'اجعل هدفك أكبر من أعذارك.', en: 'Make your goal bigger than your excuses.' },
  { ar: 'لا تتمنَّ أن يكون الأمر أسهل، بل كن أنت أفضل.', en: "Don't wish it were easier, wish you were better." },
  { ar: 'الاستمرارية هي ما يحول العمل العادي إلى تميز.', en: 'Consistency is what transforms average into excellence.' },
  { ar: 'حدد هدفك، ثم ضع خطة، ثم التزم بها.', en: 'Set a goal, make a plan, then stick to it.' },
  { ar: 'الانضباط الذاتي هو القوة الحقيقية.', en: 'Self-discipline is the ultimate power.' },
  { ar: 'طاقتك تذهب حيث يذهب تركيزك.', en: 'Where focus goes, energy flows.' },
  { ar: 'لا تنظر إلى الخلف، أنت لا تسير في ذلك الاتجاه.', en: "Don't look back, you are not going that way." },
  { ar: 'العبقرية هي 1% إلهام و 99% جهد وانضباط.', en: 'Genius is 1% inspiration and 99% perspiration.' },
  { ar: 'من يملك العزيمة يملك المستقبل.', en: 'He who has determination owns the future.' },
  { ar: 'الأحلام لا تعمل إلا إذا قمت أنت بالعمل.', en: "Dreams don't work unless you do." },
  { ar: 'العوائق هي تلك الأشياء المخيفة التي تراها عندما ترفع عينيك عن هدفك.', en: 'Obstacles are those frightful things you see when you take your eyes off your goal.' },
  { ar: 'كن صلبًا في مواجهة التحديات، ومرنًا في خطتك.', en: 'Be stubborn about your goals, but flexible about your methods.' },
  { ar: 'كل يوم هو فرصة جديدة لتقترب من هدفك.', en: 'Every day is a new chance to get closer to your goal.' },
  { ar: 'النجاح هو مجموع الجهود الصغيرة المتكررة يوماً بعد يوم.', en: 'Success is the sum of small efforts, repeated day in and day out.' },
  { ar: 'لا تتوقف عندما تتعب، توقف عندما تنتهي.', en: "Don't stop when you are tired, stop when you are done." },
  { ar: 'الانضباط هو الذي يبقيك مستمرًا عندما يختفي الحماس.', en: 'Discipline is what keeps you going when motivation fades.' },
  { ar: 'إذا كنت تريد شيئاً لم تملكه من قبل، يجب أن تفعل شيئاً لم تفعله من قبل.', en: "If you want something you've never had, you must do something you've never done." },
  { ar: 'استثمر في نفسك، فهو الاستثمار الذي لا يخسر أبدًا.', en: 'Invest in yourself, it is the investment that never loses.' },
  { ar: 'ليس هناك مصعد للنجاح، عليك صعود السلالم.', en: 'There is no elevator to success, you have to take the stairs.' },
  { ar: 'الإرادة القوية تقصر المسافات.', en: 'A strong will shortens the distance.' },
  { ar: 'لا تقارن نفسك بالآخرين، قارن نفسك بمن كنت عليه بالأمس.', en: "Don't compare yourself to others, compare yourself to who you were yesterday." },
  { ar: 'الثقة بالنفس والالتزام هما وقود النجاح.', en: 'Self-confidence and commitment are the fuel of success.' },
  { ar: 'من أراد القمة، ترك القاع.', en: 'He who wants the summit must leave the bottom.' },
  { ar: 'اجعل من الفشل أول خطوة في طريق نجاحك.', en: 'Make failure the first step on your path to success.' },
  { ar: 'غيّر عاداتك تتغير حياتك.', en: 'Change your habits, change your life.' },
  { ar: 'الوقت سيمر على أي حال، فاجعله يمر في تحقيق أهدافك.', en: 'Time will pass anyway, so spend it achieving your goals.' },
  { ar: 'النجاح لا يأتي إليك، بل أنت من تذهب إليه.', en: "Success doesn't come to you, you go to it." },
  { ar: 'البدايات الصعبة تصنع نهايات عظيمة.', en: 'Hard beginnings make great endings.' },
  { ar: 'انضباطك اليوم هو حريتك غدًا.', en: 'Your discipline today is your freedom tomorrow.' },
  { ar: 'الخطط مجرد نوايا ما لم تتحول إلى عمل شاق فورًا.', en: 'Plans are only good intentions unless they immediately degenerate into hard work.' },
  { ar: 'القوة لا تأتي من القدرة الجسدية، بل من الإرادة التي لا تقهر.', en: 'Strength does not come from physical capacity, it comes from an indomitable will.' },
  { ar: 'العقل المنضبط يقود إلى حياة ناجحة.', en: 'A disciplined mind leads to a successful life.' },
  { ar: 'لا تقلل من شأن خطوة صغيرة تخطوها نحو هدفك.', en: 'Never underestimate a small step taken toward your goal.' },
  { ar: 'كن القائد لحياتك، ولا تترك الظروف تقودك.', en: "Be the leader of your life, don't let circumstances drive you." },
  { ar: 'التميز ليس عملاً عابراً، بل هو عادة.', en: 'Excellence is not an act, but a habit.' },
  { ar: 'تغلب على عقلك قبل أن تتغلب على العالم.', en: 'Conquer your mind before you conquer the world.' },
  { ar: 'الهدف بدون خطة لا يتعدى كونه أمنية.', en: 'A goal without a plan is just a wish.' },
  { ar: 'آمن بأنك تستطيع، وسوف تجد نفسك في نصف الطريق.', en: "Believe you can and you're halfway there." }
];

/* ============================================================
   1b. LOOT TABLE
   ============================================================ */
const TIER1_ITEMS = [
  { icon: '🗡️', name: 'Common Dagger', level: 1, tier: 'Common' },
  { icon: '⚔️', name: 'Common Sword', level: 1, tier: 'Common' },
  { icon: '⛑️', name: 'Armor Helmet', level: 1, tier: 'Common' },
  { icon: '🛡️', name: 'Chestplate Armor', level: 1, tier: 'Common' },
  { icon: '🔱', name: 'Spear', level: 1, tier: 'Common' },
  { icon: '🛡️', name: 'Round Shield', level: 1, tier: 'Common' }
];

const SCALABLE_TEMPLATES = [
  { icon: '🗡️', name: 'Magic Dagger', tier: 'Uncommon' },
  { icon: '⚔️', name: 'Golden Sword', tier: 'Uncommon' },
  { icon: '🔱', name: 'War Spear', tier: 'Uncommon' },
  { icon: '🛡️', name: 'Guardian Shield', tier: 'Uncommon' },
  { icon: '🗡️', name: 'Shadow Dagger', tier: 'Rare' },
  { icon: '⚔️', name: 'Moonlight Sword', tier: 'Rare' },
  { icon: '🔱', name: 'Thunder Spear', tier: 'Rare' },
  { icon: '🛡️', name: 'Aegis Shield', tier: 'Rare' },
  { icon: '🗡️', name: 'Soul Reaver', tier: 'Epic' },
  { icon: '⚔️', name: 'Frostbrand', tier: 'Epic' }
];

const MONSTER_ITEMS = [
  { icon: '🦷', name: 'Monster Wolf Fang', level: 5, tier: 'Rare' },
  { icon: '🔮', name: 'Magical Wolf Fang', level: 10, tier: 'Rare' },
  { icon: '🦊', name: 'Demon Fox Claw', level: 15, tier: 'Rare' },
  { icon: '👁️', name: 'Lesser Demon Eye', level: 25, tier: 'Rare' },
  { icon: '🦷', name: 'Demon Fang', level: 40, tier: 'Rare' }
];

const EPIC_ITEMS = [
  { icon: '📿', name: "Demon Guard Commander's Necklace", level: 50, tier: 'Epic' },
  { icon: '💍', name: "Prince of the Underworld's Ring", level: 60, tier: 'Epic' }
];

const LEGENDARY_ITEMS = [
  { icon: '👑', name: "Demon King's Crown", level: 75, tier: 'Legendary' },
  { icon: '🔮', name: 'Eye of the Demon King', level: 80, tier: 'Legendary' }
];

const SPECIAL_ITEMS = [
  { icon: '🧰', name: 'Treasure Chest', level: 1, tier: 'Special' }
];

/* ============================================================
   1c. RAID SYSTEM
   ============================================================ */
const RAID_RANK_COLORS = {
  E: '#00d2ff', D: '#4a9aff', C: '#66ddaa',
  B: '#aa66ff', A: '#ff8844', S: '#ff4466', SS: '#ffaa00'
};

const TIMED_RAID_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

const TIMED_RAID_TASKS = [
  'Complete 3 hours of Deep Focus',
  'Run 5 Kilometers',
  'Finish a major backlog project block',
  'Complete 4 Pomodoro cycles',
  'Read 50 pages of a book',
  'Write 1000 words of a report',
  'Complete 2 online course modules',
  'Organize your entire workspace',
  'Complete 1 hour of intense workout',
  'Finish a creative project milestone'
];

const TIMED_RAID_NAMES = [
  'Gate of the Fallen', 'Abyssal Gate', 'Crimson Gate',
  'Shadow Gate', 'Gate of Trials', 'Celestial Gate'
];

function generateTimedRaid() {
  const rank = pickRandom(TIMED_RAID_RANKS);
  const task = pickRandom(TIMED_RAID_TASKS);
  const name = pickRandom(TIMED_RAID_NAMES);
  const rankIndex = TIMED_RAID_RANKS.indexOf(rank);
  const basePoints = 40 + rankIndex * 50;
  return {
    id: uid(),
    rank,
    name: `${rank}-Rank ${name}`,
    task,
    icon: '🌀',
    points: basePoints,
    xp: basePoints * 2,
    createdAt: new Date().toISOString()
  };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollLoot(userLevel) {
  if (Math.random() > 0.75) return null;

  const r = Math.random();
  let item;

  if (r < 0.40) {
    item = { ...pickRandom(TIER1_ITEMS) };
  } else if (r < 0.70) {
    const template = pickRandom(SCALABLE_TEMPLATES);
    const lvl = Math.min(Math.max(2, userLevel), 100);
    item = { icon: template.icon, name: template.name, level: lvl, tier: template.tier };
  } else if (r < 0.85) {
    item = { ...pickRandom(MONSTER_ITEMS) };
  } else if (r < 0.93) {
    item = { ...pickRandom(EPIC_ITEMS) };
  } else if (r < 0.98) {
    item = { ...pickRandom(LEGENDARY_ITEMS) };
  } else {
    item = { ...pickRandom(SPECIAL_ITEMS) };
  }

  return item;
}

function rollRaidLoot(userLevel) {
  if (Math.random() > 0.95) return null;

  const r = Math.random();
  let item;

  if (r < 0.25) {
    const template = pickRandom(SCALABLE_TEMPLATES);
    const lvl = Math.min(Math.max(2, userLevel + 5), 100);
    item = { icon: template.icon, name: template.name, level: lvl, tier: template.tier };
  } else if (r < 0.50) {
    item = { ...pickRandom(MONSTER_ITEMS) };
  } else if (r < 0.75) {
    item = { ...pickRandom(EPIC_ITEMS) };
  } else if (r < 0.90) {
    item = { ...pickRandom(LEGENDARY_ITEMS) };
  } else {
    item = { ...pickRandom(SPECIAL_ITEMS) };
  }

  return item;
}

function rollHabitLoot() {
  if (Math.random() > 0.175) return null;
  return Math.random() < 0.5
    ? { icon: '\u{1F9F0}', name: 'Treasure Chest', level: 1, tier: 'Special' }
    : { icon: '\u{2694}\uFE0F', name: 'Habit Sword', level: 1, tier: 'Uncommon' };
}

function addItemToInventory(item) {
  const inv = State.data.inventory;
  const existing = inv.find(i => i.name === item.name && i.level === item.level);
  if (existing) {
    existing.quantity += 1;
  } else {
    inv.push({ ...item, quantity: 1 });
  }

  if (item.name === 'Treasure Chest') {
    State.data.user.points += 1000;
    UI.showToast(`<i class="fa-solid fa-gem icon"></i> 💰 ${item.name} opened! +1000 Points!`, 'loot');
  }

  State.save();
}

/* ============================================================
   2. STATE
   ============================================================ */
const State = {
  data: null,

  get() { return this.data; },

  save() {
    Storage.save();
  },

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULTS));
    this.save();
  }
};

/* ============================================================
   3. STORAGE
   ============================================================ */
const Storage = {
  KEY: 'discipline_manager',

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(State.data));
  },

  migrateIfNeeded() {
    const data = State.data;
    const today = getTodayStr();
    if (data.lastMigrationDate === today) return;

    const yesterday = data.lastMigrationDate;
    if (yesterday) {
      // Update streak based on yesterday's performance
      const hadTasks = data.tasks.today.length > 0;
      const hadCompleted = data.tasks.today.some(t => t.completed);
      if (hadTasks && hadCompleted) {
        data.user.currentStreak += 1;
      } else if (hadTasks && !hadCompleted) {
        data.user.currentStreak = 0;
      }
      // If no tasks yesterday, streak stays unchanged
      data.user.longestStreak = Math.max(data.user.longestStreak, data.user.currentStreak);

      // Archive yesterday's tasks to history
      for (const task of data.tasks.today) {
        if (task.completed) {
          data.history.push({
            date: yesterday,
            type: 'completed',
            points: task.points,
            xp: task.xp,
            taskText: task.text
          });
        } else {
          // Apply penalty for missed tasks
          const penaltyPoints = Math.round(task.points * 0.5);
          const penaltyXp = 10;
          data.user.points = Math.max(0, data.user.points - penaltyPoints);
          data.user.xp = Math.max(0, data.user.xp - penaltyXp);
          data.history.push({
            date: yesterday,
            type: 'missed',
            points: -penaltyPoints,
            xp: -penaltyXp,
            taskText: task.text
          });
        }
      }
    }

    // Migrate tomorrow's tasks to today (if locked)
    const newToday = [];
    for (const task of data.tasks.tomorrow) {
      if (task.locked) {
        newToday.push({
          ...task,
          completed: false,
          id: Date.now() + Math.random(),
          targetDate: task.targetDate || today
        });
      }
    }
    data.tasks.today = newToday;
    data.tasks.tomorrow = data.tasks.tomorrow.filter(t => !t.locked);
    data.lastMigrationDate = today;

    // --- Weekly Schedule midnight migration ---
    if (yesterday && data.weeklySchedule && data.weeklySchedule.length > 0) {
      const getDayIndex = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return (d.getDay() + 1) % 7; // 0=Sat, 1=Sun ... 6=Fri
      };
      const yesterdayDayIndex = getDayIndex(yesterday);
      const yesterdayHabits = data.weeklySchedule.filter(h => h.dayIndex === yesterdayDayIndex);
      for (const habit of yesterdayHabits) {
        if (habit.completed) {
          data.history.push({
            date: yesterday,
            type: 'completed',
            points: habit.points,
            xp: habit.xp,
            taskText: habit.text
          });
          data.user.points += habit.points;
          data.user.xp += habit.xp;
        } else {
          const penaltyPoints = Math.round(habit.points * 0.5);
          const penaltyXp = 10;
          data.user.points = Math.max(0, data.user.points - penaltyPoints);
          data.user.xp = Math.max(0, data.user.xp - penaltyXp);
          data.history.push({
            date: yesterday,
            type: 'missed',
            points: -penaltyPoints,
            xp: -penaltyXp,
            taskText: habit.text
          });
        }
        habit.completed = false;
      }
      data.weeklyScheduleLastMigrationDayIndex = yesterdayDayIndex;
    }

    this.save();
  }
};

/* ============================================================
   4. HELPERS
   ============================================================ */
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getRank(level) {
  for (const tier of RANK_TIERS) {
    if (level >= tier.min && level <= tier.max) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

function getRankColor(level) {
  return RANK_COLORS[getRank(level).color];
}

function getRealWorldDayIndex() {
  return (new Date().getDay() + 1) % 7;
}

function getDayName(dayIndex, lang) {
  const names = {
    en: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    ar: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
  };
  return names[lang][dayIndex];
}

/* ============================================================
   5. GAME ENGINE
   ============================================================ */
const Game = {
  completeTask(task) {
    const u = State.data.user;
    u.points += task.points;
    u.xp += task.xp;
    this.checkLevelUp();
  },

  completeGoal(goal) {
    const u = State.data.user;
    u.points += goal.points;
    u.xp += goal.xp;
    this.checkLevelUp();
  },

  checkLevelUp() {
    const u = State.data.user;
    while (u.xp >= u.maxXp) {
      u.xp -= u.maxXp;
      u.level += 1;
      u.maxXp = u.level * 100;
      u.points += 100 + u.level * 10; // Level-up bonus scales with level
      UI.showToast(`<i class="fa-solid fa-certificate icon"></i> ${t('levelUp')}! ${t('level')} ${u.level}`, 'success');
      UI.updateProfile();
    }
    UI.updateProfile();
    State.save();
  },

  applyPenalty(points, xp) {
    const u = State.data.user;
    u.points = Math.max(0, u.points - points);
    u.xp = Math.max(0, u.xp - xp);
    State.save();
  },

  addHistory(entry) {
    State.data.history.push({
      date: getTodayStr(),
      ...entry
    });
    State.save();
  }
};

/* ============================================================
   6. UI RENDERERS & DOM REFS
   ============================================================ */
const UI = {
  // Cache DOM refs
  els: {},

  cache() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      welcomeModal: $('welcome-modal'),
      userNameInput: $('user-name-input'),
      welcomeStartBtn: $('welcome-start-btn'),
      welcomeTitle: $('welcome-title'),
      nameLabel: $('name-label'),
      langToggle: $('lang-toggle'),
      modalOverlay: $('modal-overlay'),
      modalTitle: $('modal-title'),
      modalBody: $('modal-body'),
      modalFooter: $('modal-footer'),
      modalClose: document.querySelector('.modal-close'),
      toastContainer: $('toast-container'),
      profileName: $('profile-name'),
      profileRank: $('profile-rank'),
      profilePoints: $('profile-points'),
      profileLevel: $('profile-level'),
      profileAvatar: $('profile-avatar'),
      xpFill: $('xp-fill'),
      xpText: $('xp-text'),
      todayDate: $('today-date'),
      todayList: $('today-list'),
      todayEmpty: $('today-empty'),
      tomorrowList: $('tomorrow-list'),
      tomorrowEmpty: $('tomorrow-empty'),
      addTomorrowBtn: $('add-tomorrow-btn'),
      lockTomorrowBtn: $('lock-tomorrow-btn'),
      goalsGrid: $('goals-grid'),
      goalsEmpty: $('goals-empty'),
      addGoalBtn: $('add-goal-btn'),
      achievementsGrid: $('achievements-grid'),
      navBtns: document.querySelectorAll('.nav-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      performanceChart: $('performance-chart'),
      completionChart: $('completion-chart'),
      chartFilters: document.querySelectorAll('.btn-filter'),
      quoteAr: $('quote-ar'),
      quoteEn: $('quote-en'),
      quotePrev: $('quote-prev'),
      quoteNext: $('quote-next'),
      // Raids refs
      gateModal: $('gate-modal'),
      gateRankDisplay: $('gate-rank-display'),
      gateTaskDisplay: $('gate-task-display'),
      gateTimerValue: $('gate-timer-value'),
      gateDescription: $('gate-description'),
      gateAcceptBtn: $('gate-accept-btn'),
      gateDeclineBtn: $('gate-decline-btn'),
      timedRaidsList: $('timed-raids-list'),
      timedRaidsEmpty: $('timed-raids-empty'),
      permanentRaidsList: $('permanent-raids-list'),
      permanentRaidsEmpty: $('permanent-raids-empty'),
      habitsList: $('habits-list'),
      habitsEmpty: $('habits-empty'),
      habitNameInput: $('habit-name-input'),
      habitDescInput: $('habit-desc-input'),
      habitPointsInput: $('habit-points-input'),
      addHabitBtn: $('add-habit-btn')
    };
  },

  /* --- Toast --- */
  showToast(msg, type = 'info') {
    const container = this.els.toastContainer;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  /* --- Profile --- */
  updateProfile() {
    const u = State.data.user;
    const rank = getRank(u.level);
    const lang = u.language;
    this.els.profileName.textContent = u.name;
    this.els.profileRank.textContent = lang === 'ar'
      ? `${rank.ar} (${rank.en})`
      : `${rank.en} (${rank.ar})`;
    this.els.profilePoints.textContent = u.points;
    this.els.profileLevel.textContent = u.level;
    const pct = Math.min(100, (u.xp / u.maxXp) * 100);
    this.els.xpFill.style.width = `${pct}%`;
    this.els.xpText.textContent = `${u.xp} / ${u.maxXp} XP`;
    const color = getRankColor(u.level);
    this.els.profileAvatar.style.borderColor = color;
    this.els.profileAvatar.style.boxShadow = `0 0 16px ${color}66`;
  },

  /* --- Today --- */
  renderToday() {
    const list = this.els.todayList;
    const empty = this.els.todayEmpty;
    const tasks = State.data.tasks.today;
    const lang = State.data.user.language;
    const today = getTodayStr();

    if (tasks.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    list.innerHTML = tasks.map(t => {
      const isOverdue = !t.completed && t.targetDate && t.targetDate < today;
      const dateDisplay = t.targetDate ? new Date(t.targetDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : '';
      return `
        <li class="task-item ${t.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${t.id}">
          <button class="task-checkbox ${t.completed ? 'checked' : ''}">${t.completed ? '<i class="fa-solid fa-check"></i>' : ''}</button>
          <span class="task-text">${t.text}</span>
          ${dateDisplay ? `<span class="task-date">${dateDisplay}</span>` : ''}
          <span class="task-points">+${t.points}pts</span>
        </li>
      `;
    }).join('');

    list.querySelectorAll('.task-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const li = btn.closest('.task-item');
        const id = li.dataset.id;
        this.toggleTaskComplete(id);
      });
    });
  },

  toggleTaskComplete(taskId) {
    const tasks = State.data.tasks.today;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    task.completed = true;
    Game.completeTask(task);
    Game.addHistory({ type: 'completed', points: task.points, xp: task.xp, taskText: task.text });
    this.renderToday();
    this.updateProfile();
    this.checkAchievements();
    this.showToast(`<i class="fa-solid fa-check-circle icon"></i> ${t('taskDone')}! +${task.points}pts`, 'success');

    const loot = rollLoot(State.data.user.level);
    if (loot) {
      const nameStr = `${loot.icon} ${loot.name}${loot.level > 1 ? ` [Lvl ${loot.level}]` : ''}`;
      addItemToInventory(loot);
      this.renderInventory();
      this.showToast(`<i class="fa-solid fa-gem icon"></i> [NOTIFICATION: You have acquired "${nameStr}"! Check your Inventory.]`, 'loot');
    }

    State.save();
  },

  checkOverdueTasks() {
    const data = State.data;
    const today = getTodayStr();
    let penalized = false;

    const processTasks = (tasks) => {
      const remaining = [];
      for (const task of tasks) {
        if (!task.completed && task.targetDate && task.targetDate < today) {
          const penaltyPoints = Math.round(task.points * 0.5);
          const penaltyXp = 10;
          data.user.points = Math.max(0, data.user.points - penaltyPoints);
          data.user.xp = Math.max(0, data.user.xp - penaltyXp);
          data.history.push({
            date: today,
            type: 'missed',
            points: -penaltyPoints,
            xp: -penaltyXp,
            taskText: task.text
          });
          penalized = true;
        } else {
          remaining.push(task);
        }
      }
      return remaining;
    };

    data.tasks.today = processTasks(data.tasks.today);
    data.tasks.tomorrow = processTasks(data.tasks.tomorrow);

    if (penalized) {
      State.save();
      this.updateProfile();
      this.renderToday();
      this.showToast('<i class="fa-solid fa-triangle-exclamation icon"></i> ' + t('overduePenalty'), 'error');
    }
  },

  /* --- Tomorrow (legacy - kept for migration compat) --- */
  renderTomorrow() {
    const list = this.els.tomorrowList;
    if (!list) return;
    const empty = this.els.tomorrowEmpty;
    const tasks = State.data.tasks.tomorrow;
    const locked = tasks.some(t => t.locked);
    const lang = State.data.user.language;

    if (tasks.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    list.innerHTML = tasks.map(t => {
      const dateDisplay = t.targetDate ? new Date(t.targetDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : '';
      return `
        <li class="task-item" data-id="${t.id}">
          <span class="task-text">${t.text}</span>
          ${dateDisplay ? `<span class="task-date">${dateDisplay}</span>` : ''}
          <span class="task-points">+${t.points}pts</span>
          ${!t.locked ? `<button class="task-delete" data-id="${t.id}"><i class="fa-solid fa-xmark icon"></i></button>` : ''}
        </li>
      `;
    }).join('');

    if (!locked) {
      list.querySelectorAll('.task-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          State.data.tasks.tomorrow = State.data.tasks.tomorrow.filter(t => t.id !== id);
          this.renderTomorrow();
          State.save();
        });
      });
    }

    if (this.els.lockTomorrowBtn) this.els.lockTomorrowBtn.style.display = locked ? 'none' : 'inline-flex';
    if (this.els.addTomorrowBtn) this.els.addTomorrowBtn.style.display = locked ? 'none' : 'inline-flex';
  },

  showAddTaskModal(defaultDate, targetArray = 'tomorrow') {
    this.showModal(
      t('addTask'),
      `
        <div class="form-group">
          <label>${t('taskText')}</label>
          <input type="text" id="modal-task-text" class="form-input" placeholder="${t('taskPlaceholder')}" maxlength="100">
        </div>
        <div class="form-group">
          <label>${t('taskDate')}</label>
          <input type="date" id="modal-task-date" class="form-input" value="${defaultDate}">
        </div>
        <div class="form-group">
          <label>${t('taskPoints')}</label>
          <input type="number" id="modal-task-points" class="form-input" value="25" min="5" max="100">
        </div>
      `,
      `
        <button class="btn btn-secondary" data-close-modal>${t('cancel')}</button>
        <button class="btn btn-primary" id="modal-add-task-btn"><i class="fa-solid fa-plus icon"></i> ${t('add')}</button>
      `
    );

    document.getElementById('modal-add-task-btn').addEventListener('click', () => {
      const text = document.getElementById('modal-task-text').value.trim();
      const points = parseInt(document.getElementById('modal-task-points').value) || 25;
      const taskDate = document.getElementById('modal-task-date').value || defaultDate;
      if (!text) return;
      const task = {
        id: uid(),
        text,
        points,
        xp: points * 2,
        locked: targetArray === 'tomorrow',
        targetDate: taskDate,
        completed: false,
        createdAt: new Date().toISOString()
      };
      State.data.tasks[targetArray].push(task);
      this.closeModal();
      this.renderToday();
      this.renderTomorrow();
      State.save();
    });
  },

  lockTomorrow() {
    const tasks = State.data.tasks.tomorrow;
    if (tasks.length === 0) {
      this.showToast(t('noTasksToLock'), 'error');
      return;
    }
    const tomorrow = getTomorrowStr();
    State.data.tasks.tomorrow = tasks.map(t => ({ ...t, locked: true, targetDate: t.targetDate || tomorrow }));
    this.renderTomorrow();
    this.showToast(`<i class="fa-solid fa-lock icon"></i> ${t('planLocked')}!`, 'success');
    State.save();
  },

  /* --- Goals --- */
  renderGoals() {
    const grid = this.els.goalsGrid;
    const empty = this.els.goalsEmpty;
    const goals = State.data.goals;
    const lang = State.data.user.language;

    if (goals.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = goals.map(g => {
      const deadline = new Date(g.targetDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
      const isOverdue = !g.completed && new Date(g.targetDate) < new Date();
      return `
        <div class="goal-card ${g.completed ? 'completed' : ''}" data-id="${g.id}">
          <h4>${g.completed ? '<i class="fa-solid fa-check-circle icon"></i> ' : ''}${g.title}</h4>
          <p>${g.description || ''}</p>
          <div class="goal-meta">
            <span><i class="fa-solid fa-calendar icon"></i> ${deadline} ${isOverdue ? '<i class="fa-solid fa-triangle-exclamation icon"></i>' : ''}</span>
            <span>+${g.points}pts</span>
          </div>
          ${!g.completed ? `<button class="btn btn-primary btn-sm complete-goal" data-id="${g.id}"><i class="fa-solid fa-check icon"></i> ${t('complete')}</button>` : ''}
          <button class="btn btn-danger btn-sm delete-goal" data-id="${g.id}"><i class="fa-solid fa-xmark icon"></i></button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.complete-goal').forEach(btn => {
      btn.addEventListener('click', () => this.completeGoal(btn.dataset.id));
    });
    grid.querySelectorAll('.delete-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        State.data.goals = State.data.goals.filter(g => g.id !== btn.dataset.id);
        this.renderGoals();
        State.save();
      });
    });
  },

  completeGoal(goalId) {
    const goal = State.data.goals.find(g => g.id === goalId);
    if (!goal || goal.completed) return;
    goal.completed = true;
    Game.completeGoal(goal);
    Game.addHistory({ type: 'goal', points: goal.points, xp: goal.xp, taskText: goal.title });
    this.renderGoals();
    this.updateProfile();
    this.checkAchievements();
    this.showToast(`<i class="fa-solid fa-bullseye icon"></i> ${t('goalDone')}! +${goal.points}pts`, 'success');

    const loot = rollLoot(State.data.user.level);
    if (loot) {
      const nameStr = `${loot.icon} ${loot.name}${loot.level > 1 ? ` [Lvl ${loot.level}]` : ''}`;
      addItemToInventory(loot);
      this.renderInventory();
      this.showToast(`<i class="fa-solid fa-gem icon"></i> [NOTIFICATION: You have acquired "${nameStr}"! Check your Inventory.]`, 'loot');
    }

    State.save();
  },

  showAddGoalModal() {
    this.showModal(
      t('newGoal'),
      `
        <div class="form-group">
          <label>${t('goalTitle')}</label>
          <input type="text" id="modal-goal-title" class="form-input" placeholder="${t('goalPlaceholder')}" maxlength="80">
        </div>
        <div class="form-group">
          <label>${t('goalDesc')}</label>
          <input type="text" id="modal-goal-desc" class="form-input" placeholder="${t('goalDescPlaceholder')}" maxlength="200">
        </div>
        <div class="form-group">
          <label>${t('targetDate')}</label>
          <input type="date" id="modal-goal-date" class="form-input">
        </div>
        <div class="form-group">
          <label>${t('goalPoints')}</label>
          <input type="number" id="modal-goal-points" class="form-input" value="200" min="50" max="1000">
        </div>
      `,
      `
        <button class="btn btn-secondary" data-close-modal>${t('cancel')}</button>
        <button class="btn btn-primary" id="modal-add-goal-btn"><i class="fa-solid fa-bullseye icon"></i> ${t('createGoal')}</button>
      `
    );

    // Set min date to today
    document.getElementById('modal-goal-date').min = getTodayStr();

    document.getElementById('modal-add-goal-btn').addEventListener('click', () => {
      const title = document.getElementById('modal-goal-title').value.trim();
      const description = document.getElementById('modal-goal-desc').value.trim();
      const targetDate = document.getElementById('modal-goal-date').value;
      const points = parseInt(document.getElementById('modal-goal-points').value) || 200;
      if (!title || !targetDate) return;
      State.data.goals.push({
        id: uid(),
        title,
        description,
        targetDate,
        points,
        xp: points * 3,
        completed: false,
        createdAt: new Date().toISOString()
      });
      this.closeModal();
      this.renderGoals();
      State.save();
    });
  },

  /* --- Achievements --- */
  renderAchievements() {
    const grid = this.els.achievementsGrid;
    const state = State.data;
    const lang = state.user.language;
    const unlockedIds = new Set(state.achievements.map(a => a.id));

    if (ACHIEVEMENT_DEFS.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>' + t('noAchievements') + '</p></div>';
      return;
    }

    grid.innerHTML = ACHIEVEMENT_DEFS.map(def => {
      const isUnlocked = unlockedIds.has(def.id);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <h4>${def.icon} ${def.title[lang]}</h4>
          <p>${def.desc[lang]}</p>
          <div class="achievement-meta">
            <span>${isUnlocked ? '<i class="fa-solid fa-check-circle icon"></i> ' + t('unlocked') : '<i class="fa-solid fa-lock icon"></i> ' + t('locked')}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  checkAchievements() {
    const state = State.data;
    const unlockedIds = new Set(state.achievements.map(a => a.id));
    let newUnlock = false;

    for (const def of ACHIEVEMENT_DEFS) {
      if (unlockedIds.has(def.id)) continue;
      if (def.check(state)) {
        state.achievements.push({
          id: def.id,
          unlockedAt: getTodayStr()
        });
        const lang = state.user.language;
        this.showToast(`<i class="fa-solid fa-trophy icon"></i> ${t('achUnlocked')}: ${def.title[lang]}`, 'success');
        newUnlock = true;
      }
    }

    if (newUnlock) {
      this.renderAchievements();
      State.save();
    }
  },

  /* --- Inventory --- */
  renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const empty = document.getElementById('inventory-empty');
    const count = document.getElementById('inventory-count');
    const items = State.data.inventory;

    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (count) count.textContent = '0';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (count) count.textContent = items.length;

    grid.innerHTML = items.map(item => {
      const qty = item.quantity || 1;
      const tierLower = item.tier.toLowerCase();
      return `
        <div class="inventory-slot" data-tier="${tierLower}" data-name="${item.name}" data-level="${item.level}" data-rarity="${tierLower}">
          <div class="inv-icon">${item.icon}</div>
          <div class="inv-name">${item.name}</div>
          <div class="inv-level">Lvl ${item.level}</div>
          ${qty > 1 ? `<span class="inv-qty-badge">x${qty}</span>` : ''}
          <div class="inv-tooltip">
            <div class="tooltip-name">${item.icon} ${item.name}</div>
            <div class="tooltip-level">Level: ${item.level}</div>
            <div class="tooltip-tier" data-rarity="${tierLower}">${item.tier}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  /* --- Quotes --- */
  _quoteIndex: 0,

  initQuotes() {
    this._quoteIndex = Math.floor(Math.random() * QUOTES.length);
    this.showQuote(this._quoteIndex);
    // Rotate every 60 seconds
    setInterval(() => {
      this._quoteIndex = (this._quoteIndex + 1) % QUOTES.length;
      this.showQuote(this._quoteIndex);
    }, 60000);
    // Nav buttons
    this.els.quotePrev.addEventListener('click', () => {
      this._quoteIndex = (this._quoteIndex - 1 + QUOTES.length) % QUOTES.length;
      this.showQuote(this._quoteIndex);
    });
    this.els.quoteNext.addEventListener('click', () => {
      this._quoteIndex = (this._quoteIndex + 1) % QUOTES.length;
      this.showQuote(this._quoteIndex);
    });
  },

  showQuote(index) {
    const q = QUOTES[index];
    this.els.quoteAr.textContent = q.ar;
    this.els.quoteEn.textContent = `"${q.en}"`;
  },

  /* --- Modal --- */
  showModal(title, bodyHTML, footerHTML) {
    this.els.modalTitle.textContent = title;
    this.els.modalBody.innerHTML = bodyHTML;
    this.els.modalFooter.innerHTML = footerHTML;
    this.els.modalOverlay.classList.remove('hidden');

    // Bind close buttons
    const close = () => this.closeModal();
    const closeOnOverlay = (e) => {
      if (e.target === this.els.modalOverlay) close();
    };
    // Remove old listeners by cloning, then add fresh ones
    const newClose = this.els.modalClose.cloneNode(true);
    this.els.modalClose.replaceWith(newClose);
    this.els.modalClose = newClose;
    this.els.modalClose.addEventListener('click', close);

    this.els.modalOverlay.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', close);
    });
    this.els.modalOverlay.addEventListener('click', closeOnOverlay);
    // Store the overlay click handler so we can clean up later
    this._overlayCloseHandler = closeOnOverlay;
  },

  closeModal() {
    this.els.modalOverlay.classList.add('hidden');
    // Clean up overlay click listener to avoid stacking
    if (this._overlayCloseHandler) {
      this.els.modalOverlay.removeEventListener('click', this._overlayCloseHandler);
      this._overlayCloseHandler = null;
    }
  },

  /* --- Charts --- */
  charts: { perf: null, comp: null },
  currentFilter: 7,

  updateCharts() {
    if (typeof Chart === 'undefined') return;
    this.renderPerformanceChart(this.currentFilter);
    this.renderCompletionChart();
  },

  renderPerformanceChart(days) {
    if (typeof Chart === 'undefined') return;
    const ctx = this.els.performanceChart.getContext('2d');
    if (this.charts.perf) { this.charts.perf.destroy(); }

    const history = State.data.history;
    const dates = [];
    const pointsMap = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dates.push(key);
      pointsMap[key] = 0;
    }

    for (const h of history) {
      if (pointsMap[h.date] !== undefined) {
        pointsMap[h.date] += (h.points || 0);
      }
    }

    const dataPoints = dates.map(d => pointsMap[d]);

    this.charts.perf = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(d => d.slice(5)),
        datasets: [{
          label: t('points'),
          data: dataPoints,
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0, 210, 255, 0.12)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d2ff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.15)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxTicksLimit: Math.min(days, 30) }
          }
        }
      }
    });
  },

  renderCompletionChart() {
    if (typeof Chart === 'undefined') return;
    const ctx = this.els.completionChart.getContext('2d');
    if (this.charts.comp) { this.charts.comp.destroy(); }

    const history = State.data.history;
    let completed = history.filter(h => h.type === 'completed' || h.type === 'goal').length;
    let missed = history.filter(h => h.type === 'missed').length;
    if (completed === 0 && missed === 0) { completed = 1; } // Show placeholder

    this.charts.comp = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [t('completed'), t('missed')],
        datasets: [{
          data: [completed, missed],
          backgroundColor: ['#00d2ff', '#ff4466'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              padding: 12,
              usePointStyle: true
            }
          }
        }
      }
    });
  },

  /* --- Raids --- */
  _gateTimerInterval: null,

  renderRaids() {
    this.renderPermanentRaids();
    this.renderActiveTimedRaids();
  },

  renderPermanentRaids() {
    const list = this.els.permanentRaidsList;
    const empty = this.els.permanentRaidsEmpty;
    const raids = State.data.raids.permanent;
    const lang = State.data.user.language;

    if (!list) return;

    const allDone = raids.length > 0 && raids.every(r => r.completed);
    if (raids.length === 0 || allDone) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = raids.map(r => {
      if (r.completed) return '';
      const color = RAID_RANK_COLORS[r.rank] || '#00d2ff';
      return `
        <div class="raid-card" data-rank="${r.rank}">
          <div class="raid-card-header">
            <span class="raid-icon">${r.icon}</span>
            <span class="raid-name">${r.name}</span>
            <span class="raid-rank-badge" style="color:${color};border-color:${color}">${r.rank}-Rank</span>
          </div>
          <div class="raid-task-text"><i class="fa-solid fa-bullseye icon"></i> ${r.task}</div>
          <div class="raid-rewards">
            <span class="raid-reward-points"><i class="fa-solid fa-coins icon"></i> +${r.points} pts</span>
            <span class="raid-reward-xp"><i class="fa-solid fa-bolt icon"></i> +${r.xp} XP</span>
            <span class="raid-reward-loot"><i class="fa-solid fa-gem icon"></i> 95% Loot</span>
          </div>
          <button class="btn btn-primary btn-sm complete-raid-btn" data-id="${r.id}" data-type="permanent">
            <i class="fa-solid fa-check icon"></i> <span data-en="Complete Raid" data-ar="إكمال الغارة">Complete Raid</span>
          </button>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.complete-raid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.completeRaid(btn.dataset.id, btn.dataset.type);
      });
    });
  },

  renderActiveTimedRaids() {
    const list = this.els.timedRaidsList;
    const empty = this.els.timedRaidsEmpty;
    const raids = State.data.raids.activeTimed;

    if (!list) return;

    if (raids.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = raids.map(r => {
      const color = RAID_RANK_COLORS[r.rank] || '#00d2ff';
      const timeLeft = r.expiresAt ? formatTimeRemaining(r.expiresAt) : '—';
      const isUrgent = r.expiresAt && (r.expiresAt - Date.now()) < 86400000;
      return `
        <div class="raid-card ${isUrgent ? 'timed-urgent' : ''}" data-rank="${r.rank}">
          <div class="raid-card-header">
            <span class="raid-icon">${r.icon}</span>
            <span class="raid-name">${r.name}</span>
            <span class="raid-rank-badge" style="color:${color};border-color:${color}">${r.rank}-Rank</span>
          </div>
          <div class="raid-task-text"><i class="fa-solid fa-bullseye icon"></i> ${r.task}</div>
          <div class="raid-rewards">
            <span class="raid-reward-points"><i class="fa-solid fa-coins icon"></i> +${r.points} pts</span>
            <span class="raid-reward-xp"><i class="fa-solid fa-bolt icon"></i> +${r.xp} XP</span>
            <span class="raid-reward-loot"><i class="fa-solid fa-gem icon"></i> 95% Loot</span>
          </div>
          <div class="raid-timer" style="font-size:0.72rem;font-family:var(--font-mono);color:${isUrgent ? 'var(--accent-red-text)' : 'var(--text-muted)'};margin-bottom:10px;">
            <i class="fa-regular fa-clock icon"></i> ${timeLeft} remaining
          </div>
          <button class="btn btn-primary btn-sm complete-raid-btn" data-id="${r.id}" data-type="timed">
            <i class="fa-solid fa-check icon"></i> <span data-en="Complete Raid" data-ar="إكمال الغارة">Complete Raid</span>
          </button>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.complete-raid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.completeRaid(btn.dataset.id, btn.dataset.type);
      });
    });
  },

  completeRaid(raidId, type) {
    const data = State.data;
    let raid;

    if (type === 'permanent') {
      raid = data.raids.permanent.find(r => r.id === raidId);
      if (!raid || raid.completed) return;
      raid.completed = true;
    } else {
      const idx = data.raids.activeTimed.findIndex(r => r.id === raidId);
      if (idx === -1) return;
      raid = data.raids.activeTimed[idx];
      data.raids.activeTimed.splice(idx, 1);
    }

    const u = data.user;
    u.points += raid.points;
    u.xp += raid.xp;
    Game.checkLevelUp();
    this.renderRaids();
    this.updateProfile();
    this.showToast(`<i class="fa-solid fa-dungeon icon"></i> Raid Complete! +${raid.points}pts`, 'success');

    const loot = rollRaidLoot(u.level);
    if (loot) {
      const nameStr = `${loot.icon} ${loot.name}${loot.level > 1 ? ` [Lvl ${loot.level}]` : ''}`;
      addItemToInventory(loot);
      this.renderInventory();
      this.showToast(`<i class="fa-solid fa-gem icon"></i> [Raid Loot] You acquired "${nameStr}"!`, 'loot');
    } else {
      this.showToast(`<i class="fa-solid fa-skull icon"></i> No loot dropped this time...`, 'error');
    }

    State.save();
  },

  /* --- Gate Modal --- */
  showGateModal(pending) {
    const els = this.els;
    const { raid, expiresAt } = pending;
    const color = RAID_RANK_COLORS[raid.rank] || '#00d2ff';

    els.gateRankDisplay.textContent = `RANK: ${raid.rank}`;
    els.gateRankDisplay.style.color = color;
    els.gateTaskDisplay.textContent = `Task: ${raid.task}`;
    els.gateDescription.innerHTML = `A <strong style="color:${color}">${raid.rank}-Rank</strong> gate has appeared near your location. Step through to face the challenge and earn powerful rewards.`;
    els.gateModal.classList.remove('hidden');

    this._startGateTimer(expiresAt);
  },

  _startGateTimer(expiresAt) {
    this._stopGateTimer();

    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      this.els.gateTimerValue.textContent = display;

      if (remaining <= 60000) {
        this.els.gateTimerValue.classList.add('urgent');
      } else {
        this.els.gateTimerValue.classList.remove('urgent');
      }

      if (remaining <= 0) {
        this._stopGateTimer();
        this.declineGateRaid(true);
      }
    };

    update();
    this._gateTimerInterval = setInterval(update, 1000);
  },

  _stopGateTimer() {
    if (this._gateTimerInterval) {
      clearInterval(this._gateTimerInterval);
      this._gateTimerInterval = null;
    }
  },

  acceptGateRaid() {
    const data = State.data;
    if (!data.raids.pendingTimedRaid) return;

    const raid = data.raids.pendingTimedRaid.raid;
    raid.expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
    data.raids.activeTimed.push(raid);
    data.raids.pendingTimedRaid = null;
    State.save();

    this._stopGateTimer();
    this.els.gateModal.classList.add('hidden');
    this.renderRaids();
    this.showToast(`<i class="fa-solid fa-dungeon icon"></i> Gate accepted! Complete it within 3 days or lose points.`, 'success');
  },

  declineGateRaid(fromTimer = false) {
    const data = State.data;
    if (!data.raids.pendingTimedRaid) return;

    data.raids.pendingTimedRaid = null;
    State.save();

    this._stopGateTimer();
    this.els.gateModal.classList.add('hidden');
    if (!fromTimer) {
      this.showToast(`<i class="fa-solid fa-skull icon"></i> The gate has closed. Wait 3 days for the next one.`, 'error');
    }
  },

  /* --- Habits --- */
  renderHabits() {
    const list = this.els.habitsList;
    const empty = this.els.habitsEmpty;
    const habits = State.data.habits;
    const lang = State.data.user.language;

    if (!list) return;

    if (habits.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    list.innerHTML = habits.map(h => `
      <div class="habit-card ${h.completed ? 'completed' : ''}" data-id="${h.id}">
        <div class="habit-info">
          <div class="habit-name">${h.name}</div>
          ${h.description ? `<div class="habit-desc">${h.description}</div>` : ''}
        </div>
        <span class="habit-points">${h.completed ? '<i class="fa-solid fa-check icon"></i>' : '+'}${h.points}pts</span>
        ${!h.completed
          ? `<button class="btn btn-primary btn-sm habit-complete-btn"><i class="fa-solid fa-check icon"></i> ${t('complete')}</button>`
          : ''}
        <button class="btn btn-danger btn-sm habit-delete-btn"><i class="fa-solid fa-xmark icon"></i></button>
      </div>
    `).join('');

    list.querySelectorAll('.habit-complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.habit-card');
        this.completeHabit(card.dataset.id);
      });
    });

    list.querySelectorAll('.habit-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.habit-card');
        this.deleteHabit(card.dataset.id);
      });
    });
  },

  addHabit() {
    const name = this.els.habitNameInput.value.trim();
    const description = this.els.habitDescInput.value.trim();
    const points = parseInt(this.els.habitPointsInput.value) || 15;
    if (!name) {
      this.showToast('<i class="fa-solid fa-triangle-exclamation icon"></i> Please enter a habit name.', 'error');
      return;
    }

    State.data.habits.push({
      id: uid(),
      name,
      description,
      points,
      completed: false
    });

    this.els.habitNameInput.value = '';
    this.els.habitDescInput.value = '';
    this.els.habitPointsInput.value = '15';
    this.renderHabits();
    State.save();
    this.showToast(`<i class="fa-solid fa-plus icon"></i> Habit "${name}" added!`, 'success');
  },

  deleteHabit(id) {
    State.data.habits = State.data.habits.filter(h => h.id !== id);
    this.renderHabits();
    State.save();
  },

  completeHabit(id) {
    const habit = State.data.habits.find(h => h.id === id);
    if (!habit || habit.completed) return;

    habit.completed = true;
    const u = State.data.user;
    u.points += habit.points;
    u.xp += habit.points * 2;
    Game.checkLevelUp();

    const loot = rollHabitLoot();
    if (loot) {
      const nameStr = `${loot.icon} ${loot.name}${loot.level > 1 ? ` [Lvl ${loot.level}]` : ''}`;
      addItemToInventory(loot);
      this.renderInventory();
      this.showToast(`<i class="fa-solid fa-gem icon"></i> [Habit Reward] You found "${nameStr}"!`, 'loot');
    }

    this.renderHabits();
    this.updateProfile();
    this.showToast(`<i class="fa-solid fa-check-circle icon"></i> Habit "${habit.name}" done! +${habit.points}pts`, 'success');
    State.save();
  },

  checkHabitDailyReset() {
    const data = State.data;
    const today = getTodayStr();
    if (data.habitsLastResetDate === today) return;

    let penalized = false;
    for (const habit of data.habits) {
      if (!habit.completed) {
        const penalty = Math.round(habit.points * 0.5);
        data.user.points = Math.max(0, data.user.points - penalty);
        data.history.push({
          date: data.habitsLastResetDate || today,
          type: 'missed',
          points: -penalty,
          xp: -10,
          taskText: `Habit: ${habit.name}`
        });
        penalized = true;
      }
      habit.completed = false;
    }

    data.habitsLastResetDate = today;

    if (penalized) {
      this.showToast('<i class="fa-solid fa-triangle-exclamation icon"></i> ' + t('habitPenalty'), 'error');
    }

    this.renderHabits();
    this.updateProfile();
    State.save();
  },

  /* --- Weekly Schedule --- */
  renderWeeklySchedule() {
    const container = document.getElementById('schedule-grid');
    if (!container) return;
    const habits = State.data.weeklySchedule || [];
    const lang = State.data.user.language;
    const currentDayIndex = getRealWorldDayIndex();

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayHabits = habits.filter(h => h.dayIndex === i);
      const isToday = i === currentDayIndex;
      const dayLabel = getDayName(i, lang);

      const habitsHTML = dayHabits.map(h => `
        <div class="schedule-habit ${h.completed ? 'completed' : ''} ${isToday ? '' : 'disabled'}" data-id="${h.id}" title="${h.text}">
          <button class="schedule-check-btn ${h.completed ? 'checked' : ''} ${isToday ? '' : 'locked'}" data-id="${h.id}" ${!isToday ? 'disabled' : ''}>
            ${h.completed ? '<i class="fa-solid fa-check"></i>' : ''}
          </button>
          <span class="schedule-habit-text">${h.text}</span>
          <span class="schedule-habit-points">+${h.points}</span>
          <button class="schedule-delete-btn" data-id="${h.id}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join('');

      days.push(`
        <div class="schedule-day-col ${isToday ? 'today' : ''}" data-day="${i}">
          <div class="schedule-day-header ${isToday ? 'active-day' : ''}">
            <span class="schedule-day-name">${dayLabel}</span>
          </div>
          <div class="schedule-day-habits">${habitsHTML}</div>
          <button class="schedule-add-habit-btn btn btn-secondary btn-sm" data-day="${i}">
            <i class="fa-solid fa-plus icon"></i> <span data-en="Add" data-ar="إضافة">Add</span>
          </button>
        </div>
      `);
    }

    container.innerHTML = days.join('');

    // Bind check buttons
    container.querySelectorAll('.schedule-check-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.toggleScheduleHabit(id);
      });
    });

    // Bind delete buttons
    container.querySelectorAll('.schedule-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        State.data.weeklySchedule = State.data.weeklySchedule.filter(h => h.id !== id);
        this.renderWeeklySchedule();
        State.save();
      });
    });

    // Bind add buttons
    container.querySelectorAll('.schedule-add-habit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayIndex = parseInt(btn.dataset.day);
        this.showAddScheduleHabitModal(dayIndex);
      });
    });
  },

  showAddScheduleHabitModal(dayIndex) {
    const dayName = getDayName(dayIndex, State.data.user.language);
    this.showModal(
      t('addScheduleHabit') + ' - ' + dayName,
      `
        <div class="form-group">
          <label>${t('habitName')}</label>
          <input type="text" id="modal-schedule-text" class="form-input" placeholder="${t('taskPlaceholder')}" maxlength="60">
        </div>
        <div class="form-group">
          <label>${t('taskPoints')}</label>
          <input type="number" id="modal-schedule-points" class="form-input" value="20" min="5" max="100">
        </div>
      `,
      `
        <button class="btn btn-secondary" data-close-modal>${t('cancel')}</button>
        <button class="btn btn-primary" id="modal-add-schedule-btn"><i class="fa-solid fa-plus icon"></i> ${t('add')}</button>
      `
    );

    document.getElementById('modal-add-schedule-btn').addEventListener('click', () => {
      const text = document.getElementById('modal-schedule-text').value.trim();
      const points = parseInt(document.getElementById('modal-schedule-points').value) || 20;
      if (!text) return;
      State.data.weeklySchedule.push({
        id: uid(),
        dayIndex,
        text,
        points,
        xp: points * 2,
        completed: false
      });
      this.closeModal();
      this.renderWeeklySchedule();
      State.save();
    });
  },

  toggleScheduleHabit(id) {
    const habit = State.data.weeklySchedule.find(h => h.id === id);
    if (!habit || habit.completed) return;

    const currentDayIndex = getRealWorldDayIndex();
    if (habit.dayIndex !== currentDayIndex) {
      this.showToast('<i class="fa-solid fa-lock icon"></i> ' + t('scheduleWrongDay'), 'error');
      return;
    }

    habit.completed = true;
    Game.completeTask(habit);
    Game.addHistory({ type: 'completed', points: habit.points, xp: habit.xp, taskText: habit.text });
    this.renderWeeklySchedule();
    this.updateProfile();
    this.checkAchievements();
    this.showToast(`<i class="fa-solid fa-check-circle icon"></i> ${t('scheduleHabitDone')}! +${habit.points}pts`, 'success');

    const loot = rollLoot(State.data.user.level);
    if (loot) {
      const nameStr = `${loot.icon} ${loot.name}${loot.level > 1 ? ` [Lvl ${loot.level}]` : ''}`;
      addItemToInventory(loot);
      this.renderInventory();
      this.showToast(`<i class="fa-solid fa-gem icon"></i> [NOTIFICATION: You have acquired "${nameStr}"! Check your Inventory.]`, 'loot');
    }

    State.save();
  }
};

/* ============================================================
   7. INTERNATIONALIZATION (Bilingual)
   ============================================================ */
const TRANSLATIONS = {
  en: {
    levelUp: 'Level Up',
    level: 'Level',
    taskDone: 'Task completed',
    goalDone: 'Goal completed',
    addTask: 'Add Task',
    taskText: 'Task',
    taskPlaceholder: 'What do you want to do?',
    taskPoints: 'Points (5-100)',
    cancel: 'Cancel',
    add: 'Add',
    noTasksToLock: 'No tasks to lock!',
    planLocked: 'Plan locked for tomorrow',
    newGoal: 'New Goal',
    goalTitle: 'Goal Title',
    goalPlaceholder: 'e.g., Read 10 books',
    goalDesc: 'Description (optional)',
    goalDescPlaceholder: 'Describe your goal...',
    targetDate: 'Target Date',
    goalPoints: 'Points (50-1000)',
    createGoal: 'Create Goal',
    complete: 'Complete',
    achUnlocked: 'Achievement Unlocked',
    points: 'Points',
    completed: 'Completed',
    missed: 'Missed',
    taskDate: 'Date',
    days: 'Days',
    day: 'Day',
    overduePenalty: 'Overdue tasks! Points deducted.',
    noAchievements: 'Complete tasks and goals to unlock achievements!',
    unlocked: 'Unlocked',
    locked: 'Locked',
    completeRaid: 'Complete Raid',
    raidComplete: 'Raid Complete!',
    gateAccepted: 'Gate accepted! New timed raid added.',
    gateDeclined: 'The gate has closed. Wait 3 days for the next one.',
    noLootDrop: 'No loot dropped this time...',
    timedRaidsEmpty: 'No active timed raids. Wait for a Gate to appear!',
    permanentRaidsAllDone: 'All permanent raids completed. New ones may appear later!',
    acceptRaid: 'Accept Raid',
    ignoreRaid: 'Ignore (Raid Vanishes)',
    habits: 'Habits',
    habitName: 'Habit Name',
    habitDesc: 'Description',
    habitPoints: 'Points',
    addHabit: 'Add Habit',
    completeHabit: 'Complete',
    deleteHabit: 'Delete',
    habitDone: 'Habit completed',
    noHabits: 'No habits yet. Create a daily habit!',
    habitPenalty: 'Uncompleted habits! Points deducted.',
    addScheduleHabit: 'Add Weekly Habit',
    scheduleHabitDone: 'Weekly habit completed',
    scheduleWrongDay: 'You can only check habits on their scheduled day!'
  },
  ar: {
    levelUp: 'ارتقى المستوى',
    level: 'المستوى',
    taskDone: 'تم إنجاز المهمة',
    goalDone: 'تم تحقيق الهدف',
    addTask: 'أضف مهمة',
    taskText: 'المهمة',
    taskPlaceholder: 'ماذا تريد أن تفعل؟',
    taskDate: 'التاريخ',
    taskPoints: 'النقاط (5-100)',
    cancel: 'إلغاء',
    add: 'إضافة',
    noTasksToLock: 'لا توجد مهام للحفظ!',
    planLocked: 'تم حفظ خطة الغد',
    newGoal: 'هدف جديد',
    goalTitle: 'عنوان الهدف',
    goalPlaceholder: 'مثال: قراءة 10 كتب',
    goalDesc: 'الوصف (اختياري)',
    goalDescPlaceholder: 'صف هدفك...',
    targetDate: 'تاريخ الهدف',
    goalPoints: 'النقاط (50-1000)',
    createGoal: 'إنشاء هدف',
    complete: 'إكمال',
    achUnlocked: 'تم فتح الإنجاز',
    points: 'النقاط',
    completed: 'مكتمل',
    missed: 'فائت',
    days: 'أيام',
    day: 'يوم',
    overduePenalty: 'مهام متأخرة! تم خصم النقاط.',
    noAchievements: 'أكمل المهام والأهداف لفتح الإنجازات!',
    unlocked: 'مفتوح',
    locked: 'مغلق',
    completeRaid: 'إكمال الغارة',
    raidComplete: 'تم إكمال الغارة!',
    gateAccepted: 'تم قبول البوابة! تمت إضافة غارة محددة جديدة.',
    gateDeclined: 'أغلقت البوابة. انتظر 3 أيام للبوابة التالية.',
    noLootDrop: 'لم تسقط غنائم هذه المرة...',
    timedRaidsEmpty: 'لا توجد غارات محددة نشطة. انتظر ظهور بوابة!',
    permanentRaidsAllDone: 'تم إكمال جميع الغارات الدائمة. قد تظهر غارات جديدة لاحقًا!',
    acceptRaid: 'قبول الغارة',
    ignoreRaid: 'تجاهل (تختفي الغارة)',
    habits: 'العادات',
    habitName: 'اسم العادة',
    habitDesc: 'الوصف',
    habitPoints: 'النقاط',
    addHabit: 'أضف عادة',
    completeHabit: 'إكمال',
    deleteHabit: 'حذف',
    habitDone: 'تم إنجاز العادة',
    noHabits: 'لا توجد عادات بعد. أنشئ عادة يومية!',
    habitPenalty: 'عادات غير مكتملة! تم خصم النقاط.',
    addScheduleHabit: 'إضافة عادة أسبوعية',
    scheduleHabitDone: 'تم إنجاز العادة الأسبوعية',
    scheduleWrongDay: 'يمكنك فقط تحديد العادات في يومها المحدد!'
  }
};

function t(key) {
  const lang = State.data ? State.data.user.language : 'en';
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}

/* ============================================================
   8. LANGUAGE & THEME
   ============================================================ */
function applyLanguage(lang) {
  State.data.user.language = lang;
  const root = document.documentElement;
  root.lang = lang === 'ar' ? 'ar' : 'en';
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  UI.els.langToggle.innerHTML = '<i class="fa-solid fa-language icon"></i>';

  // Update all data-* attributes for bilingual text
  document.querySelectorAll('[data-en]').forEach(el => {
    const key = el.getAttribute(`data-${lang}`);
    if (key) el.textContent = key;
  });
  // Update input placeholders too
  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    const key = el.getAttribute(`data-placeholder-${lang}`);
    if (key) el.placeholder = key;
  });

  UI.updateProfile();
  UI.renderToday();
  UI.renderHabits();
  UI.renderGoals();
  UI.renderAchievements();
  UI.renderInventory();
  UI.renderRaids();
  UI.renderWeeklySchedule();
  if (UI.charts.perf || UI.charts.comp) UI.updateCharts();
  State.save();
}

/* ============================================================
   9. EVENT BINDING
   ============================================================ */
function bindEvents() {
  // Language toggle
  UI.els.langToggle.addEventListener('click', () => {
    const current = State.data.user.language;
    applyLanguage(current === 'en' ? 'ar' : 'en');
  });

  // Nav button click (switch tab, scroll to top)
  UI.els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      UI.els.navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      UI.els.tabContents.forEach(tc => tc.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Nav buttons from empty states (data-tab attribute)
  document.querySelectorAll('[data-tab]').forEach(el => {
    if (el.classList.contains('nav-btn')) return; // already handled
    el.addEventListener('click', () => {
      const tab = el.dataset.tab;
      UI.els.navBtns.forEach(b => b.classList.remove('active'));
      document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');
      UI.els.tabContents.forEach(tc => tc.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Today: Add Task
  const addTodayBtn = document.getElementById('add-today-btn');
  if (addTodayBtn) {
    addTodayBtn.addEventListener('click', () => UI.showAddTaskModal(getTodayStr(), 'today'));
  }

  // Habits: Add Habit
  if (UI.els.addHabitBtn) {
    UI.els.addHabitBtn.addEventListener('click', () => UI.addHabit());
    const habitEnter = (e) => { if (e.key === 'Enter') UI.addHabit(); };
    UI.els.habitNameInput.addEventListener('keydown', habitEnter);
    UI.els.habitDescInput.addEventListener('keydown', habitEnter);
    UI.els.habitPointsInput.addEventListener('keydown', habitEnter);
  }

  // Goals: Add Goal
  UI.els.addGoalBtn.addEventListener('click', () => UI.showAddGoalModal());

  // Chart filters
  UI.els.chartFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      UI.els.chartFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      UI.currentFilter = parseInt(btn.dataset.filter);
      UI.renderPerformanceChart(UI.currentFilter);
    });
  });

  // Gate modal buttons
  UI.els.gateAcceptBtn.addEventListener('click', () => UI.acceptGateRaid());
  UI.els.gateDeclineBtn.addEventListener('click', () => UI.declineGateRaid(false));

  // Welcome modal
  UI.els.welcomeStartBtn.addEventListener('click', () => {
    const name = UI.els.userNameInput.value.trim() || 'User';
    State.data.user.name = name;
    UI.els.welcomeModal.classList.add('hidden');
    State.save();
    initApp();
  });

  UI.els.userNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') UI.els.welcomeStartBtn.click();
  });
}

function getRaidPenalty(rank) {
  const map = { E: 25, D: 50, C: 75, B: 100, A: 150, S: 200, SS: 300 };
  return map[rank] || 50;
}

function formatTimeRemaining(expiresAt) {
  const diff = Math.max(0, expiresAt - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/* ============================================================
   9b. TIMED RAID GATE & ACTIVE RAID CHECK
   ============================================================ */
function checkTimedRaidGate() {
  const data = State.data;
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const THIRTY_MIN = 30 * 60 * 1000;

  // Check for expired active timed raids
  if (data.raids && data.raids.activeTimed) {
    const before = data.raids.activeTimed.length;
    const stillActive = [];
    for (const raid of data.raids.activeTimed) {
      if (raid.expiresAt && now >= raid.expiresAt) {
        const penalty = getRaidPenalty(raid.rank);
        data.user.points = Math.max(0, data.user.points - penalty);
        UI.showToast(`<i class="fa-solid fa-skull icon"></i> Timed raid expired! -${penalty}pts penalty.`, 'error');
      } else {
        stillActive.push(raid);
      }
    }
    data.raids.activeTimed = stillActive;
    if (stillActive.length !== before) {
      State.save();
      UI.updateProfile();
      UI.renderRaids();
    }
  }

  if (!data.raids) {
    data.raids = { permanent: [], activeTimed: [], lastTimedRaidTimestamp: null, pendingTimedRaid: null };
    State.save();
  }

  if (data.raids.pendingTimedRaid) {
    if (now < data.raids.pendingTimedRaid.expiresAt) {
      UI.showGateModal(data.raids.pendingTimedRaid);
      return;
    }
    data.raids.pendingTimedRaid = null;
    data.raids.lastTimedRaidTimestamp = now;
    State.save();
    return;
  }

  if (!data.raids.lastTimedRaidTimestamp || (now - data.raids.lastTimedRaidTimestamp) >= THREE_DAYS) {
    const raid = generateTimedRaid();
    const expiresAt = now + THIRTY_MIN;
    data.raids.pendingTimedRaid = { raid, expiresAt };
    data.raids.lastTimedRaidTimestamp = now;
    State.save();
    UI.showGateModal(data.raids.pendingTimedRaid);
  }
}

/* ============================================================
   10. INITIALIZATION
   ============================================================ */
function initApp() {
  // Render all sections
  UI.initQuotes();
  UI.updateProfile();
  UI.renderToday();
  UI.renderRaids();
  UI.renderHabits();
  UI.renderGoals();
  UI.renderAchievements();
  UI.renderInventory();
  UI.renderWeeklySchedule();
  UI.updateCharts();
  UI.checkAchievements();
  UI.checkOverdueTasks();
  UI.checkHabitDailyReset();

  // Set today's date
  UI.els.todayDate.textContent = new Date().toLocaleDateString(
    State.data.user.language === 'ar' ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Check for timed raid gates
  checkTimedRaidGate();
}

function loadTestData() {
  const data = JSON.parse(JSON.stringify(DEFAULTS));
  const today = new Date();
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const TASKS = [
    { text: 'Morning exercise',     pts: 25 },
    { text: 'Read 30 minutes',      pts: 30 },
    { text: 'Study coding',         pts: 40 },
    { text: 'Meditate 15min',       pts: 20 },
    { text: 'Practice English',     pts: 35 },
    { text: 'Write in journal',     pts: 20 },
    { text: 'Walk 10,000 steps',    pts: 35 },
    { text: 'Stretch for 15min',    pts: 20 },
    { text: 'Review weekly goals',  pts: 15 },
    { text: 'Organize workspace',   pts: 25 },
    { text: 'Digital detox 1hr',    pts: 30 }
  ];

  let totalPts = 0;
  let totalXp = 0;
  let streak = 0;
  let longest = 0;

  // ─── Generate 62 days of deterministic history ───
  // Day 0 = today. Each day has 2-5 task slots, some complete, some miss.
  // The pattern creates a beautiful chart curve.
  for (let d = 0; d < 62; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const ds = fmt(date);

    let completedToday = 0;
    let totalToday = 0;

    // ── Phase A (days 0-6): PERFECT — 5 tasks, all done ──
    if (d <= 6) {
      totalToday = 5;
      completedToday = 5;
    }
    // ── Phase B (days 7-17): STRONG — 4-5 tasks, 1 miss every 3 days ──
    else if (d <= 17) {
      totalToday = 4 + (d % 2 === 0 ? 1 : 0);
      completedToday = totalToday - (d % 3 === 0 ? 1 : 0);
    }
    // ── Phase C (days 18-29): GOOD — 3-4 tasks, some misses ──
    else if (d <= 29) {
      totalToday = 3 + (d % 3 === 0 ? 1 : 0);
      completedToday = totalToday - (d % 4 === 0 ? 1 : (d % 7 === 0 ? 2 : 0));
    }
    // ── Phase D (days 30-39): DIP — 2-3 tasks, many misses (the chart valley) ──
    else if (d <= 39) {
      totalToday = 2 + (d % 5 === 0 ? 1 : 0);
      completedToday = d % 3 === 0 ? totalToday : (d % 7 === 0 ? 0 : Math.floor(totalToday * 0.4));
    }
    // ── Phase E (days 40-54): RECOVERY — 3-4 tasks, improving ──
    else if (d <= 54) {
      totalToday = 3 + (d % 4 === 0 ? 1 : 0);
      const rate = 0.4 + (d - 40) * 0.025; // climbs from 40% → 75%
      completedToday = Math.max(0, Math.min(totalToday, Math.round(totalToday * rate)));
    }
    // ── Phase F (days 55-61): STRUGGLE — 1-2 tasks, mostly missed ──
    else {
      totalToday = 1 + (d % 4 === 0 ? 1 : 0);
      completedToday = d % 5 === 0 ? totalToday : (d % 3 === 0 ? 1 : 0);
    }

    for (let t = 0; t < totalToday; t++) {
      const idx = (d * 3 + t * 5) % TASKS.length;
      const task = TASKS[idx];
      const isCompleted = t < completedToday;

      if (isCompleted) {
        data.history.push({ date: ds, type: 'completed', points: task.pts, xp: task.pts * 2, taskText: task.text });
        totalPts += task.pts;
        totalXp += task.pts * 2;
      } else {
        const pen = Math.round(task.pts * 0.5);
        data.history.push({ date: ds, type: 'missed', points: -pen, xp: -10, taskText: task.text });
        totalPts -= pen;
      }
    }

    if (completedToday > 0) { streak++; longest = Math.max(longest, streak); }
    else { streak = 0; }
  }

  // ─── Compute level from total XP ───
  let level = 1, xp = totalXp, maxXp = 100, lvlBonus = 0;
  while (xp >= maxXp && level < 999) {
    xp -= maxXp;
    level++;
    maxXp = level * 100;
    lvlBonus += 100 + level * 10;
  }

  const u = data.user;
  u.name = 'Test Warrior';
  u.points = Math.max(0, totalPts) + lvlBonus;
  u.level = level;
  u.xp = Math.max(0, xp);
  u.maxXp = maxXp;
  u.currentStreak = streak;
  u.longestStreak = longest;

  // ─── Today's tasks ───
  const todayStr = fmt(today);
  data.tasks.today = [
    { id: uid(), text: 'Morning exercise',    points: 25, xp: 50, completed: false, targetDate: todayStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Read 30 minutes',      points: 30, xp: 60, completed: false, targetDate: todayStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Study coding',         points: 40, xp: 80, completed: false, targetDate: todayStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Write in journal',     points: 20, xp: 40, completed: false, targetDate: todayStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Walk 10,000 steps',    points: 35, xp: 70, completed: false, targetDate: todayStr, createdAt: new Date().toISOString() }
  ];

  // ─── Tomorrow's locked tasks ───
  const tomorrowStr = fmt(new Date(today.getTime() + 86400000));
  data.tasks.tomorrow = [
    { id: uid(), text: 'Morning exercise',    points: 25, xp: 50, locked: true, targetDate: tomorrowStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Practice English',     points: 35, xp: 70, locked: true, targetDate: tomorrowStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Meditate 15min',       points: 20, xp: 40, locked: true, targetDate: tomorrowStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Stretch for 15min',    points: 20, xp: 40, locked: true, targetDate: tomorrowStr, createdAt: new Date().toISOString() },
    { id: uid(), text: 'Review weekly goals',  points: 15, xp: 30, locked: true, targetDate: tomorrowStr, createdAt: new Date().toISOString() }
  ];

  // ─── Goals ───
  const daysAgo = n => new Date(today.getTime() - n * 86400000).toISOString();
  data.goals = [
    { id: uid(), title: 'Learn JavaScript',     description: 'Full JS course on Udemy',          targetDate: '2026-04-15', points: 500, xp: 1500, completed: true,  createdAt: daysAgo(90) },
    { id: uid(), title: 'Read 5 Books',         description: 'Self-development books',           targetDate: '2026-06-01', points: 400, xp: 1200, completed: true,  createdAt: daysAgo(80) },
    { id: uid(), title: 'Run 5km Daily',        description: 'Run 5km for a month',              targetDate: '2026-07-15', points: 300, xp: 900,  completed: false, createdAt: daysAgo(60) },
    { id: uid(), title: 'Build Portfolio',      description: 'Personal portfolio website',       targetDate: '2026-08-15', points: 450, xp: 1350, completed: false, createdAt: daysAgo(45) },
    { id: uid(), title: 'Meditate 30 Days',     description: 'Meditate daily for 30 days',       targetDate: '2026-10-01', points: 350, xp: 1050, completed: false, createdAt: daysAgo(30) },
    { id: uid(), title: 'Save $1,000',          description: 'Cut unnecessary expenses',         targetDate: '2026-12-31', points: 500, xp: 1500, completed: false, createdAt: daysAgo(20) }
  ];

  // ─── Achievements ───
  const aDay = (off) => fmt(new Date(today.getTime() - off * 86400000));
  const ach = [
    { id: 'first_task',         unlockedAt: aDay(58) },
    { id: 'task_machine_25',    unlockedAt: aDay(30) },
    { id: 'first_goal',         unlockedAt: aDay(70) },
    { id: 'rapid_progress',     unlockedAt: aDay(38) },
    { id: 'week_discipline',    unlockedAt: aDay(2) },
    { id: 'level_5',            unlockedAt: aDay(20) },
    { id: 'level_10',           unlockedAt: aDay(7) }
  ];
  if (level >= 25) ach.push({ id: 'level_25', unlockedAt: aDay(1) });
  if (longest >= 14) ach.push({ id: 'two_weeks_discipline', unlockedAt: aDay(Math.max(0, streak - 3)) });
  if (u.points >= 5000) ach.push({ id: 'point_collector', unlockedAt: aDay(2) });
  if (data.goals.filter(g => g.completed).length >= 5) ach.push({ id: 'five_goals', unlockedAt: aDay(5) });
  if (data.history.length >= 100) ach.push({ id: 'task_machine_100', unlockedAt: aDay(1) });
  data.achievements = ach;

  data.lastMigrationDate = fmt(today);
  State.data = data;
  Storage.save();
}

function boot() {
  UI.cache();
  bindEvents();

  // Try to load state, or initialize with defaults
  const saved = Storage.load();
  if (saved && saved.version >= 4) {
    State.data = saved;
    // Merge with defaults for any missing keys
    State.data = { ...JSON.parse(JSON.stringify(DEFAULTS)), ...State.data };
    if (State.data.user) {
      State.data.user = { ...DEFAULTS.user, ...State.data.user };
    }
    if (!State.data.tasks) State.data.tasks = { today: [], tomorrow: [], completed: [], failed: [] };
    State.data.tasks = { ...DEFAULTS.tasks, ...State.data.tasks };
    if (!State.data.goals) State.data.goals = [];
    if (!State.data.achievements) State.data.achievements = [];
    if (!State.data.history) State.data.history = [];
    if (!State.data.inventory) State.data.inventory = [];
    if (!State.data.habits) State.data.habits = [];
    if (!State.data.habitsLastResetDate) State.data.habitsLastResetDate = null;
    if (!State.data.weeklySchedule) State.data.weeklySchedule = [];
    if (State.data.weeklyScheduleLastMigrationDayIndex === undefined) State.data.weeklyScheduleLastMigrationDayIndex = null;
    if (!State.data.raids) State.data.raids = JSON.parse(JSON.stringify(DEFAULTS.raids));
    if (!State.data.raids.permanent || State.data.raids.permanent.length === 0) {
      State.data.raids.permanent = JSON.parse(JSON.stringify(DEFAULTS.raids.permanent));
    }
    if (!State.data.raids.activeTimed) State.data.raids.activeTimed = [];
    // Bump version
    State.data.version = DEFAULTS.version;
  } else {
    State.data = JSON.parse(JSON.stringify(DEFAULTS));
    Storage.save();
  }

  // Show quotes immediately (even before welcome modal is dismissed)
  UI.initQuotes();

  // Run midnight migration
  Storage.migrateIfNeeded();

  // Apply saved language (theme is always dark)
  document.documentElement.setAttribute('data-theme', 'dark');
  applyLanguage(State.data.user.language);

  // Check if user needs onboarding
  if (saved && saved.user && saved.user.name !== 'User') {
    UI.els.welcomeModal.classList.add('hidden');
    initApp();
  }
  // else: welcome modal stays open
}

document.addEventListener('DOMContentLoaded', boot);
