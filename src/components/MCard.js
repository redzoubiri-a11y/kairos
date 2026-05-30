import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing, shadows, common } from '../theme';
import MTag from './MTag';

export default function MCard({ restaurant, onPress, showPromo = true, horizontal = false }) {
  if (!restaurant) return null;
  const { name, quartier, cuisine, note, avis, prix, dispo, emoji, promo } = restaurant;

  if (horizontal) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.horizontal, shadows.sm]} activeOpacity={0.8}>
        <View style={styles.horizontalImage}>
          <Text style={styles.emojiMd}>{emoji || '🍽️'}</Text>
        </View>
        <View style={styles.horizontalContent}>
          <View style={common.rowBetween}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.rating}>★ {note}</Text>
          </View>
          <Text style={styles.meta}>{quartier} · {cuisine}</Text>
          <Text style={styles.prix}>{prix}</Text>
          <View style={styles.tagRow}>
            <MTag variant={dispo ? 'success' : 'error'} size="sm">
              {dispo ? '✓ Dispo' : '✗ Complet'}
            </MTag>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, shadows.sm]} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Text style={styles.emojiLg}>{emoji || '🍽️'}</Text>
        {showPromo && promo ? (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>{promo}</Text>
          </View>
        ) : null}
        {!dispo ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Complet</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={common.rowBetween}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.rating}>★ {note}</Text>
        </View>
        <Text style={styles.meta}>{quartier} · {cuisine} · {prix}</Text>
        {avis ? <Text style={styles.avis}>{avis} avis</Text> : null}
        <View style={styles.tagRow}>
          <MTag variant={dispo ? 'success' : 'error'} size="sm">
            {dispo ? '✓ Dispo ce soir' : '✗ Complet'}
          </MTag>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#1A1209',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLg: {
    fontSize: 48,
  },
  emojiMd: {
    fontSize: 28,
  },
  promoBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  promoText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.extrabold,
    color: '#000000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.red,
  },
  content: {
    padding: spacing.xl,
  },
  name: {
    flex: 1,
    fontSize: typography.size.heading3,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginRight: spacing.md,
  },
  rating: {
    fontSize: typography.size.heading3,
    fontWeight: typography.weight.extrabold,
    color: colors.accent,
  },
  meta: {
    fontSize: typography.size.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  avis: {
    fontSize: typography.size.sm,
    color: colors.textDim,
    marginTop: spacing.xxs,
  },
  prix: {
    fontSize: typography.size.caption,
    color: colors.textDim,
    marginTop: spacing.xxs,
  },
  tagRow: {
    marginTop: spacing.sm,
  },
  horizontal: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  horizontalImage: {
    width: 70,
    backgroundColor: '#1A1209',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalContent: {
    flex: 1,
    padding: spacing.lg,
  },
});
