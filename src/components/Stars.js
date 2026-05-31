import { Text } from 'react-native';
import { colors } from '../theme';

export default function Stars({ value, size = 12 }) {
  const full = Math.round(value || 0);
  return (
    <Text style={{ fontSize: size, color: colors.accent, letterSpacing: 1 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </Text>
  );
}
