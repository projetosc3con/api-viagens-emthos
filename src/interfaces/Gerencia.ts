export default interface Gerencia {
    id?: string;
    nome: string;
    aprovador: string;
    colaboradores: number;
    fluxoCompleto: boolean;
    idContrato: string;
}