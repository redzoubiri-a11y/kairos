import { useState } from 'react';
import { View, Text, Image, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { staticMapUrl, directionsUrl, hasCoords } from '../lib/geo';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || null;

/**
 * Situation de la salle (§1.3, Annexe A).
 *
 * Avec un jeton Mapbox, une vignette cartographique. Sans jeton — le cas par
 * défaut — un repli qui affiche la ville. Dans les deux cas le bouton
 * d'itinéraire fonctionne : il ouvre l'application de cartes de l'appareil,
 * qui n'exige aucune clé d'API. Le §1.3 prévoit explicitement ce repli.
 *
 * Le même repli couvre l'échec de chargement de la tuile. Sans lui, une
 * coupure réseau — le §1.4 rappelle qu'elles sont fréquentes — laissait le
 * bloc « Situation » sans visuel, alors que le repli était déjà écrit.
 */
export default function SalleMap({ salle }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();
  const [tuileEnEchec, setTuileEnEchec] = useState(false);

  if (!hasCoords(salle)) return null;

  const vignette = staticMapUrl({
    latitude: salle.latitude,
    longitude: salle.longitude,
    token: MAPBOX_TOKEN,
  });

  const ouvrirItineraire = () => {
    const url = directionsUrl({
      latitude: salle.latitude,
      longitude: salle.longitude,
      label: salle.name,
      platform: Platform.OS,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      {vignette && !tuileEnEchec ? (
        <Image
          source={{ uri: vignette }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
          onError={() => setTuileEnEchec(true)}
        />
      ) : (
        // Repli — pas de jeton, ou tuile inaccessible : une bande sobre
        // plutôt qu'une fausse carte ou un trou dans la mise en page
        <View
          style={{
            height: 96,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="location" size={22} color={colors.primaryInk} />
          <Text style={[typography.caption, { color: colors.primaryInk }]}>{salle.city}</Text>
        </View>
      )}

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[typography.secondary, { color: colors.dark, textAlign: 'left' }]}>
          {salle.address || salle.city}
        </Text>

        <Pressable
          onPress={ouvrirItineraire}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.lg,
            paddingVertical: 10,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="navigate-outline" size={16} color={colors.primaryInk} />
          <Text style={[typography.secondary, { color: colors.primaryInk, fontWeight: '500' }]}>
            {t('salle.directions')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
