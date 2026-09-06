import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from './src/theme.js';
import ProfilArtisanScreen from './src/screens/ProfilArtisanScreen.js';
import NouveauDevisScreen from './src/screens/NouveauDevisScreen.js';

/**
 * Bascule minimale entre les deux écrans, sans librairie de navigation :
 * deux écrans ne la justifient pas encore. À revoir dès qu'un troisième
 * écran (liste des devis, historique fournisseurs...) s'ajoute.
 */
const ONGLETS = [
  { cle: 'devis', label: 'Nouveau devis', Ecran: NouveauDevisScreen },
  { cle: 'profil', label: 'Mon profil', Ecran: ProfilArtisanScreen },
];

export default function App() {
  const [ongletActif, setOngletActif] = useState('devis');
  const { Ecran } = ONGLETS.find((o) => o.cle === ongletActif);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.barreOnglets} edges={['top']}>
        <View style={styles.barreOngletsContenu}>
          {ONGLETS.map((onglet) => (
            <TouchableOpacity
              key={onglet.cle}
              style={[styles.onglet, ongletActif === onglet.cle && styles.ongletActif]}
              onPress={() => setOngletActif(onglet.cle)}
            >
              <Text style={[styles.ongletTexte, ongletActif === onglet.cle && styles.ongletTexteActif]}>
                {onglet.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
      <Ecran />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  barreOnglets: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  barreOngletsContenu: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  onglet: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  ongletActif: { borderBottomColor: colors.primary },
  ongletTexte: { ...typography.label, fontSize: 14 },
  ongletTexteActif: { color: colors.primary, fontWeight: '700' },
});
