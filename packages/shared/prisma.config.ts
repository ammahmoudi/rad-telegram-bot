import { defineConfig } from 'prisma/config';

// Production config with explicit datasource for migrations
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
});
