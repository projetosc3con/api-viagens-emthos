"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/viagens.ts
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const firebase_1 = require("../firebase");
const viagem_1 = require("../services/viagem");
const router = (0, express_1.Router)();
const collection = firebase_1.admin.firestore().collection('VIAGENS');
// Criar viagem
router.post('/', authenticate_1.authenticate, async (req, res) => {
    try {
        const data = req.body;
        const result = await viagem_1.viagemService.create(data);
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao criar viagem'
        });
    }
});
router.post('/passivosms', async (req, res) => {
    try {
        const data = req.body;
        const snapshot = await collection.count().get();
        const nextID = (snapshot.data().count) + 1;
        //add a viagem
        await collection.doc(nextID.toString()).set({ ...data, id: nextID });
        //gera o adiantamento
        const dataIda = parseDateBR(data.dataIda);
        let totalA = 0;
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
        await firebase_1.admin.firestore().collection("ADIANTAMENTOS").add({
            idDoc: '',
            idViagem: nextID.toString(),
            itens: itens,
            totalAdiantamento: totalA
        });
        res.status(201).json({ message: 'Viagem criada com sucesso' });
    }
    catch (error) {
        return res.status(400).json({ message: 'Erro' });
    }
});
// Listar gerencias
router.get('/', async (req, res) => {
    try {
        const snapshot = await collection.get();
        const viagens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.json(viagens);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar viagens', details: error });
    }
});
// Buscar por ID
router.get('/:id', authenticate_1.authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await collection.doc(id).get();
        if (!doc.exists)
            return res.status(404).json({ error: 'viagem não encontrada' });
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar viagem', details: error });
    }
});
// Atualizar viagem
router.put('/:id', authenticate_1.authenticate, async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        await collection.doc(id).update(data);
        res.json({ message: 'Viagem atualizado com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao atualizar viagem', details: error });
    }
});
// Deletar viagem
router.delete('/:id', authenticate_1.authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        await collection.doc(id).delete();
        res.json({ message: 'Viagem deletada com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao deletar Viagem', details: error });
    }
});
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function formatDateBR(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}
function parseDateBR(data) {
    const [dia, mes, ano] = data.split('/').map(Number);
    // mês começa em 0 no JS
    return new Date(ano, mes - 1, dia);
}
exports.default = router;
