import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEV_MODE = process.env.NODE_ENV !== 'production';

let bot = null;

if (TELEGRAM_BOT_TOKEN) {
  bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  console.log('✅ Telegram Bot инициализирован');
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не найден');
}

if (bot) {
  bot.start(async (ctx) => {
    const startParam = ctx.startPayload; // Код после ?start=
    const chatId = ctx.chat.id;

    console.log(`[TELEGRAM] /start command. Chat ID: ${chatId}, Param: ${startParam || 'none'}`);

    if (startParam && startParam.startsWith('MED_')) {
      // Это попытка подключения медика
      try {
        // Проверяем код в БД
        const verification = await prisma.verificationCode.findFirst({
          where: {
            code: startParam,
            verified: false,
            expiresAt: { gt: new Date() }
          }
        });

        if (!verification) {
          ctx.reply('❌ Неверный код или код истёк.\n\nПопробуйте снова через профиль на сайте.');
          return;
        }

        // Находим медика по userId (сохранён в phone)
        const medic = await prisma.medic.findUnique({
          where: { userId: verification.phone }
        });

        if (!medic) {
          ctx.reply('❌ Медик не найден. Обратитесь в поддержку.');
          return;
        }

        // Привязываем Chat ID
        await prisma.medic.update({
          where: { id: medic.id },
          data: { telegramChatId: chatId.toString() }
        });

        // Отмечаем код как использованный
        await prisma.verificationCode.update({
          where: { id: verification.id },
          data: { verified: true }
        });

        ctx.replyWithHTML(
          `✅ <b>Отлично!</b>\n\n` +
          `Ваш аккаунт успешно привязан к Telegram!\n\n` +
          `Теперь вы будете получать уведомления о новых заказах прямо здесь. 🔔\n\n` +
          `<i>Можете вернуться на сайт.</i>`
        );

        console.log(`✅ Medic ${medic.id} connected to Telegram (Chat ID: ${chatId})`);

      } catch (error) {
        console.error('❌ Telegram connect error:', error);
        ctx.reply('❌ Ошибка подключения. Попробуйте позже или обратитесь в поддержку.');
      }
    } else {
      // Обычный /start без кода
      ctx.replyWithHTML(
        `Привет! 👋\n\n` +
        `Я бот для уведомлений <b>MedicPro</b>.\n\n` +
        `Чтобы подключить уведомления о новых заказах:\n` +
        `1️⃣ Откройте сайт MedicPro\n` +
        `2️⃣ Перейдите в <b>Профиль</b>\n` +
        `3️⃣ Нажмите <b>"Подключить Telegram"</b>\n\n` +
        `После этого вы будете получать уведомления здесь! 🚀`
      );
    }
  });

  bot.help((ctx) => {
    ctx.replyWithHTML(
      `<b>Команды бота:</b>\n\n/start - Получить код для привязки\n/status - Проверить статус\n/stop - Отключить уведомления\n/help - Эта справка`
    );
  });

  bot.command('status', (ctx) => {
    const chatId = ctx.chat.id;
    ctx.replyWithHTML(`Ваш Chat ID: <code>${chatId}</code>\n\nСтатус: Активен ✅`);
  });

  bot.command('stop', (ctx) => {
    ctx.reply('Уведомления отключены. Чтобы включить снова, используйте /start');
  });

  if (process.env.ENABLE_TELEGRAM_POLLING === 'true') {
    bot.launch()
      .then(() => console.log('🤖 Telegram Bot запущен'))
      .catch(err => console.error('❌ Ошибка запуска бота:', err));

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}

async function sendOrderNotification(chatId, orderData) {
  if (!bot) {
    console.warn('⚠️ Telegram Bot не инициализирован');
    return { success: false, error: 'Bot not initialized' };
  }

  try {
    const { orderId, district, serviceType, scheduledTime, price, address } = orderData;

    if (DEV_MODE) {
      console.log('📱 [DEV] Telegram уведомление о заказе:', { chatId, district, serviceType });
    }

    const message = 
      `🏥 <b>Новый заказ в вашем районе!</b>\n\n` +
      `📍 <b>Город:</b> ${city}\n` + 
      `📍 <b>Район:</b> ${district}\n` +
      `📋 <b>Услуга:</b> ${serviceType}\n` +
      `📅 <b>Время:</b> ${new Date(scheduledTime).toLocaleString('ru-RU')}\n` +
      `💰 <b>Цена:</b> ${price ? `${parseInt(price).toLocaleString('ru-RU')} тг` : `Не указана (price=${price})`}\n` +
      `🏠 <b>Адрес:</b> ${address}\n\n` +
      `⏰ <i>Время ограничено! Первый медик получит заказ.</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('✅ Открыть заказ', `https://medicpro-platform.vercel.app/medic/orders/${orderId}`)],
      [Markup.button.url('📋 Все заказы', `https://medicpro-platform.vercel.app/medic/dashboard`)]
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

async function sendOrderAcceptedNotification(chatId, orderData) {
  if (!bot) return { success: false, error: 'Bot not initialized' };

  try {
    const { orderId, medicName, medicPhone } = orderData;

    const message = 
      `✅ <b>Ваш заказ принят!</b>\n\n` +
      `👨‍⚕️ <b>Медик:</b> ${medicName}\n` +
      `📞 <b>Телефон:</b> ${medicPhone}\n\n` +
      `Медик свяжется с вами в ближайшее время.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💬 Открыть чат', `https://medicpro-platform.vercel.app/chat/${orderId}`)]
    ]);

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...keyboard
    });

    console.log('✅ Уведомление клиенту отправлено:', chatId);
    return { success: true };

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления клиенту:', error);
    return { success: false, error: error.message };
  }
}

async function sendStatusUpdateNotification(chatId, orderData) {
  if (!bot) return { success: false, error: 'Bot not initialized' };

  try {
    const { orderId, status } = orderData;

    const statusMessages = {
      'ACCEPTED': '✅ Заказ принят медиком',
      'ON_THE_WAY': '🚗 Медик выехал к вам',
      'STARTED': '🏥 Медик приступил к работе',
      'COMPLETED': '✅ Заказ завершён',
      'PAID': '💰 Оплата получена'
    };

    const message = statusMessages[status] || `Статус изменён: ${status}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📱 Открыть заказ', `https://medicpro-platform.vercel.app/client/orders/${orderId}`)]
    ]);

    await bot.telegram.sendMessage(chatId, message, keyboard);

    return { success: true };

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о статусе:', error);
    return { success: false, error: error.message };
  }
}

// Уведомление о новом сообщении в чате
async function sendChatNotification(chatId, data) {
  if (!bot) {
    console.warn('⚠️ Telegram Bot не инициализирован');
    return { success: false, error: 'Bot not initialized' };
  }

  try {
    const { orderId, senderName, senderRole, message, serviceType } = data;

    if (DEV_MODE) {
      console.log('📱 [DEV] Telegram уведомление о сообщении:', { chatId, senderName, message });
    }

    const shortMessage = message.length > 150 
      ? message.substring(0, 150) + '...' 
      : message;

    const text = 
      `💬 <b>Новое сообщение</b>\n\n` +
      `👤 <b>От:</b> ${senderName} (${senderRole})\n` +
      `📋 <b>Заказ:</b> ${serviceType}\n\n` +
      `💭 <i>"${shortMessage}"</i>\n\n` +
      `👉 Откройте приложение для ответа`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💬 Открыть чат', `https://medicpro-platform.vercel.app/chat/${orderId}`)],
    ]);

    await bot.telegram.sendMessage(chatId, text, {
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

export {
  sendOrderNotification,
  sendOrderAcceptedNotification,
  sendStatusUpdateNotification,
  sendChatNotification,
  bot
};