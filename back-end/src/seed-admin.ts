import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@dogliotti.com';
  const senhaPlana = '123456';
  const nome = 'Administrador do Sistema';

  const userExists = await prisma.usuario.findUnique({ where: { email } });

  if (userExists) {
    console.log('Administrador já existe no banco de dados.');
    return;
  }

  const hashedPassword = await bcrypt.hash(senhaPlana, 10);

  const admin = await prisma.usuario.create({
    data: {
      email,
      senha: hashedPassword,
      nome,
      role: 'admin',
    },
  });

  console.log('Administrador criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
