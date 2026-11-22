// How to film each movement so the analysis can read it.
//
// Why this matters: the tracker scans the whole clip and picks the single
// clearest key moment (for example, the frame where the bowling hand is
// highest). It does not yet split a clip into separate repetitions. So a clip
// that mixes movements can make it measure the wrong one. One movement,
// repeated a few times, with nothing else in the clip, is what it needs.

/** The longest stretch we analyse. Longer videos: the user picks which part. */
export const MAX_CLIP_SECONDS = 20;
/** Shorter than this cannot hold even one full movement. */
export const MIN_CLIP_SECONDS = 3;
/** Shorter than this works, but is risky. We warn. */
export const SHORT_CLIP_SECONDS = 6;
/** Bigger files are slow to read on a phone. */
export const MAX_FILE_MB = 200;

/** The same rules for every sport. `{reps}` and `{movement}` are filled in. */
export const RULES = [
  { title: 'One movement only', text: 'Just the {movement}. No warm-ups, other moves or walking around in the clip.' },
  { title: 'Repeat it {reps}', text: 'Leave a short pause between each one, so every repetition is clear.' },
  { title: 'Side-on, whole body', text: 'Head to toes in frame for the whole movement. Camera at about hip height.' },
  { title: 'Keep the camera still', text: 'Prop the phone on something. Do not hold it or follow yourself.' },
  { title: 'Only you, good light', text: 'Nobody walking behind you. No bright window behind you.' },
  { title: '10 to 15 seconds', text: `That is plenty. We read up to ${MAX_CLIP_SECONDS} seconds of any video.` },
];

export const AVOID = [
  'Mixing different movements',
  'Moving or zooming the camera',
  'Head or feet cut off',
  'Other people in the frame',
  'Filming from the front',
];

/**
 * Per movement:
 *  reps   - how many times, in words ("3 times"); `null` for continuous movements
 *  do     - the one-line instruction, shown big
 *  detail - anything specific to this movement
 *  camera - where to put the phone
 */
export const FILMING = {
  'cricket-bowling': {
    reps: '2 to 3 times',
    do: 'Bowl 2 to 3 deliveries',
    detail: 'Use a short run-up of 3 to 5 steps so all of them fit in 20 seconds. Start recording just before you run in.',
    camera: '4 to 5 metres to the side of the crease, on your bowling-arm side.',
  },
  'basketball-jumpshot': {
    reps: '3 times',
    do: 'Take 3 jump shots',
    detail: 'Shoot from the same spot each time. A ball and hoop help, but form shots without a hoop work too.',
    camera: '3 to 4 metres to the side, on your shooting-arm side, at chest height.',
  },
  'football-instep-kick': {
    reps: '3 times',
    do: 'Kick the ball 3 times',
    detail: 'Reset the ball to the same place before each kick. Use the same kicking leg every time.',
    camera: 'Level with the ball, 3 to 4 metres to the side of your kicking leg.',
  },
  'tennis-serve': {
    reps: '3 times',
    do: 'Hit 3 serves',
    detail: 'Serve from the same spot. Keep the ball toss in frame.',
    camera: 'To the side of the baseline, far enough back to see the racket at full reach.',
  },
  'baseball-pitch': {
    reps: '3 times',
    do: 'Throw 3 pitches',
    detail: 'Same pitch type each time. A net or a partner to throw to is fine.',
    camera: 'At hip height, side-on to the throw, on your throwing-arm side.',
  },
  'volleyball-spike': {
    reps: '3 times',
    do: 'Do 3 spike jumps',
    detail: 'Approach, jump and swing each time. A ball is optional.',
    camera: 'Far enough back to keep the whole jump in frame, including your hand at the top.',
  },
  'badminton-smash': {
    reps: '3 times',
    do: 'Play 3 smashes',
    detail: 'Shadow swings without a shuttle are fine. Use a full overhead swing each time.',
    camera: '3 to 4 metres to the side, on your racket-arm side.',
  },
  'running-stride': {
    reps: null,
    do: 'Run for 10 to 15 seconds',
    detail: 'Run at your normal pace. A treadmill is best: on a path, the camera only sees you for a few strides.',
    camera: 'Exactly side-on at hip height, 2 to 3 metres from the treadmill.',
  },
  'cycling-pedal': {
    reps: null,
    do: 'Pedal for 10 to 15 seconds',
    detail: 'Steady pace on a stationary bike or trainer. Stay seated.',
    camera: 'Level with the saddle, on the chain side of the bike.',
  },
  'gym-squat': {
    reps: '3 to 5 times',
    do: 'Do 3 to 5 squats',
    detail: 'Steady pace, with a short pause standing tall between each one. Bodyweight or barbell both work.',
    camera: '2 to 3 metres to the side, at hip height.',
  },
};

/** The rules with this movement's words filled in. */
export function rulesFor(slug, movementName) {
  const f = FILMING[slug];
  return RULES.map((r) => {
    if (r.title.includes('{reps}') && !f?.reps) {
      // Running and cycling are continuous: there is nothing to repeat.
      return { title: 'Keep a steady pace', text: 'Move at your normal pace the whole time, without stopping.' };
    }
    return {
      title: r.title.replace('{reps}', f?.reps || '3 times'),
      text: r.text.replace('{movement}', (movementName || 'movement').toLowerCase()),
    };
  });
}
