"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificar = exports.MailService = void 0;
const firebase_1 = require("../firebase");
const collection = firebase_1.admin.firestore().collection("mail");
class MailService {
    async preAprovada(viagem) {
        try {
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar pré aprovação');
        }
    }
    async solicitacao(viagem) {
        try {
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }
    async programacao(viagem) {
        try {
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }
    async cancelamento(viagem) {
        try {
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }
}
exports.MailService = MailService;
exports.notificar = new MailService();
