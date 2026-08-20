import { useCallback, useState } from 'react';
import { View, Text, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Body } from '../../components/Screen';
import TasalleLogo from '../../components/TasalleLogo';
import SalleCard from '../../components/SalleCard';
import PartnerCard from '../../components/PartnerCard';
import { SectionTitle, Loader, ErrorState, MCard } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { EVENT_TYPES, EVENT_EMOJI, PARTNER_TYPES } from '../../lib/constants';
import * as api from '../../data';

/**
 * Sélecteur de catégorie (§13) — Salles / Traiteurs / Halouadjis, trois
 * verticales indépendantes. `Recherche` reste salle-only pour l'instant
 * (voir le plan) : seule cette page bascule déjà entre les trois.
 */
function PartnerTypeTabs({ active, onChange }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {PARTNER_TYPES.map((type) => {
        const isActive = type === active;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radii.sm,
              alignItems: 'center',
              backgroundColor: isActive ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: isActive ? colors.primary : colors.border,
            }}
          >
            <Text
              style={[typography.secondary, { fontWeight: '500', color: isActive ? colors.onPrimary : colors.dark }]}
            >
              {t(`partnerTypes.${type}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchBar({ onPress }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        paddingHorizontal: 14,
        height: 46,
      }}
    >
      <Ionicons name="search-outline" size={18} color={colors.warmGray} />
      <Text style={[typography.body, { color: `${colors.warmGray}CC`, flex: 1, textAlign: 'left' }]} numberOfLines={1}>
        {t('home.searchPlaceholder')}
      </Text>
    </Pressable>
  );
}

function CategoryTile({ type, onPress, width }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.xl,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontSize: 24 }}>{EVENT_EMOJI[type]}</Text>
      <Text style={[typography.caption, { color: colors.dark }]} numberOfLines={1}>
        {t(`events.${type}`)}
      </Text>
    </Pressable>
  );
}

const LIST_BY_TYPE = { salle: api.listSalles, traiteur: api.listTraiteurs, halouadji: api.listHalouadjis };
const RECOMMENDED_TITLE_KEY = {
  salle: 'home.recommended',
  traiteur: 'home.recommendedTraiteur',
  halouadji: 'home.recommendedHalouadji',
};

export default function HomeScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { isFav, toggle } = useFavorites();
  const { width } = useWindowDimensions();

  const [partnerType, setPartnerType] = useState('salle');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [list, count] = await Promise.all([LIST_BY_TYPE[partnerType]({}), api.unreadCount()]);
      setItems(list.slice(0, 6));
      setUnread(count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partnerType]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const inner = Math.min(width, 640) - spacing.lg * 2;
  const catWidth = (inner - spacing.sm * 3) / 4;
  const cardWidth = (inner - spacing.md) / 2;

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <TasalleLogo size={34} />

        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('notifications.title')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.dark} />
          {unread > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -3,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                paddingHorizontal: 4,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '500' }}>{unread}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primaryInk} />}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.h2, { color: colors.dark }]}>
            {t('home.greeting')}
            {user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </Text>
          <Text style={[typography.secondary, { color: colors.warmGray }]}>{t('home.subtitle')}</Text>
        </View>

        <SearchBar onPress={() => navigation.navigate('Recherche')} />

        <PartnerTypeTabs active={partnerType} onChange={setPartnerType} />

        {partnerType === 'salle' ? (
          <View>
            <SectionTitle title={t('home.categories')} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {EVENT_TYPES.filter((x) => x !== 'autre').map((type) => (
                <CategoryTile
                  key={type}
                  type={type}
                  width={catWidth}
                  onPress={() => navigation.navigate('Recherche', { eventType: type })}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionTitle
            title={t(RECOMMENDED_TITLE_KEY[partnerType])}
            action={partnerType === 'salle' ? t('common.seeAll') : undefined}
            onAction={partnerType === 'salle' ? () => navigation.navigate('Recherche') : undefined}
          />

          {loading ? (
            <Loader />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : partnerType === 'salle' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {items.map((salle) => (
                <SalleCard
                  key={salle.id}
                  salle={salle}
                  width={cardWidth}
                  isFav={isFav(salle.id)}
                  onToggleFav={() => toggle(salle.id)}
                  onPress={() => navigation.navigate('Salle', { id: salle.id })}
                />
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {items.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  type={partnerType}
                  width={cardWidth}
                  onPress={() => navigation.navigate('Partner', { type: partnerType, id: partner.id })}
                />
              ))}
            </View>
          )}
        </View>

        <MCard onPress={() => navigation.navigate('Recherche')} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="compass-outline" size={22} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, { fontSize: 15, color: colors.dark }]}>
                {t('search.allCities')}
              </Text>
              <Text style={[typography.caption, { color: colors.warmGray }]}>
                {t('search.emptyHint')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.warmGray} />
          </View>
        </MCard>
      </Body>
    </Screen>
  );
}
