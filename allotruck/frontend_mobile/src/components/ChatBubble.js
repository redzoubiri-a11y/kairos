import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { formatTime } from '../utils/format';

export default function ChatBubble({ message, isMine }) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!isMine ? <Text style={styles.author}>{message.sender?.fullName}</Text> : null}
        <Text style={[styles.text, isMine && styles.textMine]}>{message.content}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isMine && styles.timeMine]}>{formatTime(message.createdAt)}</Text>
          {isMine ? (
            <Ionicons
              name={message.readAt ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.readAt ? colors.info : 'rgba(255,255,255,0.65)'}
              style={styles.check}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  bubbleMine: { backgroundColor: colors.primaryDark, borderBottomRightRadius: radii.sm },
  bubbleTheirs: { backgroundColor: colors.card, borderBottomLeftRadius: radii.sm, borderWidth: 1, borderColor: colors.border },
  author: { ...typography.caption, color: colors.primaryDark, marginBottom: 2 },
  text: { ...typography.body, color: colors.text, lineHeight: 20 },
  textMine: { color: '#FFFFFF' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  time: { ...typography.caption, fontWeight: '400', color: colors.textMuted },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  check: { marginLeft: 3 },
});
