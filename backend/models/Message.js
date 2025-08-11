const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: String,
    encrypted: String, // Conteúdo criptografado
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'voice', 'location', 'contact'],
    default: 'text'
  },
  media: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    thumbnail: String, // Para vídeos e imagens
    duration: Number, // Para áudios e vídeos
    width: Number, // Para imagens
    height: Number // Para imagens
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwarded: {
    type: Boolean,
    default: false
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  // Mensagens autodestrutivas
  selfDestruct: {
    enabled: {
      type: Boolean,
      default: false
    },
    timer: {
      type: Number, // Em segundos
      default: 0
    },
    destructAt: Date
  },
  // Metadados para diferentes tipos de mensagem
  metadata: {
    // Para localização
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    // Para contato
    contact: {
      name: String,
      phone: String,
      email: String
    },
    // Para mensagens de voz
    voice: {
      waveform: [Number], // Array de valores para visualização da onda sonora
      transcription: String // Transcrição automática (opcional)
    }
  }
}, {
  timestamps: true
});

// Indexes para consulta eficiente
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ 'deliveredTo.user': 1 });
messageSchema.index({ 'selfDestruct.destructAt': 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { 
    'selfDestruct.enabled': true,
    'selfDestruct.destructAt': { $exists: true }
  }
});

// Middleware para mensagens autodestrutivas
messageSchema.pre('save', function(next) {
  if (this.isNew && this.selfDestruct.enabled && this.selfDestruct.timer > 0) {
    this.selfDestruct.destructAt = new Date(Date.now() + (this.selfDestruct.timer * 1000));
  }
  next();
});

// Método para marcar como lida por usuário
messageSchema.methods.markAsRead = function(userId) {
  // Verifica se já foi marcada como lida por este usuário
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Método para marcar como entregue para usuário
messageSchema.methods.markAsDelivered = function(userId) {
  // Verifica se já foi marcada como entregue para este usuário
  const alreadyDelivered = this.deliveredTo.some(delivered => delivered.user.toString() === userId.toString());
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
  }
  
  return this.save();
};

// Método para deletar mensagem para usuário específico
messageSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
  }
  return this.save();
};

// Método para deletar mensagem para todos
messageSchema.methods.deleteForEveryone = function() {
  this.deleted = true;
  this.content.text = 'Esta mensagem foi removida';
  this.content.encrypted = '';
  this.media = {};
  return this.save();
};

// Método para editar mensagem
messageSchema.methods.edit = function(newContent) {
  this.content.text = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Virtual para URL completa do arquivo de mídia
messageSchema.virtual('mediaUrl').get(function() {
  if (this.media && this.media.filename && !this.media.url) {
    return `${process.env.CLIENT_URL}/uploads/media/${this.media.filename}`;
  }
  return this.media?.url;
});

// Virtual para URL completa do thumbnail
messageSchema.virtual('thumbnailUrl').get(function() {
  if (this.media && this.media.thumbnail && !this.media.thumbnail.startsWith('http')) {
    return `${process.env.CLIENT_URL}/uploads/thumbnails/${this.media.thumbnail}`;
  }
  return this.media?.thumbnail;
});

// Método para verificar se mensagem foi lida por usuário
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Método para verificar se mensagem foi entregue para usuário
messageSchema.methods.isDeliveredTo = function(userId) {
  return this.deliveredTo.some(delivered => delivered.user.toString() === userId.toString());
};

// Método para obter status de leitura
messageSchema.methods.getReadStatus = function(currentUserId) {
  if (this.sender.toString() === currentUserId.toString()) {
    // Para o remetente, mostra quantos leram
    return {
      sent: true,
      delivered: this.deliveredTo.length,
      read: this.readBy.length
    };
  } else {
    // Para destinatários, mostra se leram
    return {
      read: this.isReadBy(currentUserId),
      delivered: this.isDeliveredTo(currentUserId)
    };
  }
};

// Configurar virtuals no JSON
messageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);
