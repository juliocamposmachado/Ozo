const express = require('express');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');

const router = express.Router();

// @route   POST /api/groups
// @desc    Criar novo grupo
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, participants = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome do grupo é obrigatório' });
    }

    // Adicionar criador como admin
    const groupParticipants = [
      { user: req.user._id, role: 'admin' },
      ...participants.map(userId => ({ user: userId, role: 'member' }))
    ];

    const group = new Chat({
      type: 'group',
      participants: groupParticipants,
      groupInfo: {
        name,
        description: description || ''
      }
    });

    await group.save();
    await group.populate('participants.user', 'name avatar');

    res.status(201).json({ group });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
