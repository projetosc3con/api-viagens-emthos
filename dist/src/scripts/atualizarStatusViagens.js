"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LISTA_IDS_VIAGENS = void 0;
exports.atualizarStatusViagens = atualizarStatusViagens;
const firebase_1 = require("../firebase");
const db = firebase_1.admin.firestore();
const collection = db.collection("VIAGENS");
exports.LISTA_IDS_VIAGENS = [
    "358", "462", "578", "605", "619", "625", "626", "628", "629", "630",
    "633", "639", "642", "644", "645", "646", "651", "654", "656", "657",
    "658", "659", "666", "667", "668", "669", "671", "672", "674", "677",
    "678", "679", "682", "688", "689", "690", "691", "692", "694", "695",
    "696", "697", "698", "699", "700", "704", "706", "707", "708", "709",
    "713", "714", "715", "716", "718", "719", "720", "721", "722", "723",
    "725", "726", "728", "729", "731", "732", "733", "734", "736", "737",
    "740", "741", "742", "743", "744", "745", "750"
];
async function atualizarStatusViagens(ids, novoStatus = "Concluída") {
    console.log(`Iniciando atualização de ${ids.length} documento(s) para o status "${novoStatus}"...`);
    const resultados = [];
    for (const id of ids) {
        try {
            const docRef = collection.doc(String(id));
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                // Tenta também buscar por campo 'id' numérico/string se o doc.id for diferente
                const querySnap = await collection.where("id", "in", [id, Number(id)]).get();
                if (querySnap.empty) {
                    console.warn(`[AVISO] Viagem ID ${id} não foi encontrada.`);
                    resultados.push({ id, sucesso: false, mensagem: "Documento não encontrado" });
                    continue;
                }
                for (const doc of querySnap.docs) {
                    const dados = doc.data();
                    const statusAntigo = dados.status;
                    await doc.ref.update({ status: novoStatus });
                    console.log(`[SUCESSO] Doc ID ${doc.id} (campo id: ${id}) atualizado de "${statusAntigo}" para "${novoStatus}". Colaborador: ${dados.colaborador}`);
                    resultados.push({ id: doc.id, statusAnterior: statusAntigo, sucesso: true, mensagem: "Atualizado com sucesso via query" });
                }
                continue;
            }
            const dados = docSnap.data() || {};
            const statusAntigo = dados.status;
            await docRef.update({ status: novoStatus });
            console.log(`[SUCESSO] Viagem ID ${id} atualizada de "${statusAntigo}" para "${novoStatus}". Colaborador: ${dados.colaborador}, Destino: ${dados.destino}`);
            resultados.push({ id, statusAnterior: statusAntigo, sucesso: true, mensagem: "Atualizado com sucesso" });
        }
        catch (error) {
            console.error(`[ERRO] Erro ao atualizar Viagem ID ${id}:`, error?.message || error);
            resultados.push({ id, sucesso: false, mensagem: error?.message || "Erro desconhecido" });
        }
    }
    return resultados;
}
// Execução principal
async function main() {
    const args = process.argv.slice(2);
    const runAll = args.includes("--all");
    const idsParaProcessar = runAll ? exports.LISTA_IDS_VIAGENS : exports.LISTA_IDS_VIAGENS.slice(0, 2);
    console.log(`Modo: ${runAll ? "TODOS OS REGISTROS" : "APENAS OS 2 PRIMEIROS REGISTROS"}`);
    console.log(`IDs a serem processados: ${idsParaProcessar.join(", ")}\n`);
    const resultados = await atualizarStatusViagens(idsParaProcessar, "Concluída");
    console.log("\n--- RESUMO DA EXECUÇÃO ---");
    console.table(resultados);
}
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error("Falha fatal na execução:", err);
        process.exit(1);
    });
}
