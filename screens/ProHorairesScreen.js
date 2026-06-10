import { useCallback, useEffect, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useSchedule, { DOW_FULL, DOW_ORDER } from '../src/hooks/useSchedule';
import BottomTabBar from '../src/components/BottomTabBar';

const PRO_ACCENT = '#c8975a';

// ── Time option generators ────────────────────────────────────────────────
function genTimes(fromH, fromM, toH, toM, step = 30) {
  const result = [];
  let cur = fromH * 60 + fromM;
  const end = (toH < fromH ? toH + 24 : toH) * 60 + toM;
  while (cur <= end) {
    const h = Math.floor(cur / 60) % 24;
    const m = cur % 60;
    result.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cur += step;
  }
  return result;
}

const TIME_OPTIONS = {
  lunch_start:  genTimes(10, 0, 13, 30),
  lunch_end:    genTimes(12, 30, 16, 30),
  dinner_start: genTimes(17, 0, 21, 0),
  dinner_end:   genTimes(20, 0, 0, 0),   // 20:00 → 00:00
};

const FIELD_LABELS = {
  lunch_start:  'Début déjeuner',
  lunch_end:    'Fin déjeuner',
  dinner_start: 'Début dîner',
  dinner_end:   'Fin dîner',
};

const DURATIONS = [30, 45, 60, 90, 120];

// ── TimePicker Modal ─────────────────────────────────────────────────────
function TimePickerModal({ visible, field, current, onSelect, onClose }) {
  const options = TIME_OPTIONS[field] || [];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.pickerBox} onStartShouldSetResponder={() => true}>
          <Text style={s.pickerTitle}>{FIELD_LABELS[field] || 'Choisir une heure'}</Text>
          <View style={s.pickerGrid}>
            {options.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.pickerChip, current === t && s.pickerChipOn]}
                onPress={() => { onSelect(t); onClose(); }}
              >
                <Text style={[s.pickerChipTxt, current === t && s.pickerChipTxtOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Day Card ─────────────────────────────────────────────────────────────
function DayCard({ day, onSetDay, onPickTime }) {
  const label = DOW_FULL[day.day_of_week];
  return (
    <View style={s.dayCard}>
      <View style={s.dayHeader}>
        <Text style={[s.dayLabel, !day.is_open && s.dayLabelOff]}>{label}</Text>
        <View style={s.dayRight}>
          {!day.is_open && <Text style={s.closedTxt}>Fermé</Text>}
          <Switch
            value={day.is_open}
            onValueChange={v => onSetDay(day.day_of_week, {
              is_open:      v,
              lunch_start:  null,
              lunch_end:    null,
              dinner_start: null,
              dinner_end:   null,
            })}
            trackColor={{ false: colors.cardBorder, true: `${PRO_ACCENT}66` }}
            thumbColor={day.is_open ? PRO_ACCENT : '#bbb'}
          />
        </View>
      </View>

      {day.is_open && (
        <View style={s.dayBody}>
          {/* Lunch */}
          <View style={s.serviceRow}>
            <Text style={s.serviceIcon}>☀️</Text>
            <Text style={s.serviceLbl}>Déjeuner</Text>
            <TouchableOpacity
              style={[s.timePill, !day.lunch_start && s.timePillEmpty]}
              onPress={() => onPickTime(day.day_of_week, 'lunch_start')}
            >
              <Text style={s.timePillTxt}>{day.lunch_start || '--:--'}</Text>
            </TouchableOpacity>
            <Text style={s.arrow}>→</Text>
            <TouchableOpacity
              style={[s.timePill, !day.lunch_end && s.timePillEmpty]}
              onPress={() => onPickTime(day.day_of_week, 'lunch_end')}
            >
              <Text style={s.timePillTxt}>{day.lunch_end || '--:--'}</Text>
            </TouchableOpacity>
          </View>

          {/* Dinner */}
          <View style={s.serviceRow}>
            <Text style={s.serviceIcon}>🌙</Text>
            <Text style={s.serviceLbl}>Dîner</Text>
            <TouchableOpacity
              style={[s.timePill, !day.dinner_start && s.timePillEmpty]}
              onPress={() => onPickTime(day.day_of_week, 'dinner_start')}
            >
              <Text style={s.timePillTxt}>{day.dinner_start || '--:--'}</Text>
            </TouchableOpacity>
            <Text style={s.arrow}>→</Text>
            <TouchableOpacity
              style={[s.timePill, !day.dinner_end && s.timePillEmpty]}
              onPress={() => onPickTime(day.day_of_week, 'dinner_end')}
            >
              <Text style={s.timePillTxt}>{day.dinner_end || '--:--'}</Text>
            </TouchableOpacity>
          </View>

          {/* Capacity */}
          <View style={s.capRow}>
            <Text style={s.capLbl}>Couverts/créneau</Text>
            <TextInput
              style={s.capInput}
              value={String(day.slot_capacity || '')}
              onChangeText={v => onSetDay(day.day_of_week, { slot_capacity: parseInt(v) || 0 })}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      {[...Array(4)].map((_, i) => (
        <MLoader key={i} width="100%" height={64} borderRadius={radius.md} />
      ))}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function ProHorairesScreen({ navigation, route }) {
  const onSetupComplete = route?.params?.onSetupComplete;
  const completedRef = useRef(false);

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const { schedule, slotDuration, setSlotDuration, loading, saving, saved, error, setDay, save } = useSchedule();

  useEffect(() => {
    if (saved && onSetupComplete && !completedRef.current) {
      completedRef.current = true;
      onSetupComplete();
      navigation.goBack();
    }
  }, [saved, onSetupComplete, navigation]);

  const [picker, setPicker] = useState(null); // { dow, field }

  const openPicker = useCallback((dow, field) => setPicker({ dow, field }), []);
  const closePicker = useCallback(() => setPicker(null), []);

  const handlePickTime = useCallback((time) => {
    if (!picker) return;
    setDay(picker.dow, { [picker.field]: time });
  }, [picker, setDay]);

  const scheduleByDow = Object.fromEntries(schedule.map(d => [d.day_of_week, d]));
  const pickerDay = picker ? scheduleByDow[picker.dow] : null;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Horaires & créneaux</Text>
        </View>
        <TouchableOpacity
          style={[s.saveBtn, (saving || saved) && s.saveBtnActive]}
          onPress={save}
          disabled={saving}
        >
          <Text style={s.saveBtnTxt}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? <Skeleton /> : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true} keyboardDismissMode="interactive">

          {/* Durée des créneaux */}
          <Text style={s.section}>Durée d'un créneau</Text>
          <View style={s.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.durationChip, slotDuration === d && s.durationChipOn]}
                onPress={() => setSlotDuration(d)}
              >
                <Text style={[s.durationTxt, slotDuration === d && s.durationTxtOn]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Planning jour par jour */}
          <Text style={[s.section, { marginTop: spacing.xxl }]}>Planning</Text>
          {DOW_ORDER.map(dow => (
            <DayCard
              key={dow}
              day={scheduleByDow[dow] || { day_of_week: dow, is_open: false, lunch_start: null, lunch_end: null, dinner_start: null, dinner_end: null, slot_capacity: null }}
              onSetDay={setDay}
              onPickTime={openPicker}
            />
          ))}

          {!!error && <Text style={s.error}>{error}</Text>}
          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      )}

      <TimePickerModal
        visible={!!picker}
        field={picker?.field || 'lunch_start'}
        current={pickerDay ? pickerDay[picker?.field] : null}
        onSelect={handlePickTime}
        onClose={closePicker}
      />
      <BottomTabBar navigation={navigation} isPro={true} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  title:          { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  saveBtn:        { backgroundColor: PRO_ACCENT, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnActive:  { opacity: 0.75 },
  saveBtnTxt:     { color: '#fff', fontSize: typography.size.caption, fontWeight: typography.weight.extrabold },

  content:        { padding: spacing.xl },
  section:        { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.md },

  durationRow:    { flexDirection: 'row', gap: spacing.sm },
  durationChip:   { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  durationChipOn: { backgroundColor: PRO_ACCENT, borderColor: PRO_ACCENT },
  durationTxt:    { color: colors.textMuted, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  durationTxtOn:  { color: '#fff', fontWeight: typography.weight.semibold },

  dayCard:        { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md, overflow: 'hidden' },
  dayHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  dayLabel:       { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold },
  dayLabelOff:    { color: colors.textMuted },
  dayRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  closedTxt:      { color: colors.textMuted, fontSize: typography.size.caption },

  dayBody:        { borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },

  serviceRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  serviceIcon:    { fontSize: 14 },
  serviceLbl:     { color: colors.textMuted, fontSize: typography.size.caption, width: 56 },
  timePill:       { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  timePillEmpty:  { borderColor: colors.redSoft },
  timePillTxt:    { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium, fontVariant: ['tabular-nums'] },
  arrow:          { color: colors.textMuted, fontSize: typography.size.caption },

  capRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder, marginTop: spacing.md },
  capLbl:         { color: colors.textMuted, fontSize: typography.size.caption },
  capInput:       { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.semibold, minWidth: 60, textAlign: 'center' },

  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  pickerBox:      { backgroundColor: colors.bg, borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxHeight: '70%' },
  pickerTitle:    { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold, marginBottom: spacing.lg, textAlign: 'center' },
  pickerGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  pickerChip:     { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  pickerChipOn:   { backgroundColor: PRO_ACCENT, borderColor: PRO_ACCENT },
  pickerChipTxt:  { color: colors.textMuted, fontSize: typography.size.body, fontVariant: ['tabular-nums'] },
  pickerChipTxtOn:{ color: '#fff', fontWeight: typography.weight.semibold },

  error:          { color: colors.red, fontSize: typography.size.caption, marginTop: spacing.lg, textAlign: 'center' },
});
