// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v10 uses ES modules — tell Metro to handle them
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Support the path aliases defined in tsconfig.json (@/*)
config.resolver.alias = {
  '@': __dirname,
};

module.exports = config;
