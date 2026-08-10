"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../firebase");
const collection = firebase_1.admin.firestore().collection("VIAGENS");
class ViagemRepository {
    static async create(data, id) {
        const ref = await collection.doc(id).set(data);
        return ref;
    }
}
exports.default = ViagemRepository;
