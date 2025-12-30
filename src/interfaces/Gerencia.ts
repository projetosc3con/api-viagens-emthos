export default interface Gerencia {
    idDoc?: string;
    nome: string;
    aprovador: string;
    colaboradores: number;
    fluxoCompleto: boolean;
    idContrato: string;
}