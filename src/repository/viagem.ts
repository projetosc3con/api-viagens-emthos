import { admin } from "../firebase";
import Viagem from "../interfaces/Viagem";

const collection = admin.firestore().collection("VIAGENS");

export default class ViagemRepository {
    static async create(data: Viagem, id: string) {
        const ref = await collection.doc(id).set(data);
        return ref;
    }
} 