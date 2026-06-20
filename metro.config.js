const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This line allows Metro to handle dynamic expressions inside import() 
config.transformer.unstable_allowRequireContext = true;

module.exports = config;