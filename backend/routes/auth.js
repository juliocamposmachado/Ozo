const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendSMS, sendEmail } = require('../services/communicationService');
const auth = require('../middleware/auth');

const router = express.Router();

// Gerar JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Gerar código de verificação
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validação básica
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        message: 'Nome, senha e (email ou telefone) são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null
      ].filter(Boolean)
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Usuário já existe com este email ou telefone'
      });
    }

    // Gerar código de verificação
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Criar usuário
    const user = new User({
      name,
      email,
      phone,
      password,
      verificationCode,
      verificationExpires
    });

    await user.save();

    // Enviar código de verificação
    if (phone) {
      await sendSMS(phone, `Seu código de verificação WhatsApp Clone: ${verificationCode}`);
    } else if (email) {
      await sendEmail(email, 'Verificação de conta', `Seu código de verificação: ${verificationCode}`);
    }

    res.status(201).json({
      message: 'Usuário criado. Código de verificação enviado.',
      userId: user._id,
      needsVerification: true
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/verify
// @desc    Verificar código de verificação
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        message: 'ID do usuário e código são obrigatórios'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Usuário já verificado' });
    }

    if (!user.verificationCode || user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'Código de verificação expirado' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Código de verificação inválido' });
    }

    // Marcar como verificado
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.json({
      message: 'Usuário verificado com sucesso',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/login
// @desc    Login do usuário
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      return res.status(400).json({
        message: 'Email/telefone e senha são obrigatórios'
      });
    }

    // Encontrar usuário
    const user = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null
      ].filter(Boolean)
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!user.isVerified) {
      // Reenviar código se necessário
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      await user.save();

      if (user.phone) {
        await sendSMS(user.phone, `Seu código de verificação WhatsApp Clone: ${verificationCode}`);
      } else if (user.email) {
        await sendEmail(user.email, 'Verificação de conta', `Seu código de verificação: ${verificationCode}`);
      }

      return res.status(401).json({
        message: 'Conta não verificada. Código de verificação reenviado.',
        userId: user._id,
        needsVerification: true
      });
    }

    // Gerar token
    const token = generateToken(user._id);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/resend-code
// @desc    Reenviar código de verificação
// @access  Public
router.post('/resend-code', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Usuário já verificado' });
    }

    // Gerar novo código
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Enviar código
    if (user.phone) {
      await sendSMS(user.phone, `Seu código de verificação WhatsApp Clone: ${verificationCode}`);
    } else if (user.email) {
      await sendEmail(user.email, 'Verificação de conta', `Seu código de verificação: ${verificationCode}`);
    }

    res.json({ message: 'Código de verificação reenviado' });

  } catch (error) {
    console.error('Erro ao reenviar código:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Solicitar redefinição de senha
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email ou telefone é obrigatório' });
    }

    const user = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null
      ].filter(Boolean)
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar token de redefinição
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Enviar token
    if (user.phone) {
      await sendSMS(user.phone, `Seu código de redefinição de senha: ${resetToken.substring(0, 6).toUpperCase()}`);
    } else if (user.email) {
      await sendEmail(user.email, 'Redefinição de senha', `Seu código de redefinição: ${resetToken.substring(0, 6).toUpperCase()}`);
    }

    res.json({ message: 'Código de redefinição de senha enviado' });

  } catch (error) {
    console.error('Erro ao solicitar redefinição:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Redefinir senha
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Hash do token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Alterar senha (usuário logado)
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const user = await User.findById(req.user.id);

    // Verificar senha atual
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout do usuário
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (deviceToken) {
      await req.user.removeDeviceToken(deviceToken);
    }

    res.json({ message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário atual
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
