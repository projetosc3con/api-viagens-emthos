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
router.post('/inativar/:uid', authenticate, async (req, res) => {
  const { uid } = req.params;
  try {
    await admin.auth().updateUser(uid, { disabled: true });
    const snapshot = await collection.where('uid', '==', uid).get();
    for (const doc of snapshot.docs) {
      await doc.ref.update({ inativo: true });
    }
    res.status(200).json({ message: 'Usuário inativado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao inativar usuario', details: error });
  }
});

export default router;