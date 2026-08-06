// AsyncStorage n'existe pas hors application : le mock officiel fournit une
// implémentation en mémoire, suffisante pour le backend local.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
