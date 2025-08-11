import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const socket = useRef(null);
  const { user, token } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    setTyping,
    cleanExpiredTyping,
    setUserOnline,
    setUserOffline
  } = useChatStore();

  useEffect(() => {
    // Limpar typing expirado periodicamente
    const typingInterval = setInterval(() => {
      cleanExpiredTyping();
    }, 1000);

    return () => {
      clearInterval(typingInterval);
    };
  }, [cleanExpiredTyping]);

  useEffect(() => {
    if (user && token) {
      // Conectar ao socket
      socket.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Eventos de conexão
      socket.current.on('connect', () => {
        console.log('Conectado ao socket:', socket.current.id);
      });

      socket.current.on('disconnect', (reason) => {
        console.log('Desconectado do socket:', reason);
      });

      socket.current.on('connect_error', (error) => {
        console.error('Erro de conexão do socket:', error);
        if (error.message === 'Token inválido') {
          // Token inválido, fazer logout
          useAuthStore.getState().logout();
        }
      });

      // Eventos de mensagens
      socket.current.on('new_message', (message) => {
        addMessage(message);
        
        // Reproduzir som de notificação se não estiver focado na janela
        if (document.hidden && 'Notification' in window) {
          new Notification(message.sender.name, {
            body: message.type === 'text' ? message.content.text : `Enviou ${message.type}`,
            icon: message.sender.avatar || '/default-avatar.png'
          });
        }
      });

      socket.current.on('message_read', (data) => {
        updateMessage(data.messageId, {
          readBy: [...(updateMessage.readBy || []), {
            user: data.readBy,
            readAt: data.readAt
          }]
        });
      });

      // Eventos de digitação
      socket.current.on('user_typing', (data) => {
        if (data.userId !== user._id) {
          setTyping(data.chatId || 'direct', data.userId, data.isTyping, data.userName);
        }
      });

      // Eventos de status online/offline
      socket.current.on('user_online', (data) => {
        setUserOnline(data.userId);
      });

      socket.current.on('user_offline', (data) => {
        setUserOffline(data.userId);
      });

      socket.current.on('user_last_seen_updated', (data) => {
        // Atualizar última vez visto do usuário na UI
        console.log('Usuário atualizou último visto:', data);
      });

      // Eventos de chamadas (WebRTC)
      socket.current.on('incoming_call', (data) => {
        // Mostrar interface de chamada recebida
        console.log('Chamada recebida:', data);
        toast.success(`Chamada recebida de ${data.fromUser.name}`);
      });

      socket.current.on('call_answered', (data) => {
        console.log('Chamada aceita:', data);
      });

      socket.current.on('call_rejected', (data) => {
        console.log('Chamada rejeitada:', data);
        toast.error('Chamada rejeitada');
      });

      socket.current.on('call_ended', (data) => {
        console.log('Chamada encerrada:', data);
        toast.info('Chamada encerrada');
      });

      socket.current.on('ice_candidate', (data) => {
        console.log('ICE candidate recebido:', data);
        // Processar ICE candidate para WebRTC
      });

      // Eventos de erro
      socket.current.on('error', (data) => {
        toast.error(data.message || 'Erro no servidor');
      });

      // Solicitar permissão para notificações
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

    } else if (socket.current) {
      // Desconectar se não houver usuário autenticado
      socket.current.disconnect();
      socket.current = null;
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [user, token, addMessage, updateMessage, setTyping, setUserOnline, setUserOffline]);

  // Funções auxiliares para usar o socket
  const sendMessage = (messageData) => {
    if (socket.current) {
      socket.current.emit('send_message', messageData);
    }
  };

  const markMessagesAsRead = (chatId, messageIds) => {
    if (socket.current) {
      socket.current.emit('mark_messages_read', { chatId, messageIds });
    }
  };

  const startTyping = (chatId) => {
    if (socket.current) {
      socket.current.emit('typing_start', { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket.current) {
      socket.current.emit('typing_stop', { chatId });
    }
  };

  const joinChat = (chatId) => {
    if (socket.current) {
      socket.current.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket.current) {
      socket.current.emit('leave_chat', chatId);
    }
  };

  const initiateCall = (targetUserId, offer, callType) => {
    if (socket.current) {
      socket.current.emit('call_user', { targetUserId, offer, callType });
    }
  };

  const answerCall = (targetUserId, answer) => {
    if (socket.current) {
      socket.current.emit('answer_call', { targetUserId, answer });
    }
  };

  const rejectCall = (targetUserId) => {
    if (socket.current) {
      socket.current.emit('reject_call', { targetUserId });
    }
  };

  const endCall = (targetUserId) => {
    if (socket.current) {
      socket.current.emit('end_call', { targetUserId });
    }
  };

  const sendICECandidate = (targetUserId, candidate) => {
    if (socket.current) {
      socket.current.emit('ice_candidate', { targetUserId, candidate });
    }
  };

  const updateLastSeen = () => {
    if (socket.current) {
      socket.current.emit('update_last_seen');
    }
  };

  return {
    socket: socket.current,
    connected: socket.current?.connected || false,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    joinChat,
    leaveChat,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    sendICECandidate,
    updateLastSeen
  };
};
