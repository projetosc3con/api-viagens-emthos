// src/routes/emails.ts
import { admin } from "../firebase";
import { Router } from "express";
import Viagem from "../interfaces/Viagem";
import Contrato from "../interfaces/Contrato";
import Gerencia from "../interfaces/Gerencia";

const router = Router();

const db = admin.firestore();

router.get('/handleraprovacao', async (req, res) => {
    const docId = String(req.query.docId || "");
    const action = String(req.query.action || "").toLowerCase();

    if (!docId || !action) {
      res.status(400).send("Parâmetros docId e action são obrigatórios");
      return;
    }

    let novoStatus: string;
    if (action === "approve") {
      novoStatus = "Aprovada";
    } else if (action === "reject") {
      novoStatus = "Reprovada";
    } else {
      res
        .status(400)
        .send("Parâmetro action inválido (use approve ou reject)");
      return;
    }

    try {
      // atualiza o status
      const viagemRef = db.collection("VIAGENS").doc(docId);
      await viagemRef.update({status: novoStatus});

      // lê dados da viagem
      const viagemSnap = await viagemRef.get();
      const viagem = viagemSnap.data() as Viagem;
      if (!viagem) {
        res.status(500).send("Viagem não encontrada após atualização");
        return;
      }

      const snapshot = await db.collection("CONTRATOS").doc(viagem.contrato).get();
      const contrato = snapshot.data() as Contrato;
      const gerSnap = await db.collection("GERENCIAS").where("nome", "==", String(viagem.gerencia)).limit(1).get();
      const gerencia = gerSnap.docs[0].data() as Gerencia;
      if (!contrato) {
        res.status(500).send("Não foi possivel obter os agentes do contrato");
        return;
      }

      // notificacao para colaborador e agente emthos
      await db.collection("mail").add({
        to: [viagem.colaborador, contrato.agentes.interno.email, contrato.agentes.preposto.email],
        idViagem: viagem.id,
        acaoViagem: "Aprovação",
        statusViagem: novoStatus,
        agenteViagem: gerencia.aprovador,
        message: {
          subject: `Viagem ID ${docId} para ${viagem.destino} - ${novoStatus}`,
          text: "",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
              <meta charset="UTF-8" />
              <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
              rel="stylesheet"
              />
              <style>
              body {
              font-family: 'Roboto', sans-serif;
              margin: 0;
              background-position: center center;
              background-repeat: no-repeat;
              background-size: cover;
              position: relative;
              background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
              padding: 0;
              color: #333;
              }
              .background-overlay {
              background-color: #fff0;
              background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
              opacity: .25;
              transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
              inset: 0;
              position: absolute;
              }
              .container {
              width: 600px;
              margin: 32px auto;
              background: #fff;
              border-radius: 8px;
              padding: 24px;
              }
              .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              }
              .btn-confirm {
              display: inline-block;
              padding: 12px 24px;
              margin: 16px 0;
              background-color: #007bff;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 700;
              margin-right: 12px;
              }
              .button-group {
              display: flex;
              }
              .info-table th,
              .info-table td {
              text-align: left;
              padding: 8px;
              border-bottom: 1px solid #ddd;
              }
              .info-table th {
              width: 30%;
              font-weight: 700;
              }
              </style>
              </head>
              <body>
                <div class="background-overlay"></div>
                <div class="container">
                  <h2 style="margin-top:0;">Olá,</h2>
                  <p>Viagem de ${viagem.origem} para ${viagem.destino} - ${novoStatus}:</p>
                  <table class="info-table">
                    <tr>
                      <th>Colaborador:</th>
                      <td>${viagem.colaborador}</td>
                    </tr>
                    <tr>
                      <th>Origem:</th>
                      <td>${viagem.origem}</td>
                    </tr>
                    <tr>
                      <th>Destino:</th>
                      <td>${viagem.destino}</td>
                    </tr>
                    <tr>
                      <th>Data de Ida:</th>
                      <td>${viagem.dataIda}</td>
                    </tr>
                    <tr>
                      <th>Data de Volta:</th>
                      <td>${viagem.dataVolta}</td>
                    </tr>
                    <tr>
                      <th>Justificativa:</th>
                      <td>${viagem.justificativa}</td>
                    </tr>
                  </table>
                  <div class="button-group">
                    <a
                        href="https://viagens-emthos.web.app/viagens/${docId}"
                        class="btn-confirm"
                    >
                        Acessar viagem
                    </a>
                  </div>
                </div>
              </body>
            </html>
          `,
        },
      });

      if (novoStatus === "Aprovada" && gerencia.fluxoCompleto) {
        // notificacao para o agente petrobras
        await db.collection("mail").add({
          to: [contrato.agentes.cliente.email],
          idViagem: viagem.id,
          acaoViagem: "Aprovação",
          statusViagem: novoStatus,
          agenteViagem: contrato.agentes.cliente.email,
          message: {
            subject: `Viagem ID ${docId} - ${novoStatus}`,
            text: "",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8" />
                  <link
                  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
                  rel="stylesheet"
                  />
                  <style>
                    body {
                      font-family: 'Roboto', sans-serif;
                      margin: 0;
                      background-position: center center;
                      background-repeat: no-repeat;
                      background-size: cover;
                      position: relative;
                      background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
                      padding: 0;
                      color: #333;
                    }
                    .background-overlay {
                      background-color: #fff0;
                      background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
                      opacity: .25;
                      transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
                      inset: 0;
                      position: absolute;
                    }
                    .container {
                      width: 600px;
                      margin: 32px auto;
                      background: #fff;
                      border-radius: 8px;
                      padding: 24px;
                    }
                    .info-table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 16px;
                    }
                    .btn-confirm {
                      display: inline-block;
                      padding: 12px 24px;
                      margin: 16px 0;
                      background-color: #007bff;
                      color: #ffffff !important;
                      text-decoration: none;
                      border-radius: 4px;
                      font-weight: 700;
                      margin-right: 12px;
                    }
                    .button-group {
                      display: flex;
                    }
                    .info-table th,
                    .info-table td {
                      text-align: left;
                      padding: 8px;
                      border-bottom: 1px solid #ddd;
                    }
                    .info-table th {
                      width: 30%;
                      font-weight: 700;
                    }
                  </style>
                </head>
                <body>
                  <div class="background-overlay"></div>
                  <div class="container">
                    <h2 style="margin-top:0;">Olá,</h2>
                    <p>Viagem de ${viagem.origem} para ${viagem.destino} - ${novoStatus}:</p>
                    <table class="info-table">
                      <tr>
                        <th>Colaborador:</th>
                        <td>${viagem.colaborador}</td>
                      </tr>
                      <tr>
                        <th>Origem:</th>
                        <td>${viagem.origem}</td>
                      </tr>
                      <tr>
                        <th>Destino:</th>
                        <td>${viagem.destino}</td>
                      </tr>
                      <tr>
                        <th>Data de Ida:</th>
                        <td>${viagem.dataIda}</td>
                      </tr>
                      <tr>
                        <th>Data de Volta:</th>
                        <td>${viagem.dataVolta}</td>
                      </tr>
                      <tr>
                        <th>Justificativa:</th>
                        <td>${viagem.justificativa}</td>
                      </tr>
                    </table>
                    <div class="button-group">
                      <a
                      href="https://southamerica-east1-viagens-emthos.cloudfunctions.net/handleTriagem
                      ?docId=${viagem.id}
                      &mailto=${contrato.agentes.interno.email}
                      &subject=${encodeURIComponent(`Triagem da viagem ID ${viagem.id}`)}
                      &bodyText=${encodeURIComponent(`Olá!
                      Seguem evidências de hospedagem ${viagem.voo ?
                          "e voo " : ""}em conformidade com as diretrizes: `)}" 
                      class="btn-confirm"
                      >
                        Iniciar triagem
                      </a>
                    </div>
                  </div>
                </body>
              </html>
            `,
          },
        });
      }

      // tela de confirmacao para o aprovador
      res.send(
        `<!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <title>Viagens Emthos</title>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                height: 100%;
              }
              body {
                background-image: url("https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e");
                background-position: center center;
                background-repeat: no-repeat;
                background-size: cover;
                position: relative;
                font-family: Arial, sans-serif;
              }
              .background-overlay {
                position: absolute;
                inset: 0;
                background-color: #fff0;
                background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
                opacity: .25;
                transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
              }
              .container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .content {
                background: #444;
                padding: 1rem;
                border-radius: 6px;
                color: #fff;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="background-overlay"></div>
            <div class="container">
              <div class="content">
                <h1>Viagem de ID ${docId} - ${novoStatus}</h1>
              </div>
            </div>
          </body>
        </html>`
      );
      return;
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      res.status(500).send("Erro interno ao atualizar status");
      return;
    }
});

router.get('/handlervaloradiantado', async(req, res) => {
  const docId = String(req.query.docId || "");

  if (!docId) {
    res.status(400).send("Parâmetro docId obrigatório");
    return;
  }

  const novoStatus = "Valor adiantado";

  try {
    // atualiza o status
    const viagemRef = db.collection("VIAGENS").doc(docId);
    await viagemRef.update({status: novoStatus});

    // lê dados da viagem
    const viagemSnap = await viagemRef.get();
    const viagem = viagemSnap.data() as Viagem;
    if (!viagem) {
      res.status(500).send("Viagem não encontrada após atualização");
      return;
    }
    const snapshot = await db.collection("CONTRATOS").doc(viagem.contrato).get();
    const contrato = snapshot.data() as Contrato;
    if (!contrato) {
      res.status(500).send("Não foi possivel obter os agentes do contrato");
      return;
    }

    // notificacao para colaborador e agente emthos
    await db.collection("mail").add({
      to: [viagem.colaborador, contrato.agentes.preposto.email],
      idViagem: viagem.id,
      acaoViagem: "Adiantamento",
      statusViagem: novoStatus,
      agenteViagem: contrato.agentes.preposto.email,
      message: {
        subject: `Viagem ID ${docId} para ${viagem.destino} - ${novoStatus}`,
        text: "",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
              rel="stylesheet"
              />
              <style>
                body {
                  font-family: 'Roboto', sans-serif;
                  margin: 0;
                  background-position: center center;
                  background-repeat: no-repeat;
                  background-size: cover;
                  position: relative;
                  background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
                  padding: 0;
                  color: #333;
                }
                .background-overlay {
                  background-color: #fff0;
                  background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
                  opacity: .25;
                  transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
                  inset: 0;
                  position: absolute;
                }
                .container {
                  width: 600px;
                  margin: 32px auto;
                  background: #fff;
                  border-radius: 8px;
                  padding: 24px;
                }
                .info-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 16px;
                }
                .btn-confirm {
                  display: inline-block;
                  padding: 12px 24px;
                  margin: 16px 0;
                  background-color: #007bff;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 700;
                  margin-right: 12px;
                }
                .button-group {
                  display: flex;
                }
                .info-table th,
                .info-table td {
                  text-align: left;
                  padding: 8px;
                  border-bottom: 1px solid #ddd;
                }
                .info-table th {
                  width: 30%;
                  font-weight: 700;
                }
              </style>
            </head>
            <body>
              <div class="background-overlay"></div>
              <div class="container">
                <h2 style="margin-top:0;">Olá,</h2>
                <p>Viagem de ${viagem.origem} para ${viagem.destino} - ${novoStatus}:</p>
                <table class="info-table">
                  <tr>
                    <th>Colaborador:</th>
                    <td>${viagem.colaborador}</td>
                  </tr>
                  <tr>
                    <th>Origem:</th>
                    <td>${viagem.origem}</td>
                  </tr>
                  <tr>
                    <th>Destino:</th>
                    <td>${viagem.destino}</td>
                  </tr>
                  <tr>
                    <th>Data de Ida:</th>
                    <td>${viagem.dataIda}</td>
                  </tr>
                  <tr>
                    <th>Data de Volta:</th>
                    <td>${viagem.dataVolta}</td>
                  </tr>
                  <tr>
                    <th>Justificativa:</th>
                    <td>${viagem.justificativa}</td>
                  </tr>
                </table>
                <div class="button-group">
                  <a href="https://viagens-emthos.web.app/viagens/${docId}" class="btn-confirm">
                    Acessar viagem
                  </a>
                </div>
              </div>
            </body>
          </html>
        `,
      },
    });

    // tela de confirmacao para o aprovador
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Viagens Emthos</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
            }
            body {
              font-family: 'Roboto', sans-serif;
              margin: 0;
              background-position: center center;
              background-repeat: no-repeat;
              background-size: cover;
              position: relative;
              background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
              padding: 0;
              color: #333;
            }
            .background-overlay {
              background-color: #fff0;
              background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
              opacity: .25;
              transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
              inset: 0;
              position: absolute;
            }
            .container {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .content {
              background: #444;
              padding: 1rem;
              border-radius: 6px;
              max-height: 50px;
              color: #fff;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="background-overlay"></div>
          <div class="container">
            <div class="content">
              <h1>${novoStatus} para Viagem de ID ${docId}</h1>
            </div>
          </div>
        </body>
      </html>`
    );
    return;
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    res.status(500).send("Erro interno ao atualizar status");
    return;
  }
});

router.get('/handlerdescontoreembolso', async(req, res) => {
  const docId = String(req.query.docId || "");
  const acao = String(req.query.acao || "");

  if (!docId || !acao) {
    res.status(400).send("Parâmetros obrigatórios faltando");
    return;
  }

  let novoStatus = "";
  if (acao === "desconto") {
    novoStatus = "Desconto programado";
  } else if (acao === "reembolso") {
    novoStatus = "Reembolso programado";
  }

  try {
    // atualiza o status
    const viagemRef = db.collection("VIAGENS").doc(docId);
    await viagemRef.update({status: novoStatus});

    // lê dados da viagem
    const viagemSnap = await viagemRef.get();
    const viagem = viagemSnap.data() as Viagem;
    if (!viagem) {
      res.status(500).send("Viagem não encontrada após atualização");
      return;
    }
    const snapshot = await db.collection("CONTRATOS").doc(viagem.contrato).get();
    const contrato = snapshot.data() as Contrato;
    
    if (!contrato) {
      res.status(500).send("Não foi possivel obter os agentes do sistema");
      return;
    }

    await db.collection("mail").add({
      to: [viagem.colaborador, contrato.agentes.preposto.email],
      idViagem: viagem.id,
      acaoViagem: "Adiantamento",
      statusViagem: novoStatus,
      agenteViagem: contrato.agentes.preposto.email,
      message: {
        subject: `Viagem ID ${docId} para ${viagem.destino} - ${novoStatus}`,
        text: "",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
              rel="stylesheet"
              />
              <style>
                body {
                  font-family: 'Roboto', sans-serif;
                  margin: 0;
                  background-position: center center;
                  background-repeat: no-repeat;
                  background-size: cover;
                  position: relative;
                  background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
                  padding: 0;
                  color: #333;
                }
                .background-overlay {
                  background-color: #fff0;
                  background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
                  opacity: .25;
                  transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
                  inset: 0;
                  position: absolute;
                }
                .container {
                  width: 600px;
                  margin: 32px auto;
                  background: #fff;
                  border-radius: 8px;
                  padding: 24px;
                }
                .info-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 16px;
                }
                .btn-confirm {
                  display: inline-block;
                  padding: 12px 24px;
                  margin: 16px 0;
                  background-color: #007bff;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 700;
                  margin-right: 12px;
                }
                .button-group {
                  display: flex;
                }
                .info-table th,
                .info-table td {
                  text-align: left;
                  padding: 8px;
                  border-bottom: 1px solid #ddd;
                }
                .info-table th {
                  width: 30%;
                  font-weight: 700;
                }
              </style>
            </head>
            <body>
              <div class="background-overlay"></div>
              <div class="container">
                <h2 style="margin-top:0;">Olá,</h2>
                <p>Viagem de ${viagem.origem} para ${viagem.destino} - ${novoStatus}:</p>
                <table class="info-table">
                  <tr>
                    <th>Colaborador:</th>
                    <td>${viagem.colaborador}</td>
                  </tr>
                  <tr>
                    <th>Origem:</th>
                    <td>${viagem.origem}</td>
                  </tr>
                  <tr>
                    <th>Destino:</th>
                    <td>${viagem.destino}</td>
                  </tr>
                  <tr>
                    <th>Data de Ida:</th>
                    <td>${viagem.dataIda}</td>
                  </tr>
                  <tr>
                    <th>Data de Volta:</th>
                    <td>${viagem.dataVolta}</td>
                  </tr>
                  <tr>
                    <th>Justificativa:</th>
                    <td>${viagem.justificativa}</td>
                  </tr>
                </table>
                <div class="button-group">
                  <a href="https://viagens-emthos.web.app/viagens/${docId}" class="btn-confirm" >
                    Acessar viagem
                  </a>
                </div>
              </div>
            </body>
          </html>
        `,
      },
    });

    // tela de confirmacao para o aprovador
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Viagens Emthos</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
            }
            body {
              font-family: 'Roboto', sans-serif;
              margin: 0;
              background-position: center center;
              background-repeat: no-repeat;
              background-size: cover;
              position: relative;
              background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
              padding: 0;
              color: #333;
            }
            .background-overlay {
              background-color: #fff0;
              background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
              opacity: .25;
              transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
              inset: 0;
              position: absolute;
            }
            .container {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .content {
              background: #444;
              padding: 1rem;
              border-radius: 6px;
              max-height: 50px;
              color: #fff;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="background-overlay"></div>
          <div class="container">
            <div class="content">
              <h1>${novoStatus} para Viagem de ID ${docId}</h1>
            </div>
          </div>
        </body>
      </html>`
    );
    return;
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    res.status(500).send("Erro interno ao atualizar status: "+err.message);
    return;
  }
});

router.get('/handleraprovaradiantamento', async(req, res) => {
  const docId = String(req.query.docId || "");

  if (!docId) {
    res.status(400).send("Parâmetros obrigatórios faltando");
    return;
  }

  try {
    // lê dados da viagem
    const viagemRef = db.collection("VIAGENS").doc(docId);
    const viagemSnap = await viagemRef.get();
    const viagem = viagemSnap.data() as Viagem;
    if (!viagem) {
      res.status(500).send("Viagem não encontrada");
      return;
    }
    const snapshot = await db.collection("CONTRATOS").doc(viagem.contrato).get();
    const contrato = snapshot.data() as Contrato;
    
    if (!contrato) {
      res.status(500).send("Não foi possivel obter os agentes do contrato");
      return;
    }

    await db.collection("mail").add({
      to: [contrato.agentes.financeiro.email, contrato.agentes.suplenteFinanceiro.email],
      idViagem: viagem.id,
      acaoViagem: "Adiantamento",
      statusViagem: "Adiantamento enviado",
      agenteViagem: contrato.agentes.preposto.email,
      message: {
        subject: `Adiantamento validado pelo preposto - viagem ID ${docId} contrato ${viagem.contrato}`,
        text: "",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
              rel="stylesheet"
              />
              <style>
                body {
                  font-family: 'Roboto', sans-serif;
                  margin: 0;
                  background-position: center center;
                  background-repeat: no-repeat;
                  background-size: cover;
                  position: relative;
                  background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
                  padding: 0;
                  color: #333;
                }
                .background-overlay {
                  background-color: #fff0;
                  background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
                  opacity: .25;
                  transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
                  inset: 0;
                  position: absolute;
                }
                .container {
                  width: 600px;
                  margin: 32px auto;
                  background: #fff;
                  border-radius: 8px;
                  padding: 24px;
                }
                .info-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 16px;
                }
                .btn-confirm {
                  display: inline-block;
                  padding: 12px 24px;
                  margin: 16px 0;
                  background-color: #007bff;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 700;
                  margin-right: 12px;
                }
                .button-group {
                  display: flex;
                }
                .info-table th,
                .info-table td {
                  text-align: left;
                  padding: 8px;
                  border-bottom: 1px solid #ddd;
                }
                .info-table th {
                  width: 30%;
                  font-weight: 700;
                }
              </style>
            </head>
            <body>
              <div class="background-overlay"></div>
              <div class="container">
                <h2 style="margin-top:0;">Olá,</h2>
                <p>Adiantamento da viagem de ${viagem.origem} para ${viagem.destino} validado pelo preposto</p>
                <table class="info-table">
                  <tr>
                    <th>Contrato:</th>
                    <td>${viagem.contrato}</td>
                  </tr>
                  <tr>
                      <th>Centro de custo:</th>
                      <td>${viagem.contrato === '4600685412' ? '53' : '47'}</td>
                  </tr>
                  <tr>
                    <th>Colaborador:</th>
                    <td>${viagem.colaborador}</td>
                  </tr>
                  <tr>
                    <th>Origem:</th>
                    <td>${viagem.origem}</td>
                  </tr>
                  <tr>
                    <th>Destino:</th>
                    <td>${viagem.destino}</td>
                  </tr>
                  <tr>
                    <th>Data de Ida:</th>
                    <td>${viagem.dataIda}</td>
                  </tr>
                  <tr>
                    <th>Data de Volta:</th>
                    <td>${viagem.dataVolta}</td>
                  </tr>
                  <tr>
                    <th>Valor do adiantamento:</th>
                    <td>R$ ${viagem.valorAdiantamento}</td>
                  </tr>
                </table>
                <div class="button-group">
                  <a href="https://api-viagens-emthos.vercel.app/emails/handlervaloradiantado?docId=${docId}" class="btn-confirm" >
                    Registrar como valor adiantado
                  </a>
                </div>
              </div>
            </body>
          </html>
        `,
      },
    });

    // tela de confirmacao para o aprovador
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Viagens Emthos</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
            }
            body {
              font-family: 'Roboto', sans-serif;
              margin: 0;
              background-position: center center;
              background-repeat: no-repeat;
              background-size: cover;
              position: relative;
              background-image: url(https://firebasestorage.googleapis.com/v0/b/viagens-emthos.firebasestorage.app/o/assets%2Fbackground-emthos.jpeg?alt=media&token=affc8676-313d-483b-b5e4-e57149c9867e);    
              padding: 0;
              color: #333;
            }
            .background-overlay {
              background-color: #fff0;
              background-image: linear-gradient(81deg, #363636ff 0%, #4e4b4bff 100%);
              opacity: .25;
              transition: background 0.3s, border-radius 0.3s, opacity 0.3s;
              inset: 0;
              position: absolute;
            }
            .container {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .content {
              background: #444;
              padding: 1rem;
              border-radius: 6px;
              max-height: 50px;
              color: #fff;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="background-overlay"></div>
          <div class="container">
            <div class="content">
              <h1>Adiantamento validado para Viagem de ID ${docId}</h1>
            </div>
          </div>
        </body>
      </html>`
    );
    return;
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    res.status(500).send("Erro interno ao atualizar status: "+err.message);
    return;
  }
});

export default router;