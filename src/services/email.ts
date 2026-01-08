import Mail from "../interfaces/Mail";
import { admin } from "../firebase";
import Viagem from "../interfaces/Viagem";

const collection = admin.firestore().collection("mail");

export class MailService {
    async preAprovada(viagem: Viagem) {
        try {

        } catch (error: any) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar pré aprovação');
        }
    }

    async solicitacao(viagem: Viagem) {
        try {

        } catch (error: any) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }

    async programacao(viagem: Viagem) {
        try {

        } catch (error: any) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }

    async cancelamento(viagem: Viagem) {
        try {

        } catch (error: any) {
            throw new Error(error instanceof Error ? error.message : 'Erro ao notificar solicitação');
        }
    }
}

export const notificar = new MailService();