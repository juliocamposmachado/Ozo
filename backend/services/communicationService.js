const twilio = require('twilio');

// Configurar Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Enviar SMS usando Twilio
 * @param {string} to - Número de telefone de destino
 * @param {string} message - Mensagem a ser enviada
 */
const sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('SMS seria enviado para:', to, 'Mensagem:', message);
      return { success: true, message: 'SMS simulado (Twilio não configurado)' };
    }

    // Formatar número de telefone
    const formattedNumber = to.startsWith('+') ? to : `+55${to.replace(/\D/g, '')}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log('SMS enviado:', result.sid);
    
    return {
      success: true,
      sid: result.sid,
      status: result.status
    };

  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    
    // Em desenvolvimento, simular envio bem-sucedido
    if (process.env.NODE_ENV === 'development') {
      console.log('SMS simulado para:', to, 'Mensagem:', message);
      return { success: true, message: 'SMS simulado (desenvolvimento)' };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email (simulado - implementar com serviço real como SendGrid, SES, etc.)
 * @param {string} to - Email de destino
 * @param {string} subject - Assunto do email
 * @param {string} text - Conteúdo do email
 */
const sendEmail = async (to, subject, text) => {
  try {
    // TODO: Implementar com serviço real de email (SendGrid, AWS SES, etc.)
    console.log('Email seria enviado para:', to);
    console.log('Assunto:', subject);
    console.log('Conteúdo:', text);
    
    return {
      success: true,
      message: 'Email simulado'
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar se número de telefone é válido
 * @param {string} phone - Número de telefone
 */
const isValidPhoneNumber = (phone) => {
  // Regex básica para números brasileiros
  const brazilianPhoneRegex = /^(\+55|55)?[\s-]?(\d{2})[\s-]?(\d{4,5})[\s-]?(\d{4})$/;
  return brazilianPhoneRegex.test(phone);
};

/**
 * Formatar número de telefone
 * @param {string} phone - Número de telefone
 */
const formatPhoneNumber = (phone) => {
  // Remove tudo que não é dígito
  const digits = phone.replace(/\D/g, '');
  
  // Adiciona código do país se não tiver
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  
  return phone; // Retorna original se não conseguir formatar
};

/**
 * Verificar se email é válido
 * @param {string} email - Email a ser verificado
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  sendSMS,
  sendEmail,
  isValidPhoneNumber,
  formatPhoneNumber,
  isValidEmail
};
