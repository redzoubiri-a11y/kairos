import { Text } from 'react-native';
import { colors } from '../theme';

export default function Stars({ value, size = 12 }) {
  const full = Math.max(0, Math.min(5, Math.round(value || 0)));
  return (
    <Text style={{ fontSize: size, color: colors.star, letterSpacing: 1 }}>
      {'★'.repeat(full)}
    </Text>
  );
}
