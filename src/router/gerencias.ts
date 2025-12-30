// src/routes/gerencias.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Gerencia from '../interfaces/Gerencia';

const router = Router();

const collection = admin.firestore().collection('gerencias');

// Criar gerencia
router.post('/', authenticate, async (req, res) => {
  const data = req.body as Gerencia;
  if (!data.idContrato || !data.nome) {
    return res.status(400).json({ error: 'Número do contrato e|ou nome ausentes' });
  }

  try {
    const ref = await collection.add(data);
    res.status(201).json({ message: 'Gerencia criada com sucesso', id: ref.id });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar gerencia', details: error });
  }
});

// Listar gerencias
router.get('/', authenticate, async (req, res) => {
  try {
    const snapshot = await collection.get();
    const gerencias: Gerencia[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Gerencia, 'id'>),
        }));
    res.json(gerencias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar gerencias', details: error });
  }
});

// Buscar por ID
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'gerencia não encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gerencia', details: error });
  }
});

// Atualizar gerencia
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<Gerencia>;
  try {
    await collection.doc(id).update(data);
    res.json({ message: 'gerencia atualizado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar gerencia', details: error });
  }
});

// Deletar gerencia
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await collection.doc(id).delete();
    res.json({ message: 'gerencia deletada com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar gerencia', details: error });
  }
});

export default router;