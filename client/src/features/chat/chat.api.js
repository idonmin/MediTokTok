import { api } from '../../lib/api.js';

export const getConversations = () => api.get('/chat/conversations');

export const createConversation = () => api.post('/chat/conversations', {});

export const deleteConversation = (conversationId) =>
  api.delete(`/chat/conversations/${conversationId}`);

export const getConversationMessages = (conversationId) =>
  api.get(`/chat/${conversationId}/messages`);

export const streamChat = ({ conversationId, message, onEvent }) =>
  api.stream('/chat/stream', {
    ...(conversationId ? { conversationId } : {}),
    message,
  }, onEvent);
