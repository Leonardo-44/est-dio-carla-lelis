import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/Api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error('Erro ao verificar token:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (telefone, senha) => {
    try {
      setError(null);

      if (!telefone || !senha) {
        const message = 'Telefone e senha são obrigatórios';
        setError(message);
        return { success: false, error: message };
      }

      const response = await api.post('/auth/login', {
        telefone: telefone.replace(/\D/g, ''),
        senha
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao fazer login. Verifique telefone e senha.';
      setError(message);
      console.error('Erro no login:', err);
      return { success: false, error: message };
    }
  };

  const register = async (dados) => {
    try {
      setError(null);

      if (!dados.nome || !dados.telefone || !dados.senha) {
        const message = 'Nome, telefone e senha são obrigatórios';
        setError(message);
        return { success: false, error: message };
      }

      const response = await api.post('/auth/register', {
        nome: dados.nome.trim(),
        telefone: dados.telefone.replace(/\D/g, ''),
        senha: dados.senha,
        role: dados.role || 'cliente'
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao registrar. Tente novamente.';
      setError(message);
      console.error('Erro no registro:', err);
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
    isCliente: user?.role === 'cliente',
    isFuncionaria: user?.role === 'funcionaria',
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