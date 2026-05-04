import { getExerciseGif } from './exerciseAnimations';

const ex = (id, name, sets, reps, rest, muscle, description) => ({
  id, name, sets, reps, rest, muscle, description,
  animation_url: getExerciseGif(name),
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const makeDay = (index, label, isRest, exercises = []) => ({
  index,
  label: isRest ? 'Rest Day' : label,
  dayName: DAYS[index],
  isRest,
  exercises,
});

// ── Underweight → Muscle Building ──────────────────────────────
const UW = {
  beginner: [
    makeDay(0, 'Upper Body Push', false, [
      ex('uw-b-0-1', 'Knee Push-ups',           3, '10 reps', '60s', 'Chest',    'On knees, keep body straight from knees to shoulders, lower chest to floor.'),
      ex('uw-b-0-2', 'Dumbbell Chest Press',    3, '10 reps', '60s', 'Chest',    'Lie on bench/floor, press light dumbbells up from chest level.'),
      ex('uw-b-0-3', 'Dumbbell Shoulder Press', 3, '10 reps', '60s', 'Shoulders','Sit tall, press dumbbells from shoulder height to overhead.'),
      ex('uw-b-0-4', 'Tricep Kickbacks',        2, '12 reps', '60s', 'Triceps',  'Hinge forward, upper arm parallel to floor, extend forearm back.'),
    ]),
    makeDay(1, 'Upper Body Pull', false, [
      ex('uw-b-1-1', 'Assisted Pull-ups',       3, '5 reps',  '90s', 'Back',     'Use a band or machine assist. Pull until chin clears the bar.'),
      ex('uw-b-1-2', 'Dumbbell Row',            3, '10 reps', '60s', 'Back',     'Knee on bench, pull dumbbell to hip, keep back flat.'),
      ex('uw-b-1-3', 'Bicep Curls',             3, '10 reps', '60s', 'Biceps',   'Stand tall, curl dumbbells from hips to shoulders, lower slowly.'),
      ex('uw-b-1-4', 'Hammer Curls',            2, '12 reps', '45s', 'Biceps',   'Neutral grip, curl alternating dumbbells.'),
    ]),
    makeDay(2, 'Rest / Light Walk', true),
    makeDay(3, 'Lower Body', false, [
      ex('uw-b-3-1', 'Bodyweight Squat',        3, '15 reps', '60s', 'Quads',    'Feet shoulder-width, squat until thighs parallel to floor, drive through heels.'),
      ex('uw-b-3-2', 'Lunges',                  3, '10 reps', '60s', 'Quads',    'Step forward, lower back knee toward floor, alternate legs.'),
      ex('uw-b-3-3', 'Glute Bridge',            3, '15 reps', '45s', 'Glutes',   'Lie on back, feet flat, drive hips up squeezing glutes, hold 1s.'),
      ex('uw-b-3-4', 'Standing Calf Raises',    3, '15 reps', '30s', 'Calves',   'Rise on toes as high as possible, lower with control.'),
    ]),
    makeDay(4, 'Core & Stability', false, [
      ex('uw-b-4-1', 'Plank',                   3, '20s',     '45s', 'Core',     'Forearms on floor, keep body straight from head to heels.'),
      ex('uw-b-4-2', 'Bird-Dog',                3, '8 reps',  '45s', 'Core',     'On all fours, extend opposite arm and leg, keep back flat.'),
      ex('uw-b-4-3', 'Crunches',                3, '12 reps', '45s', 'Core',     'Feet flat, curl shoulders off floor, squeeze abs at top.'),
      ex('uw-b-4-4', 'Dead Bug',                3, '8 reps',  '45s', 'Core',     'Lie on back, arms up, lower opposite arm and leg simultaneously.'),
    ]),
    makeDay(5, 'Full Body', false, [
      ex('uw-b-5-1', 'Goblet Squat',            3, '12 reps', '60s', 'Quads',    'Hold dumbbell at chest, squat deep, elbows inside knees.'),
      ex('uw-b-5-2', 'Push-ups',                3, '10 reps', '60s', 'Chest',    'Keep body straight, lower chest to floor, push back up.'),
      ex('uw-b-5-3', 'Dumbbell Row',            3, '10 reps', '60s', 'Back',     'Pull dumbbell to hip, keep back flat.'),
      ex('uw-b-5-4', 'Jumping Jacks',           3, '30s',     '45s', 'Cardio',   'Jump feet out wide while raising arms overhead, jump back.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  intermediate: [
    makeDay(0, 'Chest & Triceps', false, [
      ex('uw-i-0-1', 'Bench Press',            4, '8 reps',  '90s', 'Chest',   'Lie flat on bench, lower bar to chest, press up explosively.'),
      ex('uw-i-0-2', 'Incline Dumbbell Press', 3, '10 reps', '60s', 'Chest',   'Set bench to 45°, press dumbbells up from chest level.'),
      ex('uw-i-0-3', 'Push-ups',               3, '15 reps', '45s', 'Chest',   'Keep body straight, lower chest to floor, push back up.'),
      ex('uw-i-0-4', 'Tricep Dips',            3, '12 reps', '60s', 'Triceps', 'Grip parallel bars, lower body until arms are 90°, push up.'),
      ex('uw-i-0-5', 'Cable Tricep Pushdown',  3, '12 reps', '45s', 'Triceps', 'Keep elbows at sides, push bar down until arms are straight.'),
    ]),
    makeDay(1, 'Back & Biceps', false, [
      ex('uw-i-1-1', 'Pull-ups',           4, '6 reps',  '90s', 'Back',   'Hang from bar, pull chest to bar, lower with control.'),
      ex('uw-i-1-2', 'Barbell Row',        4, '8 reps',  '90s', 'Back',   'Hinge at hips, pull bar to lower chest, squeeze shoulder blades.'),
      ex('uw-i-1-3', 'Seated Cable Row',   3, '10 reps', '60s', 'Back',   'Sit tall, pull handle to abdomen, keep chest up.'),
      ex('uw-i-1-4', 'Barbell Bicep Curl', 3, '10 reps', '60s', 'Biceps', 'Keep elbows fixed, curl bar to shoulder height.'),
      ex('uw-i-1-5', 'Hammer Curls',       3, '12 reps', '45s', 'Biceps', 'Neutral grip, curl dumbbells alternating each arm.'),
    ]),
    makeDay(2, 'Rest / Light Cardio', true),
    makeDay(3, 'Legs', false, [
      ex('uw-i-3-1', 'Barbell Squat',        4, '8 reps',  '120s', 'Quads',     'Bar on upper back, squat until thighs parallel, drive through heels.'),
      ex('uw-i-3-2', 'Leg Press',            3, '10 reps', '90s',  'Quads',     'Feet shoulder-width, lower sled until 90°, press back up.'),
      ex('uw-i-3-3', 'Romanian Deadlift',    3, '10 reps', '90s',  'Hamstrings','Keep back straight, hinge at hips until bar passes knees.'),
      ex('uw-i-3-4', 'Leg Curl',             3, '12 reps', '60s',  'Hamstrings','Lie face down, curl legs toward glutes, lower slowly.'),
      ex('uw-i-3-5', 'Standing Calf Raises', 4, '15 reps', '45s',  'Calves',   'Rise on toes as high as possible, lower with control.'),
    ]),
    makeDay(4, 'Shoulders & Core', false, [
      ex('uw-i-4-1', 'Overhead Press',  4, '8 reps',  '90s', 'Shoulders', 'Press barbell overhead from chin height, lock out at top.'),
      ex('uw-i-4-2', 'Lateral Raises',  3, '12 reps', '45s', 'Shoulders', 'Raise dumbbells to shoulder height with slight bend in elbows.'),
      ex('uw-i-4-3', 'Front Raises',    3, '12 reps', '45s', 'Shoulders', 'Raise dumbbells forward to shoulder height, lower slowly.'),
      ex('uw-i-4-4', 'Face Pulls',      3, '15 reps', '45s', 'Rear Delts','Pull rope to face level, flare elbows out, squeeze rear delts.'),
      ex('uw-i-4-5', 'Plank',           3, '60s',     '45s', 'Core',      'Forearms on floor, keep body straight from head to heels.'),
    ]),
    makeDay(5, 'Full Body', false, [
      ex('uw-i-5-1', 'Deadlift',    3, '6 reps',  '120s', 'Full Body', 'Hip hinge to bar, keep back straight, drive hips forward to stand.'),
      ex('uw-i-5-2', 'Pull-ups',    3, '6 reps',  '90s',  'Back',      'Hang from bar, pull chest to bar, lower with control.'),
      ex('uw-i-5-3', 'Dips',        3, '10 reps', '60s',  'Chest',     'Grip bars, lower body with elbows flared slightly, press back up.'),
      ex('uw-i-5-4', 'Goblet Squat',3, '12 reps', '60s',  'Quads',     'Hold dumbbell at chest, squat deep, elbows inside knees.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  advanced: [
    makeDay(0, 'Chest & Triceps (Heavy)', false, [
      ex('uw-a-0-1', 'Bench Press',            5, '5 reps',  '120s', 'Chest',   'Heavy — lower bar controlled, explosive press. Use a spotter.'),
      ex('uw-a-0-2', 'Incline Dumbbell Press', 4, '8 reps',  '75s',  'Chest',   'Full range of motion, squeeze chest at top.'),
      ex('uw-a-0-3', 'Cable Crossover',        3, '12 reps', '45s',  'Chest',   'Arms slightly bent, bring cables together at chest level.'),
      ex('uw-a-0-4', 'Dips',                   4, '12 reps', '60s',  'Triceps', 'Add weight if possible. Full range, elbows flared for chest focus.'),
      ex('uw-a-0-5', 'Skull Crushers',         3, '10 reps', '45s',  'Triceps', 'Lower bar to forehead slowly, extend back up.'),
    ]),
    makeDay(1, 'Back & Biceps (Heavy)', false, [
      ex('uw-a-1-1', 'Pull-ups',           5, '8 reps',  '90s', 'Back',   'Add weight if bodyweight is easy. Full dead hang each rep.'),
      ex('uw-a-1-2', 'Barbell Row',        5, '6 reps',  '90s', 'Back',   'Heavy row — focus on squeezing shoulder blades at top.'),
      ex('uw-a-1-3', 'Seated Cable Row',   4, '10 reps', '60s', 'Back',   'Pull to abdomen, pause and squeeze for 1s.'),
      ex('uw-a-1-4', 'Barbell Bicep Curl', 4, '8 reps',  '60s', 'Biceps', 'Use a weight that challenges the last 2 reps.'),
      ex('uw-a-1-5', 'Hammer Curls',       3, '10 reps', '45s', 'Biceps', 'Go heavy, neutral grip, controlled tempo.'),
    ]),
    makeDay(2, 'Rest / Active Recovery', true),
    makeDay(3, 'Legs (Heavy)', false, [
      ex('uw-a-3-1', 'Barbell Squat',        5, '5 reps',  '150s', 'Quads',     'Heavy — go below parallel, brace core throughout.'),
      ex('uw-a-3-2', 'Leg Press',            4, '10 reps', '90s',  'Quads',     'Feet low on platform, full range of motion.'),
      ex('uw-a-3-3', 'Romanian Deadlift',    4, '8 reps',  '90s',  'Hamstrings','Loaded stretch — feel the hamstring tension at bottom.'),
      ex('uw-a-3-4', 'Leg Curl',             4, '10 reps', '60s',  'Hamstrings','Controlled eccentric — 3s down, explode up.'),
      ex('uw-a-3-5', 'Standing Calf Raises', 5, '15 reps', '30s',  'Calves',   'Pause at top for 1s, full stretch at bottom.'),
    ]),
    makeDay(4, 'Shoulders & Core (Heavy)', false, [
      ex('uw-a-4-1', 'Overhead Press',  5, '5 reps',  '120s', 'Shoulders', 'Heavy — push through a sticking point. Log your PRs.'),
      ex('uw-a-4-2', 'Arnold Press',    4, '10 reps', '60s',  'Shoulders', 'Rotate palms as you press up, reverse on descent.'),
      ex('uw-a-4-3', 'Lateral Raises',  4, '12 reps', '30s',  'Shoulders', 'Go slightly heavier — controlled cheat on last 2 reps.'),
      ex('uw-a-4-4', 'Face Pulls',      4, '15 reps', '30s',  'Rear Delts','High reps for shoulder health. Don\'t skip this.'),
      ex('uw-a-4-5', 'Ab Wheel',        4, '10 reps', '45s',  'Core',      'Roll out slowly, pull back in using core, not hips.'),
    ]),
    makeDay(5, 'Full Body (Strength)', false, [
      ex('uw-a-5-1', 'Deadlift',    5, '5 reps',  '150s', 'Full Body', 'Max effort — this is your main strength movement of the week.'),
      ex('uw-a-5-2', 'Pull-ups',    4, '8 reps',  '75s',  'Back',      'Add weight if needed. Focus on lat engagement.'),
      ex('uw-a-5-3', 'Dips',        4, '12 reps', '60s',  'Chest',     'Add weight plate if bodyweight is easy.'),
      ex('uw-a-5-4', 'Goblet Squat',4, '12 reps', '60s',  'Quads',     'Pause 2s at bottom for extra muscle activation.'),
    ]),
    makeDay(6, 'Rest', true),
  ],
};

// ── Normal BMI → Balanced Fitness ──────────────────────────────
const NR = {
  beginner: [
    makeDay(0, 'Full Body A', false, [
      ex('nr-b-0-1', 'Bodyweight Squat',   3, '15 reps', '60s', 'Quads',  'Feet shoulder-width, squat until thighs parallel, drive through heels.'),
      ex('nr-b-0-2', 'Push-ups',           3, '10 reps', '60s', 'Chest',  'Keep body straight, lower chest to floor, push back up.'),
      ex('nr-b-0-3', 'Dumbbell Row',       3, '10 reps', '60s', 'Back',   'Pull dumbbell to hip with flat back, lower slowly.'),
      ex('nr-b-0-4', 'Glute Bridge',       3, '15 reps', '45s', 'Glutes', 'Drive hips up, squeeze glutes at top, hold 1 second.'),
      ex('nr-b-0-5', 'Plank',              3, '20s',     '45s', 'Core',   'Forearms down, keep hips level, breathe steadily.'),
    ]),
    makeDay(1, 'Cardio & Core', false, [
      ex('nr-b-1-1', 'Jumping Jacks',    3, '30s',     '30s', 'Cardio', 'Full arm and leg extension on each jump.'),
      ex('nr-b-1-2', 'High Knees',       3, '30s',     '30s', 'Cardio', 'Drive knees to hip height, pump arms in rhythm.'),
      ex('nr-b-1-3', 'Crunches',         3, '15 reps', '30s', 'Core',   'Feet flat, curl shoulders off floor, squeeze abs.'),
      ex('nr-b-1-4', 'Mountain Climbers',3, '20s',     '45s', 'Core',   'Plank position, alternate driving knees to chest.'),
      ex('nr-b-1-5', 'Bird-Dog',         3, '8 reps',  '30s', 'Core',   'Extend opposite arm & leg from all-fours, hold 2s.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'Full Body B', false, [
      ex('nr-b-3-1', 'Lunges',                  3, '10 reps', '60s', 'Quads',    'Step forward, lower back knee, keep torso upright.'),
      ex('nr-b-3-2', 'Knee Push-ups',           3, '12 reps', '60s', 'Chest',    'Keep body straight knees to shoulders.'),
      ex('nr-b-3-3', 'Lat Pulldown',            3, '10 reps', '60s', 'Back',     'Pull bar to upper chest, squeeze lats.'),
      ex('nr-b-3-4', 'Dumbbell Shoulder Press', 3, '10 reps', '60s', 'Shoulders','Press from shoulders to overhead.'),
      ex('nr-b-3-5', 'Standing Calf Raises',    3, '15 reps', '30s', 'Calves',   'Rise on toes as high as possible.'),
    ]),
    makeDay(4, 'Active Recovery', false, [
      ex('nr-b-4-1', 'Jumping Jacks',    2, '60s',     '60s', 'Cardio', 'Light pace, focus on breathing.'),
      ex('nr-b-4-2', 'Wall Sit',         3, '30s',     '60s', 'Quads',  'Back flat on wall, thighs parallel to floor.'),
      ex('nr-b-4-3', 'Plank',            3, '20s',     '45s', 'Core',   'Hold position, don\'t let hips sag.'),
      ex('nr-b-4-4', 'Superman',         3, '10 reps', '45s', 'Back',   'Lie face down, lift arms and legs off floor simultaneously.'),
    ]),
    makeDay(5, 'Full Body C', false, [
      ex('nr-b-5-1', 'Goblet Squat',   3, '12 reps', '60s', 'Quads',  'Hold dumbbell at chest, squat deep.'),
      ex('nr-b-5-2', 'Push-ups',       3, '12 reps', '60s', 'Chest',  'Keep core tight throughout.'),
      ex('nr-b-5-3', 'Bicep Curls',    3, '10 reps', '60s', 'Biceps', 'Curl to shoulder height, lower slowly.'),
      ex('nr-b-5-4', 'Tricep Dips',    3, '10 reps', '60s', 'Triceps','Use a chair or bench, lower until 90°.'),
      ex('nr-b-5-5', 'Russian Twist',  3, '10 reps', '45s', 'Core',   'Lean back slightly, rotate torso side to side.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  intermediate: [
    makeDay(0, 'Upper Body', false, [
      ex('nr-i-0-1', 'Bench Press',            4, '8 reps',  '90s', 'Chest',    'Full range of motion, controlled descent.'),
      ex('nr-i-0-2', 'Pull-ups',               4, '6 reps',  '90s', 'Back',     'Dead hang to chin above bar.'),
      ex('nr-i-0-3', 'Overhead Press',         3, '10 reps', '75s', 'Shoulders','Press from chin height to full lockout.'),
      ex('nr-i-0-4', 'Barbell Bicep Curl',     3, '10 reps', '60s', 'Biceps',   'Keep elbows fixed at sides.'),
      ex('nr-i-0-5', 'Cable Tricep Pushdown',  3, '12 reps', '45s', 'Triceps',  'Elbows tight, push to full extension.'),
    ]),
    makeDay(1, 'Cardio & Core', false, [
      ex('nr-i-1-1', 'Jump Rope',        3, '2 min',   '60s', 'Cardio', 'Light bounce, stay on balls of feet, consistent rhythm.'),
      ex('nr-i-1-2', 'Mountain Climbers',3, '30s',     '30s', 'Core',   'Keep hips level, drive knees fast.'),
      ex('nr-i-1-3', 'Plank',            3, '45s',     '45s', 'Core',   'Hold position — squeeze glutes and abs.'),
      ex('nr-i-1-4', 'Russian Twist',    3, '15 reps', '30s', 'Core',   'Hold weight, rotate fully each side.'),
      ex('nr-i-1-5', 'Leg Raises',       3, '12 reps', '30s', 'Core',   'Lower legs slowly, don\'t touch floor.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'Lower Body', false, [
      ex('nr-i-3-1', 'Barbell Squat',        4, '8 reps',  '120s', 'Quads',     'Brace core, sit back into squat.'),
      ex('nr-i-3-2', 'Romanian Deadlift',    3, '10 reps', '90s',  'Hamstrings','Flat back, hinge to bar at shin height.'),
      ex('nr-i-3-3', 'Walking Lunges',       3, '12 reps', '60s',  'Quads',     '12 per leg, keep torso upright.'),
      ex('nr-i-3-4', 'Leg Curl',             3, '12 reps', '60s',  'Hamstrings','Controlled curl, squeeze at top.'),
      ex('nr-i-3-5', 'Standing Calf Raises', 4, '15 reps', '30s',  'Calves',   'Full stretch at bottom, hold at top.'),
    ]),
    makeDay(4, 'Shoulders & Arms', false, [
      ex('nr-i-4-1', 'Overhead Press',  3, '8 reps',  '90s', 'Shoulders', 'Press barbell overhead, full lockout.'),
      ex('nr-i-4-2', 'Lateral Raises',  3, '12 reps', '45s', 'Shoulders', 'Slight bend in elbows, raise to ear height.'),
      ex('nr-i-4-3', 'Face Pulls',      3, '15 reps', '45s', 'Rear Delts','Rope to face, elbows flared.'),
      ex('nr-i-4-4', 'Hammer Curls',    3, '10 reps', '45s', 'Biceps',    'Alternate arms, neutral grip throughout.'),
      ex('nr-i-4-5', 'Tricep Dips',     3, '12 reps', '45s', 'Triceps',   'Body upright, elbows directly back.'),
    ]),
    makeDay(5, 'Full Body HIIT', false, [
      ex('nr-i-5-1', 'Burpees',         3, '10 reps', '60s', 'Full Body', 'Plank, push-up, jump up with arms overhead.'),
      ex('nr-i-5-2', 'Goblet Squat',    3, '12 reps', '60s', 'Quads',     'Hold weight at chest, squat deep.'),
      ex('nr-i-5-3', 'Mountain Climbers',3,'30s',     '45s', 'Core',      'High tempo, keep hips stable.'),
      ex('nr-i-5-4', 'Push-ups',        3, '15 reps', '45s', 'Chest',     'Perfect form — no sagging hips.'),
      ex('nr-i-5-5', 'High Knees',      3, '30s',     '30s', 'Cardio',    'Drive knees to hip height, pump arms.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  advanced: [
    makeDay(0, 'Upper Body (Power)', false, [
      ex('nr-a-0-1', 'Bench Press',            5, '5 reps',  '120s', 'Chest',    'Heavy sets — log progressive overload.'),
      ex('nr-a-0-2', 'Pull-ups',               5, '8 reps',  '90s',  'Back',     'Add weight if needed.'),
      ex('nr-a-0-3', 'Overhead Press',         4, '6 reps',  '90s',  'Shoulders','Push PR each week.'),
      ex('nr-a-0-4', 'Barbell Bicep Curl',     4, '8 reps',  '60s',  'Biceps',   'Use a weight that fatigues by rep 8.'),
      ex('nr-a-0-5', 'Skull Crushers',         4, '10 reps', '45s',  'Triceps',  'Slow eccentric, full extension.'),
    ]),
    makeDay(1, 'HIIT Cardio & Core', false, [
      ex('nr-a-1-1', 'Burpees',          4, '12 reps', '45s', 'Full Body', 'Explosive jump at top.'),
      ex('nr-a-1-2', 'Mountain Climbers',4, '30s',     '20s', 'Core',      'Max speed, keep hips down.'),
      ex('nr-a-1-3', 'Ab Wheel',         4, '12 reps', '45s', 'Core',      'Full extension each rep.'),
      ex('nr-a-1-4', 'Russian Twist',    4, '20 reps', '30s', 'Core',      'Use a weight, full rotation each side.'),
      ex('nr-a-1-5', 'High Knees',       4, '45s',     '15s', 'Cardio',    'Sprint pace — max effort.'),
    ]),
    makeDay(2, 'Rest / Mobility', true),
    makeDay(3, 'Lower Body (Power)', false, [
      ex('nr-a-3-1', 'Barbell Squat',        5, '5 reps',  '150s', 'Quads',     'Heavy — below parallel, brace hard.'),
      ex('nr-a-3-2', 'Romanian Deadlift',    4, '8 reps',  '90s',  'Hamstrings','Load the stretch, controlled descent.'),
      ex('nr-a-3-3', 'Walking Lunges',       4, '12 reps', '60s',  'Quads',     'Add dumbbells. Lunge with control.'),
      ex('nr-a-3-4', 'Hip Thrust',           4, '10 reps', '60s',  'Glutes',    'Drive bar up with glutes, pause at top.'),
      ex('nr-a-3-5', 'Standing Calf Raises', 5, '15 reps', '20s',  'Calves',   'Slow tempo, feel the burn.'),
    ]),
    makeDay(4, 'Shoulders & Arms (Volume)', false, [
      ex('nr-a-4-1', 'Arnold Press',     4, '8 reps',  '75s', 'Shoulders', 'Full rotation — front and side delts.'),
      ex('nr-a-4-2', 'Lateral Raises',   4, '12 reps', '30s', 'Shoulders', 'Drop-set on last set.'),
      ex('nr-a-4-3', 'Face Pulls',       4, '15 reps', '30s', 'Rear Delts','Warm up rotator cuff first.'),
      ex('nr-a-4-4', 'Cable Curl',       4, '10 reps', '45s', 'Biceps',    'Constant tension through the movement.'),
      ex('nr-a-4-5', 'Overhead Tricep Extension', 4, '10 reps', '45s', 'Triceps', 'Full stretch at bottom, lock out at top.'),
    ]),
    makeDay(5, 'Full Body HIIT (Max)', false, [
      ex('nr-a-5-1', 'Burpees',         5, '12 reps', '30s', 'Full Body', 'Max effort every set.'),
      ex('nr-a-5-2', 'Goblet Squat',    4, '15 reps', '45s', 'Quads',     'Heavy goblet — deep squat.'),
      ex('nr-a-5-3', 'Mountain Climbers',4,'45s',     '15s', 'Core',      'Interval style.'),
      ex('nr-a-5-4', 'Push-ups',        4, '20 reps', '30s', 'Chest',     'Add a clap at top if possible.'),
      ex('nr-a-5-5', 'High Knees',      4, '45s',     '15s', 'Cardio',    'Sprint pace.'),
    ]),
    makeDay(6, 'Rest', true),
  ],
};

// ── Overweight → Weight Loss ────────────────────────────────────
const OW = {
  beginner: [
    makeDay(0, 'Low Impact Cardio', false, [
      ex('ow-b-0-1', 'Jumping Jacks',    3, '30s',     '60s', 'Cardio', 'Moderate pace, breathe rhythmically.'),
      ex('ow-b-0-2', 'Bodyweight Squat', 3, '12 reps', '60s', 'Quads',  'Sit back into squat, feet shoulder-width.'),
      ex('ow-b-0-3', 'Wall Sit',         3, '20s',     '60s', 'Quads',  'Back flat, thighs parallel to floor.'),
      ex('ow-b-0-4', 'Glute Bridge',     3, '12 reps', '45s', 'Glutes', 'Drive hips up, squeeze glutes at top.'),
      ex('ow-b-0-5', 'Plank',            3, '15s',     '45s', 'Core',   'Hold position, breathe slowly.'),
    ]),
    makeDay(1, 'Upper Body', false, [
      ex('ow-b-1-1', 'Knee Push-ups',           3, '10 reps', '60s', 'Chest',    'Controlled, full range of motion.'),
      ex('ow-b-1-2', 'Dumbbell Row',            3, '10 reps', '60s', 'Back',     'Pull to hip with flat back.'),
      ex('ow-b-1-3', 'Dumbbell Shoulder Press', 3, '10 reps', '60s', 'Shoulders','From shoulders to overhead.'),
      ex('ow-b-1-4', 'Bicep Curls',             2, '12 reps', '60s', 'Biceps',   'Controlled curl and descent.'),
      ex('ow-b-1-5', 'Tricep Kickbacks',        2, '12 reps', '45s', 'Triceps',  'Hinge forward, extend forearm back.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'Lower Body', false, [
      ex('ow-b-3-1', 'Step-ups',              3, '10 reps', '60s', 'Quads',  'Step onto a platform, fully extend, step down.'),
      ex('ow-b-3-2', 'Lunges',               3, '8 reps',  '60s', 'Quads',  'Hold wall for balance if needed.'),
      ex('ow-b-3-3', 'Glute Bridge',         3, '15 reps', '45s', 'Glutes', 'Hold 1s at top.'),
      ex('ow-b-3-4', 'Standing Calf Raises', 3, '15 reps', '30s', 'Calves', 'Full range of motion.'),
      ex('ow-b-3-5', 'Bird-Dog',             3, '8 reps',  '30s', 'Core',   'Keep back flat throughout.'),
    ]),
    makeDay(4, 'Light Cardio', false, [
      ex('ow-b-4-1', 'High Knees',  3, '20s',     '45s', 'Cardio', 'Moderate pace, drive knees to hip height.'),
      ex('ow-b-4-2', 'Jumping Jacks',3,'30s',     '45s', 'Cardio', 'Light bounce, consistent rhythm.'),
      ex('ow-b-4-3', 'Crunches',    3, '12 reps', '45s', 'Core',   'Short controlled range of motion.'),
      ex('ow-b-4-4', 'Superman',    3, '10 reps', '30s', 'Back',   'Lift arms and legs together.'),
    ]),
    makeDay(5, 'Full Body', false, [
      ex('ow-b-5-1', 'Bodyweight Squat', 3, '15 reps', '60s', 'Quads',  'Full depth, drive through heels.'),
      ex('ow-b-5-2', 'Knee Push-ups',    3, '10 reps', '60s', 'Chest',  'Control the descent.'),
      ex('ow-b-5-3', 'Dumbbell Row',     3, '10 reps', '60s', 'Back',   'Flat back, pull to hip.'),
      ex('ow-b-5-4', 'Plank',           3, '20s',     '45s', 'Core',   'Hold tight, don\'t let hips drop.'),
      ex('ow-b-5-5', 'Jumping Jacks',   3, '30s',     '45s', 'Cardio', 'Finish with cardio burst.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  intermediate: [
    makeDay(0, 'Cardio & Lower Body', false, [
      ex('ow-i-0-1', 'Jump Rope',          3, '2 min',   '90s', 'Cardio', 'Consistent pace, land softly on balls of feet.'),
      ex('ow-i-0-2', 'Barbell Squat',      3, '12 reps', '90s', 'Quads',  'Moderate weight, controlled tempo.'),
      ex('ow-i-0-3', 'Walking Lunges',     3, '12 reps', '60s', 'Quads',  'Step forward, lower back knee.'),
      ex('ow-i-0-4', 'Leg Press',          3, '15 reps', '75s', 'Quads',  'Feet shoulder-width, full range.'),
      ex('ow-i-0-5', 'Standing Calf Raises',3,'15 reps', '30s', 'Calves', 'Full range, pause at top.'),
    ]),
    makeDay(1, 'Upper Body Circuit', false, [
      ex('ow-i-1-1', 'Push-ups',           3, '12 reps', '60s', 'Chest',    'Maintain straight body.'),
      ex('ow-i-1-2', 'Dumbbell Row',       3, '12 reps', '60s', 'Back',     'Pull to hip, squeeze shoulder blade.'),
      ex('ow-i-1-3', 'Overhead Press',     3, '10 reps', '75s', 'Shoulders','Light to moderate weight.'),
      ex('ow-i-1-4', 'Lateral Raises',     3, '12 reps', '45s', 'Shoulders','Raise to ear height, lower slowly.'),
      ex('ow-i-1-5', 'Tricep Dips',        3, '10 reps', '45s', 'Triceps',  'Use bench, keep elbows tracking back.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'HIIT Cardio', false, [
      ex('ow-i-3-1', 'High Knees',        3, '40s',     '20s', 'Cardio', 'Sprint pace, drive knees to hip height.'),
      ex('ow-i-3-2', 'Mountain Climbers', 3, '30s',     '30s', 'Core',   'Keep hips level, fast alternating knees.'),
      ex('ow-i-3-3', 'Burpees',           3, '10 reps', '60s', 'Full Body','Step out instead of jumping if needed.'),
      ex('ow-i-3-4', 'Jumping Jacks',     3, '45s',     '15s', 'Cardio', 'Full arm reach overhead.'),
      ex('ow-i-3-5', 'Plank',             3, '45s',     '30s', 'Core',   'Hold steady, breathe.'),
    ]),
    makeDay(4, 'Lower Body & Core', false, [
      ex('ow-i-4-1', 'Romanian Deadlift', 3, '12 reps', '75s', 'Hamstrings','Keep back straight, feel the stretch.'),
      ex('ow-i-4-2', 'Goblet Squat',      3, '12 reps', '60s', 'Quads',    'Deep squat, elbows inside knees.'),
      ex('ow-i-4-3', 'Glute Bridge',      3, '15 reps', '45s', 'Glutes',   'Hold 2s at top.'),
      ex('ow-i-4-4', 'Russian Twist',     3, '12 reps', '30s', 'Core',     'Hold weight, full rotation.'),
      ex('ow-i-4-5', 'Leg Raises',        3, '12 reps', '30s', 'Core',     'Lower legs slow — don\'t touch floor.'),
    ]),
    makeDay(5, 'Full Body Circuit', false, [
      ex('ow-i-5-1', 'Barbell Squat',   3, '12 reps', '75s', 'Quads',  'Moderate pace, good depth.'),
      ex('ow-i-5-2', 'Push-ups',        3, '15 reps', '45s', 'Chest',  'Full range, no cheating.'),
      ex('ow-i-5-3', 'Dumbbell Row',    3, '12 reps', '45s', 'Back',   'Both sides.'),
      ex('ow-i-5-4', 'Burpees',         3, '8 reps',  '60s', 'Cardio', 'Finish strong.'),
      ex('ow-i-5-5', 'Mountain Climbers',3,'30s',     '30s', 'Core',   'Max pace.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  advanced: [
    makeDay(0, 'HIIT + Strength', false, [
      ex('ow-a-0-1', 'Burpees',         4, '15 reps', '30s', 'Full Body', 'No rest between reps, full jump at top.'),
      ex('ow-a-0-2', 'Barbell Squat',   4, '10 reps', '90s', 'Quads',    'Heavy — moderate rest between sets.'),
      ex('ow-a-0-3', 'Walking Lunges',  4, '12 reps', '60s', 'Quads',    'Add dumbbells for more resistance.'),
      ex('ow-a-0-4', 'Romanian Deadlift',4,'10 reps', '75s', 'Hamstrings','Load the hamstring stretch.'),
      ex('ow-a-0-5', 'High Knees',      4, '45s',     '15s', 'Cardio',   'Sprint pace — all out.'),
    ]),
    makeDay(1, 'Upper Body + Cardio', false, [
      ex('ow-a-1-1', 'Bench Press',           4, '8 reps',  '75s', 'Chest',    'Superset with push-ups.'),
      ex('ow-a-1-2', 'Pull-ups',              4, '6 reps',  '75s', 'Back',     'Or lat pulldown with heavy weight.'),
      ex('ow-a-1-3', 'Overhead Press',        4, '8 reps',  '75s', 'Shoulders','Push weight each week.'),
      ex('ow-a-1-4', 'Mountain Climbers',     4, '45s',     '15s', 'Core',     'Max speed between strength sets.'),
      ex('ow-a-1-5', 'Jump Rope',             3, '3 min',   '60s', 'Cardio',   'Steady pace, no stopping.'),
    ]),
    makeDay(2, 'Rest / Active Recovery', true),
    makeDay(3, 'Metabolic Lower Body', false, [
      ex('ow-a-3-1', 'Goblet Squat',      4, '15 reps', '45s', 'Quads',     'Heavy goblet, fast pace.'),
      ex('ow-a-3-2', 'Hip Thrust',        4, '12 reps', '60s', 'Glutes',    'Drive through glutes, not lower back.'),
      ex('ow-a-3-3', 'Walking Lunges',    4, '14 reps', '45s', 'Quads',     'Add weight, no rest between sets.'),
      ex('ow-a-3-4', 'Leg Curl',          4, '12 reps', '45s', 'Hamstrings','Slow eccentric, explosive concentric.'),
      ex('ow-a-3-5', 'Burpees',           3, '12 reps', '30s', 'Cardio',    'Finisher — go hard.'),
    ]),
    makeDay(4, 'HIIT Circuit', false, [
      ex('ow-a-4-1', 'High Knees',        5, '45s',     '15s', 'Cardio', 'Max effort — 5 rounds.'),
      ex('ow-a-4-2', 'Mountain Climbers', 5, '30s',     '10s', 'Core',   'No rest between intervals.'),
      ex('ow-a-4-3', 'Burpees',           4, '12 reps', '30s', 'Full Body','Chain directly from mountain climbers.'),
      ex('ow-a-4-4', 'Plank',             4, '60s',     '30s', 'Core',   'Hold strong.'),
    ]),
    makeDay(5, 'Total Body Power', false, [
      ex('ow-a-5-1', 'Deadlift',    4, '6 reps',  '120s', 'Full Body', 'Heaviest lift of the week.'),
      ex('ow-a-5-2', 'Push-ups',    4, '20 reps', '30s',  'Chest',     'Explosive push, slow descent.'),
      ex('ow-a-5-3', 'Pull-ups',    4, '8 reps',  '60s',  'Back',      'Full dead hang, chin above bar.'),
      ex('ow-a-5-4', 'Burpees',     4, '10 reps', '30s',  'Cardio',    'Sprint pace finisher.'),
    ]),
    makeDay(6, 'Rest', true),
  ],
};

// ── Obese → Active Start ────────────────────────────────────────
const OB = {
  beginner: [
    makeDay(0, 'Gentle Cardio', false, [
      ex('ob-b-0-1', 'Wall Sit',         3, '15s',     '60s', 'Quads',  'Back flat on wall, thighs toward parallel.'),
      ex('ob-b-0-2', 'Jumping Jacks',    3, '20s',     '60s', 'Cardio', 'Low impact — step out one foot at a time if needed.'),
      ex('ob-b-0-3', 'Glute Bridge',     3, '12 reps', '45s', 'Glutes', 'Drive hips up, squeeze at top.'),
      ex('ob-b-0-4', 'Crunches',         3, '10 reps', '45s', 'Core',   'Small range — just lift shoulders off floor.'),
    ]),
    makeDay(1, 'Upper Body (Light)', false, [
      ex('ob-b-1-1', 'Knee Push-ups',           3, '8 reps',  '60s', 'Chest',    'Focus on form, not speed.'),
      ex('ob-b-1-2', 'Dumbbell Row',            3, '8 reps',  '60s', 'Back',     'Light weight, flat back.'),
      ex('ob-b-1-3', 'Dumbbell Shoulder Press', 3, '8 reps',  '60s', 'Shoulders','Press light dumbbells overhead.'),
      ex('ob-b-1-4', 'Bicep Curls',             2, '10 reps', '60s', 'Biceps',   'Light weight, controlled.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'Lower Body (Light)', false, [
      ex('ob-b-3-1', 'Bodyweight Squat', 3, '10 reps', '60s', 'Quads',  'Sit back, go to comfortable depth.'),
      ex('ob-b-3-2', 'Step-ups',         3, '8 reps',  '60s', 'Quads',  'Use a low step, hold wall if needed.'),
      ex('ob-b-3-3', 'Glute Bridge',     3, '12 reps', '45s', 'Glutes', 'Hold 1s at top.'),
      ex('ob-b-3-4', 'Superman',         3, '8 reps',  '30s', 'Back',   'Lift and hold 2s.'),
    ]),
    makeDay(4, 'Rest', true),
    makeDay(5, 'Full Body Light', false, [
      ex('ob-b-5-1', 'Bodyweight Squat', 3, '10 reps', '60s', 'Quads',  'Focus on getting comfortable.'),
      ex('ob-b-5-2', 'Knee Push-ups',    3, '8 reps',  '60s', 'Chest',  'Slow and steady.'),
      ex('ob-b-5-3', 'Glute Bridge',     3, '10 reps', '45s', 'Glutes', 'Hip drive at top.'),
      ex('ob-b-5-4', 'Plank',           3, '10s',     '45s', 'Core',   'Hold for as long as comfortable.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  intermediate: [
    makeDay(0, 'Cardio & Lower Body', false, [
      ex('ob-i-0-1', 'Jumping Jacks',    3, '30s',     '60s', 'Cardio', 'Moderate pace, light landing.'),
      ex('ob-i-0-2', 'Bodyweight Squat', 3, '12 reps', '60s', 'Quads',  'Good depth, controlled.'),
      ex('ob-i-0-3', 'Step-ups',         3, '12 reps', '60s', 'Quads',  'Alternate legs.'),
      ex('ob-i-0-4', 'Glute Bridge',     3, '15 reps', '45s', 'Glutes', 'Hold 2s at top.'),
      ex('ob-i-0-5', 'Plank',           3, '20s',     '45s', 'Core',   'Hold steady.'),
    ]),
    makeDay(1, 'Upper Body', false, [
      ex('ob-i-1-1', 'Push-ups',                3, '10 reps', '60s', 'Chest',    'Full push-ups or knee variation.'),
      ex('ob-i-1-2', 'Lat Pulldown',            3, '10 reps', '60s', 'Back',     'Light weight, pull to chest.'),
      ex('ob-i-1-3', 'Dumbbell Shoulder Press', 3, '10 reps', '60s', 'Shoulders','Seated for stability.'),
      ex('ob-i-1-4', 'Bicep Curls',             3, '10 reps', '60s', 'Biceps',   'Controlled pace.'),
      ex('ob-i-1-5', 'Tricep Kickbacks',        2, '12 reps', '45s', 'Triceps',  'Light weight, full extension.'),
    ]),
    makeDay(2, 'Rest', true),
    makeDay(3, 'Cardio Circuit', false, [
      ex('ob-i-3-1', 'High Knees',       3, '25s',     '35s', 'Cardio', 'March pace — or jog in place.'),
      ex('ob-i-3-2', 'Mountain Climbers',3, '20s',     '40s', 'Core',   'Slow and controlled.'),
      ex('ob-i-3-3', 'Jumping Jacks',    3, '30s',     '30s', 'Cardio', 'Full arm reach overhead.'),
      ex('ob-i-3-4', 'Crunches',         3, '12 reps', '30s', 'Core',   'Slow and focused.'),
      ex('ob-i-3-5', 'Plank',           3, '25s',     '35s', 'Core',   'Keep hips level.'),
    ]),
    makeDay(4, 'Lower Body', false, [
      ex('ob-i-4-1', 'Goblet Squat',    3, '12 reps', '60s', 'Quads',  'Hold light dumbbell at chest.'),
      ex('ob-i-4-2', 'Lunges',          3, '8 reps',  '60s', 'Quads',  'Hold wall if needed.'),
      ex('ob-i-4-3', 'Romanian Deadlift',3,'10 reps', '60s', 'Hamstrings','Light weight, feel the stretch.'),
      ex('ob-i-4-4', 'Bird-Dog',        3, '8 reps',  '30s', 'Core',   'Opposite arm and leg.'),
    ]),
    makeDay(5, 'Full Body', false, [
      ex('ob-i-5-1', 'Bodyweight Squat', 3, '15 reps', '60s', 'Quads',  'Good range, push through heels.'),
      ex('ob-i-5-2', 'Push-ups',         3, '10 reps', '60s', 'Chest',  'Full or modified — consistent.'),
      ex('ob-i-5-3', 'Dumbbell Row',     3, '10 reps', '60s', 'Back',   'Both sides, flat back.'),
      ex('ob-i-5-4', 'High Knees',       3, '25s',     '35s', 'Cardio', 'Finish with energy.'),
    ]),
    makeDay(6, 'Rest', true),
  ],

  advanced: [
    makeDay(0, 'Cardio + Lower Body', false, [
      ex('ob-a-0-1', 'Jump Rope',          4, '90s',     '45s', 'Cardio',    'Consistent pace, no stopping.'),
      ex('ob-a-0-2', 'Barbell Squat',      4, '10 reps', '90s', 'Quads',     'Moderate weight, full depth.'),
      ex('ob-a-0-3', 'Walking Lunges',     4, '12 reps', '60s', 'Quads',     'Add light dumbbells.'),
      ex('ob-a-0-4', 'Hip Thrust',         3, '12 reps', '60s', 'Glutes',    'Drive through glutes.'),
      ex('ob-a-0-5', 'Burpees',            3, '8 reps',  '60s', 'Full Body', 'Step out option if needed.'),
    ]),
    makeDay(1, 'Upper Body + Cardio', false, [
      ex('ob-a-1-1', 'Push-ups',           4, '15 reps', '45s', 'Chest',    'Full range.'),
      ex('ob-a-1-2', 'Lat Pulldown',       4, '10 reps', '60s', 'Back',     'Moderate weight.'),
      ex('ob-a-1-3', 'Overhead Press',     3, '10 reps', '75s', 'Shoulders','Standing.'),
      ex('ob-a-1-4', 'Mountain Climbers',  4, '30s',     '30s', 'Core',     'Keep up intensity.'),
      ex('ob-a-1-5', 'Jump Rope',          3, '2 min',   '60s', 'Cardio',   'End of session cardio.'),
    ]),
    makeDay(2, 'Rest / Light Walk', true),
    makeDay(3, 'HIIT Circuit', false, [
      ex('ob-a-3-1', 'High Knees',        4, '40s',     '20s', 'Cardio', 'Drive fast.'),
      ex('ob-a-3-2', 'Burpees',           4, '10 reps', '40s', 'Full Body','No rest between exercises.'),
      ex('ob-a-3-3', 'Mountain Climbers', 4, '30s',     '20s', 'Core',   'Sprint pace.'),
      ex('ob-a-3-4', 'Jumping Jacks',     4, '45s',     '15s', 'Cardio', 'Keep moving.'),
      ex('ob-a-3-5', 'Plank',             4, '45s',     '30s', 'Core',   'Hold tight.'),
    ]),
    makeDay(4, 'Lower Body Strength', false, [
      ex('ob-a-4-1', 'Goblet Squat',     4, '15 reps', '60s', 'Quads',     'Heavy goblet, good depth.'),
      ex('ob-a-4-2', 'Romanian Deadlift',4, '12 reps', '75s', 'Hamstrings','Controlled, feel the stretch.'),
      ex('ob-a-4-3', 'Step-ups',         4, '12 reps', '45s', 'Quads',    'Add dumbbells.'),
      ex('ob-a-4-4', 'Glute Bridge',     4, '15 reps', '30s', 'Glutes',   'Add a plate across hips.'),
    ]),
    makeDay(5, 'Full Body Circuit', false, [
      ex('ob-a-5-1', 'Barbell Squat', 3, '12 reps', '75s', 'Quads',  'Moderate, consistent.'),
      ex('ob-a-5-2', 'Push-ups',      4, '15 reps', '30s', 'Chest',  'Fast pace.'),
      ex('ob-a-5-3', 'Dumbbell Row',  4, '12 reps', '30s', 'Back',   'Both sides.'),
      ex('ob-a-5-4', 'Burpees',       3, '10 reps', '45s', 'Cardio', 'Finish strong.'),
    ]),
    makeDay(6, 'Rest', true),
  ],
};

export const WORKOUT_TEMPLATES = { underweight: UW, normal: NR, overweight: OW, obese: OB };

export function getTemplateForBMI(bmiKey, fitnessLevel = 'intermediate') {
  const cat = WORKOUT_TEMPLATES[bmiKey];
  if (!cat) return null;
  const level = cat[fitnessLevel] || cat.intermediate;
  const PLAN_NAMES = {
    underweight: 'Muscle Building',
    normal: 'Balanced Fitness',
    overweight: 'Weight Loss',
    obese: 'Active Start',
  };
  return { name: PLAN_NAMES[bmiKey] || 'Custom Plan', days: level };
}
