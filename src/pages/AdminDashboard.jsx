import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/Api';
import '../styles/Dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/agendamentos');
      setAgendamentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/agendamentos/${id}`, { status: novoStatus });
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    if (filtro === 'todos') return true;
    return agendamento.status === filtro;
  });

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Painel Administrativo</h1>
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
      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Agendamentos</h2>
          
          {/* Filtros */}
          <div className="filtros">
            <button
              className={`filter-btn ${filtro === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltro('todos')}
            >
              Todos ({agendamentos.length})
            </button>
            <button
              className={`filter-btn ${filtro === 'pendente' ? 'active' : ''}`}
              onClick={() => setFiltro('pendente')}
            >
              Pendentes ({agendamentos.filter(a => a.status === 'pendente').length})
            </button>
            <button
              className={`filter-btn ${filtro === 'confirmado' ? 'active' : ''}`}
              onClick={() => setFiltro('confirmado')}
            >
              Confirmados ({agendamentos.filter(a => a.status === 'confirmado').length})
            </button>
            <button
              className={`filter-btn ${filtro === 'cancelado' ? 'active' : ''}`}
              onClick={() => setFiltro('cancelado')}
            >
              Cancelados ({agendamentos.filter(a => a.status === 'cancelado').length})
            </button>
          </div>

          {/* Agendamentos */}
          {loading ? (
            <p className="loading">Carregando agendamentos...</p>
          ) : agendamentosFiltrados.length === 0 ? (
            <p className="empty-state">Nenhum agendamento nesta categoria</p>
          ) : (
            <div className="agendamentos-list">
              {agendamentosFiltrados.map(agendamento => (
                <div key={agendamento.id} className="agendamento-item">
                  <div className="agendamento-info">
                    <div className="client-info">
                      <h4>{agendamento.cliente_nome}</h4>
                      <p className="phone">{agendamento.cliente_telefone}</p>
                    </div>
                    <div className="appointment-details">
                      <div className="detail">
                        <Calendar size={16} />
                        <span>{formatarData(agendamento.data_hora)}</span>
                      </div>
                      <div className="detail">
                        <span className="servico">{agendamento.servico}</span>
                      </div>
                    </div>
                  </div>

                  <div className="agendamento-actions">
                    <span className={`status ${agendamento.status}`}>
                      {agendamento.status}
                    </span>
                    {agendamento.status !== 'cancelado' && (
                      <div className="action-buttons">
                        {agendamento.status === 'pendente' && (
                          <button
                            onClick={() => atualizarStatus(agendamento.id, 'confirmado')}
                            className="btn-confirm"
                            title="Confirmar"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'cancelado')}
                          className="btn-cancel"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
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

export default AdminDashboard;