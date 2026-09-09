import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from './src/theme.js';
import { useAuth } from './src/hooks/useAuth.js';
import AuthScreen from './src/screens/AuthScreen.js';
import ProfilArtisanScreen from './src/screens/ProfilArtisanScreen.js';
import NouveauDevisScreen from './src/screens/NouveauDevisScreen.js';
import HistoriqueDevisScreen from './src/screens/HistoriqueDevisScreen.js';

/** Bascule minimale entre les écrans, sans librairie de navigation. */
const ONGLETS = [
  { cle: 'devis', label: 'Nouveau devis' },
  { cle: 'historique', label: 'Historique' },
  { cle: 'profil', label: 'Mon profil' },
];

export default function App() {
  const { estConnecte, enChargement, userId, inscrire, connecter, deconnecter } = useAuth();
  const [ongletActif, setOngletActif] = useState('devis');
  // Devis choisi depuis l'historique pour modification — vécu comme une
  // navigation avec paramètre, sans librairie dédiée pour trois écrans.
  const [devisAModifier, setDevisAModifier] = useState(null);
  const [ouvrirComparateur, setOuvrirComparateur] = useState(false);

  if (enChargement) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.conteneurChargement}>
          <ActivityIndicator color={colors.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!estConnecte) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen inscrire={inscrire} connecter={connecter} />
      </SafeAreaProvider>
    );
  }

  const choisirOnglet = (cle) => {
    if (cle === 'devis') {
      setDevisAModifier(null);
      setOuvrirComparateur(false);
    }
    setOngletActif(cle);
  };

  const modifierDepuisHistorique = (ligne) => {
    setDevisAModifier(ligne);
    setOuvrirComparateur(false);
    setOngletActif('devis');
  };

  const comparerDepuisHistorique = (ligne) => {
    setDevisAModifier(ligne);
    setOuvrirComparateur(true);
    setOngletActif('devis');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.barreOnglets} edges={['top']}>
        <View style={styles.barreOngletsContenu}>
          {ONGLETS.map((onglet) => (
            <TouchableOpacity
              key={onglet.cle}
              style={[styles.onglet, ongletActif === onglet.cle && styles.ongletActif]}
              onPress={() => choisirOnglet(onglet.cle)}
            >
              <Text style={[styles.ongletTexte, ongletActif === onglet.cle && styles.ongletTexteActif]}>
                {onglet.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
      {ongletActif === 'devis' ? (
        <NouveauDevisScreen
          key={devisAModifier?.id ?? 'nouveau'}
          userId={userId}
          devisExistant={devisAModifier}
          onFinModification={() => {
            setDevisAModifier(null);
            setOuvrirComparateur(false);
          }}
          ouvrirComparateurInitial={ouvrirComparateur}
        />
      ) : ongletActif === 'historique' ? (
        <HistoriqueDevisScreen
          userId={userId}
          onModifier={modifierDepuisHistorique}
          onComparer={comparerDepuisHistorique}
        />
      ) : (
        <ProfilArtisanScreen userId={userId} deconnecter={deconnecter} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  conteneurChargement: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
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
