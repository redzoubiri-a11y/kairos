import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const STEPS = ['Date', 'Heure', 'Couverts', 'Confirmation'];

export default function FormProgressBar({ current }) {
  return (
    <View style={s.row}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        const last   = i === STEPS.length - 1;
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: last ? 0 : 1 }}>
            <View style={s.stepWrap}>
              <View style={[s.circle, done && s.circleDone, active && s.circleActive]}>
                {done
                  ? <Text style={s.checkTxt}>✓</Text>
                  : <Text style={[s.numTxt, active && s.numTxtActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[s.label, active && s.labelActive, done && s.labelDone]}>{label}</Text>
            </View>
            {!last && <View style={[s.line, done && s.lineDone]} />}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  stepWrap:     { alignItems: 'center', gap: spacing.xs },
  circle:       { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  circleDone:   { backgroundColor: 'rgba(76,175,130,0.2)', borderColor: colors.green },
  circleActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  checkTxt:     { color: colors.green, fontFamily: typography.bodySemibold, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  numTxt:       { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.caption },
  numTxtActive: { color: colors.primary },
  label:        { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.xs, letterSpacing: 0.3 },
  labelActive:  { color: colors.primary },
  labelDone:    { color: colors.green },
  line:         { flex: 1, height: 1, backgroundColor: colors.cardBorder, marginBottom: 14, marginHorizontal: spacing.xs },
  lineDone:     { backgroundColor: colors.green },
});
