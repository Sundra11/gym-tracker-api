import jwt from 'jsonwebtoken';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';


const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body || {};

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    return res.status(409).json({ error: 'Email or username already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  res.status(201).json({ id: user.id, email: user.email, username: user.username });
});

router.post('/login', async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email}});

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );

  res.status(200).json({ token, user: { id: user.id, email: user.email, username: user.username } });
})

export default router;