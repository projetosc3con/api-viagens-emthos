"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const rotinas_1 = __importDefault(require("../src/services/rotinas"));
async function handler(req, res) {
    await rotinas_1.default.checarViagens();
    res.status(200).send("Checagem concluída");
}
