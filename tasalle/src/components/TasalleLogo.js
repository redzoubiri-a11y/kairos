import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import {
  MONOGRAMME_VIEWBOX,
  MONOGRAMME_CERCLE,
  MONOGRAMME_T,
  MONOGRAMME_S,
} from '../lib/monogramme';

/**
 * Marque Tasalle — monogramme TS dans un filet circulaire, sur fond libre.
 *
 * Les lettres sont des contours, pas du texte : une marque ne peut pas
 * dépendre des polices installées sur l'appareil. Leur tracé vit dans
 * lib/monogramme.js, que partagent aussi les documents PDF et le générateur
 * d'icônes — trois rendus, un seul dessin. Le tracé lui-même (issu de
 * Liberation Serif, hérité de la piste « Broadsheet » abandonnée) n'a pas été
 * redessiné pour Modernist — un empattement à la main, sans vrai outil
 * vectoriel, aurait fait moins bien qu'un tracé déjà soigné ; seules la
 * couleur (`colors.logoInk`, désormais le rouge de marque) et la police du
 * mot-symbole (Archivo, comme le reste de l'app, ci-dessous) suivent
 * Modernist — la marque et l'interface parlent maintenant d'une seule voix.
 */
const MOT_SYMBOLE_FONT_REGULAR = 'Archivo_400Regular';
const MOT_SYMBOLE_FONT_SEMIBOLD = 'Archivo_600SemiBold';

/** Monogramme seul — utilisable comme avatar, favicon ou puce d'en-tête. */
export function TasalleMark({ size = 40, color }) {
  const { colors } = useTheme();
  const or = color || colors.logoInk;

  // Repère de 100 × 100 : toutes les proportions sont relatives, la marque
  // reste donc nette à n'importe quelle taille.
  return (
    <Svg width={size} height={size} viewBox={MONOGRAMME_VIEWBOX}>
      {/* Filet circulaire. Le rayon tient compte de l'épaisseur du trait pour
          que le cercle ne soit pas rogné par le bord du viewBox. */}
      <Circle
        cx={MONOGRAMME_CERCLE.cx}
        cy={MONOGRAMME_CERCLE.cy}
        r={MONOGRAMME_CERCLE.r}
        stroke={or}
        strokeWidth={MONOGRAMME_CERCLE.largeur}
        fill="none"
      />
      <Path d={MONOGRAMME_T} fill={or} />
      <Path d={MONOGRAMME_S} fill={or} />
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
  const { t } = useI18n();

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
              fontWeight: '600',
              fontFamily: MOT_SYMBOLE_FONT_SEMIBOLD,
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
              fontFamily: MOT_SYMBOLE_FONT_REGULAR,
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <TasalleMark size={size} />
      <View>
        <Text
          style={{
            fontSize: typography.title.fontSize,
            lineHeight: typography.title.lineHeight,
            fontWeight: '600',
            fontFamily: MOT_SYMBOLE_FONT_SEMIBOLD,
            color: encre,
            letterSpacing: 1.4,
          }}
        >
          {t('common.appName').toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight,
            fontFamily: MOT_SYMBOLE_FONT_REGULAR,
            color: onDark ? 'rgba(255,255,255,0.75)' : colors.warmGray,
          }}
        >
          {t('common.tagline')}
        </Text>
      </View>
    </View>
  );
}
