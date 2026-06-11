import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    role: 'cliente'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não correspondem');
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.nome.trim().length < 3) {
      setError('Nome deve ter no mínimo 3 caracteres');
      return;
    }

    if (formData.telefone.trim().length < 10) {
      setError('Telefone inválido');
      return;
    }

    setLoading(true);

    const result = await register({
      nome: formData.nome,
      telefone: formData.telefone,
      senha: formData.senha,
      role: formData.role
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Botão Voltar */}
      <button 
        onClick={() => navigate(-1)} 
        className="btn-back"
        title="Voltar"
      >
        <ArrowLeft size={20} />
        <span>Voltar</span>
      </button>

      <div className="auth-card">
        <h1>Cadastro</h1>
        <p className="subtitle">Crie sua conta para agendar</p>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                id="nome"
                name="nome"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <div className="input-wrapper">
              <Phone size={18} />
              <input
                type="tel"
                id="telefone"
                name="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Mínimo 6 caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                placeholder="Confirme sua senha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="footer-text">
          Já tem conta? <Link to="/login">Faça login aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;