"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/prestacoes.ts
const express_1 = require("express");
const firebase_1 = require("../firebase");
const router = (0, express_1.Router)();
const collection = firebase_1.admin.firestore().collection('PRESTACOES');
// Listar prestacoes
router.get('/', async (req, res) => {
    try {
        const snapshot = await collection.get();
        const prestacoes = snapshot.docs.map(doc => ({
            idDoc: doc.id,
            ...doc.data(),
        }));
        res.json(prestacoes);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar contratos', details: error });
    }
});
exports.default = router;
