import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatDACompact } from '../lib/format';

// Toutes les séries de ce tableau de bord sont mono-teinte : une seule mesure
// par graphique, l'identité venant du titre et des libellés d'axe. Pas de
// légende (inutile pour une série unique), pas de second axe.

/**
 * Revenus des 6 derniers mois — barres verticales (§5.2).
 * Marques fines, extrémités arrondies 4px ancrées à la ligne de base,
 * espacement de 2px entre barres, ligne de base discrète.
 * Seule la barre la plus haute et la dernière portent une étiquette.
 */
export function RevenueBars({ data, height = 140 }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { list } = useI18n();
  const [active, setActive] = useState(null);

  const monthsShort = list('monthsShort');
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIndex = data.findIndex((d) => d.value === Math.max(...data.map((x) => x.value)));

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
        {data.map((d, i) => {
          const ratio = d.value / max;
          const isLabelled = i === maxIndex || i === data.length - 1 || active === i;

          return (
            <Pressable
              key={d.key}
              onPress={() => setActive(active === i ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={`${monthsShort[d.month]} : ${formatDACompact(d.value)}`}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}
            >
              {isLabelled ? (
                <Text style={[typography.caption, { color: colors.warmGray, fontSize: 10 }]} numberOfLines={1}>
                  {formatDACompact(d.value)}
                </Text>
              ) : null}

              <View
                style={{
                  width: '100%',
                  height: Math.max(3, ratio * (height - 26)),
                  backgroundColor: colors.chartInk,
                  opacity: active == null || active === i ? 1 : 0.45,
                  // Extrémité haute arrondie, base carrée : la barre reste ancrée
                  borderTopLeftRadius: radii.xs,
                  borderTopRightRadius: radii.xs,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Ligne de base discrète */}
      <View style={{ height: 1, backgroundColor: colors.chartGrid }} />

      <View style={{ flexDirection: 'row', gap: 2 }}>
        {data.map((d) => (
          <Text
            key={d.key}
            style={[typography.caption, { flex: 1, textAlign: 'center', color: colors.warmGray, fontSize: 10 }]}
            numberOfLines={1}
          >
            {monthsShort[d.month]}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Courbe de revenus (§5.6) — SVG, trait 2px, marqueurs 9px,
 * seul le dernier point est étiqueté.
 */
export function RevenueLine({ data, height = 150 }) {
  const { colors, typography, spacing } = useTheme();
  const { list } = useI18n();
  const [width, setWidth] = useState(0);

  const monthsShort = list('monthsShort');
  const max = Math.max(1, ...data.map((d) => d.value));
  const padX = 10;
  const padY = 16;
  const innerW = Math.max(1, width - padX * 2);
  const innerH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padY + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const last = points[points.length - 1];

  return (
    <View style={{ gap: spacing.sm }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {/* Grille horizontale discrète : 3 repères seulement */}
            {[0, 0.5, 1].map((f) => (
              <SvgLine
                key={f}
                x1={padX}
                x2={width - padX}
                y1={padY + innerH * f}
                y2={padY + innerH * f}
                stroke={colors.chartGrid}
                strokeWidth={1}
              />
            ))}

            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={colors.chartInk}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {points.map((p) => (
              <Circle
                key={p.key}
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill={colors.surface}
                stroke={colors.chartInk}
                strokeWidth={2}
              />
            ))}
          </Svg>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row' }}>
        {data.map((d) => (
          <Text
            key={d.key}
            style={[typography.caption, { flex: 1, textAlign: 'center', color: colors.warmGray, fontSize: 10 }]}
            numberOfLines={1}
          >
            {monthsShort[d.month]}
          </Text>
        ))}
      </View>

      {last ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'center' }]}>
          {monthsShort[last.month]} · {formatDACompact(last.value)}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Répartition en lignes libellées (§5.6 — types d'événements, sources,
 * occupation). Chaque ligne porte son libellé et sa valeur : la couleur
 * ne code aucune identité, une seule teinte suffit.
 */
export function BreakdownBars({ rows, tone = 'primary', suffix = '%' }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { dir } = useI18n();
  const fill = tone === 'gold' ? colors.gold : tone === 'secondary' ? colors.secondary : colors.chartInk;

  if (!rows?.length) return null;

  return (
    <View style={{ gap: spacing.md }}>
      {rows.map((r) => (
        <View key={r.key} style={{ gap: 5 }}>
          <View style={{ flexDirection: dir, justifyContent: 'space-between', gap: spacing.sm }}>
            <Text style={[typography.secondary, { color: colors.dark, flexShrink: 1 }]} numberOfLines={1}>
              {r.label}
            </Text>
            <Text style={[typography.secondary, { color: colors.warmGray }]}>
              {r.value}
              {suffix}
            </Text>
          </View>

          <View
            style={{
              height: 8,
              borderRadius: radii.pill,
              backgroundColor: colors.chartGrid,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.max(0, Math.min(100, r.value))}%`,
                height: '100%',
                backgroundColor: fill,
                borderRadius: radii.pill,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
