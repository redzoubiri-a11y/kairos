// Config Metro propre à l'app Artizon.
// Indispensable : sans ce fichier, Metro remonte l'arborescence et récupère
// la configuration du projet MIDA situé à la racine du dépôt.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le moteur de chiffrage (artizon/src) vit hors du dossier de l'app : on l'ajoute
// explicitement, sans remonter jusqu'à la racine du monorepo.
config.watchFolders = [__dirname, path.resolve(__dirname, '../src')];

module.exports = config;
