export default interface Contrato {
    nroContrato: string;
    empresa: string;
    saldoContratual: number;
    valorContrato: number;
    reajuste?: number;
}

export interface AgentesContrato {
    id?: string;
    nroContrato: string;
    preposto: Agente;
    interno: Agente;
    financeiro: Agente;
    suplenteFinanceiro: Agente;
    cliente: Agente; //Ponto focal cliente
    suplenteCliente: Agente;
}

export interface Agente {
    nome: string;
    email: string;
}