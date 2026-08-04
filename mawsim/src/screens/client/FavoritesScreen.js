import { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import SalleRow from '../../components/SalleRow';
import MButton from '../../components/MButton';
import { Loader, EmptyState, MCard } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useFavorites } from '../../context/FavoritesContext';
import { formatDA } from '../../lib/format';
import * as api from '../../data';

/** Comparatif rapide des favoris (§ checklist Phase 2 — « Favoris et comparatif »). */
function CompareTable({ salles }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();

  const ROWS = [
    { key: 'price', label: t('booking.amount'), get: (s) => formatDA(s.price_from, t('common.currency')) },
    { key: 'capacity', label: t('salle.capacity'), get: (s) => String(s.capacity_max) },
    { key: 'parking', label: t('salle.parking'), get: (s) => String(s.parking_places || 0) },
    { key: 'rating', label: t('salle.rating'), get: (s) => (s.rating ? Number(s.rating).toFixed(1) : '—') },
  ];

  return (
    <MCard padded={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceElevated }}>
            <View style={{ width: 110, padding: spacing.md }} />
            {salles.map((s) => (
              <View key={s.id} style={{ width: 130, padding: spacing.md }}>
                <Text style={[typography.caption, { color: colors.dark, fontWeight: '600' }]} numberOfLines={2}>
                  {s.name}
                </Text>
              </View>
            ))}
          </View>

          {ROWS.map((row, i) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: i % 2 ? colors.surfaceElevated : colors.surface,
              }}
            >
              <View style={{ width: 110, padding: spacing.md }}>
                <Text style={[typography.caption, { color: colors.warmGray }]}>{row.label}</Text>
              </View>
              {salles.map((s) => (
                <View key={s.id} style={{ width: 130, padding: spacing.md }}>
                  <Text style={[typography.caption, { color: colors.dark }]}>{row.get(s)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </MCard>
  );
}

export default function FavoritesScreen({ navigation }) {
  const { spacing } = useTheme();
  const { t } = useI18n();
  const { isFav, toggle, ids } = useFavorites();

  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSalles(await api.listFavorites());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, ids.length])
  );

  return (
    <Screen>
      <Header
        title={t('favorites.title')}
        bordered={false}
        right={
          salles.length > 1 ? (
            <MButton
              label={comparing ? t('common.close') : t('favorites.compare')}
              variant="ghost"
              size="sm"
              onPress={() => setComparing((v) => !v)}
            />
          ) : null
        }
      />

      <Body>
        {loading ? (
          <Loader />
        ) : salles.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title={t('favorites.empty')}
            body={t('favorites.emptyHint')}
            action={t('nav.search')}
            onAction={() => navigation.navigate('Recherche')}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {comparing ? <CompareTable salles={salles} /> : null}

            {salles.map((salle) => (
              <SalleRow
                key={salle.id}
                salle={salle}
                isFav={isFav(salle.id)}
                onToggleFav={() => toggle(salle.id)}
                onPress={() => navigation.navigate('Salle', { id: salle.id })}
              />
            ))}
          </View>
        )}
      </Body>
    </Screen>
  );
}
