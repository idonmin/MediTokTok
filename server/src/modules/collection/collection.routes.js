import { Router } from 'express';
import { z } from 'zod';
import { collectAndSavePapers } from './collection.service.js';

const schema = z.object({
  keyword: z.string().trim().min(1).max(200),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100),
  limit: z.number().int().min(1).max(100),
  sortOrder: z.enum(['relevance', 'newest', 'oldest']).default('relevance'),
}).refine((value) => value.startYear <= value.endYear, { message: '시작 연도는 끝 연도보다 클 수 없습니다.' });

export const collectionRouter = Router();

collectionRouter.post('/', async (req, res, next) => {
  try {
    const conditions = schema.parse(req.body);
    const result = await collectAndSavePapers(conditions, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message });
    return next(error);
  }
});
