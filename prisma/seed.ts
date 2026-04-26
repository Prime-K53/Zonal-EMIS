// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@emis.mw' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@emis.mw',
      name: 'Central Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  // Create a Sample School
  const school = await prisma.school.upsert({
    where: { emisCode: 'SCH001' },
    update: {},
    create: {
      emisCode: 'SCH001',
      name: 'Phalombe Primary School',
      zone: 'Phalombe North',
      type: 'Primary',
      ownership: 'Government',
      district: 'Phalombe',
      tdc: 'Naminjiwa',
      traditionalAuthority: 'Mkhumba',
      latitude: -15.80,
      longitude: 35.65,
    },
  });
  console.log(`✅ School ${school.name} created`);

  // Create a Teacher
  const teacher = await prisma.teacher.upsert({
    where: { emisCode: 'T001' },
    update: {},
    create: {
      emisCode: 'T001',
      firstName: 'John',
      lastName: 'Phiri',
      gender: 'Male',
      dateOfBirth: new Date('1985-05-15'),
      nationalId: 'ABC-123-XYZ',
      schoolId: school.id,
      status: 'Active',
    },
  });
  console.log(`✅ Teacher ${teacher.firstName} created`);

  console.log('🏁 Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
