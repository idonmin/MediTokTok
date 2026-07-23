import { Router } from 'express';
import { requireDatabase } from '../../lib/supabase.js';

export const papersRouter = Router();

function applyFilters(query, params) {
  let filtered = query;
  if (params.query) filtered = filtered.or(`title.ilike.%${params.query}%,abstract.ilike.%${params.query}%`);
  if (params.startYear) filtered = filtered.gte('pub_year', Number(params.startYear));
  if (params.endYear) filtered = filtered.lte('pub_year', Number(params.endYear));
  if (params.journal) filtered = filtered.eq('journal', params.journal);
  return filtered;
}

papersRouter.get('/', async (req, res, next) => {
  try {
    const database = requireDatabase();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    let query = database.from('papers').select('*', { count: 'exact' }).order('pub_year', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    query = applyFilters(query, req.query);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ items: data, total: count, page, pageSize });
  } catch (error) {
    next(error);
  }
});

papersRouter.get('/export', async (req, res, next) => {
  try {
    const database = requireDatabase();
    let query = database.from('papers').select('pmid,pub_year,title,journal,authors');
    query = applyFilters(query, req.query);
    const { data, error } = await query;
    if (error) throw error;
    const columns = ['pmid', 'pub_year', 'title', 'journal', 'authors'];
    const escape = (value) => `"${String(Array.isArray(value) ? value.join('; ') : value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(','), ...(data || []).map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="meditalktalk-papers.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});
