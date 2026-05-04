// Exercise name → GIF animation URL
// Source: fitnessprogramer.com (free public exercise GIFs)
const BASE = 'https://fitnessprogramer.com/wp-content/uploads';

export const EXERCISE_GIFS = {
  // Chest
  'Bench Press':             `${BASE}/2021/02/Barbell-Bench-Press.gif`,
  'Incline Dumbbell Press':  `${BASE}/2021/02/Incline-Dumbbell-Press.gif`,
  'Push-ups':                `${BASE}/2021/02/Push-Up.gif`,
  'Knee Push-ups':           `${BASE}/2021/06/Knee-Push-Up.gif`,
  'Dumbbell Chest Press':    `${BASE}/2021/02/Dumbbell-Bench-Press.gif`,
  'Chest Fly':               `${BASE}/2021/02/Dumbbell-Chest-Fly.gif`,
  'Cable Crossover':         `${BASE}/2021/02/Low-Cable-Crossover.gif`,

  // Back
  'Pull-ups':                `${BASE}/2021/02/PULL-UP.gif`,
  'Assisted Pull-ups':       `${BASE}/2021/06/Assisted-Pull-Up.gif`,
  'Lat Pulldown':            `${BASE}/2021/02/Lat-Pull-Down.gif`,
  'Barbell Row':             `${BASE}/2021/02/Barbell-Row.gif`,
  'Dumbbell Row':            `${BASE}/2021/02/Dumbbell-Row.gif`,
  'Seated Cable Row':        `${BASE}/2021/02/Seated-Cable-Row.gif`,
  'Deadlift':                `${BASE}/2021/02/Barbell-Deadlift.gif`,
  'Back Extension':          `${BASE}/2021/02/Back-Extension.gif`,
  'Superman':                `${BASE}/2021/06/Superman-Exercise.gif`,

  // Shoulders
  'Overhead Press':          `${BASE}/2021/02/Military-Press.gif`,
  'Dumbbell Shoulder Press': `${BASE}/2021/02/Dumbbell-Shoulder-Press.gif`,
  'Lateral Raises':          `${BASE}/2021/02/Lateral-Raise.gif`,
  'Front Raises':            `${BASE}/2021/02/Front-Raise.gif`,
  'Face Pulls':              `${BASE}/2021/02/Face-Pull.gif`,
  'Arnold Press':            `${BASE}/2021/02/Arnold-Press.gif`,

  // Biceps
  'Barbell Bicep Curl':      `${BASE}/2021/02/Barbell-Curl.gif`,
  'Dumbbell Bicep Curl':     `${BASE}/2021/02/Dumbbell-Curl.gif`,
  'Bicep Curls':             `${BASE}/2021/02/Dumbbell-Curl.gif`,
  'Hammer Curls':            `${BASE}/2021/02/Hammer-Curl.gif`,
  'Cable Curl':              `${BASE}/2021/02/Cable-Curl.gif`,

  // Triceps
  'Tricep Dips':             `${BASE}/2021/02/Tricep-Dips-between-Benches.gif`,
  'Dips':                    `${BASE}/2021/02/Dips.gif`,
  'Cable Tricep Pushdown':   `${BASE}/2021/02/Tricep-Pushdown.gif`,
  'Tricep Kickbacks':        `${BASE}/2021/02/Tricep-Kickback.gif`,
  'Skull Crushers':          `${BASE}/2021/02/Barbell-Skull-Crusher.gif`,
  'Overhead Tricep Extension': `${BASE}/2021/02/Overhead-Dumbbell-Triceps-Extension.gif`,

  // Legs
  'Barbell Squat':           `${BASE}/2021/02/Barbell-Squat.gif`,
  'Bodyweight Squat':        `${BASE}/2021/02/Bodyweight-Squat.gif`,
  'Goblet Squat':            `${BASE}/2021/02/Goblet-Squat.gif`,
  'Leg Press':               `${BASE}/2021/02/Leg-Press.gif`,
  'Romanian Deadlift':       `${BASE}/2021/02/Romanian-Deadlift.gif`,
  'Leg Curl':                `${BASE}/2021/02/Leg-Curl.gif`,
  'Leg Extension':           `${BASE}/2021/02/Leg-Extension.gif`,
  'Standing Calf Raises':    `${BASE}/2021/02/Standing-Calf-Raise.gif`,
  'Seated Calf Raises':      `${BASE}/2021/02/Seated-Calf-Raise.gif`,
  'Lunges':                  `${BASE}/2021/02/Lunges.gif`,
  'Walking Lunges':          `${BASE}/2021/06/Walking-Lunge.gif`,
  'Step-ups':                `${BASE}/2021/06/Dumbbell-Step-Up.gif`,
  'Glute Bridge':            `${BASE}/2021/02/Glute-Bridge.gif`,
  'Hip Thrust':              `${BASE}/2021/02/Barbell-Hip-Thrust.gif`,
  'Wall Sit':                `${BASE}/2021/02/Wall-Sit.gif`,
  'Sumo Squat':              `${BASE}/2021/02/Sumo-Squat.gif`,

  // Core
  'Plank':                   `${BASE}/2021/02/Plank.gif`,
  'Side Plank':              `${BASE}/2021/02/Side-Plank.gif`,
  'Crunches':                `${BASE}/2021/02/Crunch.gif`,
  'Leg Raises':              `${BASE}/2021/02/Leg-Raise.gif`,
  'Russian Twist':           `${BASE}/2021/02/Russian-Twist.gif`,
  'Mountain Climbers':       `${BASE}/2021/02/Mountain-Climbers.gif`,
  'Bird-Dog':                `${BASE}/2021/06/Bird-Dog-Exercise.gif`,
  'Dead Bug':                `${BASE}/2021/06/Dead-Bug.gif`,
  'Ab Wheel':                `${BASE}/2021/02/Ab-Wheel-Rollout.gif`,

  // Cardio / Full Body
  'Jumping Jacks':           `${BASE}/2021/02/Jumping-Jacks.gif`,
  'High Knees':              `${BASE}/2021/02/High-Knees.gif`,
  'Burpees':                 `${BASE}/2021/02/Burpee.gif`,
  'Box Step-ups':            `${BASE}/2021/06/Dumbbell-Step-Up.gif`,
  'Swimming':                `${BASE}/2021/06/Freestyle-Swim.gif`,
  'Jump Rope':               `${BASE}/2021/02/Jump-Rope.gif`,
};

export function getExerciseGif(exerciseName) {
  return EXERCISE_GIFS[exerciseName] || null;
}
