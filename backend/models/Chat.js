const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    // Configurações específicas do usuário no chat
    settings: {
      notifications: {
        type: Boolean,
        default: true
      },
      customName: String // Nome personalizado para o chat
    }
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  // Campos específicos para grupos
  groupInfo: {
    name: String,
    description: String,
    avatar: String,
    inviteLink: String,
    settings: {
      onlyAdminsCanMessage: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanAddMembers: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanEditGroupInfo: {
        type: Boolean,
        default: true
      },
      disappearingMessages: {
        enabled: {
          type: Boolean,
          default: false
        },
        timer: {
          type: Number, // Em segundos
          default: 604800 // 7 dias por padrão
        }
      }
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Para mensagens temporárias globais do chat
  temporaryMessages: {
    enabled: {
      type: Boolean,
      default: false
    },
    timer: {
      type: Number, // Em segundos
      default: 0
    }
  },
  // Estatísticas do chat
  messageCount: {
    type: Number,
    default: 0
  },
  // Para arquivar conversas
  archived: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Para silenciar conversas
  muted: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedUntil: Date
  }],
  // Para fixar conversas
  pinned: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Bloqueio do chat (para casos de spam ou abuso)
  blocked: {
    type: Boolean,
    default: false
  },
  blockedReason: String,
  // Criptografia
  encryptionKey: String, // Chave para criptografia ponta a ponta
}, {
  timestamps: true
});

// Indexes para consulta eficiente
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ 'groupInfo.inviteLink': 1 }, { sparse: true });

// Index composto para chats diretos (para evitar duplicados)
chatSchema.index(
  { 'participants.user': 1, type: 1 },
  { 
    unique: true,
    partialFilterExpression: { type: 'direct' }
  }
);

// Middleware para atualizar última atividade
chatSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

// Método para adicionar participante
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  // Verifica se usuário já está no chat
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );

  if (existingParticipant) {
    if (!existingParticipant.isActive) {
      // Reativar participante
      existingParticipant.isActive = true;
      existingParticipant.joinedAt = new Date();
      existingParticipant.leftAt = undefined;
    }
    return this.save();
  }

  // Adicionar novo participante
  this.participants.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });

  return this.save();
};

// Método para remover participante
chatSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }

  return this.save();
};

// Método para verificar se usuário é participante ativo
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
};

// Método para verificar se usuário é admin
chatSchema.methods.isAdmin = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  return participant && participant.role === 'admin';
};

// Método para promover usuário a admin
chatSchema.methods.promoteToAdmin = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.role = 'admin';
  }
  
  return this.save();
};

// Método para rebaixar admin
chatSchema.methods.demoteFromAdmin = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.role = 'member';
  }
  
  return this.save();
};

// Método para arquivar chat para usuário
chatSchema.methods.archiveForUser = function(userId) {
  // Remove arquivo anterior se existir
  this.archived = this.archived.filter(a => 
    a.user.toString() !== userId.toString()
  );
  
  // Adiciona novo arquivo
  this.archived.push({
    user: userId,
    archivedAt: new Date()
  });
  
  return this.save();
};

// Método para desarquivar chat para usuário
chatSchema.methods.unarchiveForUser = function(userId) {
  this.archived = this.archived.filter(a => 
    a.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Método para silenciar chat para usuário
chatSchema.methods.muteForUser = function(userId, duration) {
  // Remove silenciamento anterior se existir
  this.muted = this.muted.filter(m => 
    m.user.toString() !== userId.toString()
  );
  
  // Adiciona novo silenciamento
  const mutedUntil = duration ? new Date(Date.now() + duration) : null;
  
  this.muted.push({
    user: userId,
    mutedUntil: mutedUntil
  });
  
  return this.save();
};

// Método para reativar notificações para usuário
chatSchema.methods.unmuteForUser = function(userId) {
  this.muted = this.muted.filter(m => 
    m.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Método para fixar chat para usuário
chatSchema.methods.pinForUser = function(userId) {
  // Remove fixação anterior se existir
  this.pinned = this.pinned.filter(p => 
    p.user.toString() !== userId.toString()
  );
  
  // Adiciona nova fixação
  this.pinned.push({
    user: userId,
    pinnedAt: new Date()
  });
  
  return this.save();
};

// Método para desafixar chat para usuário
chatSchema.methods.unpinForUser = function(userId) {
  this.pinned = this.pinned.filter(p => 
    p.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Método para verificar se chat está arquivado para usuário
chatSchema.methods.isArchivedForUser = function(userId) {
  return this.archived.some(a => 
    a.user.toString() === userId.toString()
  );
};

// Método para verificar se chat está silenciado para usuário
chatSchema.methods.isMutedForUser = function(userId) {
  const muted = this.muted.find(m => 
    m.user.toString() === userId.toString()
  );
  
  if (!muted) return false;
  
  // Se não tem data limite ou ainda não expirou
  return !muted.mutedUntil || muted.mutedUntil > new Date();
};

// Método para verificar se chat está fixado para usuário
chatSchema.methods.isPinnedForUser = function(userId) {
  return this.pinned.some(p => 
    p.user.toString() === userId.toString()
  );
};

// Método para obter participantes ativos
chatSchema.methods.getActiveParticipants = function() {
  return this.participants.filter(p => p.isActive);
};

// Método para obter admins ativos
chatSchema.methods.getAdmins = function() {
  return this.participants.filter(p => p.isActive && p.role === 'admin');
};

// Virtual para URL completa do avatar do grupo
chatSchema.virtual('groupAvatarUrl').get(function() {
  if (this.groupInfo && this.groupInfo.avatar && !this.groupInfo.avatar.startsWith('http')) {
    return `${process.env.CLIENT_URL}/uploads/group-avatars/${this.groupInfo.avatar}`;
  }
  return this.groupInfo?.avatar;
});

// Configurar virtuals no JSON
chatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);
