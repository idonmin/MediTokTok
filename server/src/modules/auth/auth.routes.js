import { Router } from 'express';

export const authRouter = Router();

authRouter.get('/me', (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});
