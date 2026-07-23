import { api } from '../../lib/api.js';

export const collectPapers = (conditions) => api.post('/collection', conditions);
