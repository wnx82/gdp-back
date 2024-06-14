const path = require('path');
const fs = require('fs');
const configState = require('./configState');

function createConfigFile() {
    if (configState.isConfigFileCreated()) {
        return; // Ne rien faire si le fichier a déjà été créé
    }

    const ROOT_DIR = path.resolve(__dirname, '../'); 
    const CONFIG_FILE_PATH = path.join(ROOT_DIR, 'config.json');
    const CONFIG_EXAMPLE_PATH = path.join(ROOT_DIR, 'config.example');

    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        const configExampleContent = fs.readFileSync(CONFIG_EXAMPLE_PATH, 'utf8');
        fs.writeFileSync(CONFIG_FILE_PATH, configExampleContent, 'utf8');

        console.log('Le fichier config.json a été créé à partir de config.example.');
        configState.setConfigFileCreated(true); // Mettre à jour le drapeau pour indiquer que le fichier a été créé
    } else {
        // console.log('Le fichier config.json existe déjà. Aucune création nécessaire.');
        configState.setConfigFileCreated(true); // Mettre à jour le drapeau même si le fichier existe déjà
    }
}

module.exports = {
    createConfigFile,
};
