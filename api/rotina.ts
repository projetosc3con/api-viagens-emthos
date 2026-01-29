import Rotinas from "../src/services/rotinas";

export default async function handler(req, res) {
  await Rotinas.checarViagens();
  res.status(200).send("Checagem concluída");
}