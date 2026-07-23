import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { collectionRouter } from './modules/collection/collection.routes.js';
import { overviewRouter } from './modules/overview/overview.routes.js';
import { papersRouter } from './modules/papers/papers.routes.js';
import { chatRouter } from './modules/chat/chat.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authenticate, authRouter);
app.use('/api/collection', authenticate, collectionRouter);
app.use('/api/overview', authenticate, overviewRouter);
app.use('/api/papers', authenticate, papersRouter);
app.use('/api/chat', authenticate, rateLimit({ windowMs: 60_000, limit: 20 }), chatRouter);

app.use(notFound);
app.use(errorHandler);
