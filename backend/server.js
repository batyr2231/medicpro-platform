// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { sendVerificationCode, sendWhatsAppCode, generateCode, sendSMS } from './utils/sms.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
import { sendOrderNotification, sendOrderAcceptedNotification, sendStatusUpdateNotification } from './utils/telegram.js';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware для проверки роли админа
const authenticateAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Настройка Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка Multer
const upload = multer({ storage: multer.memoryStorage() });

// ==================== AUTH ROUTES ====================

  // Отправка кода верификации
  app.post('/api/auth/send-code', async (req, res) => {
    try {
      const { phone, method } = req.body; // method: 'sms' или 'whatsapp'

      console.log('📱 Send code request:', { phone, method });

      // Удаляем старые коды для этого номера
      await prisma.verificationCode.deleteMany({
        where: { phone }
      });

      // Генерируем новый код
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // +5 минут

      // Сохраняем код в БД
      await prisma.verificationCode.create({
        data: {
          phone,
          code,
          expiresAt
        }
      });

      // Отправляем код в зависимости от метода
      let result;
      if (method === 'whatsapp') {
        console.log('📱 Sending via WhatsApp...');
        result = await sendWhatsAppCode(phone, code);
      } else {
        console.log('📱 Sending via SMS...');
        result = await sendVerificationCode(phone, code);
      }

      if (!result.success) {
        console.error('❌ Failed to send code:', result.error);
        return res.status(500).json({ error: 'Failed to send code' });
      }

      console.log(`✅ Code sent to ${phone}: ${code}`);

      res.json({ message: 'Code sent successfully' });
    } catch (error) {
      console.error('❌ Send code error:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  });

  // Проверка кода
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { phone, code } = req.body;

      const verification = await prisma.verificationCode.findFirst({
        where: {
          phone,
          code,
          verified: false,
          expiresAt: {
            gt: new Date() // Код ещё действителен
          }
        }
      });

      if (!verification) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      // Отмечаем код как использованный
      await prisma.verificationCode.update({
        where: { id: verification.id },
        data: { verified: true }
      });

      res.json({ success: true, message: 'Phone verified' });
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ error: 'Failed to verify code' });
    }
  });

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, name, role } = req.body;

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        role: role || 'CLIENT'
      }
    });

    // Если регистрация медика - создаём профиль медика
    if (role === 'MEDIC') {
      await prisma.medic.create({
        data: {
          userId: user.id,
          specialty: '',
          experience: 0,
          areas: []
        }
      });
    }

    // Генерация токена
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Хранилище кодов сброса пароля (в памяти)
const resetCodes = new Map(); // { phone: { code, expiresAt, attempts } }

// Forgot Password - отправка кода
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Телефон обязателен' });
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 минут

    // Сохраняем код
    resetCodes.set(phone, { code, expiresAt, attempts: 0 });

    // Отправляем SMS
    await sendVerificationCode(phone, code);

    console.log(`[FORGOT PASSWORD] Код для ${phone}: ${code}`);

    res.json({ 
      success: true, 
      message: 'Код отправлен на ваш телефон',
      expiresIn: 300 // секунды
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Ошибка отправки кода' });
  }
});

// Reset Password - смена пароля по коду
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }

    // Проверяем наличие кода
    const resetData = resetCodes.get(phone);
    if (!resetData) {
      return res.status(400).json({ error: 'Код не найден. Запросите новый код' });
    }

    // Проверяем срок действия
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(phone);
      return res.status(400).json({ error: 'Код истёк. Запросите новый код' });
    }

    // Проверяем количество попыток
    if (resetData.attempts >= 3) {
      resetCodes.delete(phone);
      return res.status(400).json({ error: 'Превышено количество попыток. Запросите новый код' });
    }

    // Проверяем код
    if (resetData.code !== code) {
      resetData.attempts++;
      return res.status(400).json({ 
        error: 'Неверный код',
        attemptsLeft: 3 - resetData.attempts
      });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword }
    });

    // Удаляем использованный код
    resetCodes.delete(phone);

    console.log(`[RESET PASSWORD] Пароль изменён для ${phone}`);

    res.json({ 
      success: true, 
      message: 'Пароль успешно изменён' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});

// Очистка устаревших кодов (каждые 10 минут)
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of resetCodes.entries()) {
    if (now > data.expiresAt) {
      resetCodes.delete(phone);
      console.log(`[CLEANUP] Удалён устаревший код для ${phone}`);
    }
  }
}, 10 * 60 * 1000);

// ==================== ORDER ROUTES ====================

// Создание заказа
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { serviceType, address, city, district, scheduledTime, comment, price } = req.body; // ← ДОБАВИТЬ price

    const order = await prisma.order.create({
      data: {
        clientId: req.user.userId,
        serviceType,
        address,
        city,
        district,
        scheduledTime: new Date(scheduledTime),
        comment,
        price: price ? parseFloat(price) : null, // ← ДОБАВИТЬ ЭТУ СТРОКУ!
        status: 'NEW'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Уведомляем медиков в этом районе
    io.to(`medics-city-${district}`).emit('new-order', order);
    console.log(`📢 New order broadcast to: medics-city-${district}`);

    // Найти медиков в этом районе с Telegram
    try {
      const medicsInArea = await prisma.medic.findMany({
        where: {
          areas: { has: order.district },
          status: 'APPROVED',
          telegramChatId: { not: null }
        },
        include: { user: true }
      });

      console.log(`📢 Найдено ${medicsInArea.length} медиков с Telegram в районе ${order.district}`);

      // Отправить уведомления
      for (const medic of medicsInArea) {
        await sendOrderNotification(medic.telegramChatId, {
          orderId: order.id,
          district: order.district,
          serviceType: order.serviceType,
          scheduledTime: order.scheduledTime,
          price: order.price, // ← Теперь price будет из БД!
          address: order.address
        });
      }
    } catch (telegramError) {
      console.error('❌ Ошибка отправки Telegram уведомлений:', telegramError);
      // Не падаем если Telegram не работает
    }

    res.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


// Получение заказов клиента или медика
app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting orders for user:', req.user.userId, 'Role:', req.user.role);
    
    let orders;
    
    if (req.user.role === 'CLIENT') {
      // Для клиента - его заказы
      orders = await prisma.order.findMany({
        where: {
          clientId: req.user.userId
        },
        include: {
          medic: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('✅ Found', orders.length, 'orders for CLIENT');
      
    } else if (req.user.role === 'MEDIC') {
      // Для медика - заказы где он назначен
      orders = await prisma.order.findMany({
        where: {
          medicId: req.user.userId,
          status: {
            not: 'NEW'  // Исключаем новые заказы
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('✅ Found', orders.length, 'orders for MEDIC');
      console.log('📊 Orders:', orders.map(o => ({ id: o.id, status: o.status })));
      
    } else {
      orders = [];
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Получение новых заказов для медика
app.get('/api/orders/available', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting available orders for user:', req.user.userId);
    
    const medic = await prisma.medic.findUnique({
      where: { userId: req.user.userId }
    });

    if (!medic) {
      console.log('❌ User is not a medic');
      return res.status(403).json({ error: 'Not a medic' });
    }

    console.log('✅ Medic found:', {
      id: medic.id,
      specialty: medic.specialty,
      areas: medic.areas,
      status: medic.status
    });

    if (medic.status !== 'APPROVED') {
      console.log('⚠️ Medic not approved, status:', medic.status);
      return res.json([]); // Возвращаем пустой массив если не одобрен
    }

    if (!medic.areas || medic.areas.length === 0) {
      console.log('⚠️ Medic has no areas configured');
      return res.json([]);
    }

    console.log('🔍 Searching orders in districts:', medic.areas);

    const orders = await prisma.order.findMany({
      where: {
        status: 'NEW',
          district: {
          in: medic.areas
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('✅ Found', orders.length, 'available orders');
    if (orders.length > 0) {
      console.log('📦 Orders:', orders.map(o => ({ 
        id: o.id.substring(0, 8), 
        district: o.district, 
        serviceType: o.serviceType,
        status: o.status 
      })));
    } else {
      console.log('📭 No orders found matching districts:', medic.areas);
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Fetch available orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


// Получение одного заказа по ID
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Проверка доступа
    if (order.clientId !== req.user.userId && 
        order.medicId !== req.user.userId && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Если есть medicId - загружаем медика отдельно
    let medicData = null;
    if (order.medicId) {
      const medic = await prisma.user.findUnique({
        where: { id: order.medicId },
        select: {
          id: true,
          name: true,
          phone: true
        }
      });
      medicData = medic;
    }

    // Формируем ответ
    const response = {
      ...order,
      medic: medicData
    };

    res.json(response);
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});



// Принятие заказа медиком
app.post('/api/orders/:orderId/accept', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Проверяем, что пользователь - медик
    const medic = await prisma.medic.findUnique({
      where: { userId: req.user.userId }
    });

    if (!medic || medic.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Not an approved medic' });
    }

    // Проверяем, что заказ еще новый
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.status !== 'NEW') {
      return res.status(400).json({ error: 'Order is no longer available' });
    }

    // Принимаем заказ
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        medicId: req.user.userId,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      },
      include: {
        client: true,
        medic: true
      }
    });

    // Уведомляем клиента
    io.to(`user-${order.clientId}`).emit('order-accepted', updatedOrder);

    await prisma.notification.create({
      data: {
        userId: order.clientId,
        channel: 'WEB_PUSH',
        type: 'order_accepted',
        orderId: order.id,
        title: 'Заказ принят',
        body: `Медик ${updatedOrder.medic.name} принял ваш заказ`
      }
    });

    // Удаляем заказ из комнат других медиков
    io.to(`medics-${order.city}-${order.district}`).emit('order-taken', { orderId });
        // Уведомление клиенту
    try {
      if (order.client.telegramChatId) {
        await sendOrderAcceptedNotification(order.client.telegramChatId, {
          orderId: order.id,
          medicName: order.medic.user.name,
          medicPhone: order.medic.user.phone
        });
      }
    } catch (telegramError) {
      console.error('❌ Ошибка отправки уведомления клиенту:', telegramError);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Изменение статуса заказа
app.patch('/api/orders/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating order status:', { orderId: orderId.substring(0, 8), status });

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Проверка прав доступа
    if (order.medicId !== req.user.userId && order.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Обновляем статус на тот что передали
    const updateData = { status };
    
    // Дополнительные поля в зависимости от статуса
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    // Загружаем связанные данные
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    const medicUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        phone: true
      }
    });

    const finalOrder = {
      ...orderWithRelations,
      medic: medicUser
    };

    console.log('✅ Order status updated to:', status);

    // Уведомляем клиента
    io.to(`user-${order.clientId}`).emit('order-status-changed', finalOrder);

    res.json(finalOrder);
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Отметка "оплата получена"
app.post('/api/orders/:orderId/payment-received', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.medicId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: true,
        status: 'PAID'
      }
    });

    io.to(`order-${orderId}`).emit('payment-received', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Payment received error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Отмена заказа клиентом
app.post('/api/orders/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Только клиент может отменить свой заказ
    if (order.clientId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Можно отменить только если статус NEW
    if (order.status !== 'NEW') {
      return res.status(400).json({ error: 'Заказ уже принят медиком и не может быть отменён' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED'
      }
    });

    // Уведомляем медиков что заказ отменён
    io.to(`medics-city-${order.district}`).emit('order-cancelled', { orderId });

    console.log(`✅ Order ${orderId} cancelled by client`);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ==================== CHAT/MESSAGES ====================

app.get('/api/orders/:orderId/messages', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const messages = await prisma.message.findMany({
      where: { orderId },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


// ==================== FILE UPLOAD ====================
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File type not supported. Only images and PDF allowed.' });
    }

    // Проверяем размер (макс 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'medicpro',
          resource_type: 'auto' // Автоопределение типа
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    console.log('✅ File uploaded:', result.secure_url);

    res.json({
      url: result.secure_url,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
});

// ==================== REVIEWS ====================

app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { orderId, rating, comment, isComplaint, complaintCategory, complaintDescription } = req.body;

    // Проверяем заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { medic: true }
    });

    if (!order || order.clientId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      return res.status(400).json({ error: 'Order must be completed first' });
    }

    // Проверка существующего отзыва
    const existingReview = await prisma.review.findUnique({
      where: { orderId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists' });
    }

    // Валидация жалобы
    if (isComplaint) {
      if (!complaintCategory) {
        return res.status(400).json({ error: 'Укажите категорию жалобы' });
      }
      if (!complaintDescription || complaintDescription.trim().length < 10) {
        return res.status(400).json({ error: 'Опишите жалобу подробнее (минимум 10 символов)' });
      }
    }

    const editableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа

    // Создаём отзыв с жалобой
    const review = await prisma.review.create({
      data: {
        orderId,
        clientId: req.user.userId,
        medicId: order.medicId,
        rating: parseInt(rating),
        comment: comment || null,
        isComplaint: isComplaint || false,
        complaintCategory: isComplaint ? complaintCategory : null,
        complaintDescription: isComplaint ? complaintDescription : null,
        complaintStatus: isComplaint ? 'NEW' : 'RESOLVED',
        editableUntil
      }
    });

    // Обновление рейтинга медика
    const reviews = await prisma.review.findMany({
      where: { medicId: order.medicId }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // ИСПРАВЛЕНО: Сначала находим медика по userId, затем обновляем по id
    const medic = await prisma.medic.findUnique({
      where: { userId: order.medicId }
    });

    if (medic) {
      await prisma.medic.update({
        where: { id: medic.id },
        data: {
          ratingAvg: avgRating,
          reviewsCount: reviews.length
        }
      });
    }

    console.log(`[REVIEW] ${isComplaint ? 'Жалоба' : 'Отзыв'} создан для заказа ${orderId}`);

    res.json({ 
      success: true, 
      review,
      message: isComplaint ? 'Жалоба отправлена на рассмотрение' : 'Спасибо за отзыв!'
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});


// ==================== MEDIC PROFILE ====================

// Получение профиля медика
app.get('/api/medics/profile', authenticateToken, async (req, res) => {
  try {
    const medic = await prisma.medic.findUnique({
      where: { userId: req.user.userId }
    });

    if (!medic) {
      return res.status(404).json({ error: 'Medic profile not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    const profile = {
      id: medic.id,
      userId: medic.userId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      specialization: medic.specialty || '',
      experience: medic.experience?.toString() || '0',
      education: medic.description || '',
      areas: medic.areas || [],
      status: medic.status,
      ratingAvg: medic.ratingAvg,
      reviewsCount: medic.reviewsCount,
      createdAt: medic.createdAt,
    };

    console.log('✅ Medic profile loaded:', profile);
    res.json(profile);
  } catch (error) {
    console.error('Get medic profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Обновление профиля медика
app.put('/api/medics/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, specialization, experience, education, areas } = req.body;

    console.log('📝 Updating medic profile:', { name, phone, specialization, experience, education, areas });

    if (name || phone) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
        }
      });
    }

    const updateData = {};
    
    if (specialization) {
      updateData.specialty = specialization;
    }
    
    if (experience) {
      const expInt = parseInt(experience) || 0;
      updateData.experience = expInt;
    }
    
    if (education) {
      updateData.description = education;
    }
    
    if (areas && Array.isArray(areas)) {
      updateData.areas = areas;
      console.log('✅ Areas updated:', areas);
    }

    const medic = await prisma.medic.update({
      where: { userId: req.user.userId },
      data: updateData
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    console.log('✅ Medic profile updated successfully');

    res.json({
      id: medic.id,
      name: user.name,
      phone: user.phone,
      specialization: medic.specialty,
      experience: medic.experience.toString(),
      education: medic.description,
      areas: medic.areas,
    });
  } catch (error) {
    console.error('❌ Update medic profile error:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});


// Upload документов медика (ФОТО вместо PDF)
app.post('/api/medics/upload-document', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (req.user.role !== 'MEDIC') {
      return res.status(403).json({ error: 'Только для медиков' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { documentType } = req.body; // 'LICENSE' или 'CERTIFICATE'
    
    if (!['LICENSE', 'CERTIFICATE'].includes(documentType)) {
      return res.status(400).json({ error: 'Неверный тип документа' });
    }

    console.log(`[UPLOAD] Uploading ${documentType} for user ${req.user.userId}`);

    // Конвертируем buffer в base64 для Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Загружаем в Cloudinary как изображение
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'medicpro/documents',
      resource_type: 'image',  // ← Изображение
      public_id: `${req.user.userId}_${documentType}_${Date.now()}`,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }  // Автооптимизация
      ]
    });

    console.log(`[UPLOAD] Cloudinary upload successful: ${result.secure_url}`);

    // Сохраняем в БД
    const medic = await prisma.medic.findUnique({
      where: { userId: req.user.userId }
    });

    if (!medic) {
      return res.status(404).json({ error: 'Профиль медика не найден' });
    }

    // Безопасно получаем documents
    let documents = [];
    if (medic.documents && Array.isArray(medic.documents)) {
      documents = medic.documents;
    }

    // Добавляем новый документ
    documents.push({
      type: documentType,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date().toISOString(),
      fileName: req.file.originalname,
      format: result.format  // jpg, png, etc
    });

    // Обновляем медика
    await prisma.medic.update({
      where: { id: medic.id },
      data: { 
        documents: documents,
        status: 'PENDING' // Требует повторной модерации
      }
    });

    console.log(`[DOCUMENT UPLOAD] ${documentType} загружен медиком ID ${medic.id}`);

    res.json({ 
      success: true, 
      message: 'Документ загружен',
      url: result.secure_url
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Ошибка загрузки документа: ' + error.message });
  }
});

// ========== TELEGRAM ENDPOINTS (НОВОЕ) ==========

// Привязать Telegram к профилю медика
app.post('/api/medics/connect-telegram', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID required' });
    }

    // Проверить что это медик
    const medic = await prisma.medic.findUnique({
      where: { userId: req.user.userId }
    });

    if (!medic) {
      return res.status(403).json({ error: 'Only medics can connect Telegram' });
    }

    await prisma.medic.update({
      where: { userId: req.user.userId },
      data: { telegramChatId: chatId }
    });

    console.log('✅ Telegram подключён для медика:', req.user.userId);

    res.json({ success: true, message: 'Telegram успешно подключён!' });
  } catch (error) {
    console.error('❌ Connect Telegram error:', error);
    res.status(500).json({ error: 'Failed to connect Telegram' });
  }
});

// Отключить Telegram
app.post('/api/medics/disconnect-telegram', authenticateToken, async (req, res) => {
  try {
    await prisma.medic.update({
      where: { userId: req.user.userId },
      data: { telegramChatId: null }
    });

    console.log('✅ Telegram отключён для медика:', req.user.userId);

    res.json({ success: true, message: 'Telegram отключён' });
  } catch (error) {
    console.error('❌ Disconnect Telegram error:', error);
    res.status(500).json({ error: 'Failed to disconnect Telegram' });
  }
});

// ================================================

// Middleware для логирования всех admin запросов
app.use('/api/admin/*', (req, res, next) => {
  console.log(`[ADMIN REQUEST] ${req.method} ${req.path}`);
  next();
});
// ==================== ADMIN ENDPOINTS ====================

// Получение всех медиков
app.get('/api/admin/medics', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const medics = await prisma.medic.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result = medics.map(medic => ({
      id: medic.id,
      name: medic.user.name,
      phone: medic.user.phone,
      specialization: medic.specialty, // ← ИСПРАВЛЕНО
      experience: medic.experience,
      education: medic.education,
      areas: medic.areas,
      status: medic.status,
      ratingAvg: medic.ratingAvg,
      reviewsCount: medic.reviewsCount,
      createdAt: medic.createdAt,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get medics error:', error);
    res.status(500).json({ error: 'Failed to get medics' });
  }
});

// Одобрение медика
app.post('/api/admin/medics/:medicId/approve', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { medicId } = req.params;

    const medic = await prisma.medic.update({
      where: { id: medicId },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    console.log('✅ Medic approved:', medic.id);

    res.json({ message: 'Medic approved', medic });
  } catch (error) {
    console.error('Approve medic error:', error);
    res.status(500).json({ error: 'Failed to approve medic' });
  }
});

// Отклонение медика
app.post('/api/admin/medics/:medicId/reject', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { medicId } = req.params;

    const medic = await prisma.medic.update({
      where: { id: medicId },
      data: { status: 'REJECTED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    console.log('❌ Medic rejected:', medic.id);

    res.json({ message: 'Medic rejected', medic });
  } catch (error) {
    console.error('Reject medic error:', error);
    res.status(500).json({ error: 'Failed to reject medic' });
  }
});

// Получение документов медика (для админа)
app.get('/api/admin/medics/:medicId/documents', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    console.log(`[ADMIN] Запрос документов для медика: ${req.params.medicId}`);
    
    const medic = await prisma.medic.findUnique({
      where: { id: req.params.medicId }
    });

    if (!medic) {
      console.log(`[ADMIN] Медик не найден: ${req.params.medicId}`);
      return res.status(404).json({ error: 'Медик не найден' });
    }

    const documents = medic.documents || [];

    console.log(`[ADMIN] Найдено документов: ${documents.length}`, documents);

    res.json({ documents });

  } catch (error) {
    console.error('[ADMIN] Get documents error:', error);
    res.status(500).json({ error: 'Ошибка получения документов', details: error.message });
  }
});

// Получение всех заказов
app.get('/api/admin/orders', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        medic: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Получение всех жалоб
app.get('/api/admin/complaints', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const complaints = await prisma.review.findMany({
      where: {
        isComplaint: true
      },
      include: {
        order: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            },
            medic: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to get complaints' });
  }
});

// Получение статистики
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMedics = await prisma.medic.count();
    const totalOrders = await prisma.order.count();
    const totalReviews = await prisma.review.count();
    
    const pendingMedics = await prisma.medic.count({
      where: { status: 'PENDING' }
    });

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    const stats = {
      totalUsers,
      totalMedics,
      totalOrders,
      totalReviews,
      pendingMedics,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}) // ← Просто пустой объект без TypeScript
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

  // Получение жалоб с фильтрацией
  app.get('/api/admin/complaints', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.query;

      console.log(`[ADMIN] Запрос жалоб с фильтром: ${status || 'ALL'}`);

      // Базовое условие
      let where = { isComplaint: true };
      
      // Фильтрация по статусу
      if (status && status !== 'ALL') {
        if (status === 'COMPLETED') {
          // Завершённые = RESOLVED + REJECTED
          where.complaintStatus = { in: ['RESOLVED', 'REJECTED'] };
        } else {
          // Конкретный статус
          where.complaintStatus = status;
        }
      }

      const complaints = await prisma.review.findMany({
        where,
        include: {
          order: {
            include: {
              client: {
                select: { id: true, name: true, phone: true }
              },
              medic: {
                select: { id: true, name: true, phone: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`[ADMIN] Найдено жалоб: ${complaints.length} (фильтр: ${status || 'ALL'})`);

      res.json(complaints);

    } catch (error) {
      console.error('[ADMIN] Get complaints error:', error);
      res.status(500).json({ error: 'Ошибка загрузки жалоб' });
    }
  });


// Обновление статуса жалобы
app.patch('/api/admin/complaints/:complaintId/status', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    console.log(`[ADMIN] Обновление статуса жалобы ${complaintId} на ${status}`);

    if (!['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    // Сначала проверяем что жалоба существует
    const existingReview = await prisma.review.findUnique({
      where: { id: complaintId }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }

    if (!existingReview.isComplaint) {
      return res.status(400).json({ error: 'Это не жалоба' });
    }

    // Обновляем статус
    const review = await prisma.review.update({
      where: { id: complaintId },
      data: { 
        complaintStatus: status,
        complaintResolvedAt: (status === 'RESOLVED' || status === 'REJECTED') ? new Date() : null,
        complaintResolvedBy: (status === 'RESOLVED' || status === 'REJECTED') ? req.user.userId : null,
        updatedAt: new Date()
      }
    });

    console.log(`[ADMIN] Статус жалобы ${complaintId} успешно изменён на ${status}`);

    res.json({ success: true, review });

  } catch (error) {
    console.error('[ADMIN] Update complaint status error:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления статуса',
      details: error.message 
    });
  }
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.role = decoded.role;

      socket.join(`user-${decoded.userId}`);

      if (decoded.role === 'MEDIC') {
        const medic = await prisma.medic.findUnique({
          where: { userId: decoded.userId }
        });

        if (medic) {
          medic.areas.forEach(area => {
            socket.join(`medics-city-${area}`);
          });
          console.log(`✅ Medic joined rooms:`, medic.areas.map(a => `medics-city-${a}`));
        }
      }

      socket.emit('authenticated');
      console.log('✅ User authenticated:', socket.userId, 'Role:', socket.role);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authentication-error');
    }
  });

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`✅ User ${socket.userId} joined order: ${orderId}`);
  });

socket.on('send-message', async (data) => {
  try {
    const { orderId, text, fileUrl, fileType } = data;

    if (!socket.userId) {
      socket.emit('message-error', { error: 'Not authenticated' });
      return;
    }

    // Проверяем что заказ существует
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      socket.emit('message-error', { error: 'Order not found' });
      return;
    }

    // Создаём сообщение
    const message = await prisma.message.create({
      data: {
        orderId,
        fromUserId: socket.userId,
        text: text || null,
        fileUrl: fileUrl || null,
        fileType: fileType || null
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    console.log('✅ Message created:', message.id);
    
    // Отправляем всем в комнате заказа
    io.to(`order-${orderId}`).emit('new-message', message);
    console.log('📢 Message broadcast to room: order-' + orderId);
    
  } catch (error) {
    console.error('❌ Send message error:', error);
    socket.emit('message-error', { error: 'Failed to send message' });
  }
});

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Health check для Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'MedicPro API Server',
    version: '1.0.0'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});