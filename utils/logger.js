const fs = require('fs');
const path = require('path');

// Chemin du fichier de log pour console.log
const logFilePath = path.join(__dirname, '../console.log');

// Création du stream pour écrire dans le fichier de log
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Redirection des appels console.log pour les enregistrer dans le fichier de log
const originalConsoleLog = console.log;
console.log = (...args) => {
    const message = args.join(' ') + '\n';
    logStream.write(message); // Écriture dans le fichier de log
    originalConsoleLog.apply(console, args); // Affichage dans la console
};

module.exports = logStream;
