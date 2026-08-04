import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/:workoutExerciseId/sets', requireAuth, async (req: AuthRequest, res) => {
  const workoutExerciseId = req.params.workoutExerciseId as string;
  const { weight, reps, rpe, restSeconds } = req.body || {};

  if (weight === undefined || reps === undefined) {
    return res.status(400).json({ error: 'weight and reps are required' });
  }

  const set = await prisma.set.create({
    data: {
      workoutExerciseId,
      weight,
      reps,
      rpe,
      restSeconds,
    },
  });

  res.status(201).json(set);
});

export default router;