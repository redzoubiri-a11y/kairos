import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

const REGION_ALGER = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function ProLocationScreen({ route, navigation }) {
  const t = useT();
  const { salonId } = route.params;
  const [region, setRegion] = useState(REGION_ALGER);
  const [point, setPoint] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('salons')
        .select('latitude, longitude')
        .eq('id', salonId)
        .single();

      if (data?.latitude != null && data?.longitude != null) {
        const existant = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
        setPoint(existant);
        setRegion({ ...existant, latitudeDelta: 0.02, longitudeDelta: 0.02 });
        return;
      }

      // pas encore de position : on centre sur celle de l'utilisateur
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, [salonId]);

  const enregistrer = async () => {
    if (!point) {
      Alert.alert(t('position.aucunPoint'), t('position.aucunPointMessage'));
      return;
    }

    setEnvoi(true);
    const { error } = await supabase
      .from('salons')
      .update({ latitude: point.latitude, longitude: point.longitude })
      .eq('id', salonId);
    setEnvoi(false);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    Alert.alert(t('position.enregistree'), t('position.enregistreeMessage'));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={(e) => setPoint(e.nativeEvent.coordinate)}
      >
        {point && <Marker coordinate={point} pinColor={colors.primary} draggable
          onDragEnd={(e) => setPoint(e.nativeEvent.coordinate)} />}
      </MapView>

      <View style={styles.panneau}>
        <Text style={styles.aide}>
          {t(point ? 'position.aideAvecPoint' : 'position.aideSansPoint')}
        </Text>
        <Button title={t('position.enregistrerPosition')} onPress={enregistrer} loading={envoi} disabled={!point} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panneau: {
    position: 'absolute',
    start: spacing.md,
    end: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  aide: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center' },
});
