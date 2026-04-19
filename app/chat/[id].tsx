// app/chat/[id].tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { sendMessage, subscribeToMessages, markConversationRead } from '@/services/messagingService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { Message } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load conversation metadata to get other participant
    getDoc(doc(db, 'conversations', id)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const otherId = data.participants?.find((p: string) => p !== user?.uid) ?? '';
      setRecipientId(otherId);
      const otherName = data.participantNames?.[otherId] ?? 'Chat';
      navigation.setOptions({ title: otherName });
    });

    const unsub = subscribeToMessages(id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    if (user) markConversationRead(id, user.uid);
    return unsub;
  }, [id]);

  async function handleSend() {
    if (!text.trim() || !user) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try {
      await sendMessage(id, user.uid, user.displayName, body, recipientId);
    } finally {
      setSending(false);
    }
  }

  function dateLabel(d: Date) {
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEE, d MMM');
  }

  // Group messages by date
  type DateGroup = { date: string; messages: Message[] };
  const grouped: DateGroup[] = messages.reduce<DateGroup[]>((acc, msg) => {
    const label = dateLabel(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last?.date === label) {
      last.messages.push(msg);
    } else {
      acc.push({ date: label, messages: [msg] });
    }
    return acc;
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatRef}
        data={grouped}
        keyExtractor={(g) => g.date}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Start the conversation!</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <View style={styles.dateSep}>
              <View style={styles.dateLine} />
              <Text style={styles.dateLabel}>{group.date}</Text>
              <View style={styles.dateLine} />
            </View>
            {group.messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <View
                  key={msg.id}
                  style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}
                  accessibilityLabel={`${isMe ? 'You' : msg.senderName}: ${msg.body}`}
                >
                  {!isMe && (
                    <View style={styles.msgAvatar}>
                      <Text style={styles.msgAvatarText}>{msg.senderName.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.body}</Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {format(msg.createdAt, 'h:mm a')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      />

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={Colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={Platform.OS !== 'ios' ? handleSend : undefined}
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={20} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg, paddingBottom: 12 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: FontSizes.md, color: Colors.textTertiary },
  dateSep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.lg },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dateLabel: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontWeight: '500' },
  msgRow: { flexDirection: 'row', marginBottom: 6, gap: 8, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  bubbleText: { fontSize: FontSizes.md, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: Colors.textTertiary, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    fontSize: FontSizes.md, color: Colors.textPrimary, maxHeight: 110,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
