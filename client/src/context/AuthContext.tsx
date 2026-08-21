import { createContext, useContext, useState,  useEffect } from 'react';
import type { ReactNode } from "react";
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  
  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
  }, []); 

  async function login(email: string, password: string) {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token, user } = res.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    connectSocket(token); 
  }

  async function register(username: string, email: string, password: string) {
    const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
    const { token, user } = res.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    connectSocket(token);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}