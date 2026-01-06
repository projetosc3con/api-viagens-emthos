import Viagem from "./Viagem"

export default interface Mail {
    to: string[],
    message: {
        html: string,
        text: string,
        subject: string
    },
    delivery?: {
        attempts: number,
        endTime: any,
        error: any,
        info: {
            accepted: string[],
            pending: any,
            rejected: any,
            response: string,
            sendgridQueueId: any
        }, 
        leaseExpireTime: any,
        startTime: string,
        state: string
    },
    idDoc?: string,
    idViagem?: string,
    acaoViagem?: string,
    statusViagem?: string,
    agenteViagem?: string
}

export const NotificarPreAprovada = async (viagem: Viagem) => {
    
}