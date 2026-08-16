import { View, Text, StyleSheet } from 'react-native';
import { tagVariants, typography } from '../theme';

// Composant tag/badge unique du design system — consomme tagVariants (theme.js).
// size: "tag" (défaut, cuisine/info/statuts — radius 6, DM Sans 700 10px tracké)
//     | "filter" (chips de filtre — radius 7, DM Sans 500 11px, pas de tracking)
//     | "choice" (chips de sélection unique, ex. cuisine à l'inscription — radius 9, DM Sans 500 11.5px)
export default function Tag({ children, variant = 'default', size = 'tag', style, textStyle }) {
  const v = tagVariants[variant] || tagVariants.default;
  const isFilter = size === 'filter';
  const isChoice = size === 'choice';
  const isFilterActive = isFilter && variant === 'filterActive';
  const isChoiceActive = isChoice && variant === 'filterActive';

  return (
    <View
      style={[
        styles.base,
        isFilter ? styles.filter : isChoice ? styles.choice : styles.tag,
        { backgroundColor: v.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isFilter ? styles.filterText : isChoice ? styles.choiceText : styles.tagText,
          (isFilterActive || isChoiceActive) && styles.filterTextActive,
          { color: v.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start' },
  tag: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 9 },
  filter: { borderRadius: 7, paddingVertical: 7, paddingHorizontal: 11 },
  choice: { borderRadius: 9, paddingVertical: 9, paddingHorizontal: 13 },
  text: { fontFamily: typography.bodyBold },
  // lineHeight explicite : sans lui, Android rogne le haut des lettres (accents,
  // majuscules) avec certaines polices custom à cette taille — texte coupé.
  tagText: { fontSize: 10, lineHeight: 14, letterSpacing: 0.4 },
  filterText: { fontSize: 11, lineHeight: 15, fontFamily: typography.bodyMedium },
  choiceText: { fontSize: 11.5, lineHeight: 16, fontFamily: typography.bodyMedium },
  // Chip actif — doc : DM Sans 600, distinct des chips inactifs (500)
  filterTextActive: { fontFamily: typography.bodySemibold },
});
