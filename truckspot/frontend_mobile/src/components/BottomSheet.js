import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_VELOCITY = 0.7;

// Animated sheet built on the RN Animated API + PanResponder: no native gesture
// dependency, so it works in Expo Go without a custom dev client.
export default function BottomSheet({ visible, onClose, children, height = SCREEN_HEIGHT * 0.55 }) {
  const translateY = useRef(new Animated.Value(height)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (toValue, backdropValue, onDone) => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          bounciness: 2,
          speed: 14,
        }),
        Animated.timing(backdrop, {
          toValue: backdropValue,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [translateY, backdrop]
  );

  useEffect(() => {
    if (visible) {
      translateY.setValue(height);
      animateTo(0, 1);
    } else {
      animateTo(height, 0);
    }
  }, [visible, height, animateTo, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldClose = gesture.dy > height * 0.3 || gesture.vy > CLOSE_VELOCITY;
        if (shouldClose) {
          animateTo(height, 0, onClose);
        } else {
          animateTo(0, 1);
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height, transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleZone}>
          <View style={styles.handle} />
        </View>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    ...shadows.sheet,
  },
  handleZone: { paddingTop: spacing.md, paddingBottom: spacing.sm, alignItems: 'center' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  content: { flex: 1 },
});
