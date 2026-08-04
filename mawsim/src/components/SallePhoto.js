import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

/** Palettes de repli — dégradés déterministes quand la salle n'a pas de photo (§4.1). */
const GRADIENTS = [
  ['#0B6E5F', '#0F8F7A'],
  ['#C8956C', '#E0B48F'],
  ['#D4A853', '#E8C989'],
  ['#084F44', '#0B6E5F'],
  ['#8B7E72', '#B5A99C'],
  ['#3B82F6', '#6BA3F8'],
];

function hashOf(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) {
    h = (h * 31 + String(str).charCodeAt(i)) % 997;
  }
  return h;
}

/**
 * Photo de salle avec repli en dégradé portant l'initiale.
 * `photos` est le tableau JSONB de la salle ; `index` sélectionne la vue.
 */
export default function SallePhoto({ salle, index = 0, height, style, radius, children }) {
  const { radii } = useTheme();
  const photos = salle?.photos || [];
  const uri = photos[index];
  const r = radius ?? 0;

  if (uri) {
    return (
      <View style={[{ height, borderRadius: r, overflow: 'hidden' }, style]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {children}
      </View>
    );
  }

  const pair = GRADIENTS[hashOf(salle?.id || salle?.name || 'mawsim') % GRADIENTS.length];
  const initial = (salle?.name || 'M').trim().charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={pair}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { height, borderRadius: r ?? radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: Math.max(28, (height || 140) * 0.32),
          color: 'rgba(255,255,255,0.35)',
          fontWeight: '500',
        }}
      >
        {initial}
      </Text>
      {children}
    </LinearGradient>
  );
}
