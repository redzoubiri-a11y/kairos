import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

const THUMB = 26;

// Self-contained slider: RN core has no <Slider>, and pulling in a native
// package would break Expo Go for a single control.
export default function VolumeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = 'Volume libre',
  unit = 'm³',
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  // Le PanResponder ci-dessous n'est construit qu'une fois (useRef) : ses
  // gestionnaires referment sur le setFromX du tout premier rendu, qui
  // fermait lui-meme sur min/max/step/onChange de ce meme premier rendu. Un
  // ecran qui fait varier `max` apres coup (DeclareRouteScreen : 100 par
  // defaut avant que l'utilisateur choisisse son camion, puis le volume reel
  // du camion) laissait le glissement suivre l'ancien plafond, desynchronise
  // de la piste affichee qui, elle, se redessine avec le max courant. Ces
  // refs, tenues a jour a chaque rendu, donnent a ce meme setFromX toujours
  // en vie un acces aux valeurs actuelles.
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const onChangeRef = useRef(onChange);
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  onChangeRef.current = onChange;

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const quantize = (v) => Math.round(clamp(v) / step) * step;
  const ratio = max === min ? 0 : (clamp(value) - min) / (max - min);

  const setFromX = (x) => {
    const usable = widthRef.current - THUMB;
    if (usable <= 0) return;
    const currentMin = minRef.current;
    const currentMax = maxRef.current;
    const currentStep = stepRef.current;
    const r = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    const clamped = Math.min(currentMax, Math.max(currentMin, currentMin + r * (currentMax - currentMin)));
    const next = Math.round(clamped / currentStep) * currentStep;
    if (next !== valueRef.current) onChangeRef.current(next);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value} {unit}
        </Text>
      </View>

      <View
        style={styles.track}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: Math.max(0, ratio * (width - THUMB) + THUMB / 2) }]} />
        <View style={[styles.thumb, { left: ratio * Math.max(0, width - THUMB) }]} />
      </View>

      <View style={styles.bounds}>
        <Text style={styles.boundText}>
          {min} {unit}
        </Text>
        <Text style={styles.boundText}>
          {max} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { ...typography.small, fontWeight: '600', color: colors.text },
  value: { ...typography.bodyStrong, color: colors.primaryDark, fontWeight: '800' },
  track: { height: THUMB + 12, justifyContent: 'center', marginTop: spacing.sm },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  trackFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  bounds: { flexDirection: 'row', justifyContent: 'space-between' },
  boundText: { ...typography.caption, color: colors.textMuted },
});
