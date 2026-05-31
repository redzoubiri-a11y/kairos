import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../theme';
import { CUISINE_EMOJI } from '../hooks/useExplorer';

export default function RestaurantPin({ restaurant, isSelected }) {
  return (
    <View style={[s.wrap, isSelected && s.wrapOn]}>
      <Text style={[s.emoji, isSelected && s.emojiOn]}>
        {CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️'}
      </Text>
      {restaurant.avg_rating > 0 && (
        <View style={[s.badge, isSelected && s.badgeOn]}>
          <Text style={[s.badgeTxt, isSelected && { color: colors.bg }]}>
            {Number(restaurant.avg_rating).toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { alignItems:'center', gap:2 },
  emoji:   { fontSize:22, lineHeight:28 },
  emojiOn: { fontSize:28, lineHeight:34 },
  badge:   { backgroundColor:'rgba(15,13,11,0.88)', borderRadius:radius.sm, paddingHorizontal:5, paddingVertical:2, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  badgeOn: { backgroundColor:colors.accent, borderColor:colors.accent },
  badgeTxt:{ color:colors.accent, fontSize:typography.size.xs, fontWeight:'600' },
});
