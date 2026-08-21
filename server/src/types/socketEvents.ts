export interface MessagePayload {
  id: number;
  roomId: number;
  senderId: number;
  senderUsername: string;
  content: string;
  createdAt: string;
}

export interface ServerToClientEvents {
  connected: (data: { message: string }) => void;
  receive_message: (message: MessagePayload) => void;
  user_joined: (data: { userId: number; username: string; roomId: number }) => void;
  error_message: (data: { error: string }) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: number) => void;
  send_message: (data: { roomId: number; content: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: number;
  username: string;
}