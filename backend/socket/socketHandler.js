const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { sendPushNotification } = require('../services/notificationService');

// Armazenar conexões ativas
const activeUsers = new Map();
const userSockets = new Map();

module.exports = (io) => {
  // Middleware de autenticação para Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token de autenticação necessário'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Usuário não encontrado'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`Usuário conectado: ${userId}`);

    // Adicionar usuário aos mapas de usuários ativos
    activeUsers.set(userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
      isOnline: true
    });

    userSockets.set(socket.id, userId);

    // Atualizar status online do usuário
    await socket.user.updateLastSeen();

    // Notificar contatos sobre status online
    const contacts = socket.user.contacts;
    contacts.forEach(contact => {
      const contactSocket = getSocketByUserId(contact.user.toString());
      if (contactSocket) {
        contactSocket.emit('user_online', {
          userId: userId,
          isOnline: true,
          lastSeen: new Date()
        });
      }
    });

    // Entrar nas salas dos chats do usuário
    const userChats = await Chat.find({
      'participants.user': userId,
      'participants.isActive': true
    });

    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    // Event: Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', replyTo, media, metadata } = data;

        // Verificar se usuário participa do chat
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(userId)) {
          socket.emit('error', { message: 'Não autorizado a enviar mensagem neste chat' });
          return;
        }

        // Verificar permissões do grupo
        if (chat.type === 'group' && 
            chat.groupInfo.settings.onlyAdminsCanMessage && 
            !chat.isAdmin(userId)) {
          socket.emit('error', { message: 'Apenas administradores podem enviar mensagens' });
          return;
        }

        // Criar nova mensagem
        const message = new Message({
          chat: chatId,
          sender: userId,
          content: {
            text: content
          },
          type,
          media,
          replyTo,
          metadata
        });

        // Aplicar configuração de mensagens temporárias se ativada
        if (chat.temporaryMessages.enabled) {
          message.selfDestruct.enabled = true;
          message.selfDestruct.timer = chat.temporaryMessages.timer;
        }

        await message.save();
        
        // Popular campos necessários
        await message.populate([
          { path: 'sender', select: 'name avatar' },
          { path: 'replyTo', populate: { path: 'sender', select: 'name' } }
        ]);

        // Atualizar última mensagem do chat
        chat.lastMessage = message._id;
        chat.messageCount += 1;
        await chat.save();

        // Marcar como entregue para todos os participantes (exceto remetente)
        const activeParticipants = chat.getActiveParticipants();
        for (const participant of activeParticipants) {
          if (participant.user.toString() !== userId) {
            await message.markAsDelivered(participant.user);
          }
        }

        // Enviar mensagem para todos no chat
        io.to(chatId).emit('new_message', message);

        // Enviar notificação push para participantes offline
        for (const participant of activeParticipants) {
          const participantId = participant.user.toString();
          if (participantId !== userId && !activeUsers.has(participantId)) {
            const user = await User.findById(participantId);
            if (user && user.deviceTokens.length > 0) {
              await sendPushNotification(user.deviceTokens, {
                title: socket.user.name,
                body: type === 'text' ? content : `Enviou ${type}`,
                data: {
                  chatId: chatId,
                  messageId: message._id.toString()
                }
              });
            }
          }
        }

      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });

    // Event: Marcar mensagens como lidas
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        // Verificar se usuário participa do chat
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(userId)) {
          return;
        }

        // Marcar mensagens como lidas
        const messages = await Message.find({
          _id: { $in: messageIds },
          chat: chatId,
          sender: { $ne: userId } // Não marcar próprias mensagens
        });

        for (const message of messages) {
          await message.markAsRead(userId);
        }

        // Notificar remetentes sobre leitura
        messages.forEach(message => {
          const senderSocket = getSocketByUserId(message.sender.toString());
          if (senderSocket) {
            senderSocket.emit('message_read', {
              messageId: message._id,
              readBy: userId,
              readAt: new Date()
            });
          }
        });

      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }
    });

    // Event: Começar digitação
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: userId,
        userName: socket.user.name,
        isTyping: true
      });
    });

    // Event: Parar digitação
    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: userId,
        userName: socket.user.name,
        isTyping: false
      });
    });

    // Event: Entrar em chat específico
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    // Event: Sair de chat específico
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    // Event: Chamada de voz/vídeo
    socket.on('call_user', (data) => {
      const { targetUserId, offer, callType } = data;
      const targetSocket = getSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('incoming_call', {
          from: userId,
          fromUser: {
            id: userId,
            name: socket.user.name,
            avatar: socket.user.avatar
          },
          offer,
          callType
        });
      }
    });

    // Event: Responder chamada
    socket.on('answer_call', (data) => {
      const { targetUserId, answer } = data;
      const targetSocket = getSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('call_answered', {
          from: userId,
          answer
        });
      }
    });

    // Event: Recusar chamada
    socket.on('reject_call', (data) => {
      const { targetUserId } = data;
      const targetSocket = getSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('call_rejected', {
          from: userId
        });
      }
    });

    // Event: Encerrar chamada
    socket.on('end_call', (data) => {
      const { targetUserId } = data;
      const targetSocket = getSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('call_ended', {
          from: userId
        });
      }
    });

    // Event: ICE Candidate (WebRTC)
    socket.on('ice_candidate', (data) => {
      const { targetUserId, candidate } = data;
      const targetSocket = getSocketByUserId(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('ice_candidate', {
          from: userId,
          candidate
        });
      }
    });

    // Event: Atualizar último visto
    socket.on('update_last_seen', async () => {
      await socket.user.updateLastSeen();
      
      // Notificar contatos
      const contacts = socket.user.contacts;
      contacts.forEach(contact => {
        const contactSocket = getSocketByUserId(contact.user.toString());
        if (contactSocket) {
          contactSocket.emit('user_last_seen_updated', {
            userId: userId,
            lastSeen: new Date()
          });
        }
      });
    });

    // Desconexão
    socket.on('disconnect', async () => {
      console.log(`Usuário desconectado: ${userId}`);
      
      // Remover dos mapas
      activeUsers.delete(userId);
      userSockets.delete(socket.id);
      
      // Atualizar status offline
      await socket.user.setOffline();
      
      // Notificar contatos sobre status offline
      const contacts = socket.user.contacts;
      contacts.forEach(contact => {
        const contactSocket = getSocketByUserId(contact.user.toString());
        if (contactSocket) {
          contactSocket.emit('user_offline', {
            userId: userId,
            isOnline: false,
            lastSeen: new Date()
          });
        }
      });
    });
  });

  // Função auxiliar para obter socket por ID do usuário
  function getSocketByUserId(userId) {
    const userData = activeUsers.get(userId);
    return userData ? io.sockets.sockets.get(userData.socketId) : null;
  }

  // Função para enviar mensagem direta para usuário
  function sendToUser(userId, event, data) {
    const socket = getSocketByUserId(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Exportar funções úteis
  io.sendToUser = sendToUser;
  io.getActiveUsers = () => Array.from(activeUsers.keys());
  io.isUserOnline = (userId) => activeUsers.has(userId);
};
