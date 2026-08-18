import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../components/Screen';
import { Loader, EmptyState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';
import * as api from '../../data';

export default function ChatScreen({ route, navigation }) {
  const { reservationId, title } = route.params;
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();
  const { user } = useAuth();

  // Les deux rôles partagent cet écran : le propriétaire répond, la famille
  // demande. Les phrases suivent donc le rôle, et la langue courante.
  const quickReplies = list(user?.role === ROLES.PRO ? 'messages.quickPro' : 'messages.quickClient');

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setMessages(await api.listMessages(reservationId));
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (text = draft) => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    try {
      await api.sendMessage(reservationId, content);
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header title={title || t('messages.title')} onBack={navigation.goBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading ? (
            <Loader />
          ) : messages.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title={t('messages.empty')} />
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    backgroundColor: mine ? colors.primary : colors.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                    borderRadius: radii.xl,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text style={[typography.secondary, { color: mine ? '#FFFFFF' : colors.dark }]}>
                    {m.content}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Réponses rapides (§ checklist Phase 3) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
            flexDirection: 'row',
          }}
          style={{ flexGrow: 0 }}
        >
          {quickReplies.map((q) => (
            <Pressable
              key={q}
              onPress={() => send(q)}
              disabled={sending}
              accessibilityRole="button"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radii.sm,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={[typography.caption, { color: colors.warmGray }]} numberOfLines={1}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('messages.placeholder')}
            placeholderTextColor={`${colors.warmGray}99`}
            onSubmitEditing={() => send()}
            style={[
              typography.secondary,
              {
                flex: 1,
                color: colors.dark,
                backgroundColor: colors.cream,
                borderRadius: radii.sm,
                paddingHorizontal: 14,
                paddingVertical: 10,
                outlineStyle: 'none',
              },
            ]}
          />
          <Pressable
            onPress={() => send()}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('common.send')}
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.pill,
              backgroundColor: draft.trim() ? colors.primary : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
