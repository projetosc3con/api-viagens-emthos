// src/routes/adiantamentos.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Adiantamento from '../interfaces/Adiantamento';

const router = Router();

const collection = admin.firestore().collection('adiantamentos');

// Criar adiantamento
router.post('/', authenticate, async (req, res) => {
  const data = req.body as Adiantamento;
  if (!data.idViagem || !data.totalAdiantamento) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
  }

  try {
    const ref = await collection.add(data);
    res.status(201).json({ message: 'Adiantamento criado com sucesso', id: ref.id });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar adiantamento', details: error });
  }
});

// Listar adiantamentos
router.get('/', authenticate, async (req, res) => {
  try {
    const snapshot = await collection.get();
    const adiantamentos: Adiantamento[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Adiantamento, 'id'>),
        }));
    res.json(adiantamentos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar adiantamentos', details: error });
  }
});

// Buscar por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Adiantamento não encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar adiantamento', details: error });
  }
});

// Atualizar adiantamento
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<Adiantamento>;
  try {
    await collection.doc(id).update(data);
    res.json({ message: 'Adiantamento atualizado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar adiantamento', details: error });
  }
});

// Deletar categoria
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await collection.doc(id).delete();
    res.json({ message: 'Adiantamento deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar adiantamento', details: error });
  }
});

export default router;