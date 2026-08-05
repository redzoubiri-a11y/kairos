import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, BUCKETS } from '../../lib/storage';
import { Screen, Header, Body, StickyBar } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import { StarPicker } from '../../components/Stars';
import { MCard, Divider } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { REVIEW_MAX_PHOTOS } from '../../lib/constants';
import * as api from '../../data';

const CRITERIA = ['salle', 'traiteur', 'proprete', 'value'];

export default function ReviewFormScreen({ route, navigation }) {
  const { reservationId, salleName } = route.params;
  const { colors, typography, spacing, radii } = useTheme();
  const { t, dir, align } = useI18n();

  const [overall, setOverall] = useState(0);
  const [criteria, setCriteria] = useState({ salle: 0, traiteur: 0, proprete: 0, value: 0 });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const addPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: false,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage({
        bucket: BUCKETS.AVIS,
        prefix: reservationId,
        asset: result.assets[0],
      });
      setPhotos((list) => [...list, url].slice(0, REVIEW_MAX_PHOTOS));
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!overall) {
      setError(t('reviews.needRating'));
      return;
    }
    if (!consent) {
      setError(t('reviews.needConsent'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createReview({
        reservation_id: reservationId,
        rating_overall: overall,
        rating_salle: criteria.salle || null,
        rating_traiteur: criteria.traiteur || null,
        rating_proprete: criteria.proprete || null,
        rating_value: criteria.value || null,
        comment: comment.trim(),
        photos,
      });
      setDone(true);
    } catch (e) {
      setError(e.code === 'TOO_EARLY' ? t('reviews.tooEarly') : e.message || t('common.error'));
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <Header title={t('reviews.title')} onBack={() => navigation.goBack()} />
        <Body>
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.pill,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={36} color={colors.primaryInk} />
            </View>
            <Text style={[typography.title, { color: colors.dark, textAlign: 'center' }]}>
              {t('reviews.submitted')}
            </Text>
            <MButton label={t('common.close')} size="lg" onPress={() => navigation.goBack()} />
          </View>
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('reviews.title')} onBack={navigation.goBack} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body bottomInset={80}>
          <Text style={[typography.secondary, { color: colors.warmGray, textAlign: align }]}>
            {t('reviews.subtitle', { salle: salleName || '' })}
          </Text>

          <MCard style={{ alignItems: 'center', gap: spacing.md }}>
            <Text style={[typography.title, { color: colors.dark }]}>{t('reviews.overall')}</Text>
            <StarPicker value={overall} onChange={setOverall} size={34} />
          </MCard>

          <MCard style={{ gap: spacing.md }}>
            <Text style={[typography.title, { fontSize: 15, color: colors.dark, textAlign: align }]}>
              {t('reviews.criteria')}
            </Text>
            {CRITERIA.map((key, i) => (
              <View key={key} style={{ gap: spacing.sm }}>
                {i > 0 ? <Divider /> : null}
                <View style={{ flexDirection: dir, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[typography.secondary, { color: colors.dark }]}>{t(`reviews.${key}`)}</Text>
                  <StarPicker
                    value={criteria[key]}
                    onChange={(v) => setCriteria((c) => ({ ...c, [key]: v }))}
                    size={20}
                  />
                </View>
              </View>
            ))}
          </MCard>

          <MInput
            label={t('reviews.comment')}
            value={comment}
            onChangeText={setComment}
            placeholder={t('reviews.commentPlaceholder')}
            multiline
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
              {t('reviews.photos')}
            </Text>
            <View style={{ flexDirection: dir, gap: spacing.sm, flexWrap: 'wrap' }}>
              {photos.map((uri) => (
                <View key={uri} style={{ width: 66, height: 66 }}>
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%', borderRadius: radii.lg }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setPhotos((list) => list.filter((x) => x !== uri))}
                    accessibilityRole="button"
                    accessibilityLabel="Retirer la photo"
                    hitSlop={6}
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      width: 20,
                      height: 20,
                      borderRadius: radii.pill,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {photos.length < REVIEW_MAX_PHOTOS ? (
                <Pressable
                  onPress={addPhoto}
                  disabled={uploading}
                  accessibilityRole="button"
                  accessibilityState={{ busy: uploading }}
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: uploading ? colors.primaryInk : colors.border,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primaryInk} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={18} color={colors.warmGray} />
                      <Text style={{ fontSize: 10, color: colors.warmGray }}>{t('reviews.addPhoto')}</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={() => setConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            style={{ flexDirection: dir, alignItems: 'flex-start', gap: spacing.sm }}
          >
            <Ionicons
              name={consent ? 'checkbox' : 'square-outline'}
              size={20}
              color={consent ? colors.primaryInk : colors.warmGray}
            />
            <Text style={[typography.caption, { color: colors.dark, flex: 1, textAlign: align }]}>
              {t('reviews.consent')}
            </Text>
          </Pressable>

          {error ? <Text style={[typography.caption, { color: colors.accent }]}>{error}</Text> : null}
        </Body>
      </KeyboardAvoidingView>

      <StickyBar>
        <MButton label={t('reviews.submit')} size="lg" onPress={submit} loading={saving} style={{ flex: 1 }} />
      </StickyBar>
    </Screen>
  );
}
