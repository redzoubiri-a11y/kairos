import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProTableQr from '../src/hooks/useProTableQr';

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
            <View style={s.ctrlRow}>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={tableCount}
                onChangeText={setTableCount}
              />
              <TouchableOpacity style={s.printBtn} onPress={printAll} disabled={printing || tableQrList.length === 0}>
                <Text style={s.printBtnTxt}>{printing ? 'Préparation…' : '🖨️ Imprimer'}</Text>
              </TouchableOpacity>
            </View>
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

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:    { width: 36, height: 36, borderRadius: radius.control, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: 15 },
  title:      { fontFamily: typography.display, fontSize: typography.size.heading2, color: colors.text },

  controls: { padding: spacing.xl, gap: spacing.md },
  ctrlRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  input:    { width: 64, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.control - 1, paddingVertical: spacing.md, color: colors.text, fontFamily: typography.bodyBold, fontSize: typography.size.body, textAlign: 'center' },
  printBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md + 1, paddingVertical: spacing.md + 2, alignItems: 'center' },
  printBtnTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.body - 0.5 },
  hint:     { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.md },
  card: { width: 140, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, padding: spacing.md },
  qrImg: { width: 110, height: 110 },
  cardTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.text, marginTop: spacing.sm },
});
