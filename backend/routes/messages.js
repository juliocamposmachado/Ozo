const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const router = express.Router();

// @route   GET /api/messages/:chatId
// @desc    Buscar mensagens de um chat
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verificar se usuário tem acesso ao chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ message: 'Acesso negado a este chat' });
    }

    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: req.user._id }
    })
    .populate('sender', 'name avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const hasMore = await Message.countDocuments({
      chat: chatId,
      deletedFor: { $ne: req.user._id }
    }) > (page * limit);

    res.json({ 
      messages: messages.reverse(),
      hasMore,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
