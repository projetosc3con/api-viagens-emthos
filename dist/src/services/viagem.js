"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viagemService = exports.ViagemService = void 0;
const firebase_1 = require("../firebase");
const viagem_1 = __importDefault(require("../repository/viagem"));
const email_1 = require("./email");
const collection = firebase_1.admin.firestore().collection('VIAGENS');
class ViagemService {
    //Criar viagem
    async create(data) {
        //checagem de dados obrigatorios
        if (!data.colaborador || !data.contrato || !data.dataIda || !data.destino) {
            throw new Error("Dados obrigatórios não informados");
        }
        //fluxo de acordo com contrato
        switch (data.contrato) {
            case "4600679817":
            case "4600680171":
                this.validaAntecedencia(data.dataIda); //verifica se foi cadastrada com antecedencia
                const id = await this.getNextID(); //obtem o ID
                await viagem_1.default.create(data, id); //envia pro banco
                await email_1.notificar.preAprovada(data); //notifica
                break;
            default:
                throw new Error("Contrato inválido");
        }
        return { message: "Viagem cadastrada com sucesso!", id: '' };
    }
    //Validar antecedencia
    validaAntecedencia(dataIda) {
        const hoje = new Date();
        const ida = new Date(dataIda);
        const diff = 10;
        const diffEmDias = (ida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        if (diffEmDias < diff) {
            throw new Error(`A viagem deve ser solicitada com no mínimo ${diff} dias de antecedência`);
        }
    }
    //Obter o ID da viagem
    async getNextID() {
        const snapshot = await collection.count().get();
        const total = (snapshot.data().count) + 1;
        return total.toString();
    }
}
exports.ViagemService = ViagemService;
exports.viagemService = new ViagemService();
