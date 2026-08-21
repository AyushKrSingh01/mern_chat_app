import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { apiClient } from '../lib/api';

interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  createdAt: string;
}

export default function Chat({
  roomId,
  roomName,
  onBack,
}: {
  roomId: number;
  roomName: string;
  onBack: () => void;
}) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load message history when entering the room
  useEffect(() => {
    if (!token) return;
    apiClient(token)
      .get(`/rooms/${roomId}/messages`)
      .then((res) => {
        const history = res.data.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderUsername: m.sender?.username ?? 'Unknown',
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(history);
      })
      .catch((err) => console.error('Failed to load history', err));
  }, [roomId, token]);

  // Live message updates via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_room', roomId);

    const handleReceive = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [roomId]);

  // Typing indicator listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTyping = ({ userId, username }: { userId: number; username: string }) => {
      if (userId === user?.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: username }));
    };

    const handleStopTyping = ({ userId }: { userId: number }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopTyping);
    };
  }, [roomId, user?.id]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', roomId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', roomId);
    }, 1500); // stop after 1.5s of no keystrokes
  }

  function sendMessage() {
    const socket = getSocket();
    if (!socket || !input.trim()) return;
    socket.emit('send_message', { roomId, content: input });
    socket.emit('stop_typing', roomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxWidth: 500 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
        }}
      >
        <button onClick={onBack}>← Back</button>
        <h3>{roomName}</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {messages.map((m) => {
          const isMe = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              style={{
                textAlign: isMe ? 'right' : 'left',
                margin: '6px 0',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: isMe ? '#0084ff' : '#e4e6eb',
                  color: isMe ? 'white' : 'black',
                  borderRadius: 12,
                  padding: '6px 12px',
                  maxWidth: '75%',
                }}
              >
                {!isMe && <div style={{ fontSize: 11, opacity: 0.7 }}>{m.senderUsername}</div>}
                <div>{m.content}</div>
              </div>
              <div style={{ fontSize: 10, color: '#888' }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {Object.keys(typingUsers).length > 0 && (
        <div style={{ fontSize: 12, color: '#888', padding: '4px 8px' }}>
          {Object.values(typingUsers).join(', ')}{' '}
          {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #ccc' }}>
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}