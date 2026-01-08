import Rotinas from "../src/services/rotinas";

export default async function handler(req, res) {
  //await Rotinas.checarConclusaoInicio();
  await Rotinas.teste();
  res.status(200).send("Checagem concluída");
}