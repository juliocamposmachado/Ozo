const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('Firebase Admin SDK inicializado');
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
    }
  }
};

// Inicializar na primeira importação
initializeFirebase();

/**
 * Enviar notificação push para dispositivos
 * @param {Array} deviceTokens - Array de tokens dos dispositivos
 * @param {Object} notification - Objeto de notificação
 * @param {Object} data - Dados adicionais
 */
const sendPushNotification = async (deviceTokens, notification, data = {}) => {
  try {
    if (!deviceTokens || deviceTokens.length === 0) {
      console.log('Nenhum token de dispositivo fornecido');
      return { success: false, error: 'No device tokens' };
    }

    // Filtrar tokens válidos
    const validTokens = deviceTokens
      .map(dt => typeof dt === 'string' ? dt : dt.token)
      .filter(token => token && token.trim() !== '');

    if (validTokens.length === 0) {
      console.log('Nenhum token válido encontrado');
      return { success: false, error: 'No valid tokens' };
    }

    const message = {
      notification: {
        title: notification.title || 'Nova mensagem',
        body: notification.body || 'Você tem uma nova mensagem',
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-icon.png'
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'high_importance_channel'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true
          }
        }
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-icon.png',
          requireInteraction: true,
          actions: [
            {
              action: 'open_chat',
              title: 'Abrir conversa'
            },
            {
              action: 'mark_read',
              title: 'Marcar como lida'
            }
          ]
        },
        fcmOptions: {
          link: process.env.CLIENT_URL || 'http://localhost:3000'
        }
      }
    };

    let response;
    if (validTokens.length === 1) {
      // Envio para um único dispositivo
      response = await admin.messaging().send({
        ...message,
        token: validTokens[0]
      });
      console.log('Notificação enviada:', response);
    } else {
      // Envio para múltiplos dispositivos
      response = await admin.messaging().sendMulticast({
        ...message,
        tokens: validTokens
      });
      console.log(`Notificações enviadas: ${response.successCount}/${validTokens.length}`);
      
      // Log de tokens inválidos
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Token inválido: ${validTokens[idx]}, Erro: ${resp.error?.message}`);
          }
        });
      }
    }

    return {
      success: true,
      response: response,
      validTokensCount: validTokens.length
    };

  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar notificação para tópico específico
 * @param {string} topic - Nome do tópico
 * @param {Object} notification - Objeto de notificação
 * @param {Object} data - Dados adicionais
 */
const sendTopicNotification = async (topic, notification, data = {}) => {
  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title || 'Notificação',
        body: notification.body || 'Você tem uma nova notificação'
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Notificação do tópico enviada:', response);
    
    return {
      success: true,
      response: response
    };

  } catch (error) {
    console.error('Erro ao enviar notificação do tópico:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Subscrever dispositivo a um tópico
 * @param {Array|string} tokens - Token(s) do dispositivo
 * @param {string} topic - Nome do tópico
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    const response = await admin.messaging().subscribeToTopic(tokenArray, topic);
    
    console.log(`${response.successCount} dispositivos subscritos ao tópico ${topic}`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error('Erro ao subscrever ao tópico:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cancelar subscrição de dispositivo a um tópico
 * @param {Array|string} tokens - Token(s) do dispositivo
 * @param {string} topic - Nome do tópico
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    const response = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
    
    console.log(`${response.successCount} dispositivos removidos do tópico ${topic}`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error('Erro ao cancelar subscrição do tópico:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar se tokens são válidos
 * @param {Array} tokens - Array de tokens para validar
 */
const validateTokens = async (tokens) => {
  try {
    if (!tokens || tokens.length === 0) {
      return { validTokens: [], invalidTokens: [] };
    }

    // Tentar enviar uma mensagem de teste (dry run)
    const message = {
      tokens: tokens,
      notification: {
        title: 'Test',
        body: 'Test'
      },
      dryRun: true
    };

    const response = await admin.messaging().sendMulticast(message);
    
    const validTokens = [];
    const invalidTokens = [];
    
    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        validTokens.push(tokens[idx]);
      } else {
        invalidTokens.push({
          token: tokens[idx],
          error: resp.error?.message
        });
      }
    });

    return { validTokens, invalidTokens };

  } catch (error) {
    console.error('Erro ao validar tokens:', error);
    return { validTokens: [], invalidTokens: tokens };
  }
};

module.exports = {
  sendPushNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  validateTokens
};
