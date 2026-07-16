import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, User, Phone, Lock } from 'lucide-react';
import api from '../../services/Api';

function FuncionariasAdmin() {
  const [funcionarias, setFuncionarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // null = criando, objeto = editando
  const [form, setForm] = useState({ nome: '', telefone: '', senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  useEffect(() => { carregarFuncionarias(); }, []);

  const carregarFuncionarias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/funcionarias');
      setFuncionarias(response.data);
      setErro('');
    } catch (error) {
      console.error('Erro ao carregar funcionárias:', error);
      setErro('Não foi possível carregar as funcionárias.');
    } finally {
      setLoading(false);
    }
  };

  const abrirCriacao = () => {
    setEditando(null);
    setForm({ nome: '', telefone: '', senha: '' });
    setErroForm('');
    setModalAberto(true);
  };

  const abrirEdicao = (funcionaria) => {
    setEditando(funcionaria);
    setForm({ nome: funcionaria.nome, telefone: funcionaria.telefone, senha: '' });
    setErroForm('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroForm('');

    if (!form.nome.trim() || !form.telefone.trim()) {
      setErroForm('Nome e telefone são obrigatórios.');
      return;
    }
    if (!editando && form.senha.length < 6) {
      setErroForm('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (editando && form.senha && form.senha.length < 6) {
      setErroForm('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setSalvando(true);
      if (editando) {
        const payload = { nome: form.nome, telefone: form.telefone };
        if (form.senha) payload.senha = form.senha;
        await api.put(`/users/funcionarias/${editando.id}`, payload);
      } else {
        await api.post('/users/funcionarias', form);
      }
      await carregarFuncionarias();
      fecharModal();
    } catch (error) {
      console.error('Erro ao salvar funcionária:', error);
      setErroForm(error.response?.data?.message || 'Erro ao salvar funcionária.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirFuncionaria = async (funcionaria) => {
    if (!window.confirm(`Excluir "${funcionaria.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/users/funcionarias/${funcionaria.id}`);
      carregarFuncionarias();
    } catch (error) {
      console.error('Erro ao excluir funcionária:', error);
      alert(error.response?.data?.message || 'Erro ao excluir funcionária.');
    }
  };

  return (
    <div className="funcionarias-admin">
      <div className="funcionarias-header">
        <h2>Funcionárias</h2>
        <button className="btn-submit btn-add-funcionaria" onClick={abrirCriacao}>
          <Plus size={18} /> Nova Funcionária
        </button>
      </div>

      {erro && <p className="error-message">{erro}</p>}

      {loading ? (
        <p className="loading">Carregando funcionárias...</p>
      ) : funcionarias.length === 0 ? (
        <p className="empty-state">Nenhuma funcionária cadastrada ainda.</p>
      ) : (
        <div className="funcionarias-list">
          {funcionarias.map((f) => (
            <div key={f.id} className="funcionaria-item">
              <div className="funcionaria-info">
                <h4>{f.nome}</h4>
                <p className="phone">{f.telefone}</p>
              </div>
              <div className="funcionaria-actions">
                <button className="btn-edit" onClick={() => abrirEdicao(f)} title="Editar">
                  <Pencil size={16} />
                </button>
                <button className="btn-delete" onClick={() => excluirFuncionaria(f)} title="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editando ? 'Editar Funcionária' : 'Nova Funcionária'}</h3>
              <button className="btn-close-modal" onClick={fecharModal}>
                <X size={20} />
              </button>
            </div>

            <form className="appointment-form" onSubmit={handleSubmit}>
              {erroForm && <p className="error-message">{erroForm}</p>}

              <div className="form-group">
                <label>Nome</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <div className="input-wrapper">
                  <Phone size={18} />
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{editando ? 'Nova senha (opcional)' : 'Senha'}</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder={editando ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Funcionária'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FuncionariasAdmin;