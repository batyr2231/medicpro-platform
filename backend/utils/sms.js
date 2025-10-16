import twilio from 'twilio';

const isDevelopment = process.env.NODE_ENV === 'development';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Генерация 6-значного кода
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Отправка SMS кода
export const sendVerificationCode = async (phone, code) => {
  try {
    // В dev режиме логируем код в консоль
    if (isDevelopment) {
      console.log('📱 ========================================');
      console.log('📱 VERIFICATION CODE');
      console.log('📱 Phone:', phone);
      console.log('📱 Code:', code);
      console.log('📱 ========================================');
    }

    const message = await client.messages.create({
      body: `Ваш код подтверждения MedicPro: ${code}. Код действителен 5 минут.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    console.log('✅ SMS sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ SMS error:', error.message);
    
    // В dev режиме возвращаем успех даже при ошибке
    if (isDevelopment) {
      console.log('⚠️ DEV MODE: Ignoring SMS error');
      return { success: true, sid: 'dev-mock-' + Date.now() };
    }
    
    return { success: false, error: error.message };
  }
};

// Отправка через WhatsApp (используя Template)
export const sendWhatsAppCode = async (phone, code) => {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": code  // {{1}} заменится на код
      }),
      to: `whatsapp:${phone}`
    });
    
    console.log('✅ WhatsApp sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ WhatsApp error:', error);
    return { success: false, error: error.message };
  }
};
