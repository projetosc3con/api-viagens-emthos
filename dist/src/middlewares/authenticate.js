"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const firebase_1 = require("../firebase");
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token ausente ou inválido' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await firebase_1.admin.auth().verifyIdToken(token);
        req.user = decodedToken; // UID, e-mail, claims etc.
        next();
    }
    catch (error) {
        console.error('Erro na verificação do token:', error);
        return res.status(403).json({ error: 'Token inválido' });
    }
}
