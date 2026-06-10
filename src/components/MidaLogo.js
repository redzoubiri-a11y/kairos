import { Image } from 'react-native';

export default function MidaLogo({ style, size = 120 }) {
  return (
    <Image
      source={require('../../assets/images/logo-home.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
