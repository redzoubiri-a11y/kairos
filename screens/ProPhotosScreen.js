import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProPhotos from '../src/hooks/useProPhotos';

export default function ProPhotosScreen({ navigation, route }) {
  const restaurantId = route?.params?.restaurantId;
  const { photos, loading, uploading, error, addPhoto, removePhoto } = useProPhotos(restaurantId);

  const confirmDelete = (url) => {
    Alert.alert('Supprimer la photo', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removePhoto(url) },
    ]);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Photos du restaurant</Text>
        <View style={{ width: 36 }} />
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item, i) => `${i}-${item}`}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📷</Text>
              <Text style={s.emptyTxt}>Aucune photo pour l'instant</Text>
              <Text style={s.emptySub}>Ajoutez des photos pour attirer plus de clients</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Image source={{ uri: item }} style={s.img} resizeMode="cover" />
              <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(item)}>
                <Text style={s.deleteTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={s.footer}>
        <TouchableOpacity style={[s.addBtn, uploading && s.addBtnDisabled]} onPress={addPhoto} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={s.addBtnTxt}>+ Ajouter une photo</Text>
          }
        </TouchableOpacity>
        <Text style={s.hint}>JPG / PNG · max 5 Mo · ratio 4:3 recommandé</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backTxt:{ color: colors.text, fontSize: 18 },
  title:  { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.semibold, letterSpacing: 1 },

  error:  { color: colors.red, fontSize: typography.size.caption, textAlign: 'center', margin: spacing.lg },

  grid:   { padding: spacing.lg, paddingBottom: 120 },
  row:    { gap: spacing.md },
  card:   { flex: 1, aspectRatio: 4/3, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md, backgroundColor: colors.card },
  img:    { width: '100%', height: '100%' },
  deleteBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(15,13,11,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  deleteTxt: { color: colors.text, fontSize: 11, fontWeight: typography.weight.bold },

  empty:    { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTxt:   { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', paddingHorizontal: spacing.xxl },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, paddingBottom: spacing.xxl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  addBtn:     { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.6 },
  addBtnTxt:  { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.semibold },
  hint:       { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.sm },
});
