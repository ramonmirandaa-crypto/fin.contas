import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
if (globalProcess && globalProcess.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
