import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProTableQr from '../src/hooks/useProTableQr';

const PRO_ACCENT = '#c8975a';

export default function ProTableQrScreen({ navigation }) {
  const { loading, tableCount, setTableCount, tableQrList, printing, printAll } = useProTableQr();

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>QR codes des tables</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
      ) : (
        <>
          <View style={s.controls}>
            <Text style={s.label}>Nombre de tables</Text>
            <TextInput
              style={s.input}
              keyboardType="number-pad"
              value={tableCount}
              onChangeText={setTableCount}
            />
            <TouchableOpacity style={s.printBtn} onPress={printAll} disabled={printing || tableQrList.length === 0}>
              <Text style={s.printBtnTxt}>{printing ? 'Préparation…' : '🖨️ Imprimer / Exporter PDF'}</Text>
            </TouchableOpacity>
            <Text style={s.hint}>
              Chaque QR encode un lien direct vers la commande de cette table. Un client qui le
              scanne avec l'appareil photo de son téléphone ouvre MIDA en mode "à table" prérempli.
            </Text>
          </View>

          <ScrollView contentContainerStyle={s.grid}>
            {tableQrList.map(t => (
              <View key={t.table} style={s.card}>
                <Image source={{ uri: t.imageUrl }} style={s.qrImg} />
                <Text style={s.cardTxt}>Table n°{t.table}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg - 2, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: 18 },
  title:      { fontFamily: typography.display, fontSize: typography.size.heading2, color: colors.text },

  controls: { padding: spacing.xl, gap: spacing.sm },
  label:    { fontFamily: typography.bodyMedium, fontSize: typography.size.caption, color: colors.textMuted },
  input:    { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: typography.size.body, width: 100 },
  printBtn: { backgroundColor: PRO_ACCENT, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  printBtnTxt: { color: '#FFFFFF', fontFamily: typography.bodyBold, fontSize: typography.size.body },
  hint:     { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted, marginTop: spacing.xs },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.md },
  card: { width: 140, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, padding: spacing.md },
  qrImg: { width: 110, height: 110 },
  cardTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.text, marginTop: spacing.sm },
});
