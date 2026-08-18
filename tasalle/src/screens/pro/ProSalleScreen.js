import { useCallback, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body, StickyBar } from '../../components/Screen';
import MInput, { MSelect } from '../../components/MInput';
import MButton from '../../components/MButton';
import SallePhoto from '../../components/SallePhoto';
import { MChip, MCard, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { CITIES, AMENITIES, AMENITY_ICONS, SALLE_MAX_PHOTOS } from '../../lib/constants';
import { uploadImage, BUCKETS } from '../../lib/storage';
import { useProSalle } from '../../context/ProSalleContext';
import SalleSwitcher from '../../components/SalleSwitcher';
import * as api from '../../data';

const TABS = ['infos', 'photos', 'pricing'];

export default function ProSalleScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();
  const { currentId } = useProSalle();

  const [tab, setTab] = useState('infos');
  const [salle, setSalle] = useState(null);
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const s = await api.proGetSalle(currentId);
      setSalle(s);
      setTarifs((s.tarifs || []).map((x) => ({ ...x, price: String(x.price) })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const set = (key, value) => {
    setSalle((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const toggleAmenity = (a) =>
    setSalle((s) => ({
      ...s,
      amenities: (s.amenities || []).includes(a)
        ? s.amenities.filter((x) => x !== a)
        : [...(s.amenities || []), a],
    }));

  const addPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage({
        bucket: BUCKETS.SALLES,
        prefix: salle.id,
        asset: result.assets[0],
      });
      set('photos', [...(salle.photos || []), url].slice(0, SALLE_MAX_PHOTOS));
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => set('photos', (salle.photos || []).filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.proUpdateSalle(currentId, {
        name: salle.name,
        city: salle.city,
        address: salle.address,
        capacity_max: Number(salle.capacity_max) || 0,
        parking_places: Number(salle.parking_places) || 0,
        description: salle.description,
        amenities: salle.amenities,
        photos: salle.photos,
      });
      await api.proUpdateTarifs(
        currentId,
        tarifs.filter((x) => x.name?.trim()).map((x) => ({ name: x.name, description: x.description, price: x.price }))
      );
      setSaved(true);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title={t('pro.myHall')} bordered={false} />
        <Loader />
      </Screen>
    );
  }
  if (error && !salle) {
    return (
      <Screen>
        <Header title={t('pro.myHall')} bordered={false} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('pro.myHall')} subtitle={salle?.name} bordered={false} />

      <SalleSwitcher />

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
        {TABS.map((key) => (
          <MChip
            key={key}
            label={t(`pro.tab${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            active={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body bottomInset={80}>
          {tab === 'infos' ? (
            <>
              <MInput label={t('pro.hallName')} value={salle.name} onChangeText={(v) => set('name', v)} />
              <MSelect
                label={t('pro.city')}
                value={salle.city}
                onChange={(v) => set('city', v)}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
              <MInput label={t('pro.address')} value={salle.address} onChangeText={(v) => set('address', v)} />

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <MInput
                  label={t('pro.capacity')}
                  value={String(salle.capacity_max ?? '')}
                  onChangeText={(v) => set('capacity_max', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  direction="ltr"
                  style={{ flex: 1 }}
                />
                <MInput
                  label={t('pro.parkingPlaces')}
                  value={String(salle.parking_places ?? '')}
                  onChangeText={(v) => set('parking_places', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  direction="ltr"
                  style={{ flex: 1 }}
                />
              </View>

              <MInput
                label={t('pro.description')}
                value={salle.description}
                onChangeText={(v) => set('description', v)}
                multiline
              />

              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                  {t('salle.amenities')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {AMENITIES.map((a) => (
                    <MChip
                      key={a}
                      label={t(`amenities.${a}`)}
                      icon={AMENITY_ICONS[a]}
                      active={(salle.amenities || []).includes(a)}
                      onPress={() => toggleAmenity(a)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {tab === 'photos' ? (
            <>
              <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                {t('pro.photosHint')}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {(salle.photos || []).map((uri, i) => (
                  <View key={`${uri}-${i}`} style={{ width: '30%' }}>
                    <SallePhoto salle={salle} index={i} height={90} radius={radii.lg} />
                    <Pressable
                      onPress={() => removePhoto(i)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.removePhoto')}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: radii.pill,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={13} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}

                {(salle.photos || []).length < SALLE_MAX_PHOTOS ? (
                  <Pressable
                    onPress={addPhoto}
                    disabled={uploading}
                    accessibilityRole="button"
                    accessibilityState={{ busy: uploading }}
                    style={{
                      width: '30%',
                      height: 90,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: uploading ? colors.primaryInk : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.primaryInk} />
                    ) : (
                      <>
                        <Ionicons name="add" size={20} color={colors.warmGray} />
                        <Text style={{ fontSize: 10, color: colors.warmGray }}>{t('pro.addPhoto')}</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}

          {tab === 'pricing' ? (
            <>
              {tarifs.map((tarif, i) => (
                <MCard key={tarif.id || i} style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[typography.caption, { color: colors.warmGray }]}>
                      {t('salle.formulas')} {i + 1}
                    </Text>
                    <Pressable
                      onPress={() => setTarifs((l) => l.filter((_, idx) => idx !== i))}
                      hitSlop={8}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.accentInk} />
                    </Pressable>
                  </View>

                  <MInput
                    label={t('pro.formulaName')}
                    value={tarif.name}
                    onChangeText={(v) => setTarifs((l) => l.map((x, idx) => (idx === i ? { ...x, name: v } : x)))}
                  />
                  <MInput
                    label={t('pro.formulaPrice')}
                    value={String(tarif.price ?? '')}
                    onChangeText={(v) =>
                      setTarifs((l) =>
                        l.map((x, idx) => (idx === i ? { ...x, price: v.replace(/\D/g, '') } : x))
                      )
                    }
                    keyboardType="number-pad"
                    direction="ltr"
                    suffix={t('common.currency')}
                  />
                </MCard>
              ))}

              <MButton
                label={t('pro.addFormula')}
                variant="ghost"
                icon="add"
                full
                onPress={() => setTarifs((l) => [...l, { name: '', price: '' }])}
              />
            </>
          ) : null}

          {error ? <Text style={[typography.caption, { color: colors.accentInk }]}>{error}</Text> : null}
        </Body>
      </KeyboardAvoidingView>

      <StickyBar>
        <MButton
          label={saved ? t('common.saved') : t('common.save')}
          size="lg"
          onPress={save}
          loading={saving}
          icon={saved ? 'checkmark' : undefined}
          style={{ flex: 1 }}
        />
      </StickyBar>
    </Screen>
  );
}
