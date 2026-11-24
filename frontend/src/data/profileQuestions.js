// The setup questionnaire. Option keys must match the backend's allowed
// values (backend/app/profiles/schemas.py). Every question says why we ask.

export const STEPS = [
  { key: 'you', title: 'About you', short: 'You' },
  { key: 'sport', title: 'Your sport', short: 'Sport' },
  { key: 'body', title: 'Your body', short: 'Body' },
  { key: 'goal', title: 'Your goal', short: 'Goal' },
  { key: 'consent', title: 'Your consent', short: 'Consent' },
];

export const WHY = {
  display_name: 'So your reports and coach talk to you by name.',
  birth: 'Young bodies are still growing, so we adjust advice and safety checks to your age. We never ask the exact day.',
  gender: 'Some body angles and injury risks are different for men and women. "Prefer not to say" is fine.',
  sport_slug: 'Your tips start here. You can still analyse any sport at any time.',
  role: 'A fast bowler and a spinner need different advice.',
  level: 'So the advice is not too easy or too hard for you.',
  years_playing: 'Newer players get the simplest, biggest fixes first.',
  training_days: 'So your plan fits your week and leaves time to recover.',
  dominant_hand: 'We measure the arm that does the work.',
  dominant_foot: 'We measure the leg that does the work.',
  height: 'Your height helps us measure your movement correctly.',
  weight: 'Your weight changes how hard your joints work. Nobody else sees it.',
  fitness: 'So we never suggest too much, too soon.',
  pain_now: 'We are careful with areas that hurt, and tell you when to see a doctor.',
  pain_areas: 'So the coach can be careful with these areas.',
  past_injuries: 'Old injuries can come back. We watch those areas more carefully.',
  injury_note: 'Optional. For example: "knee surgery in 2024".',
  goal: 'Your reports and plan focus on this first.',
  goal_event: 'Optional. It gives you a date to train for.',
};

export const GENDERS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
  { key: 'prefer_not', label: 'Prefer not to say' },
];

export const LEVELS = [
  { key: 'beginner', label: 'Just starting', hint: 'Learning the basics' },
  { key: 'school_club', label: 'School or club', hint: 'Regular games and practice' },
  { key: 'district_state', label: 'District or state', hint: 'Selected teams, trials' },
  { key: 'national_pro', label: 'National or pro', hint: 'Top level' },
];

export const YEARS = [
  { key: 'lt1', label: 'Under 1 year' },
  { key: '1_3', label: '1 to 3 years' },
  { key: '3_5', label: '3 to 5 years' },
  { key: '5_plus', label: 'More than 5 years' },
];

export const SIDES = [
  { key: 'right', label: 'Right' },
  { key: 'left', label: 'Left' },
  { key: 'both', label: 'Both' },
];

export const FITNESS = [
  { key: 'low', label: 'Low', hint: 'Out of breath quickly' },
  { key: 'average', label: 'Average', hint: 'Can get through a session' },
  { key: 'good', label: 'Good', hint: 'Last a full game' },
  { key: 'very_good', label: 'Very good', hint: 'Strong to the very end' },
];

export const PAIN = [
  { key: 'none', label: 'No pain' },
  { key: 'mild', label: 'A little', hint: 'I can still train' },
  { key: 'stops_me', label: 'A lot', hint: 'It stops me training' },
];

export const AREAS = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'elbow', label: 'Elbow' },
  { key: 'wrist', label: 'Wrist or hand' },
  { key: 'back', label: 'Back' },
  { key: 'hip', label: 'Hip' },
  { key: 'groin', label: 'Inner thigh (groin)' },
  { key: 'hamstring', label: 'Back of thigh' },
  { key: 'knee', label: 'Knee' },
  { key: 'shin', label: 'Lower leg (shin)' },
  { key: 'ankle', label: 'Ankle' },
  { key: 'foot', label: 'Foot' },
  { key: 'other', label: 'Somewhere else' },
];

export const GOALS = [
  { key: 'technique', label: 'Better technique', hint: 'Fix my form', icon: '🎯' },
  { key: 'prevent_injury', label: 'Avoid injuries', hint: 'Protect my body', icon: '🛡️' },
  { key: 'selection', label: 'Get selected', hint: 'Make the team or trials', icon: '🏆' },
  { key: 'comeback', label: 'Come back from injury', hint: 'Return safely', icon: '🔁' },
  { key: 'fitness', label: 'Get fitter', hint: 'Stronger, faster, longer', icon: '⚡' },
];

/** Roles depend on the sport. "Not sure yet" is always allowed. */
export const ROLES = {
  'cricket-bowling': ['Fast bowler', 'Medium-pace bowler', 'Spin bowler', 'Batter', 'All-rounder', 'Wicket-keeper'],
  'basketball-jumpshot': ['Guard', 'Forward', 'Centre'],
  'football-instep-kick': ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  'tennis-serve': ['Singles', 'Doubles', 'Both'],
  'baseball-pitch': ['Pitcher', 'Catcher', 'Infield', 'Outfield'],
  'volleyball-spike': ['Outside hitter', 'Opposite', 'Middle blocker', 'Setter', 'Libero'],
  'badminton-smash': ['Singles', 'Doubles', 'Both'],
  'running-stride': ['Sprints (100 to 400 m)', 'Middle distance', 'Long distance', 'For fitness'],
  'cycling-pedal': ['Road', 'Track', 'Mountain', 'Indoor or fitness'],
  'gym-squat': ['Strength', 'Bodybuilding', 'General fitness', 'Training for a sport'],
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export const ADULT_AGE = 18;

/** Whole years old from month and year of birth. */
export function ageFrom(year, month, today = new Date()) {
  if (!year || !month) return null;
  const years = today.getFullYear() - year;
  return today.getMonth() + 1 < month ? years - 1 : years;
}

export const labelOf = (list, key) => list.find((o) => o.key === key)?.label ?? key;
