import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAppStore } from '../store/useAppStore';

export function useLogin() {
  const setUser = useAppStore(s => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => api.post('/login', data).then(r => r.data),
    onSuccess: ({ user, token }) => {
      localStorage.setItem('auth_token', token);
      setUser(user);
      navigate(user.is_admin ? '/admin' : '/dashboard');
    },
  });
}

export function useRegister() {
  const setUser = useAppStore(s => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => api.post('/register', data).then(r => r.data),
    onSuccess: ({ user, token }) => {
      localStorage.setItem('auth_token', token);
      setUser(user);
      navigate(user.is_admin ? '/admin' : '/dashboard');
    },
  });
}

export function useLogout() {
  const logout = useAppStore(s => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => api.post('/logout'),
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });
}
