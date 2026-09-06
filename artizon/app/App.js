import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ProfilArtisanScreen from './src/screens/ProfilArtisanScreen.js';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProfilArtisanScreen />
    </SafeAreaProvider>
  );
}
