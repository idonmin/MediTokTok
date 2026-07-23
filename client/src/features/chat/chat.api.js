import { api } from '../../lib/api.js';

export const getConversations = () => api.get('/chat/conversations');

export const getConversationMessages = (conversationId) =>
  api.get(`/chat/${conversationId}/messages`);

export const streamChat = ({ conversationId, message, onEvent }) =>
  api.stream('/chat/stream', {
    ...(conversationId ? { conversationId } : {}),
    message,
  }, onEvent);
