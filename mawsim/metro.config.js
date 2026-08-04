// Config Metro propre à Mawsim.
// Indispensable : sans ce fichier, Metro remonte l'arborescence et récupère
// la configuration du projet MIDA situé à la racine du dépôt.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le projet est autonome : on n'observe que son propre dossier.
config.watchFolders = [__dirname];

module.exports = config;
