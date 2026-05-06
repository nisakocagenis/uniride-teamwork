import { useState } from 'react';
import API_BASE_URLS from "../config/api";

function RentModal({ vehicle, user, token, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [cardInfo, setCardInfo] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasProgress = step === 2 || dates.start || dates.end;

  const handleClose = () => {
    if (hasProgress && !window.confirm('You have an unfinished reservation. Are you sure you want to leave?')) return;
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  const calcDays = () => {
    if (!dates.start || !dates.end) return 0;
    const diff = new Date(dates.end) - new Date(dates.start);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const totalAmount = calcDays() * vehicle.pricePerDay;

  const handleCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardInfo({ ...cardInfo, number: formatted });
  };

  const handleExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 0) { setCardInfo({ ...cardInfo, expiry: '' }); return; }
    if (digits.length <= 2) {
      setCardInfo({ ...cardInfo, expiry: digits });
    } else {
      const month = Math.min(parseInt(digits.slice(0, 2)), 12).toString().padStart(2, '0');
      setCardInfo({ ...cardInfo, expiry: month + '/' + digits.slice(2) });
    }
  };

  const handleCvv = (val) => {
    setCardInfo({ ...cardInfo, cvv: val.replace(/\D/g, '').slice(0, 3) });
  };

  const rawCardDigits = cardInfo.number.replace(/\s/g, '');
  const expiryValid = /^\d{2}\/\d{2}$/.test(cardInfo.expiry);
  const isCardValid =
    rawCardDigits.length === 16 &&
    cardInfo.name.trim().length > 0 &&
    expiryValid &&
    cardInfo.cvv.length === 3;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('${API_BASE_URLS.RESERVATION}/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          renterName: user.name,
          vehicleId: vehicle.id,
          startDate: dates.start,
          endDate: dates.end,
          amount: totalAmount,
          cardInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reservation failed.');
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>✕</button>

        {step === 1 && (
          <>
            <h2>Rent a Vehicle</h2>
            <div className="vehicle-summary">
              <h3>🚗 {vehicle.brand} {vehicle.model}</h3>
              <p>{vehicle.campus} &bull; {vehicle.segment}</p>
              <p className="price">₺{vehicle.pricePerDay}/day</p>
            </div>
            <div className="date-inputs">
              <label>
                Start Date
                <input
                  type="date"
                  value={dates.start}
                  min={today}
                  onChange={(e) => setDates({ ...dates, start: e.target.value })}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={dates.end}
                  min={dates.start || today}
                  onChange={(e) => setDates({ ...dates, end: e.target.value })}
                  required
                />
              </label>
            </div>
            {calcDays() > 0 && (
              <div className="total">
                <span>{calcDays()} day{calcDays() > 1 ? 's' : ''} × ₺{vehicle.pricePerDay}</span>
                <strong>Total: ₺{totalAmount}</strong>
              </div>
            )}
            <button
              className="rent-btn"
              onClick={() => setStep(2)}
              disabled={!dates.start || !dates.end}
            >
              Proceed to Payment →
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handlePayment}>
            <h2>Payment Details</h2>
            <p className="payment-note">🔒 Secure Escrow Payment System</p>

            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                placeholder="0000 0000 0000 0000"
                value={cardInfo.number}
                onChange={(e) => handleCardNumber(e.target.value)}
                maxLength={19}
                inputMode="numeric"
                className={rawCardDigits.length > 0 && rawCardDigits.length !== 16 ? 'input-error' : ''}
                required
              />
              {rawCardDigits.length > 0 && rawCardDigits.length !== 16 && (
                <span className="field-hint">Please enter a 16-digit card number</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Cardholder Name</label>
              <input
                placeholder="FULL NAME"
                value={cardInfo.name}
                onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="card-row">
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  placeholder="MM/YY"
                  value={cardInfo.expiry}
                  onChange={(e) => handleExpiry(e.target.value)}
                  maxLength={5}
                  inputMode="numeric"
                  className={cardInfo.expiry.length > 0 && !expiryValid ? 'input-error' : ''}
                  required
                />
                {cardInfo.expiry.length > 0 && !expiryValid && (
                  <span className="field-hint">Use MM/YY format</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  placeholder="000"
                  value={cardInfo.cvv}
                  onChange={(e) => handleCvv(e.target.value)}
                  maxLength={3}
                  inputMode="numeric"
                  type="password"
                  className={cardInfo.cvv.length > 0 && cardInfo.cvv.length !== 3 ? 'input-error' : ''}
                  required
                />
              </div>
            </div>

            <div className="total">
              <strong>Amount to Pay: ₺{totalAmount}</strong>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="pay-btn" disabled={loading || !isCardValid}>
              {loading ? 'Processing...' : 'Complete Payment'}
            </button>
            <button type="button" className="back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RentModal;
