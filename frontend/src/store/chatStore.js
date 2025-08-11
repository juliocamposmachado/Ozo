import { create } from 'zustand';
import api from '../config/api';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  chats: [],
  messages: {},
  activeChat: null,
  loading: false,
  typingUsers: {},
  onlineUsers: new Set(),

  // Buscar chats do usuário
  fetchChats: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/chats');
      set({ chats: response.data.chats });
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      set({ loading: false });
    }
  },

  // Buscar mensagens de um chat
  fetchMessages: async (chatId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/messages/${chatId}?page=${page}&limit=${limit}`);
      
      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: page === 1 
            ? response.data.messages 
            : [...(state.messages[chatId] || []), ...response.data.messages]
        }
      }));

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
      return { messages: [], hasMore: false };
    }
  },

  // Definir chat ativo
  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

  // Adicionar nova mensagem
  addMessage: (message) => {
    set(state => {
      const chatId = message.chat;
      const currentMessages = state.messages[chatId] || [];
      
      // Verificar se mensagem já existe (evitar duplicatas)
      const messageExists = currentMessages.some(m => m._id === message._id);
      if (messageExists) return state;

      return {
        messages: {
          ...state.messages,
          [chatId]: [message, ...currentMessages]
        }
      };
    });

    // Atualizar última mensagem do chat
    set(state => ({
      chats: state.chats.map(chat => 
        chat._id === message.chat 
          ? { ...chat, lastMessage: message, lastActivity: message.createdAt }
          : chat
      )
    }));
  },

  // Atualizar mensagem
  updateMessage: (messageId, updates) => {
    set(state => {
      const newMessages = { ...state.messages };
      
      Object.keys(newMessages).forEach(chatId => {
        newMessages[chatId] = newMessages[chatId].map(message =>
          message._id === messageId ? { ...message, ...updates } : message
        );
      });

      return { messages: newMessages };
    });
  },

  // Marcar mensagens como lidas
  markMessagesAsRead: (chatId, messageIds) => {
    const userId = JSON.parse(localStorage.getItem('auth-storage'))?.state?.user?._id;
    if (!userId) return;

    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map(message => {
        if (messageIds.includes(message._id) && message.sender._id !== userId) {
          const alreadyRead = message.readBy?.some(read => read.user === userId);
          if (!alreadyRead) {
            return {
              ...message,
              readBy: [
                ...(message.readBy || []),
                { user: userId, readAt: new Date().toISOString() }
              ]
            };
          }
        }
        return message;
      });

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });
  },

  // Remover mensagem
  removeMessage: (messageId) => {
    set(state => {
      const newMessages = { ...state.messages };
      
      Object.keys(newMessages).forEach(chatId => {
        newMessages[chatId] = newMessages[chatId].filter(
          message => message._id !== messageId
        );
      });

      return { messages: newMessages };
    });
  },

  // Adicionar chat
  addChat: (chat) => {
    set(state => ({
      chats: [chat, ...state.chats.filter(c => c._id !== chat._id)]
    }));
  },

  // Atualizar chat
  updateChat: (chatId, updates) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat._id === chatId ? { ...chat, ...updates } : chat
      )
    }));
  },

  // Remover chat
  removeChat: (chatId) => {
    set(state => ({
      chats: state.chats.filter(chat => chat._id !== chatId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== chatId)
      )
    }));
  },

  // Gerenciar usuários digitando
  setTyping: (chatId, userId, isTyping, userName) => {
    set(state => {
      const currentTyping = state.typingUsers[chatId] || {};
      
      if (isTyping) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: {
              ...currentTyping,
              [userId]: { userName, timestamp: Date.now() }
            }
          }
        };
      } else {
        const { [userId]: removed, ...rest } = currentTyping;
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: rest
          }
        };
      }
    });
  },

  // Limpar usuários digitando expirados
  cleanExpiredTyping: () => {
    const now = Date.now();
    const TYPING_TIMEOUT = 5000; // 5 segundos

    set(state => {
      const newTypingUsers = {};
      
      Object.entries(state.typingUsers).forEach(([chatId, users]) => {
        const activeUsers = {};
        Object.entries(users).forEach(([userId, data]) => {
          if (now - data.timestamp < TYPING_TIMEOUT) {
            activeUsers[userId] = data;
          }
        });
        
        if (Object.keys(activeUsers).length > 0) {
          newTypingUsers[chatId] = activeUsers;
        }
      });

      return { typingUsers: newTypingUsers };
    });
  },

  // Gerenciar usuários online
  setUserOnline: (userId) => {
    set(state => ({
      onlineUsers: new Set([...state.onlineUsers, userId])
    }));
  },

  setUserOffline: (userId) => {
    set(state => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },

  // Buscar ou criar chat direto
  findOrCreateDirectChat: async (userId) => {
    try {
      const response = await api.post('/chats/direct', { userId });
      const chat = response.data.chat;
      
      // Adicionar chat à lista
      get().addChat(chat);
      
      return chat;
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      toast.error('Erro ao iniciar conversa');
      return null;
    }
  },

  // Criar grupo
  createGroup: async (groupData) => {
    try {
      const response = await api.post('/groups', groupData);
      const group = response.data.group;
      
      // Adicionar grupo à lista
      get().addChat(group);
      
      toast.success('Grupo criado com sucesso!');
      return group;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo');
      return null;
    }
  },

  // Limpar store
  clearStore: () => {
    set({
      chats: [],
      messages: {},
      activeChat: null,
      typingUsers: {},
      onlineUsers: new Set()
    });
  }
}));
