import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, User, Phone, Lock, Eye, EyeOff, CalendarOff, Clock } from 'lucide-react';
import api from '../../services/Api';

const DIAS_SEMANA = [
  { valor: '', label: 'Sem folga fixa' },
  { valor: '0', label: 'Domingo' },
  { valor: '1', label: 'Segunda-feira' },
  { valor: '2', label: 'Terça-feira' },
  { valor: '3', label: 'Quarta-feira' },
  { valor: '4', label: 'Quinta-feira' },
  { valor: '5', label: 'Sexta-feira' },
  { valor: '6', label: 'Sábado' },
];

function nomeDia(dia_folga) {
  if (dia_folga === null || dia_folga === undefined) return null;
  return DIAS_SEMANA.find((d) => d.valor === String(dia_folga))?.label ?? null;
}

// Formata telefone para (00) 00000-0000 ou (00) 0000-0000
function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function FuncionariasAdmin() {
  const [funcionarias, setFuncionarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // null = criando, objeto = editando
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    senha: '',
    dia_folga: '',
    hora_inicio: '',
    hora_fim: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    setForm({ nome: '', telefone: '', senha: '', dia_folga: '', hora_inicio: '', hora_fim: '' });
    setErroForm('');
    setShowPassword(false);
    setModalAberto(true);
  };

  const abrirEdicao = (funcionaria) => {
    setEditando(funcionaria);
    setForm({
      nome: funcionaria.nome,
      telefone: formatarTelefone(funcionaria.telefone),
      senha: '',
      dia_folga: funcionaria.dia_folga !== null && funcionaria.dia_folga !== undefined
        ? String(funcionaria.dia_folga)
        : '',
      hora_inicio: funcionaria.hora_inicio !== null && funcionaria.hora_inicio !== undefined
        ? String(funcionaria.hora_inicio)
        : '',
      hora_fim: funcionaria.hora_fim !== null && funcionaria.hora_fim !== undefined
        ? String(funcionaria.hora_fim)
        : ''
    });
    setErroForm('');
    setShowPassword(false);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleTelefoneChange = (e) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setForm({ ...form, telefone: valorFormatado });
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
    if (
      form.hora_inicio !== '' && form.hora_fim !== '' &&
      Number(form.hora_inicio) >= Number(form.hora_fim)
    ) {
      setErroForm('O horário de entrada deve ser antes do horário de saída.');
      return;
    }

    const dia_folga = form.dia_folga === '' ? null : Number(form.dia_folga);
    const hora_inicio = form.hora_inicio === '' ? null : Number(form.hora_inicio);
    const hora_fim = form.hora_fim === '' ? null : Number(form.hora_fim);

    try {
      setSalvando(true);
      if (editando) {
        const payload = { nome: form.nome, telefone: form.telefone, dia_folga, hora_inicio, hora_fim };
        if (form.senha) payload.senha = form.senha;
        await api.put(`/users/funcionarias/${editando.id}`, payload);
      } else {
        await api.post('/users/funcionarias', { ...form, dia_folga, hora_inicio, hora_fim });
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
          {funcionarias.map((f) => {
            const folga = nomeDia(f.dia_folga);
            const temHorario = f.hora_inicio !== null && f.hora_inicio !== undefined &&
              f.hora_fim !== null && f.hora_fim !== undefined;
            return (
              <div key={f.id} className="funcionaria-item">
                <div className="funcionaria-info">
                  <h4>{f.nome}</h4>
                  <p className="phone">{formatarTelefone(f.telefone)}</p>
                  {folga && (
                    <p className="funcionaria-folga">
                      <CalendarOff size={14} /> Folga: {folga}
                    </p>
                  )}
                  {temHorario && (
                    <p className="funcionaria-horario">
                      <Clock size={14} /> {String(f.hora_inicio).padStart(2, '0')}:00 às {String(f.hora_fim).padStart(2, '0')}:00
                    </p>
                  )}
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
            );
          })}
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
                    onChange={handleTelefoneChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dia de folga fixo</label>
                <select
                  value={form.dia_folga}
                  onChange={(e) => setForm({ ...form, dia_folga: e.target.value })}
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Entra às</label>
                  <select
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  >
                    <option value="">Horário padrão</option>
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sai às</label>
                  <select
                    value={form.hora_fim}
                    onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
                  >
                    <option value="">Horário padrão</option>
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{editando ? 'Nova senha (opcional)' : 'Senha'}</label>
                <div className="input-wrapper password-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder={editando ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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