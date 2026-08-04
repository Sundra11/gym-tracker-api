import { Router} from 'express';
import {prisma } from '../prisma';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: 'asc' },
  });
  res.status(200).json(exercises);
});

export default router;
