const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Disponível',
    maxLength: 139
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  contacts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    },
    lastSeen: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'everyone'
    },
    profilePhoto: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'everyone'
    },
    status: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'everyone'
    }
  },
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  publicKey: String, // Para criptografia ponta a ponta
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Index para busca eficiente
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: 'text' });

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para atualizar último acesso
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = true;
  return this.save();
};

// Método para definir offline
userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.lastSeen = new Date();
  return this.save();
};

// Método para adicionar token de dispositivo
userSchema.methods.addDeviceToken = function(token, platform) {
  // Remove token duplicado se existir
  this.deviceTokens = this.deviceTokens.filter(dt => dt.token !== token);
  
  // Adiciona novo token
  this.deviceTokens.push({
    token,
    platform,
    createdAt: new Date()
  });
  
  // Mantém apenas os 5 tokens mais recentes
  if (this.deviceTokens.length > 5) {
    this.deviceTokens = this.deviceTokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }
  
  return this.save();
};

// Método para remover token de dispositivo
userSchema.methods.removeDeviceToken = function(token) {
  this.deviceTokens = this.deviceTokens.filter(dt => dt.token !== token);
  return this.save();
};

// Método para obter perfil público
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  
  // Remove campos sensíveis
  delete user.password;
  delete user.deviceTokens;
  delete user.verificationCode;
  delete user.verificationExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  
  return user;
};

// Virtual para avatar URL completa
userSchema.virtual('avatarUrl').get(function() {
  if (this.avatar && !this.avatar.startsWith('http')) {
    return `${process.env.CLIENT_URL}/uploads/avatars/${this.avatar}`;
  }
  return this.avatar;
});

// Configurar virtuals no JSON
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
