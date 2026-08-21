import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

interface Message {
  id: number;
  senderUsername: string;
  content: string;
}

export default function ChatTest({ roomId }: { roomId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_room', roomId);

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [roomId]);

  function sendMessage() {
    const socket = getSocket();
    if (!socket || !input.trim()) return;
    socket.emit('send_message', { roomId, content: input });
    setInput('');
  }

  return (
    <div>
      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <b>{m.senderUsername}:</b> {m.content}
          </li>
        ))}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}