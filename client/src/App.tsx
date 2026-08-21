import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RoomList from './components/RoomList';
import ChatTest from './components/ChatTest';

function App() {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  if (!user) {
    return <Login />;
  }

  if (!selectedRoomId) {
    return <RoomList onSelectRoom={setSelectedRoomId} />;
  }

  return (
    <div>
      <button onClick={() => setSelectedRoomId(null)}>← Back to rooms</button>
      <ChatTest roomId={selectedRoomId} />
    </div>
  );
}

export default App;