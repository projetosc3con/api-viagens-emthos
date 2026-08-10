"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nomeAbreviado = void 0;
const nomeAbreviado = (fullName) => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length <= 2
        ? fullName
        : [parts[0], parts[parts.length - 1]].join(' ');
};
exports.nomeAbreviado = nomeAbreviado;
