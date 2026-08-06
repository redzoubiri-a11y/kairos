import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import RatingStars from '../src/components/RatingStars';
import { useT } from '../src/i18n';

const REGION_ALGER = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen({ navigation, route }) {
  const t = useT();
  const [salons, setSalons] = useState([]);
  const [region, setRegion] = useState(REGION_ALGER);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // sans position, on retombe sur tous les salons géolocalisés
        const { data } = await supabase
          .from('salons')
          .select('id, nom, type, note_moyenne, nb_avis, latitude, longitude')
          .eq('statut', 'valide')
          .not('latitude', 'is', null);
        setSalons(data ?? []);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 });

      // tri par distance réelle via PostGIS
      const { data } = await supabase.rpc('salons_a_proximite', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_rayon_km: 25,
      });
      setSalons(data ?? []);
    })();
  }, []);

  // latitude/longitude sont exposées en clair par l'API (cf. migration 0006) :
  // PostgREST sérialiserait une colonne geography en WKB hexadécimal, inutilisable ici
  const coordonnees = (salon) => {
    if (salon.latitude == null || salon.longitude == null) return null;
    return { latitude: Number(salon.latitude), longitude: Number(salon.longitude) };
  };

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} region={region}>
        {salons.map((salon) => {
          const coords = coordonnees(salon);
          if (!coords) return null;
          return (
            <Marker key={salon.id} coordinate={coords} pinColor={colors.primary}>
              <Callout onPress={() => navigation.navigate('Salon', { salonId: salon.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutNom}>{salon.nom}</Text>
                  <RatingStars note={salon.note_moyenne} nbAvis={salon.nb_avis} size={12} />
                  {salon.distance_km != null && (
                    <Text style={styles.calloutDistance}>
                      {t('recherche.distance', { n: salon.distance_km })}
                    </Text>
                  )}
                  <Text style={styles.calloutLien}>{t('salon.voirSalon')}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <Pressable style={styles.retour} onPress={() => navigation.goBack()}>
        <Text style={styles.retourTexte}>← {t('commun.retour')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  callout: { minWidth: 160, gap: 2 },
  calloutNom: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  calloutDistance: { fontSize: typography.size.xs, color: colors.textSecondary },
  calloutLien: { fontSize: typography.size.xs, color: colors.primary, marginTop: 4 },
  retour: {
    position: 'absolute',
    top: spacing.xl,
    start: spacing.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    ...StyleSheet.flatten({ elevation: 3 }),
  },
  retourTexte: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary },
});
