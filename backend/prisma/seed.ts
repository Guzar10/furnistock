import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@furnistock.ro' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@furnistock.ro',
      passwordHash: hash,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'manager@furnistock.ro' },
    update: {},
    create: {
      name: 'Ion Popescu',
      email: 'manager@furnistock.ro',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
    },
  })

  await prisma.user.upsert({
    where: { email: 'operator@furnistock.ro' },
    update: {},
    create: {
      name: 'Vasile Ionescu',
      email: 'operator@furnistock.ro',
      passwordHash: await bcrypt.hash('operator123', 10),
      role: 'OPERATOR',
    },
  })

  console.log('✅ Seed complet — 3 useri creați')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())