import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';

interface UserResult {
  id: number;
  username: string;
}

export default function CreateRoom({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient(token)
        .get(`/users/search?q=${encodeURIComponent(query)}`)
        .then((res) => setResults(res.data))
        .catch((err) => console.error(err));
    }, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query, token]);

  function addUser(u: UserResult) {
    if (!selected.find((s) => s.id === u.id)) {
      setSelected([...selected, u]);
    }
    setQuery('');
    setResults([]);
  }

  function removeUser(id: number) {
    setSelected(selected.filter((s) => s.id !== id));
  }

  async function handleCreate() {
    if (!token || !name.trim() || selected.length === 0) return;
    try {
      await apiClient(token).post('/rooms', {
        name,
        isGroup: selected.length > 1,
        memberIds: selected.map((s) => s.id),
      });
      setName('');
      setSelected([]);
      setError('');
      onCreated();
    } catch (err) {
      console.error(err);
      setError('Failed to create room');
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
      <h4>Create a Room</h4>
      <input
        placeholder="Room name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div style={{ marginTop: 8 }}>
        {selected.map((u) => (
          <span key={u.id} style={{ marginRight: 6, background: '#eee', padding: '2px 6px', borderRadius: 4 }}>
            {u.username} <button onClick={() => removeUser(u.id)}>×</button>
          </span>
        ))}
      </div>

      <input
        placeholder="Search users by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginTop: 8, display: 'block' }}
      />
      {results.length > 0 && (
        <ul style={{ border: '1px solid #ddd', listStyle: 'none', padding: 4 }}>
          {results.map((u) => (
            <li key={u.id} onClick={() => addUser(u)} style={{ cursor: 'pointer', padding: 4 }}>
              {u.username}
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleCreate} style={{ marginTop: 8 }} disabled={!name.trim() || selected.length === 0}>
        Create
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}