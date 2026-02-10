import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('[PRISMA] ❌ ERRO: DATABASE_URL não está definida!');
  console.error('[PRISMA] Defina a variável no arquivo .env');
  process.exit(1);
}

console.log('[PRISMA] ✓ DATABASE_URL carregada do .env');

// Singleton para evitar múltiplas conexões no hot-reload (ts-node-dev)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Criar o pool de conexões com pg
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Passar o adapter ao PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: new PrismaPg(pool),
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
