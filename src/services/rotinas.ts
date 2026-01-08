import { admin } from "../firebase";

const db = admin.firestore();

export default class Rotinas {
    static async checarConclusaoInicio() {
        try {
            // 1) Formata a data de ontem como dd/MM/yyyy
            const hoje = new Date();
            const ontemDate = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
            const dd = String(ontemDate.getDate()).padStart(2, "0");
            const mm = String(ontemDate.getMonth() + 1).padStart(2, "0");
            const yyyy = String(ontemDate.getFullYear());
            const dataOntem = `${dd}/${mm}/${yyyy}`;

            // 2)Busca todas as viagens cuja dataVolta é exatamente ontem
            const viagensFinalizando = await db
                .collection("VIAGENS")
                .where("dataVolta", "==", dataOntem)
                .where("status", "not-in", ["Cancelar", "Cancelada", "Reprovada"])
                .get();

            // 3)Para cada viagem, verifica se existe alguma prestação
            for (const viagemDoc of viagensFinalizando.docs) {
                const viagemId = viagemDoc.id;
                const prestacoesSnap = await db
                .collection("PRESTACOES")
                .where("idViagem", "==", viagemId)
                .get();

                // 4) Se não existir nenhuma prestação, marca a viagem como pendente
                if (prestacoesSnap.empty) {
                    await viagemDoc.ref.update({
                        status: "Pendente prestação de contas",
                    });
                    //envia notificação para prestação de contas
                    await db.collection("mail").add({
                        to: [viagemDoc.data().colaborador],
                        idViagem: viagemId,
                        acaoViagem: "Prestação de contas",
                        statusViagem: "Pendente prestação de contas",
                        agenteViagem: viagemDoc.data().colaborador,
                        message: {
                        subject: `Viagem ID ${viagemId} pendente prestação de contas`,
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
                                            <p>Viagem de ${viagemDoc.data().origem} para ${viagemDoc.data().destino}
                                            concluída, agora basta inserir a prestação de contas no sistema:</p>
                                            <div class="button-group">
                                                <a
                                                    href="https://viagens-emthos.web.app/viagens/${viagemId}/prestacao"
                                                    class="btn-confirm"
                                                >
                                                    Prestação de contas
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </body>
                            </html>
                            `,
                        },
                    });
                }
            }

            // VERIFICA ADIANTAMENTO
            const viagensComecando = await db
                .collection("VIAGENS")
                .where("dataIda", "==", dataOntem)
                .get();

            for (const viagemDoc of viagensComecando.docs) {
                const viagemId = viagemDoc.id;
                const adiantamentoSnap = await db
                    .collection("ADIANTAMENTOS")
                    .where("idViagem", "==", viagemId)
                    .get();
                if (adiantamentoSnap.empty) {
                    await viagemDoc.ref.update({
                        status: "Sem adiantamento",
                    });
                } else {
                    await viagemDoc.ref.update({
                        status: "Com adiantamento",
                    });
                }
            }

            // VERIFICA PENDENTE FINANCEIRO
            const pendenteFinanceiro = await db
                .collection("VIAGENS")
                .where("status", "==", "Pendente financeiro")
                .get();

            const agenteSnap = await db.collection("AGENTES").get();
            const financeiro = agenteSnap
                .docs
                .find((d) => d.id === "financeiro")?.data();

            if (!financeiro) {
                throw new Error("Dados obrigatórios não encontrados");
            }
            
            for (const viagemDoc of pendenteFinanceiro.docs) {
                const snap = await db
                .collection("PRESTACOES")
                .where("idViagem", "==", viagemDoc.id)
                .get();

                if (!snap.empty) {
                    const prestacao = snap.docs[0].data();

                    await db.collection("mail").add({
                        to: [financeiro.email],
                        idViagem: viagemDoc.id,
                        acaoViagem: "Pendente financeiro",
                        statusViagem: "Pendente financeiro",
                        agenteViagem: financeiro.nome,
                        message: {
                        subject: `Viagem ID ${viagemDoc.id} pendente financeiro`,
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
                            <h2 style="margin-top:0;">Olá ${financeiro.nome},</h2>
                            <p>
                            ${prestacao.valorDiferenca > 0 ?
                                "Programar desconto no valor de R$ " + prestacao.valorDiferenca:
                                prestacao.valorDiferenca === 0 ?
                                "Sem diferença entre prestação e adiantamento":
                                "Programar reembolso no valor de R$ " + (prestacao.valorDiferenca * -1)
                            }
                            </p>
                            <table class="info-table">
                            <tr>
                            <th>ID:</th>
                            <td>${viagemDoc.id}</td>
                            </tr>
                            <tr>
                            <th>Colaborador:</th>
                            <td>${viagemDoc.data().colaborador}</td>
                            </tr>
                            <tr>
                            <th>Adiantamento:</th>
                            <td>R$ ${prestacao.valorAdiantamento}</td>
                            </tr>
                            <tr>
                            <th>Prestação de contas:</th>
                            <td>R$ ${prestacao.valorTotal}</td>
                            </tr>
                            <tr>
                            <th>Status prestação:</th>
                            <td>${prestacao.status}</td>
                            </tr>

                            <tr>
                            <th>Status viagem:</th>
                            <td>${viagemDoc.data().status}</td>
                            </tr>
                            </table>
                            <div class="button-group">
                            <a class="btn-confirm" href="https://southamerica-east1-viagens-emthos.cloudfunctions.net/handleValorAdiantado?docId=${viagemDoc.id}">
                            Valor adiantado
                            </a>
                            </div>
                            </div>
                            </body>
                            </html>
                            `,
                        },
                    });
                }
            }
        } catch (err: any) {
            console.error(err);
            throw new Error("Erro ao executar: " + err.message);
        }
    }

    static async teste() {
        await db.collection("mail").add({
                        to: ['victorhsltech@gmail.com'],
                        idViagem: 'X',
                        acaoViagem: "X",
                        statusViagem: "X",
                        agenteViagem: "X",
                        message: {
                        subject: `Teste executado com sucesso`,
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
                                            <h2 style="margin-top:0;">Olá, teste executado com sucesso</h2>
                                        </div>
                                    </div>
                                </body>
                            </html>
                            `,
                        },
                    });
    }
}