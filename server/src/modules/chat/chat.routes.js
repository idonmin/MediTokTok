import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { medicalSafety } from '../../middleware/medicalSafety.js';
import {
  createChatStream,
  createConversation,
  deleteConversation,
  ensureConversation,
  listConversations,
  loadConversation,
  saveMessage,
} from './chat.service.js';

const schema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export const chatRouter = Router();

chatRouter.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await listConversations(req.user.id);
    res.json({ items: conversations });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/conversations', async (req, res, next) => {
  try {
    const conversation = await createConversation(req.user.id);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

chatRouter.delete('/conversations/:conversationId', async (req, res, next) => {
  try {
    const conversationId = z.string().uuid().parse(req.params.conversationId);
    const deleted = await deleteConversation(req.user.id, conversationId);
    res.json(deleted);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: '올바르지 않은 대화 ID입니다.' });
    next(error);
  }
});

chatRouter.post('/stream', medicalSafety, async (req, res, next) => {
  let streaming = false;
  try {
    const input = schema.parse(req.body);
    const conversationId = input.conversationId || randomUUID();
    await ensureConversation(req.user.id, conversationId, input.message);
    const history = await loadConversation(req.user.id, conversationId);
    await saveMessage({ userId: req.user.id, conversationId, role: 'user', content: input.message });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    streaming = true;
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`);

    const context = history.map(({ role, content }) => ({ role, content }));
    const stream = await createChatStream([...context, { role: 'user', content: input.message }]);
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
    if (streaming) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || '답변 생성 중 오류가 발생했습니다.' })}\n\n`);
      return res.end();
    }
    return next(error);
  }
});

chatRouter.get('/:conversationId/messages', async (req, res, next) => {
  try {
    const conversationId = z.string().uuid().parse(req.params.conversationId);
    const messages = await loadConversation(req.user.id, conversationId);
    res.json({ items: messages });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: '올바르지 않은 대화 ID입니다.' });
    next(error);
  }
});
