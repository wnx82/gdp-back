const fs = require('fs');
const path = require('path');

// Chemins des fichiers de log
const consoleLogFilePath = path.join(__dirname, '../console.log');
const accessLogFilePath = path.join(__dirname, '../access.log');

// Création des streams pour écrire dans les fichiers de log
const consoleLogStream = fs.createWriteStream(consoleLogFilePath, { flags: 'a' });
const accessLogStream = fs.createWriteStream(accessLogFilePath, { flags: 'a' });

// Redirection des appels console.log pour les enregistrer dans le fichier de log
const originalConsoleLog = console.log;
console.log = (...args) => {
    const timestamp = new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }); // Utilisation de toLocaleString pour le format standardisé
    const message = `[${timestamp}] ${args.join(' ')}\n`;
    consoleLogStream.write(message); // Écriture dans le fichier de log
    originalConsoleLog.apply(console, [`[${timestamp}]`, ...args]); // Affichage dans la console avec le timestamp
};

// Fonction pour ajouter un timestamp aux logs d'accès
const formatAccessLog = (tokens, req, res) => {
    const timestamp = new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' });
    return [
        `[${timestamp}]`,
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ');
};

module.exports = {
    consoleLogStream,
    accessLogStream,
    formatAccessLog
};
