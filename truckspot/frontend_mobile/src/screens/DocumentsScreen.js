import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { transporterApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { DOCUMENT_TYPES } from '../utils/constants';
import { formatDate } from '../utils/format';
import { colors, radii, spacing, typography } from '../theme';

const STATUS_COPY = {
  PENDING: { tone: { bg: colors.warningSoft, fg: colors.warning }, label: 'En cours de verification' },
  VERIFIED: { tone: { bg: colors.successSoft, fg: colors.success }, label: 'Compte verifie' },
  REJECTED: { tone: { bg: colors.dangerSoft, fg: colors.danger }, label: 'Dossier refuse' },
};

export default function DocumentsScreen({ navigation }) {
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState({});
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setError(null);
    try {
      setProfile(await transporterApi.me());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pick = async (type) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisez l'acces aux photos pour televerser un document.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPending((p) => ({
      ...p,
      [type]: {
        uri: asset.uri,
        name: asset.fileName ?? `${type.toLowerCase()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        type,
      },
    }));
  };

  const upload = async () => {
    const files = Object.values(pending);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      await transporterApi.uploadDocs(files);
      setPending({});
      await load();
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mes documents" onBack={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  const status = profile?.verificationStatus ?? 'PENDING';
  const copy = STATUS_COPY[status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes documents" subtitle={profile?.companyName} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <ErrorBanner message={error} onRetry={load} />

        <Card>
          <Badge tone={copy.tone} label={copy.label} />
          {status === 'REJECTED' && profile?.rejectionReason ? (
            <Text style={styles.rejection}>Motif : {profile.rejectionReason}</Text>
          ) : null}
          <Text style={styles.help}>
            Envoyez le registre de commerce, la patente et la carte grise de vos vehicules. Un administrateur
            valide votre dossier sous 48 h.
          </Text>
        </Card>

        {DOCUMENT_TYPES.map((doc) => {
          const uploaded = profile?.documents?.find((d) => d.type === doc.value);
          const staged = pending[doc.value];

          return (
            <Card key={doc.value} style={styles.docCard}>
              <View style={styles.docHeader}>
                <View style={styles.docTitles}>
                  <Text style={styles.docTitle}>{doc.label}</Text>
                  <Text style={styles.docMeta}>
                    {staged
                      ? 'Pret a envoyer'
                      : uploaded
                        ? `Envoye le ${formatDate(uploaded.createdAt)}`
                        : 'Non fourni'}
                  </Text>
                </View>
                {uploaded && !staged ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                ) : null}
              </View>

              {staged ? <Image source={{ uri: staged.uri }} style={styles.preview} resizeMode="cover" /> : null}

              <Pressable style={styles.picker} onPress={() => pick(doc.value)}>
                <Ionicons name="cloud-upload-outline" size={17} color={colors.primaryDark} />
                <Text style={styles.pickerText}>
                  {staged || uploaded ? 'Remplacer le document' : 'Choisir un fichier'}
                </Text>
              </Pressable>
            </Card>
          );
        })}

        <Button
          title={`Envoyer ${Object.keys(pending).length || ''} document(s)`.replace('  ', ' ')}
          icon="send"
          onPress={upload}
          loading={uploading}
          disabled={Object.keys(pending).length === 0}
          style={styles.submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  rejection: { ...typography.small, color: colors.danger, marginTop: spacing.md },
  help: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, lineHeight: 20 },
  docCard: { marginTop: spacing.md },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docTitles: { flex: 1 },
  docTitle: { ...typography.bodyStrong, color: colors.text },
  docMeta: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 2 },
  preview: { width: '100%', height: 150, borderRadius: radii.md, marginTop: spacing.md },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  pickerText: { ...typography.small, fontWeight: '600', color: colors.primaryDark, marginLeft: spacing.sm },
  submit: { marginTop: spacing.lg },
});
