import { ScrollView, TouchableOpacity } from 'react-native';
import { spacing } from '../theme';
import Tag from './Tag';
import { USAGE_FILTERS } from '../hooks/useHomeSearch';

// Rangée de puces de filtres d'usage, multi-sélection — Lot 1.
export default function UsageFilters({ active, onToggle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: spacing.xs + 2, paddingHorizontal: spacing.xl }}
    >
      {USAGE_FILTERS.map(f => {
        const isActive = active.includes(f.id);
        return (
          <TouchableOpacity key={f.id} onPress={() => onToggle(f.id)}>
            <Tag size="filter" variant={isActive ? 'filterActive' : 'filterInactive'}>
              {f.label}
            </Tag>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
