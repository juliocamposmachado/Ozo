const express = require('express');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

// @route   GET /api/chats
// @desc    Listar chats do usuário
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
      'participants.isActive': true
    })
    .populate('participants.user', 'name avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/chats/direct
// @desc    Criar ou buscar chat direto
// @access  Private
router.post('/direct', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    // Buscar chat existente
    let chat = await Chat.findOne({
      type: 'direct',
      'participants.user': { $all: [req.user._id, userId] },
      'participants.isActive': true
    });

    if (!chat) {
      // Criar novo chat
      chat = new Chat({
        type: 'direct',
        participants: [
          { user: req.user._id, role: 'member' },
          { user: userId, role: 'member' }
        ]
      });
      
      await chat.save();
    }

    // Popular dados
    await chat.populate('participants.user', 'name avatar isOnline lastSeen');

    res.json({ chat });
  } catch (error) {
    console.error('Erro ao criar chat:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
