"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users.ts
const express_1 = require("express");
const firebase_1 = require("../firebase");
//import { authenticate } from '../middlewares/authenticate';
const Usuario_1 = require("../interfaces/Usuario");
const authenticate_1 = require("../middlewares/authenticate");
const router = (0, express_1.Router)();
const collection = firebase_1.admin.firestore().collection("USUARIO");
// Criar novo usuário
router.post('/', async (req, res) => {
    const data = req.body;
    try {
        await collection.doc(data.email).set({
            ...data,
            nomeAbreviado: (0, Usuario_1.nomeAbreviado)(data.nomeCompleto)
        });
        res.status(201).json({ message: 'Usuario criado com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao criar usuário', details: error });
    }
});
//inativar usuario
router.put('/inativar/:id', authenticate_1.authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const userRef = await collection.doc(id).get();
        if (userRef.data().uid !== 'Pendente') {
            await firebase_1.admin.auth().updateUser(userRef.data().uid, { disabled: true });
        }
        await collection.doc(id).update({ inativo: true });
        res.status(200).json({ message: 'Usuário inativado com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao inativar usuario', details: error });
    }
});
// Listar usuarios
router.get('/', async (req, res) => {
    try {
        const snapshot = await collection.get();
        const usuarios = snapshot.docs.map(doc => ({
            ...doc.data()
        }));
        res.json(usuarios);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuarios', details: error });
    }
});
//ativar usuario
router.put('/ativar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const userRef = await collection.doc(id).get();
        if (userRef.data().uid !== 'Pendente') {
            await firebase_1.admin.auth().updateUser(userRef.data().uid, { disabled: false });
        }
        await collection.doc(id).update({ inativo: false });
        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao ativar usuário', details: error });
    }
});
exports.default = router;
