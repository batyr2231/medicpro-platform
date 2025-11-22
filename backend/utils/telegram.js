import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const DEV_MODE = process.env.NODE_ENV === 'development';

let bot = null;

// Инициализация бота
async function initBot() {
  if (!TELEGRAM_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен');
    return null;
  }

  try {
    bot = new Telegraf(TELEGRAM_TOKEN);

    // Обработчик /start с кодом
    bot.start(async (ctx) => {
      const startPayload = ctx.startPayload;
      const chatId = ctx.chat.id;

      if (!startPayload) {
        await ctx.reply(
          '👋 Привет! Я бот MedicPro для уведомлений.\n\n' +
          'Для подключения получите код в приложении (Профиль → Telegram).'
        );
        return;
      }

      console.log(`📱 /start команда с кодом: ${startPayload}`);

      try {
        // Ищем медика по коду
        const verification = await prisma.verificationCode.findFirst({
          where: {
            code: startPayload,
            verified: false,
            expiresAt: { gt: new Date() }
          }
        });

        if (!verification) {
          await ctx.reply('❌ Код недействителен или истёк. Получите новый код в приложении.');
          return;
        }

        const medicUserId = verification.phone; // В phone храним userId

        // Привязываем Telegram к медику
        await prisma.medic.update({
          where: { userId: medicUserId },
          data: { telegramChatId: chatId.toString() }
        });

        // Отмечаем код как использованный
        await prisma.verificationCode.update({
          where: { id: verification.id },
          data: { verified: true }
        });

        await ctx.reply(
          '✅ Telegram успешно подключён!\n\n' +
          'Вы будете получать уведомления о:\n' +
          '• Новых заказах в вашем районе\n' +
          '• Сообщениях от клиентов\n' +
          '• Изменениях статуса заказов'
        );

        console.log('✅ Telegram подключён для медика:', medicUserId);

      } catch (error) {
        console.error('❌ Ошибка подключения Telegram:', error);
        await ctx.reply('❌ Произошла ошибка. Попробуйте ещё раз.');
      }
    });

    // Обработчик всех остальных сообщений
    bot.on('message', async (ctx) => {
      await ctx.reply(
        '👋 Привет! Я бот MedicPro для уведомлений.\n\n' +
        'Для подключения получите код в приложении (Профиль → Telegram).'
      );
    });

    // Если продакшен - используем webhook
    if (!DEV_MODE && WEBHOOK_URL) {
      const webhookPath = `/telegram-webhook/${TELEGRAM_TOKEN}`;
      const fullWebhookUrl = `${WEBHOOK_URL}${webhookPath}`;
      
      await bot.telegram.setWebhook(fullWebhookUrl);
      console.log('✅ Telegram Webhook установлен:', fullWebhookUrl);
    } else {
      // В dev режиме используем polling
      console.log('⚠️ DEV MODE: Используется polling');
      bot.launch();
    }

    console.log('✅ Telegram Bot инициализирован');
    return bot;

  } catch (error) {
    console.error('❌ Ошибка инициализации бота:', error);
    return null;
  }
}

async function handleWebhook(req, res) {
  try {
    if (!bot) {
      console.warn('⚠️ Bot not initialized');
      return res.status(500).send('Bot not initialized');
    }

    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Telegram Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
}

// Уведомление о новом заказе
async function sendOrderNotification(chatId, orderData) {
  if (!bot) {
    console.warn('⚠️ Telegram Bot не инициализирован');
    return { success: false, error: 'Bot not initialized' };
  }

  try {
    const { orderId, city, district, serviceType, scheduledTime, price, address } = orderData;

    if (DEV_MODE) {
      console.log('📱 [DEV] Telegram уведомление о заказе:', { chatId, city, district, serviceType });
    }

    const message = 
      `🏥 <b>Новый заказ!</b>\n\n` +
      `📍 <b>Город:</b> ${city}\n` +
      `📍 <b>Район:</b> ${district}\n` +
      `📋 <b>Услуга:</b> ${serviceType}\n` +
      `📅 <b>Время:</b> ${new Date(scheduledTime).toLocaleString('ru-RU')}\n` +
      `💰 <b>Цена:</b> ${price ? `${parseInt(price).toLocaleString('ru-RU')} тг` : 'Не указана'}\n` +
      `🏠 <b>Адрес:</b> ${address}\n\n` +
      `⏰ <i>Время ограничено! Первый медик получит заказ.</i>`;

    // Автологин URL
    const autoLoginUrl = `https://medicpro-platform.vercel.app/api/auth/auto-login?chatId=${chatId}&redirect=/medic/dashboard`



    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('✅ Открыть заказ', autoLoginUrl)]
    ]);

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...keyboard
    });

    console.log('✅ Telegram уведомление отправлено:', chatId);
    return { success: true };

  } catch (error) {
    console.error('❌ Ошибка отправки Telegram уведомления:', error);
    return { success: false, error: error.message };
  }
}

// Уведомление о сообщении в чате - ОСТАВЛЯЕМ ТОЛЬКО ОДНУ!
async function sendChatNotification(chatId, data) {
  if (!bot) {
    console.warn('⚠️ Telegram Bot не инициализирован');
    return { success: false, error: 'Bot not initialized' };
  }

  try {
    const { orderId, senderName, text } = data;

    if (DEV_MODE) {
      console.log('📱 [DEV] Telegram уведомление о сообщении:', { chatId, senderName, text });
    }

    const shortMessage = text && text.length > 150 
      ? text.substring(0, 150) + '...' 
      : (text || '📎 Файл');

    const message = 
      `💬 <b>Новое сообщение в чате</b>\n\n` +
      `👤 <b>От:</b> ${senderName}\n` +
      `📝 <b>Текст:</b> ${shortMessage}\n\n` +
      `👉 Откройте приложение для ответа`;

    // Автологин URL
   const autoLoginUrl = `https://medicpro-platform.vercel.app/api/auth/auto-login?chatId=${chatId}&redirect=/chat/${orderId}`;


    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💬 Открыть чат', autoLoginUrl)]
    ]);

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...keyboard
    });

    console.log('✅ Telegram уведомление о сообщении отправлено:', chatId);
    return { success: true };

  } catch (error) {
    console.error('❌ Ошибка отправки Telegram уведомления о сообщении:', error);
    return { success: false, error: error.message };
  }
}

// Уведомление о принятии заказа
async function sendOrderAcceptedNotification(chatId, data) {
  if (!bot) return { success: false };
  
  try {
    await bot.telegram.sendMessage(chatId, `✅ Ваш заказ принят медиком ${data.medicName}`);
    return { success: true };
  } catch (error) {
    console.error('Send order accepted error:', error);
    return { success: false };
  }
}

// Уведомление об изменении статуса
async function sendStatusUpdateNotification(chatId, data) {
  if (!bot) return { success: false };
  
  try {
    await bot.telegram.sendMessage(chatId, `📋 Статус заказа изменён: ${data.status}`);
    return { success: true };
  } catch (error) {
    console.error('Send status update error:', error);
    return { success: false };
  }
}

// Отправка произвольного сообщения
export async function sendTelegramMessage(chatId, text) {
  if (!bot) {
    console.warn('⚠️ Telegram Bot не инициализирован');
    throw new Error('Bot not initialized');
  }

  try {
    await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    console.log(`✅ Telegram message sent to ${chatId}`);
  } catch (error) {
    console.error(`❌ Failed to send Telegram message:`, error);
    throw error;
  }
}

export {
  initBot,
  handleWebhook,
  sendOrderNotification,
  sendOrderAcceptedNotification,
  sendStatusUpdateNotification,
  sendChatNotification
};