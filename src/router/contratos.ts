// src/routes/contratos.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Contrato, { AgentesContrato, Agente } from '../interfaces/Contrato';

const router = Router();

const collection = admin.firestore().collection('CONTRATOS');

// Criar contrato
router.post('/', authenticate, async (req, res) => {
  const data = req.body as Contrato;
  if (!data.nroContrato) {
    return res.status(400).json({ error: 'Número do contrato ausente' });
  }

  try {
    await collection.doc(data.nroContrato).set(data);
    res.status(201).json({ message: 'Contrato criado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar contrato', details: error });
  }
});

// Listar contratos
router.get('/', authenticate, async (req, res) => {
  try {
    const snapshot = await collection.get();
    const contratos: Contrato[] = snapshot.docs.map(doc => ({
          empresa: doc.data().empresa,
          nroContrato: doc.id,
          saldoContratual: doc.data().saldoContratual,
          valorContrato: doc.data().valorContrato,
          reajuste: doc.data().reajuste ?? undefined,
          agentes: doc.data().agentes 
        }));
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar contratos', details: error });
  }
});

// Buscar por ID
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Contrato não encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar contrato', details: error });
  }
});

// Atualizar contrato
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body as Partial<Contrato>;
  try {
    await collection.doc(id).update(data);
    res.json({ message: 'Contrato atualizado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar contrato', details: error });
  }
});

// Deletar contrato
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await collection.doc(id).delete();
    res.json({ message: 'Contrato deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar contrato', details: error });
  }
});

export default router;