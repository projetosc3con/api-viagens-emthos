import type { Request, Response } from 'express';
import Rotinas from "../src/services/rotinas";

export default async function handler(req: Request, res: Response) {
  // Configuração de CORS para permitir requisições de qualquer frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Responde com status OK a requisições preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await Rotinas.checarViagens();
    res.status(200).json({
      success: true,
      message: "Rotina de checagem concluída com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao executar rotina:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao executar rotina",
      details: error?.message || error
    });
  }
}