import { Calendar, Clock, DollarSign, User } from 'lucide-react';

const STATUS_MAP = {
  pendente:   { label: '⏳ Pendente',   className: 'pendente'   },
  confirmado: { label: '✓ Confirmado',  className: 'confirmado' },
  concluido:  { label: '★ Concluído',   className: 'concluido'  },
  cancelado:  { label: '✗ Cancelado',   className: 'cancelado'  },
};

// Corrige UTC → horário de SP sem depender do toLocaleString
function formatarData(dataISO) {
  const d = new Date(dataISO);
  d.setHours(d.getHours() + 3); // UTC → America/Sao_Paulo
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppointmentItem({ agendamento, onCancelar }) {
  const status = STATUS_MAP[agendamento.status] ?? { label: agendamento.status, className: '' };

  const handleCancelar = () => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      onCancelar(agendamento.id);
    }
  };

  const podeCancelar = agendamento.status !== 'cancelado' && agendamento.status !== 'concluido';

  return (
    <div className="agendamento-item client-item">
      <div className="agendamento-info">

        <h4>{agendamento.servico ?? agendamento.servico_nome ?? 'Serviço'}</h4>

        <div className="appointment-details">
          <div className="detail">
            <Calendar size={15} />
            <span>{formatarData(agendamento.data_hora)}</span>
          </div>

          {agendamento.funcionaria_nome && (
            <div className="detail">
              <User size={15} />
              <span>{agendamento.funcionaria_nome}</span>
            </div>
          )}

          {agendamento.servico_preco != null && (
            <div className="detail">
              <DollarSign size={15} />
              <span>R$ {Number(agendamento.servico_preco).toFixed(2)}</span>
            </div>
          )}

          {agendamento.observacoes && (
            <p className="observacoes">{agendamento.observacoes}</p>
          )}
        </div>
      </div>

      <div className="agendamento-actions">
        <span className={`status ${status.className}`}>
          {status.label}
        </span>
        {podeCancelar && (
          <button onClick={handleCancelar} className="btn-cancel">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export default AppointmentItem;