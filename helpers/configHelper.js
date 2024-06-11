const path = require('path');
const fs = require('fs');

function createConfigFile() {
    const ROOT_DIR = path.resolve(__dirname, '../'); 
    const CONFIG_FILE_PATH = path.join(ROOT_DIR, 'config.json');
    const CONFIG_EXAMPLE_PATH = path.join(ROOT_DIR, 'config.example');

    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        
        const configExampleContent = fs.readFileSync(
            CONFIG_EXAMPLE_PATH,
            'utf8'
        );

        
        fs.writeFileSync(CONFIG_FILE_PATH, configExampleContent, 'utf8');

        console.log(
            'Le fichier config.json a été créé à partir de config.example.'
        );
    } else {
        console.log(
            'Le fichier config.json n\'a pas été créé.'
        );
    }
}

module.exports = {
    createConfigFile,
};
