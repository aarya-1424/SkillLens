// Content for the landing page. Only true numbers go here — funders will check.

export const STATS = [
  { value: 9, suffix: '', label: 'sports supported' },
  { value: 33, suffix: '', label: 'body points tracked' },
  { value: 5, suffix: '', label: 'joints scored per video' },
  { value: 30, prefix: '<', suffix: 's', label: 'per analysis' },
];

export const FEATURES = [
  {
    key: 'score',
    tab: 'Technique score',
    title: 'One number that tells you where you stand.',
    body: 'Every video gets a score out of 100, plus a score for your shoulder, elbow, hip, knee and spine. It comes from measured joint angles compared with correct form — the same video always gets the same score.',
    sample: { kind: 'score' },
  },
  {
    key: 'mistakes',
    tab: 'Mistakes & drills',
    title: 'What went wrong, and the drill that fixes it.',
    body: 'SkillLens names each mistake in plain words, with the actual number it measured. Every mistake is paired with one to three simple drills you can do at home or on the ground.',
    sample: { kind: 'mistakes' },
  },
  {
    key: 'injury',
    tab: 'Injury risk',
    title: 'Catch the strain before it becomes an injury.',
    body: 'Bad form loads the wrong joints. SkillLens rates your risk Low, Medium or High, shows which body part is under stress, and explains why — before pain does.',
    sample: { kind: 'injury' },
  },
  {
    key: 'plan',
    tab: 'Training plan',
    title: 'A week built around you.',
    body: 'A seven-day plan and diet tips based on your sport, level, age, body and the mistakes we found. It changes as your scores change.',
    sample: { kind: 'plan' },
  },
  {
    key: 'coach',
    tab: 'Ask Coach',
    title: 'Ask anything. Get an answer with its source.',
    body: 'Answers come from our checked sports library first, so you get consistent advice — not a guess. Every answer shows where it came from.',
    sample: { kind: 'coach' },
  },
];

export const STEPS = [
  { n: '01', title: 'Record', text: 'Film 5–15 seconds of your movement from the side. A phone on a chair is enough.' },
  { n: '02', title: 'Track', text: 'SkillLens finds 33 body points in every frame, right in your browser.' },
  { n: '03', title: 'Compare', text: 'Your joint angles at the key moments are checked against correct form for your sport.' },
  { n: '04', title: 'Improve', text: 'You get your score, your mistakes, drills, injury risk and a weekly plan.' },
];

export const JOURNEY = [
  { n: '01', title: 'Sign in', tag: 'Google, 10 seconds', text: 'Or explore the demo without an account.' },
  { n: '02', title: 'Quick setup', tag: 'First time only', text: 'Age, height, sport, level, old injuries.' },
  { n: '03', title: 'First video', tag: 'Under a minute', text: 'Record or upload. Tips show you where to put the camera.' },
  { n: '04', title: 'Your report', tag: 'About 30 seconds', text: 'Score, mistakes, drills, injury risk, plan.' },
  { n: '05', title: 'Weekly progress', tag: 'Ongoing', text: 'Practise, record again, watch the chart climb.' },
];

export const SPORTS = [
  {
    name: 'Cricket', icon: '🏏', movement: 'Bowling action', view: 'Side view, bowling-arm side',
    checks: ['Elbow straightening during delivery', 'Front knee bracing at landing', 'Trunk lean at release'],
    tip: 'Stand 4–5 m to the side of the crease. Keep the whole run-up and release in frame.',
  },
  {
    name: 'Basketball', icon: '🏀', movement: 'Jump shot', view: 'Side view, shooting-arm side',
    checks: ['Elbow angle at set point', 'Knee bend in the dip', 'Arm extension at release'],
    tip: 'Film from the side at chest height so the shooting elbow is clearly visible.',
  },
  {
    name: 'Soccer', icon: '⚽', movement: 'Instep kick', view: 'Side view, kicking-leg side',
    checks: ['Standing-leg knee bend', 'Kicking-knee extension at contact', 'Body lean at contact'],
    tip: 'Place the camera level with the ball, a few metres to the side.',
  },
  {
    name: 'Tennis', icon: '🎾', movement: 'Serve', view: 'Side view',
    checks: ['Knee bend in trophy position', 'Elbow angle in trophy position', 'Arm extension at contact'],
    tip: 'Film from the side of the baseline, full body in frame including the toss.',
  },
  {
    name: 'Baseball', icon: '⚾', movement: 'Pitching', view: 'Side view, throwing-arm side',
    checks: ['Arm height at foot contact', 'Elbow angle at foot contact', 'Stride-knee bend'],
    tip: 'Camera at hip height, perpendicular to the throw.',
  },
  {
    name: 'Volleyball', icon: '🏐', movement: 'Spike', view: 'Side view, hitting-arm side',
    checks: ['Knee bend before take-off', 'Elbow height in the arm swing', 'Arm extension at contact'],
    tip: 'Stand back far enough to keep the full jump in frame.',
  },
  {
    name: 'Swimming', icon: '🏊', movement: 'Freestyle stroke (Beta)', view: 'Side view, dry-land or above water',
    checks: ['High-elbow catch', 'Arm reach at entry', 'Straight body line'],
    tip: 'Dry-land stroke practice on a bench gives the clearest reading for now.',
  },
  {
    name: 'Running', icon: '🏃', movement: 'Running stride', view: 'Side view',
    checks: ['Forward lean', 'Knee angle at foot strike', 'Over-striding'],
    tip: 'Film 2–3 strides from the side on a treadmill or a straight path.',
  },
  {
    name: 'Cycling', icon: '🚴', movement: 'Pedalling (stationary bike)', view: 'Side view',
    checks: ['Knee angle at bottom of stroke', 'Knee angle at top of stroke', 'Back angle'],
    tip: 'Camera level with the saddle, drive-side of the bike.',
  },
];

export const TRUST = [
  { title: 'Your videos stay private', text: 'Only you can see what you record. Delete everything with one button.' },
  { title: 'Checked by real coaches', text: 'Every scoring rule carries its source. Unchecked rules are marked as such.' },
  { title: 'Built for young athletes', text: 'Parent consent for under-18s, as required by law.' },
  { title: 'Coaching guidance, not medical advice', text: 'We flag risk and suggest prevention. We never diagnose.' },
];

export const FAQ = [
  { q: 'Do I need any sensors or special equipment?', a: 'No. A phone or laptop camera is all you need. SkillLens tracks your body from the video itself.' },
  { q: 'How accurate is the score?', a: 'Scores come from measured joint angles compared with correct ranges for your sport, so the same video always gets the same score. Good lighting and a clear side view give the best results — the app tells you when it could not see you clearly.' },
  { q: 'Which sports work today?', a: 'Nine: cricket, basketball, soccer, tennis, baseball, volleyball, swimming (beta), running and cycling — one key movement each, with more movements being added.' },
  { q: 'Is it free?', a: 'Yes while we are in the prototype stage. You can also explore the demo without creating an account.' },
  { q: 'Who sees my videos?', a: 'Only you. Videos are stored privately. Coaches can see them later only if you invite them.' },
  { q: 'Can it replace my coach?', a: 'No — it gives your coach eyes on every session, and gives players without a coach a place to start. It is guidance, not medical advice.' },
];
