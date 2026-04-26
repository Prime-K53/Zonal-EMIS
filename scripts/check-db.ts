import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Validating Data Integrity and Table Existence...');
  try {
    // Check tables by trying to count records
    const tables = ['user', 'school', 'teacher', 'learner', 'resource', 'dailyAttendance', 'submission', 'auditLog'];
    
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count();
        console.log(`✅ Table "${table}" exists. Record count: ${count}`);
      } catch (e: any) {
        console.error(`❌ Table "${table}" check failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('💥 Database validation failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
