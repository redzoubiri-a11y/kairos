const { getDefaultConfig } = require('expo/metro-config');

// projectRoot is pinned to this directory: the repository root holds a separate
// Expo app, and Metro would otherwise walk up and load its config instead.
const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

module.exports = config;
