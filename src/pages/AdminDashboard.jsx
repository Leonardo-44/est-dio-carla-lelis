import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Scissors, DollarSign, LayoutDashboard, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/Api';

import ServicosAdmin from '../components/ServicosAdmin/ServicosAdmin';
import FinanceiroAdmin from '../components/FinanceiroAdmin/FinanceiroAdmin';

import '../styles/Dashboard.css';

const ABAS = [
  { id: 'agendamentos', label: 'Agendamentos', icon: LayoutDashboard },
  { id: 'servicos',     label: 'Serviços',     icon: Scissors        },
  { id: 'financeiro',   label: 'Financeiro',   icon: DollarSign      },
];

const STATUS_MAP = {
  pendente:   { label: '⏳ Pendente',  className: 'pendente'   },
  confirmado: { label: '✓ Confirmado', className: 'confirmado' },
  concluido:  { label: '★ Concluído',  className: 'concluido'  },
  cancelado:  { label: '✗ Cancelado',  className: 'cancelado'  },
};

function formatarData(dataISO) {
  const d = new Date(dataISO);
  d.setHours(d.getHours() + 3);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Retorna "YYYY-MM-DD" no fuso de SP para comparar com input date
function toDateStrSP(dataISO) {
  const d = new Date(dataISO);
  d.setHours(d.getHours() + 3);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [abaAtiva,     setAbaAtiva]     = useState('agendamentos');
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dataInicio,   setDataInicio]   = useState('');
  const [dataFim,      setDataFim]      = useState('');

  useEffect(() => { carregarAgendamentos(); }, []);

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

  const excluirAgendamento = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/agendamentos/${id}`);
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  };

  const limparFiltroData = () => {
    setDataInicio('');
    setDataFim('');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const contagem = (status) => agendamentos.filter(a => a.status === status).length;

  // Aplica filtro de status + intervalo de datas
  const agendamentosFiltrados = agendamentos.filter(a => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;

    const dataSP = toDateStrSP(a.data_hora);
    if (dataInicio && dataSP < dataInicio) return false;
    if (dataFim    && dataSP > dataFim)    return false;

    return true;
  });

  const temFiltroData = dataInicio || dataFim;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Painel Administrativo</h1>
          <div className="user-info">
            <span>Olá, {user?.nome}!</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-tabs">
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`dashboard-tab ${abaAtiva === id ? 'active' : ''}`}
            onClick={() => setAbaAtiva(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      <main className="dashboard-main">

        {abaAtiva === 'agendamentos' && (
          <div className="dashboard-card">
            <h2>Agendamentos</h2>

            {/* ── Filtro de status ── */}
            <div className="filtros">
              {[
                { value: 'todos',      label: `Todos (${agendamentos.length})` },
                { value: 'pendente',   label: `Pendentes (${contagem('pendente')})` },
                { value: 'confirmado', label: `Confirmados (${contagem('confirmado')})` },
                { value: 'concluido',  label: `Concluídos (${contagem('concluido')})` },
                { value: 'cancelado',  label: `Cancelados (${contagem('cancelado')})` },
              ].map(f => (
                <button
                  key={f.value}
                  className={`filter-btn ${filtroStatus === f.value ? 'active' : ''}`}
                  onClick={() => setFiltroStatus(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── Filtro de data ── */}
            <div className="filtro-data">
              <div className="filtro-data-inputs">
                <div className="filtro-data-group">
                  <label htmlFor="dataInicio">De</label>
                  <input
                    type="date"
                    id="dataInicio"
                    value={dataInicio}
                    max={dataFim || undefined}
                    onChange={e => setDataInicio(e.target.value)}
                  />
                </div>
                <span className="filtro-data-sep">—</span>
                <div className="filtro-data-group">
                  <label htmlFor="dataFim">Até</label>
                  <input
                    type="date"
                    id="dataFim"
                    value={dataFim}
                    min={dataInicio || undefined}
                    onChange={e => setDataFim(e.target.value)}
                  />
                </div>
              </div>

              {temFiltroData && (
                <button className="btn-limpar-data" onClick={limparFiltroData} title="Limpar filtro de data">
                  <X size={14} /> Limpar datas
                </button>
              )}
            </div>

            {/* ── Contador de resultados ── */}
            {(filtroStatus !== 'todos' || temFiltroData) && (
              <p className="filtro-resultado">
                {agendamentosFiltrados.length} agendamento{agendamentosFiltrados.length !== 1 ? 's' : ''} encontrado{agendamentosFiltrados.length !== 1 ? 's' : ''}
              </p>
            )}

            {loading ? (
              <p className="loading">Carregando agendamentos...</p>
            ) : agendamentosFiltrados.length === 0 ? (
              <p className="empty-state">Nenhum agendamento nesta categoria.</p>
            ) : (
              <div className="agendamentos-list">
                {agendamentosFiltrados.map(ag => {
                  const statusInfo = STATUS_MAP[ag.status] ?? { label: ag.status, className: '' };
                  return (
                    <div key={ag.id} className="agendamento-item">
                      <div className="agendamento-info">
                        <div className="client-info">
                          <h4>{ag.cliente_nome}</h4>
                          {ag.cliente_telefone && (
                            <p className="phone">{ag.cliente_telefone}</p>
                          )}
                        </div>
                        <div className="appointment-details">
                          <div className="detail">
                            <Calendar size={15} />
                            <span>{formatarData(ag.data_hora)}</span>
                          </div>
                          <div className="detail">
                            <span className="servico">{ag.servico}</span>
                            {ag.servico_preco != null && (
                              <span className="preco-badge">
                                R$ {Number(ag.servico_preco).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {ag.observacoes && (
                            <p className="observacoes">{ag.observacoes}</p>
                          )}
                        </div>
                      </div>

                      <div className="agendamento-actions">
                        <select
                          className={`status-select ${statusInfo.className}`}
                          value={ag.status}
                          onChange={e => atualizarStatus(ag.id, e.target.value)}
                        >
                          <option value="pendente">⏳ Pendente</option>
                          <option value="confirmado">✓ Confirmado</option>
                          <option value="concluido">★ Concluído</option>
                          <option value="cancelado">✗ Cancelado</option>
                        </select>
                        <button
                          onClick={() => excluirAgendamento(ag.id)}
                          className="btn-delete"
                          title="Excluir permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'servicos' && (
          <div className="dashboard-card">
            <ServicosAdmin />
          </div>
        )}

        {abaAtiva === 'financeiro' && (
          <div className="dashboard-card">
            <FinanceiroAdmin />
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;