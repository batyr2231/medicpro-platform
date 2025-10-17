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
import { sendVerificationCode, sendWhatsAppCode, generateCode } from './utils/sms.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

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

// ==================== ORDER ROUTES ====================

// Создание заказа
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { serviceType, address, city, district, scheduledTime, comment } = req.body;

    const order = await prisma.order.create({
      data: {
        clientId: req.user.userId,
        serviceType,
        address,
        city,
        district,
        scheduledTime: new Date(scheduledTime),
        comment,
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

    const order = await prisma.order.findUnique({
      where: { id: orderId }
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

    const editableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа

    const review = await prisma.review.create({
      data: {
        orderId,
        clientId: req.user.userId,
        medicId: order.medicId,
        rating,
        comment,
        isComplaint,
        complaintCategory,
        complaintDescription,
        editableUntil
      }
    });

    // Обновление рейтинга медика
    const reviews = await prisma.review.findMany({
      where: { medicId: order.medicId }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.medic.update({
      where: { userId: order.medicId },
      data: {
        ratingAvg: avgRating,
        reviewsCount: reviews.length
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});


// ==================== MEDIC PROFILE ====================

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

// ==================== ADMIN ENDPOINTS ====================

// Получение всех медиков
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

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});