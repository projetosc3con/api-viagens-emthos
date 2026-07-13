// src/routes/prestacoes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { admin } from '../firebase';
import Prestacao from '../interfaces/Prestacao';


const router = Router();

const collection = admin.firestore().collection('PRESTACOES');
// Listar prestacoes
router.get('/', async (req, res) => {
  try {
    const snapshot = await collection.get();
    const prestacoes: Prestacao[] = snapshot.docs.map(doc => ({
              idDoc: doc.id,
              ...(doc.data() as Omit<Prestacao, 'id'>),
            }));
    res.json(prestacoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar contratos', details: error });
  }
});