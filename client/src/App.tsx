import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RoomList from './components/RoomList';
import Chat from './components/Chat';

interface SelectedRoom {
  id: number;
  name: string;
}

function App() {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);

  if (!user) return <Login />;

  if (!selectedRoom) {
    return <RoomList onSelectRoom={(id, name) => setSelectedRoom({ id, name })} />;
  }

  return (
    <Chat
      roomId={selectedRoom.id}
      roomName={selectedRoom.name}
      onBack={() => setSelectedRoom(null)}
    />
  );
}

export default App;