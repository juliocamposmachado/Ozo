const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Obter perfil do usuário atual
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/users/me
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const { name, status, avatar } = req.body;
    
    const user = req.user;
    
    if (name) user.name = name;
    if (status) user.status = status;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      message: 'Perfil atualizado com sucesso',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   GET /api/users/search
// @desc    Buscar usuários
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Query de busca é obrigatória' });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
    .select('name email phone avatar status isOnline lastSeen')
    .limit(20);
    
    res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
