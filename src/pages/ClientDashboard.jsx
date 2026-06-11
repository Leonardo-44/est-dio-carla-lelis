import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/Api';
import '../styles/Dashboard.css';

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [servicos, setServicos] = useState([]);
  const [meuAgendamentos, setMeuAgendamentos] = useState([]);
  const [formData, setFormData] = useState({
    servico_id: '',
    data_hora: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarServicos();
    carregarMeuAgendamentos();
  }, []);

  const carregarServicos = async () => {
    try {
      const response = await api.get('/servicos');
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setErro('Erro ao carregar serviços');
    }
  };

  const carregarMeuAgendamentos = async () => {
    try {
      const response = await api.get('/agendamentos/meus');
      setMeuAgendamentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar meus agendamentos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!formData.servico_id || !formData.data_hora) {
      setErro('Selecione um serviço e uma data');
      return;
    }

    setLoading(true);

    try {
      await api.post('/agendamentos', formData);
      setSucesso('Agendamento realizado com sucesso!');
      setFormData({
        servico_id: '',
        data_hora: '',
        observacoes: ''
      });
      carregarMeuAgendamentos();
      
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao agendar';
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      await api.put(`/agendamentos/${id}`, { status: 'cancelado' });
      carregarMeuAgendamentos();
      setSucesso('Agendamento cancelado com sucesso');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao cancelar agendamento');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obterNomeServico = (servicoId) => {
    const servico = servicos.find(s => s.id === servicoId);
    return servico?.nome || servicoId;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Minha Conta</h1>
          <div className="user-info">
            <span>Olá, {user?.nome}!</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main client">
        <div className="dashboard-card">
          <h2>Agendar Serviço</h2>

          {sucesso && (
            <div className="success-message">
              <CheckCircle size={20} />
              <span>{sucesso}</span>
            </div>
          )}

          {erro && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-group">
              <label htmlFor="servico_id">Selecione um Serviço</label>
              <select
                id="servico_id"
                name="servico_id"
                value={formData.servico_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Escolha um serviço --</option>
                {servicos.map(servico => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="data_hora">Data e Hora</label>
              <div className="input-wrapper">
                <Calendar size={18} />
                <input
                  type="datetime-local"
                  id="data_hora"
                  name="data_hora"
                  value={formData.data_hora}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Observações (opcional)</label>
              <textarea
                id="observacoes"
                name="observacoes"
                placeholder="Alguma observação especial?"
                value={formData.observacoes}
                onChange={handleChange}
                rows="4"
              ></textarea>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Agendando...' : 'Agendar'}
            </button>
          </form>
        </div>

        {/* Meus Agendamentos */}
        <div className="dashboard-card">
          <h2>Meus Agendamentos</h2>
          {meuAgendamentos.length === 0 ? (
            <p className="empty-state">Você ainda não tem agendamentos</p>
          ) : (
            <div className="agendamentos-list">
              {meuAgendamentos.map(agendamento => (
                <div key={agendamento.id} className="agendamento-item client-item">
                  <div className="agendamento-info">
                    <h4>{obterNomeServico(agendamento.servico_id)}</h4>
                    <div className="appointment-details">
                      <div className="detail">
                        <Calendar size={16} />
                        <span>{formatarData(agendamento.data_hora)}</span>
                      </div>
                      {agendamento.observacoes && (
                        <p className="observacoes">{agendamento.observacoes}</p>
                      )}
                    </div>
                  </div>

                  <div className="agendamento-actions">
                    <span className={`status ${agendamento.status}`}>
                      {agendamento.status === 'pendente' && '⏳ Pendente'}
                      {agendamento.status === 'confirmado' && '✓ Confirmado'}
                      {agendamento.status === 'cancelado' && '✗ Cancelado'}
                    </span>
                    {agendamento.status !== 'cancelado' && (
                      <button
                        onClick={() => cancelarAgendamento(agendamento.id)}
                        className="btn-cancel"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClientDashboard;