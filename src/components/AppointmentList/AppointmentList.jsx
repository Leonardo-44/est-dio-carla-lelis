import AppointmentItem from '../AppointmentItem/AppointmentItem';

// AppointmentList não precisa mais resolver nome/preço —
// a API /agendamentos/meus já retorna servico e servico_preco direto.
function AppointmentList({ agendamentos, onCancelar }) {
  return (
    <div className="dashboard-card">
      <h2>Meus Agendamentos</h2>

      {agendamentos.length === 0 ? (
        <p className="empty-state">Você ainda não tem agendamentos.</p>
      ) : (
        <div className="agendamentos-list">
          {agendamentos.map(agendamento => (
            <AppointmentItem
              key={agendamento.id}
              agendamento={agendamento}
              onCancelar={onCancelar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentList;