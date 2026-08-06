import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadow } from '../theme';
import RatingStars from './RatingStars';
import { useT } from '../i18n';

export default function SalonCard({ salon, onPress }) {
  const t = useT();
  const photo = salon.photos?.[0];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image
        source={photo ? { uri: photo } : undefined}
        style={styles.image}
      />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.nom} numberOfLines={1}>{salon.nom}</Text>
          <RatingStars note={salon.note_moyenne} nbAvis={salon.nb_avis} />
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {t(`types.${salon.type}`)} · {salon.quartier ? `${salon.quartier}, ` : ''}{salon.ville}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  pressed: { opacity: 0.9 },
  image: { width: '100%', height: 140, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nom: { flex: 1, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary },
});
