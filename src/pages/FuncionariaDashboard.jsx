import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, LogOut } from "lucide-react";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import "../styles/FuncionariaDashboard.css";

const STATUS_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
};

function FuncionariaDashboard() {
  const { user, logout } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarAgenda();
  }, []);

  const carregarAgenda = async () => {
    setLoading(true);
    setErro("");
    try {
      const response = await api.get("/agendamentos/hoje");
      setAgendamentos(response.data);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
      setErro("Não foi possível carregar sua agenda de hoje.");
    } finally {
      setLoading(false);
    }
  };

  const marcarConcluido = async (id) => {
    try {
      await api.put(`/agendamentos/${id}`, { status: "concluido" });
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "concluido" } : a)),
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar o status do agendamento.");
    }
  };

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="dashboard-container">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Estúdio Carla Lelis</h1>
          <div className="user-info">
            <span>Olá, {user?.nome}</span>
            <button className="btn-logout" onClick={logout}>
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ───────────────────────────────────────── */}
      <main className="dashboard-main">
        <div className="dashboard-card funcionaria-dashboard">
          <h2>Meus clientes de hoje</h2>
          <p className="data-hoje">
            <Calendar size={18} /> {hoje}
          </p>

          {loading && <p className="loading">Carregando sua agenda...</p>}

          {erro && (
            <div className="error-message">
              <span>{erro}</span>
            </div>
          )}

          {!loading && !erro && agendamentos.length === 0 && (
            <div className="empty-state">Nenhum cliente agendado para hoje.</div>
          )}

          {!loading && agendamentos.length > 0 && (
            <ul className="agendamentos-list agenda-lista">
              {agendamentos.map((a) => {
                const hora = new Date(a.data_hora).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li key={a.id} className="agendamento-item">
                    <div className="agendamento-info">
                      <h4>
                        <Clock size={16} className="icon-inline" /> {hora} —{" "}
                        {a.cliente_nome}
                      </h4>
                      <p className="phone">
                        <Phone size={14} className="icon-inline" />{" "}
                        {a.cliente_telefone}
                      </p>
                      <div className="appointment-details">
                        <span className="servico">{a.servico}</span>
                        {a.observacoes && (
                          <p className="observacoes">Obs: {a.observacoes}</p>
                        )}
                      </div>
                    </div>

                    <div className="agendamento-actions">
                      <span className={`status ${a.status}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                      {a.status !== "concluido" && (
                        <button
                          type="button"
                          className="btn-concluir"
                          onClick={() => marcarConcluido(a.id)}
                          title="Marcar como concluído"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default FuncionariaDashboard;