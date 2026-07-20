import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import api from "../../../services/Api";
import "./GerenciarFuncionariasModal.css";

function GerenciarFuncionariasModal({ servico, onClose }) {
  const [todasFuncionarias, setTodasFuncionarias] = useState([]);
  const [vinculadas, setVinculadas] = useState([]); // ids das que já fazem o serviço
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro("");
    try {
      const [todasRes, vinculadasRes] = await Promise.all([
        api.get("/users/funcionarias"),
        api.get(`/servicos/${servico.id}/funcionarias`),
      ]);
      setTodasFuncionarias(todasRes.data);
      setVinculadas(vinculadasRes.data.map((f) => f.id));
    } catch (error) {
      console.error("Erro ao carregar funcionárias:", error);
      setErro("Não foi possível carregar as funcionárias.");
    } finally {
      setLoading(false);
    }
  };

  const alternarVinculo = async (funcionariaId, estaVinculada) => {
    setSalvandoId(funcionariaId);
    setErro("");
    try {
      if (estaVinculada) {
        await api.delete(`/servicos/${servico.id}/funcionarias/${funcionariaId}`);
        setVinculadas((prev) => prev.filter((id) => id !== funcionariaId));
      } else {
        await api.post(`/servicos/${servico.id}/funcionarias`, {
          funcionaria_id: funcionariaId,
        });
        setVinculadas((prev) => [...prev, funcionariaId]);
      }
    } catch (error) {
      console.error("Erro ao atualizar vínculo:", error);
      const message =
        error?.response?.data?.message || "Erro ao atualizar. Tente novamente.";
      setErro(message);
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content funcionarias-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profissionais — {servico.nome}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="modal-subtitle">
          Selecione quem realiza esse serviço.
        </p>

        {erro && (
          <div className="error-message">
            <span>{erro}</span>
          </div>
        )}

        {loading ? (
          <p className="loading">Carregando...</p>
        ) : todasFuncionarias.length === 0 ? (
          <p className="empty-state">
            Nenhuma funcionária cadastrada ainda.
          </p>
        ) : (
          <ul className="funcionarias-checklist">
            {todasFuncionarias.map((f) => {
              const vinculada = vinculadas.includes(f.id);
              const salvando = salvandoId === f.id;
              return (
                <li key={f.id} className="funcionaria-check-item">
                  <button
                    type="button"
                    className={`checkbox-custom ${vinculada ? "marcado" : ""}`}
                    onClick={() => alternarVinculo(f.id, vinculada)}
                    disabled={salvando}
                  >
                    {salvando ? (
                      <Loader2 size={14} className="spin-icon" />
                    ) : (
                      vinculada && <Check size={14} />
                    )}
                  </button>
                  <span
                    className="funcionaria-check-nome"
                    onClick={() => !salvando && alternarVinculo(f.id, vinculada)}
                  >
                    {f.nome}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <button type="button" className="btn-submit" onClick={onClose}>
          Concluído
        </button>
      </div>
    </div>
  );
}

export default GerenciarFuncionariasModal;