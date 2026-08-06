import { Platform, View, Text } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/**
 * Marque Tasalle — monogramme TS dans un filet circulaire, or sur fond libre.
 *
 * Le monogramme est tracé en SVG plutôt qu'en `<Text>` classique : la
 * superposition du T et du S demande un positionnement au sous-pixel que les
 * primitives de mise en page ne donnent pas.
 *
 * Les lettres restent latines dans les deux langues : la translittération
 * arabe de la marque n'est pas arrêtée.
 */

// react-native-svg ne prend qu'une famille par plateforme, pas de pile de
// repli comme en CSS. On nomme donc le serif de chacune.
const SERIF = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: "Georgia, 'Times New Roman', serif",
});

/** Monogramme seul — utilisable comme avatar, favicon ou puce d'en-tête. */
export function TasalleMark({ size = 40, color }) {
  const { colors } = useTheme();
  const or = color || colors.logoInk;

  // Repère de 100 × 100 : toutes les proportions sont relatives, la marque
  // reste donc nette à n'importe quelle taille.
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Filet circulaire. Le rayon tient compte de l'épaisseur du trait pour
          que le cercle ne soit pas rogné par le bord du viewBox. */}
      <Circle cx="50" cy="50" r="47.2" stroke={or} strokeWidth="1.6" fill="none" />

      {/* T et S se chevauchent : le S descend sous la ligne du T et mord sur
          son pied, comme dans le document de marque. Les deux glyphes sont
          posés séparément — un simple interlettrage négatif les laisserait
          côte à côte. Ces valeurs sont celles du générateur d'icônes, pour que
          la marque à l'écran et celle des stores soient la même. */}
      <SvgText x="43" y="64" fill={or} fontFamily={SERIF} fontSize="57" textAnchor="middle">
        T
      </SvgText>
      <SvgText x="60" y="74" fill={or} fontFamily={SERIF} fontSize="48" textAnchor="middle">
        S
      </SvgText>
    </Svg>
  );
}

/**
 * Verrouillage complet : monogramme, mot-symbole et mention de pays.
 *
 * `showText` réduit la marque au seul monogramme, pour les en-têtes où le nom
 * est déjà porté par le titre de l'écran.
 * `stacked` empile les éléments comme sur le document de marque ; à défaut ils
 * s'alignent sur une ligne, ce qui convient aux barres d'en-tête.
 */
export default function TasalleLogo({
  size = 36,
  showText = true,
  stacked = false,
  tone = 'default',
}) {
  const { colors, typography, spacing } = useTheme();
  const { t, dir } = useI18n();

  const onDark = tone === 'onDark';
  const encre = onDark ? '#FFFFFF' : colors.logoWordmark;

  if (!showText) return <TasalleMark size={size} />;

  if (stacked) {
    return (
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <TasalleMark size={size} />
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Text
            style={{
              fontSize: size * 0.34,
              fontWeight: '400',
              color: encre,
              // L'interlettrage large est la signature du mot-symbole : sans
              // lui, « TASALLE » n'est plus la marque, juste un mot.
              letterSpacing: size * 0.11,
              // L'interlettrage ajoute un blanc après la dernière lettre ;
              // ce décalage recentre optiquement le mot.
              marginLeft: size * 0.11,
            }}
          >
            {t('common.appName').toUpperCase()}
          </Text>
          <View
            style={{ width: size * 1.1, height: 1, backgroundColor: colors.logoInk, opacity: 0.7 }}
          />
          <Text
            style={{
              fontSize: size * 0.19,
              color: colors.logoInk,
              letterSpacing: size * 0.09,
              marginLeft: size * 0.09,
            }}
          >
            {/* Capitales comme sur le document de marque. Sans effet en
                arabe, qui n'a pas de casse. */}
            {t('common.country').toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm }}>
      <TasalleMark size={size} />
      <View>
        <Text style={[typography.title, { color: encre, letterSpacing: 1.4 }]}>
          {t('common.appName').toUpperCase()}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: onDark ? 'rgba(255,255,255,0.75)' : colors.warmGray },
          ]}
        >
          {t('common.tagline')}
        </Text>
      </View>
    </View>
  );
}
