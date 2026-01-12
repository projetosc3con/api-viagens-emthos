export default interface Usuario {
    uid: string;
    email: string;
    cpf: string;
    nomeCompleto: string;
    nomeAbreviado: string;
    nivelAcesso: string;
    gerenciaPb: string;
    matriculaEmthos?: string;
    contrato: string;
}

export const nomeAbreviado = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts.length <= 2
    ? fullName
    : [parts[0], parts[parts.length - 1]].join(' ');
};
