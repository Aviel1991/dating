import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin 1: שרה מרקוביץ ───────────────────────────────────────────
  const sarah = await prisma.user.upsert({
    where: { username: 'Sarah' },
    update: {
      passwordHash: await bcrypt.hash('123456', 10),
    },
    create: {
      fullName: 'שרה מרקוביץ',
      username: 'Sarah',
      passwordHash: await bcrypt.hash('123456', 10),
      email: 'sarah@speeddating.app',
      isAdmin: true,
      consentFlags: { admin: true },
    },
  });
  console.log('✓ Admin 1:', sarah.username, '(', sarah.fullName, ')');

  // ─── Admin 2: אביאל גמליאל ──────────────────────────────────────────
  const aviel = await prisma.user.upsert({
    where: { username: 'Aviel' },
    update: {
      passwordHash: await bcrypt.hash('654321', 10),
    },
    create: {
      fullName: 'אביאל גמליאל',
      username: 'Aviel',
      passwordHash: await bcrypt.hash('654321', 10),
      email: 'aviel@speeddating.app',
      isAdmin: true,
      consentFlags: { admin: true },
    },
  });
  console.log('✓ Admin 2:', aviel.username, '(', aviel.fullName, ')');

  // ─── Sample event (owned by Sarah) ──────────────────────────────────
  const event = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'ספיד-דייטינג תל אביב - מרץ 2026',
      description: 'ערב ספיד-דייטינג מרגש במרכז תל אביב. הצטרפו אלינו לערב של פגישות מהנות ועניינות!',
      coverImageUrl:
        'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1920&h=1080&fit=crop',
      startsAt: new Date('2026-03-20T19:00:00Z'),
      endsAt: new Date('2026-03-20T22:00:00Z'),
      locationName: 'מועדון הלב',
      locationAddress: 'רחוב דיזנגוף 50, תל אביב',
      capacityTotal: 20,
      capacityMale: 10,
      capacityFemale: 10,
      registrationOpenAt: new Date('2026-01-01T00:00:00Z'),
      registrationCloseAt: new Date('2026-03-18T23:59:59Z'),
      status: 'published',
      createdByAdminId: sarah.id,
    },
  });
  console.log('✓ Event:', event.title);

  console.log('\n🎉 Seed completed!');
  console.log('\n─── Admin credentials ────────────────');
  console.log('  Username: Sarah    | Password: 123456');
  console.log('  Username: Aviel    | Password: 654321');
  console.log('──────────────────────────────────────');
  console.log('Login via: POST /auth/admin/login');
  console.log('  { "username": "Sarah", "password": "123456" }');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
