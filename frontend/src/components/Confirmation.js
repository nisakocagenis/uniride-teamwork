function Confirmation({ reservation, onBack }) {
  const isPending = reservation.status === 'pending_approval';

  return (
    <div className="confirmation">
      <div className="confirmation-card">
        <div className="success-icon">{isPending ? '⏳' : '✅'}</div>
        <h2 className={isPending ? 'pending-title' : ''}>
          {isPending ? 'Request Submitted!' : 'Reservation Confirmed!'}
        </h2>
        {isPending && (
          <p className="pending-desc">
            Your payment has been held in Escrow. Waiting for the car owner's approval.
          </p>
        )}
        <div className="reservation-details">
          <h3>🚗 {reservation.vehicle.brand} {reservation.vehicle.model}</h3>
          <p>📋 Reservation No: <strong>#{reservation.id}</strong></p>
          <p>🔑 Transaction ID: <strong>{reservation.transactionId}</strong></p>
          <p>📅 Start: <strong>{reservation.startDate}</strong></p>
          <p>📅 End: <strong>{reservation.endDate}</strong></p>
          <p>💰 Amount: <strong>₺{reservation.amount}</strong></p>
          <div className={`status-badge ${isPending ? 'pending' : 'confirmed'}`}>
            {isPending ? '⏳ PENDING APPROVAL' : '✓ CONFIRMED'}
          </div>
        </div>
        <button onClick={onBack}>Back to Home</button>
      </div>
    </div>
  );
}

export default Confirmation;
