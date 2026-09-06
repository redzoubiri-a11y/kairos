import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme.js';
import { ChampTexte } from '../components/Champs.js';

const MESSAGES_ERREUR = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet email — connecte-toi plutôt.',
};

function messageLisible(erreur) {
  if (!erreur) return null;
  return MESSAGES_ERREUR[erreur.message] ?? erreur.message;
}

export default function AuthScreen({ inscrire, connecter }) {
  const [modeInscription, setModeInscription] = useState(false);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [messageInscription, setMessageInscription] = useState(null);

  const valider = async () => {
    setErreur(null);
    setMessageInscription(null);
    setEnCours(true);
    try {
      const { error } = modeInscription
        ? await inscrire(email.trim(), motDePasse)
        : await connecter(email.trim(), motDePasse);

      if (error) {
        setErreur(error);
      } else if (modeInscription) {
        setMessageInscription('Compte créé. Si une confirmation par email est activée, vérifie ta boîte de réception.');
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SafeAreaView style={styles.conteneur}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          <Text style={styles.titre}>Artizon</Text>
          <Text style={styles.sousTitre}>
            {modeInscription ? 'Créer ton compte artisan' : 'Connecte-toi à ton compte'}
          </Text>

          <ChampTexte
            label="Email"
            valeur={email}
            onChangeText={setEmail}
            placeholder="toi@exemple.fr"
            clavier="email-address"
          />
          <ChampTexte
            label="Mot de passe"
            valeur={motDePasse}
            onChangeText={setMotDePasse}
            placeholder="8 caractères minimum"
          />

          {erreur ? <Text style={styles.texteErreur}>{messageLisible(erreur)}</Text> : null}
          {messageInscription ? <Text style={styles.texteSucces}>{messageInscription}</Text> : null}

          <TouchableOpacity
            style={styles.boutonPrincipal}
            onPress={valider}
            disabled={enCours || !email || !motDePasse}
          >
            {enCours ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.boutonPrincipalTexte}>
                {modeInscription ? 'Créer mon compte' : 'Se connecter'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModeInscription((v) => !v)} style={styles.boutonBascule}>
            <Text style={styles.texteBascule}>
              {modeInscription ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? En créer un'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  contenu: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  titre: { ...typography.title, fontSize: 28, textAlign: 'center', marginBottom: spacing.xs },
  sousTitre: { ...typography.hint, textAlign: 'center', marginBottom: spacing.lg },
  texteErreur: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  texteSucces: { color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  boutonPrincipal: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  boutonPrincipalTexte: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  boutonBascule: { marginTop: spacing.lg, alignItems: 'center' },
  texteBascule: { color: colors.primary, fontWeight: '600' },
});
