import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../src/theme';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ La carte est disponible uniquement sur mobile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  text: { fontFamily: typography.body, fontSize: 18, textAlign: 'center', padding: 20, color: colors.text },
});
