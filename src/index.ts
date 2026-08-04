import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import { AuthRequest, requireAuth } from './middleware/auth';
import workoutsRouter from './routes/workouts';
import setsRouter from './routes/sets';
import routinesRouter from './routes/routines';
import exercisesRouter from './routes/exercises';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Gym tracker API is running');
});

app.get('/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ userId: req.userId})
});

app.use('/auth', authRouter);

app.use('/workouts', workoutsRouter);

app.use('/workout-exercises', setsRouter);

app.use('/routines', routinesRouter);

app.use('/exercises', exercisesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
