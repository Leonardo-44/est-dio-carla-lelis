import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/Api';
import '../../styles/Dashboard.css';
import './FinanceiroAdmin.css';

const PERIODOS = [
  { label: 'Hoje', value: 'dia' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mês', value: 'mes' },
  { label: 'Este Ano', value: 'ano' }
];

function FinanceiroAdmin() {
  const [periodo, setPeriodo] = useState('mes');
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    buscarDados();
  }, []);

  async function buscarDados() {
    try {
      setLoading(true);
      const res = await api.get('/agendamentos');
      setAgendamentos(res.data);
    } catch {
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }

  // Filtra agendamentos pelo período selecionado
  function filtrarPorPeriodo(lista, p) {
    const agora = new Date();
    return lista.filter(a => {
      const data = new Date(a.data_hora);
      if (p === 'dia') {
        return data.toDateString() === agora.toDateString();
      }
      if (p === 'semana') {
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        return data >= inicioSemana;
      }
      if (p === 'mes') {
        return data.getMonth() === agora.getMonth() &&
               data.getFullYear() === agora.getFullYear();
      }
      if (p === 'ano') {
        return data.getFullYear() === agora.getFullYear();
      }
      return true;
    });
  }

  const filtrados = filtrarPorPeriodo(agendamentos, periodo);
  const confirmados = filtrados.filter(a => a.status === 'confirmado');
  const pendentes = filtrados.filter(a => a.status === 'pendente');
  const cancelados = filtrados.filter(a => a.status === 'cancelado');

  const totalConfirmado = confirmados.reduce((s, a) => s + Number(a.servico_preco || 0), 0);
  const totalPendente = pendentes.reduce((s, a) => s + Number(a.servico_preco || 0), 0);
  const totalGeral = filtrados
    .filter(a => a.status !== 'cancelado')
    .reduce((s, a) => s + Number(a.servico_preco || 0), 0);

  // Top serviços por receita
  const receitaPorServico = {};
  confirmados.forEach(a => {
    const nome = a.servico || 'Desconhecido';
    if (!receitaPorServico[nome]) receitaPorServico[nome] = { total: 0, qtd: 0 };
    receitaPorServico[nome].total += Number(a.servico_preco || 0);
    receitaPorServico[nome].qtd += 1;
  });
  const topServicos = Object.entries(receitaPorServico)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const formatPreco = (v) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatData = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="financeiro-admin">
      {/* Cabeçalho */}
      <div className="financeiro-header">
        <div>
          <h2>Financeiro</h2>
          <p className="financeiro-subtitle">Acompanhe a receita do estúdio por período</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros de período */}
      <div className="filtros">
        {PERIODOS.map(p => (
          <button
            key={p.value}
            className={`filter-btn ${periodo === p.value ? 'active' : ''}`}
            onClick={() => setPeriodo(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="financeiro-cards">
        <div className="financeiro-card destaque">
          <div className="financeiro-card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="financeiro-card-info">
            <span className="financeiro-card-label">Receita Total</span>
            <strong className="financeiro-card-valor">{formatPreco(totalGeral)}</strong>
            <span className="financeiro-card-sub">{filtrados.filter(a => a.status !== 'cancelado').length} atendimentos</span>
          </div>
        </div>

        <div className="financeiro-card confirmado">
          <div className="financeiro-card-icon">
            <CheckCircle size={24} />
          </div>
          <div className="financeiro-card-info">
            <span className="financeiro-card-label">Confirmados</span>
            <strong className="financeiro-card-valor">{formatPreco(totalConfirmado)}</strong>
            <span className="financeiro-card-sub">{confirmados.length} atendimentos</span>
          </div>
        </div>

        <div className="financeiro-card pendente">
          <div className="financeiro-card-icon">
            <Clock size={24} />
          </div>
          <div className="financeiro-card-info">
            <span className="financeiro-card-label">Pendentes</span>
            <strong className="financeiro-card-valor">{formatPreco(totalPendente)}</strong>
            <span className="financeiro-card-sub">{pendentes.length} atendimentos</span>
          </div>
        </div>

        <div className="financeiro-card cancelado">
          <div className="financeiro-card-icon">
            <XCircle size={24} />
          </div>
          <div className="financeiro-card-info">
            <span className="financeiro-card-label">Cancelados</span>
            <strong className="financeiro-card-valor">{cancelados.length}</strong>
            <span className="financeiro-card-sub">atendimentos perdidos</span>
          </div>
        </div>
      </div>

      <div className="financeiro-bottom">
        {/* Top serviços */}
        <div className="dashboard-card">
          <h3 className="section-title">Top Serviços</h3>
          {topServicos.length === 0 ? (
            <div className="empty-state">
              <p>Sem dados para o período selecionado</p>
            </div>
          ) : (
            <div className="top-servicos-list">
              {topServicos.map(([nome, dados], i) => {
                const porcentagem = totalConfirmado > 0
                  ? (dados.total / totalConfirmado) * 100
                  : 0;
                return (
                  <div key={nome} className="top-servico-item">
                    <div className="top-servico-rank">#{i + 1}</div>
                    <div className="top-servico-info">
                      <div className="top-servico-row">
                        <span className="top-servico-nome">{nome}</span>
                        <strong className="top-servico-valor">{formatPreco(dados.total)}</strong>
                      </div>
                      <div className="top-servico-bar-track">
                        <div
                          className="top-servico-bar-fill"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                      <span className="top-servico-qtd">{dados.qtd} atendimento{dados.qtd !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos agendamentos confirmados */}
        <div className="dashboard-card">
          <h3 className="section-title">Últimos Confirmados</h3>
          {confirmados.length === 0 ? (
            <div className="empty-state">
              <p>Sem atendimentos confirmados no período</p>
            </div>
          ) : (
            <div className="ultimos-list">
              {confirmados.slice(0, 8).map(a => (
                <div key={a.id} className="ultimo-item">
                  <div className="ultimo-info">
                    <span className="ultimo-cliente">{a.cliente_nome}</span>
                    <span className="ultimo-servico">{a.servico}</span>
                    <span className="ultimo-data">
                      <Calendar size={12} />
                      {formatData(a.data_hora)}
                    </span>
                  </div>
                  <strong className="ultimo-valor">{formatPreco(a.servico_preco)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinanceiroAdmin;