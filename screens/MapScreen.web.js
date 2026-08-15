import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../src/theme';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ La carte est disponible uniquement sur mobile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontFamily: typography.body, fontSize: 18, textAlign: 'center', padding: 20 },
});
