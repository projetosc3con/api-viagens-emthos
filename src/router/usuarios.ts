// src/routes/users.ts
import { Router } from 'express';
import { admin } from '../firebase';
//import { authenticate } from '../middlewares/authenticate';
import Usuario, { nomeAbreviado } from '../interfaces/Usuario';
import { authenticate } from '../middlewares/authenticate';

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

//inativar usuario
router.put('/inativar/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const userRef = await collection.doc(id).get();
    if (userRef.data().uid !== 'Pendente') {
      await admin.auth().updateUser(userRef.data().uid, { disabled: true });
    }
    await collection.doc(id).update({ inativo: true });
    res.status(200).json({ message: 'Usuário inativado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao inativar usuario', details: error });
  }
});

//ativar usuario
router.put('/ativar/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const userRef = await collection.doc(id).get();
    if(userRef.data().uid !== 'Pendente') {
      await admin.auth().updateUser(userRef.data().uid, { disabled: false });
    }
    await collection.doc(id).update({ inativo: false });
    res.status(200).json({ message: 'Usuário ativado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao ativar usuário', details: error });
  }
});

export default router;