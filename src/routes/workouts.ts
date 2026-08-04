import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { name } = req.body || {};

  const workout = await prisma.workout.create({
    data: {
      userId: req.userId as string,
      name: name || 'Workout',
    },
  });

  res.status(201).json(workout);
});

router.post('/:workoutId/exercises', requireAuth, async (req: AuthRequest, res) => {
  const  workoutId = req.params.workoutId as string;
  const { exerciseId } = req.body || {};

  if (!exerciseId) {
    return res.status(400).json({ error: 'exerciseId is required' });
  }

  // Figure out what order this exercise should be in
  const existingCount = await prisma.workoutExercise.count({
    where: { workoutId },
  });

  const workoutExercise = await prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId,
      order: existingCount,
    },
    include: { exercise: true },
  });

  res.status(201).json(workoutExercise);
});

router.patch('/:workoutId/finish', requireAuth, async (req: AuthRequest, res) => {
  const workoutId = req.params.workoutId as string;

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: { finishedAt: new Date() },
  });

  res.status(200).json(workout);
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const workouts = await prisma.workout.findMany({
    where: {
      userId: req.userId as string,
      finishedAt: { not: null }, // only show completed workouts
    },
    orderBy: { date: 'desc' },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  res.status(200).json(workouts);
});

router.get('/stats/summary', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const weeklyTarget = user?.weeklyTarget ?? 3;

  const workouts = await prisma.workout.findMany({
    where: { userId, finishedAt: { not: null } },
    include: {
      exercises: {
        include: { exercise: true, sets: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  // --- Personal records: highest weight per exercise ---
  const prMap = new Map<string, { exercise: string; weight: number; reps: number; date: Date }>();
  for (const workout of workouts) {
    for (const we of workout.exercises) {
      for (const set of we.sets) {
        const existing = prMap.get(we.exercise.name);
        if (!existing || set.weight > existing.weight) {
          prMap.set(we.exercise.name, {
            exercise: we.exercise.name,
            weight: set.weight,
            reps: set.reps,
            date: workout.date,
          });
        }
      }
    }
  }
  const personalRecords = Array.from(prMap.values());

  // --- Weekly streak ---
  // Helper: get the Monday of the week a date falls in
  function getWeekStart(date: Date): string {
    const d = new Date(date);
    const utcDay = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = utcDay === 0 ? -6 : 1 - utcDay;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    return monday.toISOString().split('T')[0];
}

  const sessionsPerWeek = new Map<string, number>();
  for (const workout of workouts) {
    const weekKey = getWeekStart(workout.date);
    sessionsPerWeek.set(weekKey, (sessionsPerWeek.get(weekKey) || 0) + 1);
  }

  const thisWeekKey = getWeekStart(new Date());
  const thisWeekCount = sessionsPerWeek.get(thisWeekKey) || 0;

  // Walk backwards from last week (not this week, since it's still in progress)
  let streak = 0;
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - 7); // start checking from last week

  while (true) {
    const weekKey = getWeekStart(cursor);
    const count = sessionsPerWeek.get(weekKey) || 0;
    if (count >= weeklyTarget) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  // --- Weekly volume for the chart ---
  const volumeByWeek = new Map<string, number>();
  for (const workout of workouts) {
    const weekKey = getWeekStart(workout.date);
    let workoutVolume = 0;
    for (const we of workout.exercises) {
      for (const set of we.sets) {
        workoutVolume += set.weight * set.reps;
      }
    }
    volumeByWeek.set(weekKey, (volumeByWeek.get(weekKey) || 0) + workoutVolume);
  }
  const weeklyVolume = Array.from(volumeByWeek.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));

  res.status(200).json({
    personalRecords,
    weeklyStreak: streak,
    thisWeekSessions: thisWeekCount,
    weeklyTarget,
    weeklyVolume,
  });
});

router.get('/:workoutId', requireAuth, async (req: AuthRequest, res) => {
  const workoutId = req.params.workoutId as string;

  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      userId: req.userId as string,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  res.status(200).json(workout);
});



export default router;
