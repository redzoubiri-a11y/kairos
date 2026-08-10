import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import ChatBubble from '../components/ChatBubble';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { joinMission, leaveMission } from '../api/socket';
import { colors, radii, spacing, typography } from '../theme';

export default function ChatScreen({ navigation, route }) {
  const { missionId, title, subtitle } = route.params;
  const listRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  const messages = useChatStore((s) => s.threads[missionId] ?? []);
  const loading = useChatStore((s) => s.loading);
  const loadingOlder = useChatStore((s) => s.loadingOlder);
  const hasOlder = useChatStore((s) => s.hasMore[missionId] ?? false);
  const sending = useChatStore((s) => s.sending);
  const error = useChatStore((s) => s.error);
  const typingIn = useChatStore((s) => s.typingIn);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const loadOlder = useChatStore((s) => s.loadOlder);
  const send = useChatStore((s) => s.send);
  const notifyTyping = useChatStore((s) => s.notifyTyping);

  const [draft, setDraft] = useState('');

  useEffect(() => {
    loadHistory(missionId);
    joinMission(missionId);
    return () => leaveMission(missionId);
  }, [missionId, loadHistory]);

  // On suit le dernier message et non le nombre : charger les messages
  // precedents allonge aussi la liste, et ramener l'utilisateur en bas
  // annulerait justement ce qu'il vient de demander.
  const lastMessageId = messages.length ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (!lastMessageId) return undefined;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [lastMessageId]);

  const onSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setDraft('');
    try {
      await send(missionId, content);
    } catch {
      setDraft(content);
    }
  }, [draft, sending, send, missionId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title ?? 'Conversation'} subtitle={subtitle} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {loading && messages.length === 0 ? (
          <Loader label="Chargement de la conversation..." />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} isMine={item.senderId === user?.id} />}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              hasOlder ? (
                <Pressable
                  onPress={() => loadOlder(missionId)}
                  disabled={loadingOlder}
                  style={styles.loadOlder}
                >
                  {loadingOlder ? (
                    <ActivityIndicator color={colors.primaryDark} />
                  ) : (
                    <Text style={styles.loadOlderLabel}>Charger les messages precedents</Text>
                  )}
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="chatbubbles-outline"
                title="Aucun message"
                message="Ecrivez le premier message pour organiser le chargement."
              />
            }
          />
        )}

        {typingIn === missionId ? <Text style={styles.typing}>En train d'ecrire...</Text> : null}

        <View style={styles.composer}>
          {error ? <ErrorBanner message={error} /> : null}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                notifyTyping(missionId);
              }}
              placeholder="Votre message..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={onSend}
              disabled={!draft.trim() || sending}
              accessibilityLabel="Envoyer"
              style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
            >
              <Ionicons name="send" size={19} color="#1A1206" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  flex: { flex: 1 },
  list: { paddingVertical: spacing.lg, flexGrow: 1 },
  loadOlder: { alignItems: 'center', paddingBottom: spacing.md },
  loadOlderLabel: { ...typography.small, fontWeight: '700', color: colors.primaryDark },
  typing: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.lg, paddingBottom: 4 },
  composer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.cardMuted,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: 110,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendDisabled: { opacity: 0.4 },
});
