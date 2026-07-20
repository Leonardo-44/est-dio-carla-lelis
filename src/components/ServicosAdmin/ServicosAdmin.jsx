import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, DollarSign, AlertCircle, Scissors, Users } from 'lucide-react';

import api from '../../services/Api';
import '../../styles/Dashboard.css';
import './ServicosAdmin.css';
import GerenciarFuncionariasModal from './GerenciarFuncionariasModal/GerenciarFuncionariasModal';

function ServicosAdmin() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '60'
  });
  const [servicoParaFuncionarias, setServicoParaFuncionarias] = useState(null);

  useEffect(() => {
    buscarServicos();
  }, []);

  async function buscarServicos() {
    try {
      setLoading(true);
      const res = await api.get('/servicos?todos=true');
      setServicos(res.data);
    } catch {
      setError('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }

  function abrirFormNovo() {
    setEditando(null);
    setFormData({ nome: '', descricao: '', preco: '', duracao: '60' });
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function abrirFormEdicao(servico) {
    setEditando(servico.id);
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco: servico.preco,
      duracao: String(servico.duracao || 60)
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function cancelarForm() {
    setShowForm(false);
    setEditando(null);
    setFormData({ nome: '', descricao: '', preco: '', duracao: '60' });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nome.trim()) return setError('Nome é obrigatório');
    if (!formData.preco.trim()) return setError('Informe um preço');

    const payload = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || null,
      preco: formData.preco.trim(),
      duracao: Number(formData.duracao) || 60
    };

    try {
      if (editando) {
        await api.put(`/servicos/${editando}`, payload);
        setSuccess('Serviço atualizado com sucesso!');
      } else {
        await api.post('/servicos', payload);
        setSuccess('Serviço criado com sucesso!');
      }
      cancelarForm();
      buscarServicos();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar serviço');
    }
  }

  async function excluirServico(servico) {
    if (!confirm(`Deseja excluir o serviço "${servico.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/servicos/${servico.id}`);
      setSuccess('Serviço excluído com sucesso!');
      buscarServicos();
    } catch {
      setError('Erro ao excluir serviço');
    }
  }

  async function toggleAtivo(servico) {
    try {
      await api.put(`/servicos/${servico.id}`, { ativo: !servico.ativo });
      setSuccess(`Serviço ${servico.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      buscarServicos();
    } catch {
      setError('Erro ao alterar status do serviço');
    }
  }

  const formatDuracao = (min) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando serviços...</p>
      </div>
    );
  }

  return (
    <div className="servicos-admin">
      <div className="servicos-header">
        <div>
          <h2>Serviços</h2>
          <p className="servicos-subtitle">Gerencie os serviços oferecidos pelo estúdio</p>
        </div>
        {!showForm && (
          <button className="btn-novo-servico" onClick={abrirFormNovo}>
            <Plus size={18} />
            Novo Serviço
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="success-message">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="servico-form-card">
          <h3>{editando ? 'Editar Serviço' : 'Novo Serviço'}</h3>
          <form onSubmit={handleSubmit} className="servico-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">Nome do Serviço</label>
                <div className="input-wrapper">
                  <Scissors size={18} />
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    placeholder="Ex: Corte Feminino"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="preco">Preço (R$)</label>
                <div className="input-wrapper">
                  <DollarSign size={18} />
                  <input
                    type="text"
                    id="preco"
                    name="preco"
                    placeholder="Ex: 50 ou 30 a 60"
                    value={formData.preco}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="duracao">Duração (minutos)</label>
                <div className="input-wrapper">
                  <Clock size={18} />
                  <input
                    type="number"
                    id="duracao"
                    name="duracao"
                    placeholder="60"
                    value={formData.duracao}
                    onChange={handleChange}
                    min="5"
                    step="5"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição (opcional)</label>
              <textarea
                id="descricao"
                name="descricao"
                placeholder="Descreva o serviço brevemente..."
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancelar" onClick={cancelarForm}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                {editando ? 'Salvar Alterações' : 'Criar Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}

      {servicos.length === 0 ? (
        <div className="empty-state">
          <Scissors size={40} style={{ color: 'var(--light-pink)', marginBottom: '1rem' }} />
          <p>Nenhum serviço cadastrado ainda.</p>
          <p>Clique em <strong>Novo Serviço</strong> para começar.</p>
        </div>
      ) : (
        <div className="servicos-grid">
          {servicos.map(servico => (
            <div
              key={servico.id}
              className={`servico-card ${!servico.ativo ? 'inativo' : ''}`}
            >
              <div className="servico-card-header">
                <span className={`servico-status-badge ${servico.ativo ? 'ativo' : 'inativo'}`}>
                  {servico.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <div className="servico-card-actions">
                  <button
                    className="btn-icon btn-funcionarias"
                    onClick={() => setServicoParaFuncionarias(servico)}
                    title="Gerenciar profissionais"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    className="btn-icon btn-editar"
                    onClick={() => abrirFormEdicao(servico)}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={`btn-icon ${servico.ativo ? 'btn-desativar' : 'btn-ativar'}`}
                    onClick={() => toggleAtivo(servico)}
                    title={servico.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {servico.ativo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    className="btn-icon btn-excluir"
                    onClick={() => excluirServico(servico)}
                    title="Excluir permanentemente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="servico-card-body">
                <h4>{servico.nome}</h4>
                {servico.descricao && (
                  <p className="servico-descricao">{servico.descricao}</p>
                )}
              </div>

              <div className="servico-card-footer">
                <div className="servico-info-item">
                  <DollarSign size={15} />
                  <strong>R$ {servico.preco}</strong>
                </div>
                <div className="servico-info-item">
                  <Clock size={15} />
                  <span>{formatDuracao(servico.duracao)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {servicoParaFuncionarias && (
        <GerenciarFuncionariasModal
          servico={servicoParaFuncionarias}
          onClose={() => setServicoParaFuncionarias(null)}
        />
      )}
    </div>
  );
}

export default ServicosAdmin;