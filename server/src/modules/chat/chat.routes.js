import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { medicalSafety } from '../../middleware/medicalSafety.js';
import { createChatStream, ensureConversation, loadConversation, saveMessage } from './chat.service.js';

const schema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export const chatRouter = Router();

chatRouter.post('/stream', medicalSafety, async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const conversationId = input.conversationId || randomUUID();
    await ensureConversation(req.user.id, conversationId);
    const history = await loadConversation(req.user.id, conversationId);
    await saveMessage({ userId: req.user.id, conversationId, role: 'user', content: input.message });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`);

    const stream = await createChatStream([...history, { role: 'user', content: input.message }]);
    let answer = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        answer += token;
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      }
    }
    await saveMessage({ userId: req.user.id, conversationId, role: 'assistant', content: answer });
    res.write('event: done\ndata: {}\n\n');
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message });
    return next(error);
  }
});

chatRouter.get('/:conversationId/messages', async (req, res, next) => {
  try {
    const messages = await loadConversation(req.user.id, req.params.conversationId);
    res.json({ items: messages });
  } catch (error) {
    next(error);
  }
});
