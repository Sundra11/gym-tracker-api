import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Create a new routine
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { name } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const routine = await prisma.routine.create({
    data: {
      userId: req.userId as string,
      name,
    },
  });

  res.status(201).json(routine);
});

// Add an exercise to a routine
router.post('/:routineId/exercises', requireAuth, async (req: AuthRequest, res) => {
  const routineId = req.params.routineId as string;
  const { exerciseId, targetSets, targetReps } = req.body || {};

  if (!exerciseId) {
    return res.status(400).json({ error: 'exerciseId is required' });
  }

  const existingCount = await prisma.routineExercise.count({
    where: { routineId },
  });

  const routineExercise = await prisma.routineExercise.create({
    data: {
      routineId,
      exerciseId,
      order: existingCount,
      targetSets,
      targetReps,
    },
    include: { exercise: true },
  });

  res.status(201).json(routineExercise);
});

// List all routines for the logged-in user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const routines = await prisma.routine.findMany({
    where: { userId: req.userId as string },
    orderBy: { createdAt: 'desc' },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  res.status(200).json(routines);
});

// Get a single routine's detail
router.get('/:routineId', requireAuth, async (req: AuthRequest, res) => {
  const routineId = req.params.routineId as string;

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: req.userId as string },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }

  res.status(200).json(routine);
});

// Convenience: start a new workout pre-filled from a routine
router.post('/:routineId/start', requireAuth, async (req: AuthRequest, res) => {
  const routineId = req.params.routineId as string;
  const userId = req.userId as string;

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: true },
  });

  if (!routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }

  const workout = await prisma.workout.create({
    data: { userId, name: routine.name },
  });

  for (const re of routine.exercises) {
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout.id,
        exerciseId: re.exerciseId,
        order: re.order,
      },
    });
  }

  const fullWorkout = await prisma.workout.findUnique({
    where: { id: workout.id },
    include: {
      exercises: { include: { exercise: true, sets: true } },
    },
  });

  res.status(201).json(fullWorkout);
});

export default router;
