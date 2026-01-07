// Prisma v7 configuration
// Note: 'prisma/config' module not available in Alpine containers, using plain object
export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
};
