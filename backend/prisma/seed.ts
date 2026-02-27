import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+972500000001' },
    update: {},
    create: {
      fullName: 'מנהלת ראשית',
      phone: '+972500000001',
      email: 'admin@speeddating.app',
      birthDate: new Date('1990-01-01'),
      gender: 'female',
      relationshipStatus: 'single',
      facebookUrl: 'https://facebook.com/admin',
      aboutText: 'מנהלת המערכת - חשבון ניהול',
      lookingForText: 'N/A',
      isAdmin: true,
      consentFlags: { admin: true },
    },
  });

  console.log('Created admin user:', admin.phone);

  // Create a test event
  const event = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'ספיד-דייטינג תל אביב - פברואר 2025',
      description: 'ערב ספיד-דייטינג מרגש במרכז תל אביב. הצטרפו אלינו לערב של פגישות מהנות ועניינות!',
      coverImageUrl: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1920&h=1080&fit=crop',
      startsAt: new Date('2025-02-28T19:00:00Z'),
      endsAt: new Date('2025-02-28T22:00:00Z'),
      locationName: 'מועדון הלב',
      locationAddress: 'רחוב דיזנגוף 50, תל אביב',
      capacityTotal: 20,
      capacityMale: 10,
      capacityFemale: 10,
      registrationOpenAt: new Date('2025-01-01T00:00:00Z'),
      registrationCloseAt: new Date('2025-02-25T23:59:59Z'),
      status: 'published',
      createdByAdminId: admin.id,
    },
  });

  console.log('Created event:', event.title);
  console.log('Seed completed!');
  console.log('\nAdmin credentials:');
  console.log('Phone:', admin.phone);
  console.log('OTP: Will be shown in backend logs (dev mode)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
