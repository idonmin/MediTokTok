import { Router } from 'express';
import { requireDatabase } from '../../lib/supabase.js';

export const overviewRouter = Router();

overviewRouter.get('/', async (_req, res, next) => {
  try {
    const database = requireDatabase();
    const { data: papers, error } = await database.from('pubmed_records').select('pub_year,journal');
    if (error) throw error;
    const byYear = Object.entries((papers || []).reduce((acc, paper) => ({ ...acc, [paper.pub_year]: (acc[paper.pub_year] || 0) + 1 }), {})).map(([year, count]) => ({ year, count })).sort((a, b) => Number(a.year) - Number(b.year));
    const journals = Object.entries((papers || []).reduce((acc, paper) => ({ ...acc, [paper.journal]: (acc[paper.journal] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
    res.json({ totalPapers: papers.length, totalJournals: new Set(papers.map((paper) => paper.journal)).size, byYear, journals });
  } catch (error) {
    next(error);
  }
});

overviewRouter.post('/reset', async (_req, res, next) => {
  try {
    const database = requireDatabase();
    const { count: clearedRecords, error: deleteError } = await database
      .from('pubmed_records')
      .delete()
      .like('pmid', '%')
      .select('pmid', { count: 'exact' });

    if (deleteError) throw deleteError;

    res.json({
      clearedRecords: clearedRecords ?? 0,
    });
  } catch (error) {
    next(error);
  }
});
