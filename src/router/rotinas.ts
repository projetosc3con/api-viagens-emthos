import { Router, Request, Response } from 'express';
import Rotinas from '../services/rotinas';

const router = Router();

/**
 * Executa a rotina de checagem de viagens manualmente
 */
async function handleChecarViagens(req: Request, res: Response) {
  try {
    await Rotinas.checarViagens();
    res.status(200).json({
      success: true,
      message: 'Rotina de checagem de viagens executada com sucesso.'
    });
  } catch (error: any) {
    console.error('Erro ao executar rotina checarViagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar rotina de checagem',
      details: error?.message || error
    });
  }
}

// Rotas públicas (suporta tanto GET quanto POST)
router.post('/checar', handleChecarViagens);
router.get('/checar', handleChecarViagens);
router.post('/', handleChecarViagens);
router.get('/', handleChecarViagens);

export default router;
