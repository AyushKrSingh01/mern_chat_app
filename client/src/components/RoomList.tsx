import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';
import CreateRoom from './CreateRoom';

interface Room {
  id: number;
  name: string;
  isGroup: boolean;
}

export default function RoomList({ onSelectRoom }: { onSelectRoom: (roomId: number, roomName: string) => void }) {

  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);

  function fetchRooms() {
    if (!token) return;
    apiClient(token)
      .get('/rooms')
      .then((res) => setRooms(res.data))
      .catch((err) => console.error('Failed to fetch rooms', err));
  }

  useEffect(fetchRooms, [token]);

  return (
    <div>
      <p>Logged in as: {user?.username} (id: {user?.id})</p>

      <h3>Your Rooms</h3>
      {rooms.length === 0 && <p>No rooms yet.</p>}
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
           <button onClick={() => onSelectRoom(room.id, room.name)}>{room.name}</button>
          </li>
        ))}
      </ul>

      <CreateRoom onCreated={fetchRooms} />
    </div>
  );
}