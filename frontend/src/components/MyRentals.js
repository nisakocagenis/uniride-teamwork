import { useState, useRef, useEffect, useCallback } from 'react';
import API_BASE_URLS from "../config/api";

const STATUS_MAP = {
  pending_approval: { label: '⏳ Pending Approval',      cls: 'status-pending'   },
  confirmed:        { label: '✅ Active Rental',          cls: 'status-confirmed' },
  pending_return:   { label: '📸 Return Under Review',   cls: 'status-pending'   },
  completed:        { label: '🏁 Completed',             cls: 'status-completed' },
  rejected:         { label: '❌ Rejected',              cls: 'status-rejected'  },
  cancelled:        { label: '🚫 Cancelled',             cls: 'status-cancelled' },
  failed:           { label: '💳 Payment Failed',        cls: 'status-failed'    },
};

function StarPicker({ onSubmit, loading }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  return (
    <div className="star-form">
      <div className="stars-pick">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`star-pick-icon ${s <= (hover || stars) ? 'star-filled' : ''}`}
            onClick={() => setStars(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>★</span>
        ))}
      </div>
      <input className="rating-comment" placeholder="Add a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="submit-rating-btn" onClick={() => onSubmit(stars, comment)} disabled={stars === 0 || loading}>
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}

function ReturnForm({ reservation, onSubmitted }) {
  const inputRef = useRef();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setPhotos((prev) => [...prev, ...valid].slice(0, 10));
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async () => {
    if (photos.length === 0) return setError('Please upload at least one photo.');
    setUploading(true);
    setError('');
    try {
      const base64Photos = await Promise.all(photos.map(toBase64));
      const res = await fetch(`${API_BASE_URLS.RESERVATION}/api/reservations/${reservation.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: base64Photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      onSubmitted(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
      <p style={{ fontWeight: 700, fontSize: '14px', color: '#333', marginBottom: '10px' }}>
        📸 Upload Vehicle Return Photos
      </p>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
        Take photos of the vehicle from all sides before returning. The owner will review them.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed #d3101f', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fff8f8', marginBottom: '12px' }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
        <div style={{ fontSize: '28px' }}>📷</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Click or drag photos here</div>
        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>JPG, PNG — up to 10 photos</div>
      </div>

      {/* Previews */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {photos.map((f, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={URL.createObjectURL(f)} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} />
              <button
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#d3101f', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#d3101f', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={uploading || photos.length === 0}
        style={{ width: '100%', padding: '10px', background: photos.length > 0 ? '#d3101f' : '#ccc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: photos.length > 0 ? 'pointer' : 'not-allowed' }}
      >
        {uploading ? 'Uploading...' : `Submit Return (${photos.length} photo${photos.length !== 1 ? 's' : ''})`}
      </button>
    </div>
  );
}

function MyRentals({ user }) {
  const [reservations, setReservations] = useState([]);
  const [ratings, setRatings]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(null);
  const [openRating, setOpenRating]     = useState(null);
  const [openReturn, setOpenReturn]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [rRes, ratRes] = await Promise.all([
      fetch(`${API_BASE_URLS.RESERVATION}/api/reservations`),
      fetch(`${API_BASE_URLS.RESERVATION}/api/ratings`),
    ]);
    const rData   = await rRes.json();
    const ratData = await ratRes.json();
    setReservations(rData.filter((r) => r.userId === user.id));
    setRatings(ratData);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    setCancelLoading(id);
    await fetch(`${API_BASE_URLS.RESERVATION}/api/reservations/${id}/cancel`, { method: 'PATCH' });
    await load();
    setCancelLoading(null);
  };

  const handleRate = async (reservation, stars, comment) => {
    setRatingLoading(reservation.id);
    await fetch(`${API_BASE_URLS.RESERVATION}/api/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId: reservation.id,
        fromUserId:    user.id,
        fromName:      user.name,
        toUserId:      reservation.vehicle.ownerId,
        stars,
        comment,
        type: 'renter_to_owner',
      }),
    });
    setOpenRating(null);
    await load();
    setRatingLoading(null);
  };

  const alreadyRated    = (id) => ratings.some((r) => r.reservationId === id && r.fromUserId === user.id && r.type === 'renter_to_owner');
  const ratingFromOwner = (id) => ratings.find((r) => r.reservationId === id && r.type === 'owner_to_renter' && r.toUserId === user.id);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="my-rentals">
      <h2>My Rentals</h2>

      {reservations.length === 0 ? (
        <p className="no-vehicles">You haven't made any rental requests yet.</p>
      ) : (
        <div className="rentals-list">
          {reservations.slice().reverse().map((r) => {
            const status      = STATUS_MAP[r.status] || { label: r.status, cls: '' };
            const rated       = alreadyRated(r.id);
            const ownerRating = ratingFromOwner(r.id);

            return (
              <div key={r.id} className={`rental-card rental-card-${r.status}`}>
                <div className="rental-card-header">
                  <div className="rental-card-vehicle">
                    <div className="rental-vehicle-img">
                      {r.vehicle?.image ? (
                        <img
                          src={r.vehicle.image.startsWith('data:') || (r.vehicle.image.startsWith('http') && !r.vehicle.image.startsWith('http://localhost')) ? r.vehicle.image : `/images/${r.vehicle.image}`}
                          alt=""
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="vehicle-img-fallback small-fallback" style={{ display: r.vehicle?.image ? 'none' : 'flex' }}>🚗</div>
                    </div>
                    <div>
                      <div className="rental-vehicle-name">{r.vehicle?.brand} {r.vehicle?.model}</div>
                      <div className="rental-vehicle-sub">📍 {r.vehicle?.campus} &bull; {r.vehicle?.segment}</div>
                    </div>
                  </div>
                  <span className={`rental-status-badge ${status.cls}`}>{status.label}</span>
                </div>

                <div className="rental-card-body">
                  <div className="rental-detail-row">
                    <span>📅 Dates</span>
                    <strong>{r.startDate} → {r.endDate}</strong>
                  </div>
                  <div className="rental-detail-row">
                    <span>💰 Amount</span>
                    <strong>₺{r.amount}</strong>
                  </div>
                  {r.transactionId && (
                    <div className="rental-detail-row">
                      <span>🔑 Transaction ID</span>
                      <strong className="txid">{r.transactionId}</strong>
                    </div>
                  )}
                  <div className="rental-detail-row">
                    <span>📋 Reservation No</span>
                    <strong>#{r.id}</strong>
                  </div>
                </div>

                <div className="rental-card-footer">
                  {/* Cancel */}
                  {r.status === 'pending_approval' && (
                    <button className="cancel-rental-btn" onClick={() => handleCancel(r.id)} disabled={cancelLoading === r.id}>
                      {cancelLoading === r.id ? 'Cancelling...' : '🚫 Cancel Request'}
                    </button>
                  )}

                  {/* Return vehicle */}
                  {r.status === 'confirmed' && (
                    openReturn === r.id ? (
                      <ReturnForm reservation={r} onSubmitted={() => { setOpenReturn(null); load(); }} />
                    ) : (
                      <button
                        onClick={() => setOpenReturn(r.id)}
                        style={{ width: '100%', padding: '10px', background: '#d3101f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '8px' }}
                      >
                        📸 Return Vehicle
                      </button>
                    )
                  )}

                  {/* Pending return notice */}
                  {r.status === 'pending_return' && (
                    <div style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#78580a' }}>
                      <strong>📸 {r.returnPhotos?.length} photo{r.returnPhotos?.length !== 1 ? 's' : ''} submitted.</strong>
                      <p style={{ margin: '4px 0 0' }}>Waiting for the car owner to approve your return.</p>
                    </div>
                  )}

                  {/* Rate owner */}
                  {(r.status === 'confirmed' || r.status === 'completed') && !rated && (
                    openRating === r.id ? (
                      <StarPicker onSubmit={(stars, comment) => handleRate(r, stars, comment)} loading={ratingLoading === r.id} />
                    ) : (
                      <button className="rate-btn" onClick={() => setOpenRating(r.id)}>⭐ Rate Car Owner</button>
                    )
                  )}
                  {(r.status === 'confirmed' || r.status === 'completed') && rated && (
                    <span className="already-rated">⭐ Rated</span>
                  )}

                  {/* Rating received from owner */}
                  {ownerRating && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff8f0', border: '1.5px solid #ffe0b2', borderRadius: '10px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>Rating from Car Owner</div>
                      <div style={{ color: '#f59e0b', fontSize: '16px', letterSpacing: '2px' }}>
                        {'★'.repeat(ownerRating.stars)}{'☆'.repeat(5 - ownerRating.stars)}
                      </div>
                      {ownerRating.comment && <div style={{ color: '#555', marginTop: '4px', fontStyle: 'italic' }}>"{ownerRating.comment}"</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyRentals;
