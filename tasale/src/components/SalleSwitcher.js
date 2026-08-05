import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useProSalle } from '../context/ProSalleContext';

/**
 * Sélecteur de salle pour l'espace pro.
 * Ne s'affiche qu'à partir de deux salles : un propriétaire qui n'en a qu'une
 * n'a rien à choisir, et une liste d'un seul élément est du bruit.
 */
export default function SalleSwitcher() {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, dir, align } = useI18n();
  const { salles, current, select, isMulti } = useProSalle();
  const [open, setOpen] = useState(false);

  if (!isMulti || !current) return null;

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t('pro.switchSalle')}
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: dir,
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: open ? colors.primaryInk : colors.border,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Ionicons name="business-outline" size={15} color={colors.primaryInk} />
        <Text
          style={[typography.secondary, { color: colors.dark, flex: 1, textAlign: align }]}
          numberOfLines={1}
        >
          {current.name}
        </Text>
        <Text style={[typography.caption, { color: colors.warmGray }]}>
          {salles.length}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.warmGray} />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {salles.map((salle) => {
            const actif = salle.id === current.id;
            return (
              <Pressable
                key={salle.id}
                onPress={() => {
                  select(salle.id);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                style={{
                  flexDirection: dir,
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 11,
                  backgroundColor: actif ? colors.primaryLight : 'transparent',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.secondary,
                      { color: actif ? colors.primaryInk : colors.dark, textAlign: align },
                    ]}
                    numberOfLines={1}
                  >
                    {salle.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
                    {salle.city}
                  </Text>
                </View>
                {actif ? <Ionicons name="checkmark" size={16} color={colors.primaryInk} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
