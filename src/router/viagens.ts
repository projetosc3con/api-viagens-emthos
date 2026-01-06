// src/routes/viagens.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Viagem from '../interfaces/Viagem';

const router = Router();

const collection = admin.firestore().collection('VIAGENS');

// Criar viagem
router.post('/', authenticate, async (req, res) => {
  const data = req.body as Viagem;
  if (!data.colaborador || !data.contrato) {
    return res.status(400).json({ error: 'Dados ausentes' });
  }

  try {
    const ref = await collection.add(data);
    res.status(201).json({ message: 'Viagem criada com sucesso', id: ref.id });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar viagem', details: error });
  }
});

// Listar gerencias
router.get('/', authenticate, async (req, res) => {
  try {
    const snapshot = await collection.get();
    const viagens: Viagem[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Viagem, 'id'>),
        }));
    res.json(viagens);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar viagens', details: error });
  }
});

// Buscar por ID
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'viagem não encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar viagem', details: error });
  }
});

// Atualizar viagem
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<Viagem>;
  try {
    await collection.doc(id).update(data);
    res.json({ message: 'Viagem atualizado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar viagem', details: error });
  }
});

// Deletar viagem
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await collection.doc(id).delete();
    res.json({ message: 'Viagem deletada com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar Viagem', details: error });
  }
});

export default router;