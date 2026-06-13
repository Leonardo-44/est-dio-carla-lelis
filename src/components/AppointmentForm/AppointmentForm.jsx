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
    // Calcula quando este slot terminaria
    const totalMinInicio = h * 60 + m;
    const totalMinFim = totalMinInicio + duracaoMinutos;

    // Não pode ultrapassar o horário de fechamento
    if (totalMinFim > config.fim * 60) break;

    slots.push({
      hora: h,
      minuto: m,
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    });

    // Avança 30 min
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }

    // Limite de segurança
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
      // exclui domingo
      dias.push(d);
    }
  }
  return dias;
}

// ─── Formata data para chave de lookup ──────────────────────
function toDateKey(date) {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── Monta datetime-local string ────────────────────────────
// Substitua a função montarDataHora por esta:
function montarDataHora(date, hora, minuto) {
  const d = new Date(date);
  d.setHours(hora, minuto, 0, 0);
  // Envia com offset local (-03:00) para o backend não confundir com UTC
  const pad = (n) => String(n).padStart(2, "0");
  const offset = -d.getTimezoneOffset(); // em minutos
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
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState({}); // { "YYYY-MM-DD": Set<"HH:MM"> }
  const [mesSelecionado, setMesSelecionado] = useState(0); // índice nos diasDisponiveis agrupados

  const diasDisponiveis = gerarDiasDisponiveis();

  // Serviço selecionado completo
  const servico = servicos.find((s) => String(s.id) === String(servicoId));
  const duracao = servico?.duracao ?? 60;

  // Agrupa dias por mês para navegação
  const diasPorMes = diasDisponiveis.reduce((acc, d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
  const mesesKeys = Object.keys(diasPorMes);
  const mesAtual = mesesKeys[mesSelecionado] ?? mesesKeys[0];
  const diasDoMes = diasPorMes[mesAtual] ?? [];

  // Busca horários ocupados do dia selecionado
  const buscarOcupados = useCallback(
    async (date) => {
      const key = toDateKey(date);
      if (horariosOcupados[key]) return; // já carregado

      setLoadingSlots(true);
      try {
        const response = await api.get("/agendamentos/horarios-ocupados", {
          params: { data: key },
        });
        // response.data: ["HH:MM", "HH:MM", ...]
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

  // Quando muda o dia, busca ocupados e limpa slot
  useEffect(() => {
    if (!diaSelecionado) return;
    setSlotSelecionado(null);
    buscarOcupados(diaSelecionado);
  }, [diaSelecionado]); // eslint-disable-line

  // Quando muda serviço, limpa slot (duração pode mudar)
  useEffect(() => {
    setSlotSelecionado(null);
  }, [servicoId]);

  // Slots do dia selecionado
  const slots = diaSelecionado
    ? gerarSlots(diaSelecionado.getDay(), duracao)
    : [];

  const agora = new Date();
  const slotsFiltrados = slots.filter((slot) => {
    if (!diaSelecionado) return true;
    const d = new Date(diaSelecionado);
    d.setHours(slot.hora, slot.minuto, 0, 0);
    return d > agora; // remove slots que já passaram
  });

  const ocupadosHoje = diaSelecionado
    ? (horariosOcupados[toDateKey(diaSelecionado)] ?? null)
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
        data_hora: dataHora,
        observacoes,
      });
      setSucesso("Agendamento realizado com sucesso!");
      setServicoId("");
      setDiaSelecionado(null);
      setSlotSelecionado(null);
      setObservacoes("");
      // Invalida cache do dia para recarregar na próxima visita
      setHorariosOcupados((prev) => {
        const next = { ...prev };
        delete next[toDateKey(diaSelecionado)];
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

  // Rótulo do mês atual
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

        {/* ── Calendário de dias ───────────────────────────── */}
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

        {/* ── Grid de horários ─────────────────────────────── */}
        {diaSelecionado && (
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
