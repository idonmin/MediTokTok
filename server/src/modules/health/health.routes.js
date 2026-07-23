import { Router } from 'express';
import { env, hasSupabaseConfig } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'meditalktalk-api',
    integrations: {
      supabase: hasSupabaseConfig,
      ncbiKey: Boolean(env.ncbiApiKey),
      openai: Boolean(env.openaiApiKey),
    },
  });
});
