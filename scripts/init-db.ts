import { getPrisma } from '@rad/shared';
import bcrypt from 'bcryptjs';

const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

async function initDb() {
  const prisma = getPrisma();
  
  try {
    // First, ensure all tables exist by running a simple query
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" BIGINT NOT NULL,
        "updatedAt" BIGINT NOT NULL
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");
    `);
    
    console.log('✓ Admin table created');
    
    // Check if admin exists
    const existing = await prisma.admin.findUnique({
      where: { username }
    });
    
    if (existing) {
      console.log(`✓ Admin user "${username}" already exists`);
      return;
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash(password, 10);
    const now = Date.now();
    
    await prisma.admin.create({
      data: {
        id: `admin_${now}`,
        username,
        passwordHash,
        createdAt: BigInt(now),
        updatedAt: BigInt(now),
      },
    });
    
    console.log(`✓ Admin user "${username}" created successfully`);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initDb();
