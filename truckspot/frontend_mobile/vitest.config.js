import { defineConfig } from 'vitest/config';

// Les stores sont du JavaScript pur : ils se testent en environnement node, sans
// react-native ni jsdom. Les modules d'API et de socket sont remplaces par des
// doublures, la chaine d'imports Expo n'est donc jamais chargee.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js'],
    restoreMocks: true,
  },
});
