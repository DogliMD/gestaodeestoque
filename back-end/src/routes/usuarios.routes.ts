import { Router } from 'express';
import { UsuariosController } from '../controllers/UsuariosController';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const usuariosRoutes = Router();

// Todas as rotas de usuários requerem autenticação e privilégio de administrador
usuariosRoutes.use(authMiddleware, adminMiddleware);

usuariosRoutes.get('/', UsuariosController.index);
usuariosRoutes.post('/', UsuariosController.create);
usuariosRoutes.delete('/:id', UsuariosController.delete);

export { usuariosRoutes };
