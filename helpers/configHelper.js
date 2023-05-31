const path = require('path');
const fs = require('fs');

function createConfigFile() {
    const ROOT_DIR = path.resolve(__dirname, '../'); // Chemin absolu du dossier racine
    const CONFIG_FILE_PATH = path.join(ROOT_DIR, 'config.json');
    const CONFIG_EXAMPLE_PATH = path.join(ROOT_DIR, 'config.example');

    // Vérifier si le fichier config.json existe déjà
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        // Lire le contenu du fichier config.example
        const configExampleContent = fs.readFileSync(
            CONFIG_EXAMPLE_PATH,
            'utf8'
        );

        // Créer le fichier config.json en utilisant le contenu de config.example
        fs.writeFileSync(CONFIG_FILE_PATH, configExampleContent, 'utf8');

        console.log(
            'Le fichier config.json a été créé à partir de config.example.'
        );
    } else {
        // console.log('Le fichier config.json existe déjà.');
    }
}

module.exports = {
    createConfigFile,
};
