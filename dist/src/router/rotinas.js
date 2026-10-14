"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rotinas_1 = __importDefault(require("../services/rotinas"));
const router = (0, express_1.Router)();
/**
 * Executa a rotina de checagem de viagens manualmente
 */
async function handleChecarViagens(req, res) {
    try {
        await rotinas_1.default.checarViagens();
        res.status(200).json({
            success: true,
            message: 'Rotina de checagem de viagens executada com sucesso.'
        });
    }
    catch (error) {
        console.error('Erro ao executar rotina checarViagens:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao executar rotina de checagem',
            details: error?.message || error
        });
    }
}
// Rotas públicas (suporta tanto GET quanto POST)
router.post('/checar', handleChecarViagens);
router.get('/checar', handleChecarViagens);
router.post('/', handleChecarViagens);
router.get('/', handleChecarViagens);
exports.default = router;
