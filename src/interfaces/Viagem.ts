export default interface Viagem {
    id: number | string;
    status: string;
    origem: string;
    destino: string;
    colaborador: string;
    dataIda: string;
    dataVolta: string;
    duracao: number;
    gerencia: string;
    contrato: string;
    hotel: string;
    custoTotal?: number;
    voo: boolean;
    obsColaborador: string;
    centroCusto?: string;
    macroProcesso: string;
    telContato: string;
    adiantamento?: boolean;
    valorAdiantamento?: number;
    atestadoResponsabilidade?: boolean;
    dataSolicitacao: string;
    ccCliente?: string;
    obsProgramador?: string;
    anexoAprovacao?: string;
    nroRelatorio?: number;
    justificativa: string;
}