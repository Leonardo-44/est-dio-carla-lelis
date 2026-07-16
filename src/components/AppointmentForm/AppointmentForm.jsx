import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import api from "../../services/Api";

import "./AppointmentForm.css";

// ─── Configuração de horários ────────────────────────────────
const HORARIOS = {
  0: null, // Domingo: fechado
  1: { inicio: 13, fim: 20 }, // Segunda: 13h–20h
  2: { inicio: 8, fim: 20 }, // Terça
  3: { inicio: 8, fim: 20 }, // Quarta
  4: { inicio: 8, fim: 20 }, // Quinta
  5: { inicio: 8, fim: 20 }, // Sexta
  6: { inicio: 8, fim: 20 }, // Sábado
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ─── Gera slots de 30 em 30 min para um dia ─────────────────
function gerarSlots(diaSemana, duracaoMinutos) {
  const config = HORARIOS[diaSemana];
  if (!config) return [];

  const slots = [];
  let h = config.inicio;
  let m = 0;

  while (true) {
    const totalMinInicio = h * 60 + m;
    const totalMinFim = totalMinInicio + duracaoMinutos;

    if (totalMinFim > config.fim * 60) break;

    slots.push({
      hora: h,
      minuto: m,
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    });

    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }

    if (h >= 24) break;
  }

  return slots;
}

// ─── Gera os próximos 60 dias úteis disponíveis ──────────────
function gerarDiasDisponiveis() {
  const dias = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 60; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    if (d.getDay() !== 0) {
      dias.push(d);
    }
  }
  return dias;
}

// ─── Formata data para chave de lookup ──────────────────────
function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

// ─── Monta datetime-local string ────────────────────────────
function montarDataHora(date, hora, minuto) {
  const d = new Date(date);
  d.setHours(hora, minuto, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const offset = -d.getTimezoneOffset();
  const sinal = offset >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(offset) / 60));
  const om = pad(Math.abs(offset) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hora)}:${pad(minuto)}:00${sinal}${oh}:${om}`;
  // Exemplo: "2026-06-13T08:00:00-03:00"
}

// ─── Componente principal ────────────────────────────────────
function AppointmentForm({ servicos, onAgendamentoCriado }) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingFuncionarias, setLoadingFuncionarias] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [funcionarias, setFuncionarias] = useState([]);
  const [funcionariaId, setFuncionariaId] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState({}); // { "YYYY-MM-DD_funcId": Set<"HH:MM"> }
  const [mesSelecionado, setMesSelecionado] = useState(0);

  const diasDisponiveis = gerarDiasDisponiveis();

  const servico = servicos.find((s) => String(s.id) === String(servicoId));
  const duracao = servico?.duracao ?? 60;

  const diasPorMes = diasDisponiveis.reduce((acc, d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
  const mesesKeys = Object.keys(diasPorMes);
  const mesAtual = mesesKeys[mesSelecionado] ?? mesesKeys[0];
  const diasDoMes = diasPorMes[mesAtual] ?? [];

  // ── Busca funcionárias que atendem o serviço escolhido ──────
  useEffect(() => {
    if (!servicoId) {
      setFuncionarias([]);
      setFuncionariaId("");
      return;
    }

    setFuncionariaId("");
    setDiaSelecionado(null);
    setSlotSelecionado(null);
    setLoadingFuncionarias(true);

    api
      .get(`/servicos/${servicoId}/funcionarias`)
      .then((response) => setFuncionarias(response.data))
      .catch((err) => {
        console.error("Erro ao buscar funcionárias do serviço:", err);
        setFuncionarias([]);
      })
      .finally(() => setLoadingFuncionarias(false));
  }, [servicoId]);

  // ── Busca horários ocupados do dia + funcionária selecionados ──
  const buscarOcupados = useCallback(
    async (date, funcId) => {
      const key = `${toDateKey(date)}_${funcId}`;
      if (horariosOcupados[key]) return;

      setLoadingSlots(true);
      try {
        const response = await api.get("/agendamentos/horarios-ocupados", {
          params: { data: toDateKey(date), funcionaria_id: funcId },
        });
        setHorariosOcupados((prev) => ({
          ...prev,
          [key]: new Set(response.data),
        }));
      } catch {
        setHorariosOcupados((prev) => ({ ...prev, [key]: new Set() }));
      } finally {
        setLoadingSlots(false);
      }
    },
    [horariosOcupados],
  );

  useEffect(() => {
    if (!diaSelecionado || !funcionariaId) return;
    setSlotSelecionado(null);
    buscarOcupados(diaSelecionado, funcionariaId);
  }, [diaSelecionado, funcionariaId]); // eslint-disable-line

  useEffect(() => {
    setSlotSelecionado(null);
  }, [servicoId]);

  const slots = diaSelecionado
    ? gerarSlots(diaSelecionado.getDay(), duracao)
    : [];

  const agora = new Date();
  const slotsFiltrados = slots.filter((slot) => {
    if (!diaSelecionado) return true;
    const d = new Date(diaSelecionado);
    d.setHours(slot.hora, slot.minuto, 0, 0);
    return d > agora;
  });

  const chaveOcupados =
    diaSelecionado && funcionariaId
      ? `${toDateKey(diaSelecionado)}_${funcionariaId}`
      : null;
  const ocupadosHoje = chaveOcupados
    ? (horariosOcupados[chaveOcupados] ?? null)
    : null;

  const isOcupado = (slot) => {
    if (!ocupadosHoje) return false;
    return ocupadosHoje.has(slot.label);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!servicoId) {
      setErro("Selecione um serviço.");
      return;
    }
    if (!funcionariaId) {
      setErro("Selecione uma profissional.");
      return;
    }
    if (!diaSelecionado) {
      setErro("Selecione uma data.");
      return;
    }
    if (!slotSelecionado) {
      setErro("Selecione um horário.");
      return;
    }

    const dataHora = montarDataHora(
      diaSelecionado,
      slotSelecionado.hora,
      slotSelecionado.minuto,
    );

    setLoading(true);
    try {
      await onAgendamentoCriado({
        servico_id: servicoId,
        funcionaria_id: funcionariaId,
        data_hora: dataHora,
        observacoes,
      });
      setSucesso("Agendamento realizado com sucesso!");
      setServicoId("");
      setFuncionariaId("");
      setDiaSelecionado(null);
      setSlotSelecionado(null);
      setObservacoes("");
      setHorariosOcupados((prev) => {
        const next = { ...prev };
        if (chaveOcupados) delete next[chaveOcupados];
        return next;
      });
      setTimeout(() => setSucesso(""), 3000);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Erro ao agendar. Tente novamente.";
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  const [anoMes, idxMes] = (mesAtual ?? "-").split("-");
  const rotuloMes =
    idxMes !== undefined ? `${MESES[Number(idxMes)]} ${anoMes}` : "";

  return (
    <div className="dashboard-card">
      <h2>Agendar Serviço</h2>

      <p className="horario-info">
        📅 <strong>Segunda:</strong> 13h–20h &nbsp;|&nbsp;
        <strong>Ter–Sáb:</strong> 08h–20h &nbsp;|&nbsp;
        <strong>Domingo:</strong> Fechado
      </p>

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
        {/* ── Serviço ─────────────────────────────────────── */}
        <div className="form-group">
          <label htmlFor="servico_id">Serviço</label>
          <select
            id="servico_id"
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            required
          >
            <option value="">-- Escolha um serviço --</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — R$ {Number(s.preco).toFixed(2)} ({s.duracao} min)
              </option>
            ))}
          </select>
        </div>

        {/* ── Profissional ──────────────────────────────────── */}
        {servicoId && (
          <div className="form-group">
            <label>Profissional</label>
            {loadingFuncionarias ? (
              <p className="slots-loading">Carregando profissionais...</p>
            ) : funcionarias.length === 0 ? (
              <p className="slots-vazio">
                Nenhuma profissional disponível para este serviço no momento.
              </p>
            ) : (
              <div className="funcionarias-grid">
                {funcionarias.map((f) => {
                  const selecionada = String(funcionariaId) === String(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`btn-funcionaria ${selecionada ? "ativo" : ""}`}
                      onClick={() => setFuncionariaId(String(f.id))}
                    >
                      {f.nome}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Calendário de dias ───────────────────────────── */}
        {funcionariaId && (
          <div className="form-group">
            <label>Data</label>

            <div className="calendar-nav">
              <button
                type="button"
                className="btn-nav"
                onClick={() => setMesSelecionado((i) => Math.max(0, i - 1))}
                disabled={mesSelecionado === 0}
              >
                ‹
              </button>
              <span className="calendar-mes">{rotuloMes}</span>
              <button
                type="button"
                className="btn-nav"
                onClick={() =>
                  setMesSelecionado((i) => Math.min(mesesKeys.length - 1, i + 1))
                }
                disabled={mesSelecionado === mesesKeys.length - 1}
              >
                ›
              </button>
            </div>

            <div className="calendar-grid">
              {diasDoMes.map((d) => {
                const selecionado =
                  diaSelecionado && toDateKey(d) === toDateKey(diaSelecionado);
                return (
                  <button
                    key={toDateKey(d)}
                    type="button"
                    className={`btn-dia ${selecionado ? "ativo" : ""}`}
                    onClick={() => setDiaSelecionado(d)}
                  >
                    <span className="btn-dia-semana">
                      {DIAS_SEMANA[d.getDay()]}
                    </span>
                    <span className="btn-dia-numero">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Grid de horários ─────────────────────────────── */}
        {diaSelecionado && funcionariaId && (
          <div className="form-group">
            <label>
              Horário
              {servico && (
                <span className="duracao-badge"> · {duracao} min</span>
              )}
            </label>

            {loadingSlots ? (
              <p className="slots-loading">Carregando horários...</p>
            ) : slotsFiltrados.length === 0 ? (
              <p className="slots-vazio">
                Nenhum horário disponível para este serviço neste dia.
              </p>
            ) : (
              <div className="slots-grid">
                {slotsFiltrados.map((slot) => {
                  const ocupado = isOcupado(slot);
                  const selecionado = slotSelecionado?.label === slot.label;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={ocupado || ocupadosHoje === null}
                      className={`btn-slot ${selecionado ? "ativo" : ""} ${ocupado ? "ocupado" : ""}`}
                      onClick={() => setSlotSelecionado(slot)}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Observações ──────────────────────────────────── */}
        <div className="form-group">
          <label htmlFor="observacoes">Observações (opcional)</label>
          <textarea
            id="observacoes"
            placeholder="Alguma observação especial?"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows="3"
          />
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={loading || !slotSelecionado}
        >
          {loading ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </form>
    </div>
  );
}

export default AppointmentForm;