import Viagem from "../interfaces/Viagem";
import { admin } from '../firebase';
import ViagemRepository from "../repository/viagem";
import { notificar } from "./email";

const collection = admin.firestore().collection('VIAGENS');

export class ViagemService {
  //Criar viagem
  async create(data: Viagem) {
    //checagem de dados obrigatorios
    if(!data.colaborador || !data.contrato || !data.dataIda || !data.destino) {
      throw new Error("Dados obrigatórios não informados");
    }

    //fluxo de acordo com contrato
    switch (data.contrato) {
      case "4600679817":
      case "4600680171":
        this.validaAntecedencia(data.dataIda); //verifica se foi cadastrada com antecedencia
        const id = await this.getNextID(); //obtem o ID
        await ViagemRepository.create(data, id); //envia pro banco
        await notificar.preAprovada(data); //notifica
        break;

      default:
        throw new Error("Contrato inválido");
    }

    return { message: "Viagem cadastrada com sucesso!", id: '' };
  }

  //Validar antecedencia
  private validaAntecedencia(dataIda: string) {
    const hoje = new Date();
    const ida = new Date(dataIda);
    const diff = 10;

    const diffEmDias =
      (ida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);

    if (diffEmDias < diff) {
      throw new Error(
        `A viagem deve ser solicitada com no mínimo ${diff} dias de antecedência`
      );
    }
  }

  //Obter o ID da viagem
  private async getNextID(): Promise<string> {
    const snapshot = await collection.count().get();
    const total = (snapshot.data().count) + 1;
    return total.toString();
  }
}

export const viagemService = new ViagemService();
