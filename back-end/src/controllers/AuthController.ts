import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const AuthController = {
  login: async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;
    
    try {
      const user = await prisma.usuario.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const isValidPassword = await bcrypt.compare(password, user.senha);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, nome: user.nome },
        process.env.JWT_SECRET || 'secret-fallback-token',
        { expiresIn: '1d' }
      );

      return res.json({ token, user: { id: user.id, email: user.email, role: user.role, nome: user.nome } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  },
  
  me: async (req: Request, res: Response): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-fallback-token');
      return res.json(decoded);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  },
  
  logout: async (req: Request, res: Response): Promise<any> => {
    return res.json({ success: true });
  }
};
