// src/routes/users.ts
import { Router } from 'express';
import { admin } from '../firebase';
//import { authenticate } from '../middlewares/authenticate';
import Usuario, { nomeAbreviado } from '../interfaces/Usuario';

const router = Router();

const collection = admin.firestore().collection("USUARIO");

// Criar novo usuário
router.post('/', async (req, res) => {
  const data = req.body as Usuario;
  try {
    await collection.doc(data.email).set({
        ...data,
        nomeAbreviado: nomeAbreviado(data.nomeCompleto)
    });
    res.status(201).json({ message: 'Usuario criado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário', details: error });
  }
}); 

export default router;