export default interface Prestacao {
    idDoc: string;
    idViagem: string;
    status: string; 
    valorTotal: number;
    valorAdiantamento: number;
    valorDiferenca: number;
    notas?: Nota[];
    urlReciboPix?: string;
}

export interface Nota {
    diaViagem: string;
    valor: number;
    urlImagem: string;
    tipo: string;
    validada?: boolean;
    glosa?: number;
    obsGlosa?: string;
}