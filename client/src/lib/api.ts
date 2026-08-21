import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export function apiClient(token: string) {
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}