// src/routes/viagens.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Viagem from '../interfaces/Viagem';
import { viagemService } from '../services/viagem';

const router = Router();

const collection = admin.firestore().collection('VIAGENS');

// Criar viagem
router.post('/', authenticate, async (req, res) => {
  try {
    const data = req.body as Viagem;

    const result = await viagemService.create(data);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Erro ao criar viagem'
    });
  }
});

router.post('/passivosms', async (req, res) => {
  try {
    const data = req.body as Viagem;
    const snapshot = await collection.count().get();
    const nextID = (snapshot.data().count) + 1;
    //add a viagem
    await collection.doc(nextID.toString()).set({ ...data, id: nextID });

    //gera o adiantamento
    const dataIda = new Date(data.dataIda);
    let totalA: number = 0;
    const itens = Array.from({ length: data.duracao }, (_, i) => {
      const dataRef = addDays(dataIda, i);
      let valorDiaria = 65;
      totalA = totalA + valorDiaria;
      return {
        alimentacao: valorDiaria,
        deslocamento: 0,
        lavanderia: 0,
        total: valorDiaria,
        dataReferencia: formatDateBR(dataRef),
      };
    });
    //add o adiantamento
    await admin.firestore().collection("ADIANTAMENTOS").add({
      idDoc: '',
      idViagem: nextID.toString(),
      itens: itens,
      totalAdiantamento: totalA
    });

    res.status(201).json({ message: 'Viagem criada com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: 'Erro'});
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

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateBR(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

export default router;