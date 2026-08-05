import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Screen } from '../../components/Screen';
import MInput from '../../components/MInput';
import SalleRow from '../../components/SalleRow';
import { MChip, Loader, EmptyState, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useFavorites } from '../../context/FavoritesContext';
import { EVENT_TYPES, CITIES } from '../../lib/constants';
import { formatDA } from '../../lib/format';
import * as api from '../../data';

// Paliers de budget, appliqués au prix d'appel de la salle (§4.2)
const BUDGETS = [40000, 60000, 90000];

/**
 * Rangée de filtres défilant horizontalement.
 * La hauteur est explicite : empilés sans elle, les ScrollView horizontaux
 * se recouvrent au lieu de s'enchaîner.
 */
function FilterRow({ children }) {
  const { spacing } = useTheme();
  const { isRTL } = useI18n();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0, height: 46 }}
      contentContainerStyle={{
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      {children}
    </ScrollView>
  );
}

export default function SearchScreen({ navigation, route }) {
  const { colors, typography, spacing } = useTheme();
  const { t, dir, isRTL } = useI18n();
  const { isFav, toggle } = useFavorites();

  const [query, setQuery] = useState(route.params?.query || '');
  const [eventType, setEventType] = useState(route.params?.eventType || 'all');
  const [city, setCity] = useState(route.params?.city || null);
  const [extras, setExtras] = useState([]);
  const [budget, setBudget] = useState(null);

  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = useMemo(
    () => ({
      query: query.trim() || undefined,
      city: city || undefined,
      eventType: eventType === 'all' ? undefined : eventType,
      minCapacity: extras.includes('capacity') ? 300 : undefined,
      maxPrice: budget ?? undefined,
      amenities: [
        ...(extras.includes('parking') ? ['parking'] : []),
        ...(extras.includes('traiteur') ? ['traiteur'] : []),
      ],
    }),
    [query, city, eventType, extras, budget]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setSalles(await api.listSalles(filters));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 220);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleExtra = (key) =>
    setExtras((list) => (list.includes(key) ? list.filter((x) => x !== key) : [...list, key]));

  const countLabel = city
    ? t('search.resultsIn', { count: salles.length, s: salles.length > 1 ? 's' : '', city })
    : t('search.resultsCount', { count: salles.length, s: salles.length > 1 ? 's' : '' });

  return (
    <Screen>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md }}>
        <MInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          icon="search-outline"
        />
      </View>

      {/* Filtres par type d'événement */}
      <FilterRow>
        <MChip label={t('search.filterAll')} active={eventType === 'all'} onPress={() => setEventType('all')} />
        {EVENT_TYPES.filter((x) => x !== 'autre').map((type) => (
          <MChip
            key={type}
            label={t(`events.${type}`)}
            active={eventType === type}
            onPress={() => setEventType(type)}
          />
        ))}
        <MChip label={t('search.filterCapacity')} active={extras.includes('capacity')} onPress={() => toggleExtra('capacity')} />
        <MChip label={t('search.filterParking')} active={extras.includes('parking')} onPress={() => toggleExtra('parking')} />
        <MChip label={t('search.filterCaterer')} active={extras.includes('traiteur')} onPress={() => toggleExtra('traiteur')} />
      </FilterRow>

      {/* Filtres par ville */}
      <FilterRow>
        <MChip label={t('search.allCities')} active={!city} onPress={() => setCity(null)} />
        {CITIES.map((c) => (
          <MChip key={c} label={c} active={city === c} onPress={() => setCity(city === c ? null : c)} />
        ))}
      </FilterRow>

      {/* Budget — le prix d'appel de la salle doit rester sous le plafond */}
      <FilterRow>
        <MChip label={t('search.anyBudget')} active={!budget} onPress={() => setBudget(null)} />
        {BUDGETS.map((amount) => (
          <MChip
            key={amount}
            label={t('search.under', { amount: formatDA(amount, t('common.currency')) })}
            active={budget === amount}
            onPress={() => setBudget(budget === amount ? null : amount)}
          />
        ))}
      </FilterRow>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: isRTL ? 'right' : 'left' }]}>
          {countLabel}
        </Text>

        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : salles.length === 0 ? (
          <EmptyState icon="search-outline" title={t('search.empty')} body={t('search.emptyHint')} />
        ) : (
          salles.map((salle) => (
            <SalleRow
              key={salle.id}
              salle={salle}
              isFav={isFav(salle.id)}
              onToggleFav={() => toggle(salle.id)}
              onPress={() => navigation.navigate('Salle', { id: salle.id })}
            />
          ))
        )}
        <View style={{ height: spacing.lg }} />
        <View style={{ flexDirection: dir }} />
      </ScrollView>
    </Screen>
  );
}
