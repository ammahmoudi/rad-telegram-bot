import { getPrisma } from '../packages/shared/dist/db.js';
import bcrypt from 'bcryptjs';

/**
 * Script to create initial admin user
 * Usage: 
 *   tsx scripts/create-admin.ts <username> <password>
 * OR use environment variables:
 *   DEFAULT_ADMIN_USERNAME=admin DEFAULT_ADMIN_PASSWORD=pass tsx scripts/create-admin.ts
 */

async function createAdmin() {
  const args = process.argv.slice(2);
  
  // Try to get credentials from args or environment variables
  let username = args[0] || process.env.DEFAULT_ADMIN_USERNAME;
  let password = args[1] || process.env.DEFAULT_ADMIN_PASSWORD;
  
  if (!username || !password) {
    console.error('Usage: tsx scripts/create-admin.ts <username> <password>');
    console.error('OR set environment variables: DEFAULT_ADMIN_USERNAME and DEFAULT_ADMIN_PASSWORD');
    process.exit(1);
  }
  
  if (username.length < 3) {
    console.error('Error: Username must be at least 3 characters long');
    process.exit(1);
  }
  
  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }
  
  const prisma = getPrisma();
  
  try {
    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { username },
    });
    
    if (existing) {
      console.error(`Error: Admin with username "${username}" already exists`);
      process.exit(1);
    }
    
    // Hash password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create admin
    const now = Date.now();
    const admin = await prisma.admin.create({
      data: {
        id: `admin_${username}_${now}`,
        username,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`ID: ${admin.id}`);
    console.log(`\nYou can now login at: http://localhost:3002/auth/login`);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
