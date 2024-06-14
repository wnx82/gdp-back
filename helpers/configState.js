// configState.js
let configFileCreated = false;

module.exports = {
    isConfigFileCreated: () => configFileCreated,
    setConfigFileCreated: (value) => {
        configFileCreated = value;
    }
};
