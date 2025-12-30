export default interface Adiantamento {
    idDoc?: string;
    idViagem: number;
    itens: ItemAdiantamento[];
    totalAdiantamento: number;
}

export interface ItemAdiantamento {
    alimentacao: number;
    deslocamento: number;
    total: number;
    dataReferencia: string;
}