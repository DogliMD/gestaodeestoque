import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export const UsuariosController = {
  index: async (req: Request, res: Response): Promise<any> => {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          criado_em: true,
        },
        orderBy: {
          nome: 'asc'
        }
      });
      return res.json(usuarios);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  },

  create: async (req: Request, res: Response): Promise<any> => {
    const { nome, email, senha, role } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    try {
      const userExists = await prisma.usuario.findUnique({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(senha, 10);

      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: hashedPassword,
          role: role || 'user',
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          criado_em: true,
        }
      });

      return res.status(201).json(novoUsuario);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  delete: async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
      const user = await prisma.usuario.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await prisma.usuario.delete({ where: { id } });
      return res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  }
};
