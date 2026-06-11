import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/Api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token ao carregar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verificarToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verificarToken = async (token) => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (nome, telefone, senha) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { 
        nome, 
        telefone, 
        senha 
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao fazer login. Verifique nome, telefone e senha.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (dados) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', dados);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao registrar. Tente novamente.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCliente: user?.role === 'cliente'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}