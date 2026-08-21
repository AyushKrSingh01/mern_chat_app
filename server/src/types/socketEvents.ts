export interface ServerToClientEvents {
    connected: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
}

export interface InterServerEvents {}

export interface SocketData {
  userId: number;
  username: string;
}