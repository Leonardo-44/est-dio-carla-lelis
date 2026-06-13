import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/Api";

import AppointmentForm from "../components/AppointmentForm/AppointmentForm";
import AppointmentList from "../components/AppointmentList/AppointmentList";
import "../styles/Dashboard.css";

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [meuAgendamentos, setMeuAgendamentos] = useState([]);
  const [erroGlobal, setErroGlobal] = useState("");
  const [successoGlobal, setSuccessoGlobal] = useState("");

  const carregarServicos = useCallback(async () => {
    try {
      const response = await api.get("/servicos");
      setServicos(response.data);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setErroGlobal("Erro ao carregar serviços. Recarregue a página.");
    }
  }, []);

  const carregarMeuAgendamentos = useCallback(async () => {
    try {
      const response = await api.get("/agendamentos/meus");
      setMeuAgendamentos(response.data);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    }
  }, []);

  useEffect(() => {
    carregarServicos();
    carregarMeuAgendamentos();
  }, [carregarServicos, carregarMeuAgendamentos]);

  const handleAgendamentoCriado = async (formData) => {
    console.log("Enviando para API:", formData);
    try {
      await api.post("/agendamentos", formData);
      carregarMeuAgendamentos();
    } catch (error) {
      console.log("Erro detalhado:", error.response?.data); // ← adiciona isso
      throw error;
    }
  };

  const handleCancelar = async (id) => {
    try {
      await api.put(`/agendamentos/${id}`, { status: "cancelado" });
      carregarMeuAgendamentos();
      setSuccessoGlobal("Agendamento cancelado com sucesso.");
      setTimeout(() => setSuccessoGlobal(""), 3000);
    } catch (error) {
      setErroGlobal("Erro ao cancelar agendamento. Tente novamente.");
      setTimeout(() => setErroGlobal(""), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
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

      {erroGlobal && <div className="global-error-banner">{erroGlobal}</div>}

      {successoGlobal && (
        <div className="global-success-banner">{successoGlobal}</div>
      )}

      <main className="dashboard-main client">
        <AppointmentForm
          servicos={servicos}
          onAgendamentoCriado={handleAgendamentoCriado}
        />

        <AppointmentList
          agendamentos={meuAgendamentos}
          servicos={servicos}
          onCancelar={handleCancelar}
        />
      </main>
    </div>
  );
}

export default ClientDashboard;
