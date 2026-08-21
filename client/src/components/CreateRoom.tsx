import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';

export default function CreateRoom({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [memberIdsInput, setMemberIdsInput] = useState(''); // comma-separated for now
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!token || !name.trim()) return;

    const memberIds = memberIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map(Number);

    try {
      await apiClient(token).post('/rooms', {
        name,
        isGroup: memberIds.length > 1,
        memberIds,
      });
      setName('');
      setMemberIdsInput('');
      setError('');
      onCreated(); 
    } catch (err) {
      console.error(err);
      setError('Failed to create room');
    }
  }

  return (
    <div>
      <h4>Create a Room</h4>
      <input
        placeholder="Room name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Member user IDs, comma separated (e.g. 2,3)"
        value={memberIdsInput}
        onChange={(e) => setMemberIdsInput(e.target.value)}
      />
      <button onClick={handleCreate}>Create</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}