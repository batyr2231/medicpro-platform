import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Очищаем все данные
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.order.deleteMany();
  await prisma.medic.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleaned database');

  // Создаём админа
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      phone: '+77001234567',
      password: adminPassword,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin created:', admin.phone);

  // Создаём тестового клиента
  const clientPassword = await bcrypt.hash('123456', 10);
  
  const client = await prisma.user.create({
    data: {
      phone: '+77771111111',
      password: clientPassword,
      name: 'Тестовый Клиент',
      role: 'CLIENT',
    },
  });

  console.log('✅ Client created:', client.phone);

  // Создаём тестового медика
  const medicPassword = await bcrypt.hash('123456', 10);
  
  const medicUser = await prisma.user.create({
    data: {
      phone: '+77772222222',
      password: medicPassword,
      name: 'Тестовый Медик',
      role: 'MEDIC',
    },
  });

  await prisma.medic.create({
    data: {
      userId: medicUser.id,
      specialty: 'Терапевт',
      experience: 5,
      description: 'КазНМУ, 5 лет опыта',
      areas: ['Алмалинский', 'Медеуский', 'Алатауский'], // Массив напрямую
      status: 'APPROVED',
    },
  });
  console.log('✅ Medic created:', medicUser.phone);

  console.log('\n📧 Test credentials:');
  console.log('   Admin:  +77001234567 / admin123');
  console.log('   Client: +77771111111 / 123456');
  console.log('   Medic:  +77772222222 / 123456');
  console.log('\n🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });