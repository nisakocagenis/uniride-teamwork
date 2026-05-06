import { useState, useEffect, useCallback, useRef } from 'react';
import API_BASE_URLS from "../config/api";

const SEGMENTS = ['Economy', 'Standard', 'Premium', 'SUV'];

function StarPicker({ label, onSubmit, loading }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  return (
    <div className="star-form">
      {label && <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{label}</p>}
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

function EditVehicleForm({ vehicle, onSave, onCancel }) {
  const fileInputRef = useRef();
  const [form, setForm] = useState({
    brand: vehicle.brand,
    model: vehicle.model,
    segment: vehicle.segment,
    pricePerDay: vehicle.pricePerDay,
    campus: vehicle.campus,
  });
  const [imageFile, setImageFile] = useState(null);
  const getImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    if (img.startsWith('http://localhost')) return null;
    if (img.startsWith('http')) return img;
    return `/images/${img}`;
  };
  const [preview, setPreview] = useState(getImageSrc(vehicle.image));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let imageUrl = vehicle.image;
      if (imageFile) {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }
      const res = await fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pricePerDay: Number(form.pricePerDay), image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '2px solid #d3101f', borderRadius: '12px', padding: '16px', marginTop: '10px', background: '#fff' }}>
      <p style={{ fontWeight: 700, fontSize: '14px', color: '#d3101f', marginBottom: '14px' }}>✏️ Edit Vehicle</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {[['Brand', 'brand'], ['Model', 'model'], ['Campus', 'campus']].map(([lbl, key]) => (
          <div key={key} style={key === 'campus' ? { gridColumn: '1 / -1' } : {}}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>{lbl}</label>
            <input value={form[key]} onChange={set(key)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>Price / day (₺)</label>
          <input type="number" min="1" value={form.pricePerDay} onChange={set('pricePerDay')} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>Category</label>
          <select value={form.segment} onChange={set('segment')} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
            {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Photo */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>Photo</label>
        {preview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} />
            <button onClick={() => { setPreview(null); setImageFile(null); }} style={{ position: 'absolute', top: '6px', right: '6px', background: '#d3101f', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current.click()} style={{ border: '2px dashed #d0d5e0', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
            <div style={{ fontSize: '20px' }}>📷</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Click to change photo</div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files[0];
          if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); }
        }} />
      </div>

      {error && <p style={{ color: '#d3101f', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', background: '#d3101f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        <button onClick={onCancel} style={{ padding: '9px 14px', background: '#f5f5f5', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function OwnerDashboard({ user }) {
  const [vehicles, setVehicles]           = useState([]);
  const [reservations, setReservations]   = useState([]);
  const [ratings, setRatings]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(null);
  const [openRating, setOpenRating]       = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, rRes, ratRes] = await Promise.all([
      fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles`),
      fetch(`${API_BASE_URLS.RESERVATION}/api/reservations`),
      fetch(`${API_BASE_URLS.RESERVATION}/api/ratings`),
    ]);
    setVehicles((await vRes.json()).filter((v) => v.ownerId === user.id));
    setReservations(await rRes.json());
    setRatings(await ratRes.json());
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const myVehicleIds = vehicles.map((v) => v.id);

  const pendingReservations = reservations.filter((r) => r.status === 'pending_approval' && myVehicleIds.includes(r.vehicleId));
  const confirmedReservations = reservations.filter((r) => r.status === 'confirmed' && myVehicleIds.includes(r.vehicleId));
  const pendingReturnReservations = reservations.filter((r) => r.status === 'pending_return' && myVehicleIds.includes(r.vehicleId));
  const completedReservations = reservations.filter((r) => r.status === 'completed' && myVehicleIds.includes(r.vehicleId));

  const alreadyRated    = (id) => ratings.some((r) => r.reservationId === id && r.fromUserId === user.id && r.type === 'owner_to_renter');
  const unratedCompleted = completedReservations.filter((r) => !alreadyRated(r.id));
  const getConfirmedRes  = (vehicleId) => confirmedReservations.find((r) => r.vehicleId === vehicleId);

  const totalEarnings = confirmedReservations.reduce((sum, r) => sum + r.amount, 0);
  const activeRentals = vehicles.filter((v) => !v.available).length;

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    await fetch(`${API_BASE_URLS.RESERVATION}/api/reservations/${id}/approve`, { method: 'PATCH' });
    await load(); setActionLoading(null);
  };
  const handleReject = async (id) => {
    setActionLoading(id + '_reject');
    await fetch(`${API_BASE_URLS.RESERVATION}/api/reservations/${id}/reject`, { method: 'PATCH' });
    await load(); setActionLoading(null);
  };
  const handleReturnApprove = async (id) => {
    setActionLoading(id + '_return');
    await fetch(`${API_BASE_URLS.RESERVATION}/api/reservations/${id}/return-approve`, { method: 'PATCH' });
    await load(); setActionLoading(null);
  };
  const handleRate = async (reservation, stars, comment) => {
    setRatingLoading(reservation.id);
    await fetch(`${API_BASE_URLS.RESERVATION}/api/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: reservation.id, fromUserId: user.id, fromName: user.name, toUserId: reservation.userId, stars, comment, type: 'owner_to_renter' }),
    });
    setOpenRating(null); await load(); setRatingLoading(null);
  };
  const handleArchive = async (id) => {
    setActionLoading(id + '_archive');
    await fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles/${id}/archive`, { method: 'PATCH' });
    await load(); setActionLoading(null);
  };
  const handleDelete = async (id) => {
    setActionLoading(id + '_delete');
    await fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null); await load(); setActionLoading(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="owner-dashboard">
      <h2>My Listings</h2>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat"><span className="dash-stat-val">{vehicles.length}</span><span className="dash-stat-label">Total Vehicles</span></div>
        <div className="dash-stat"><span className="dash-stat-val">{activeRentals}</span><span className="dash-stat-label">Active Rentals</span></div>
        <div className="dash-stat"><span className="dash-stat-val">₺{totalEarnings.toLocaleString()}</span><span className="dash-stat-label">Total Earnings</span></div>
        <div className="dash-stat"><span className="dash-stat-val">{pendingReservations.length}</span><span className="dash-stat-label">Pending Approval</span></div>
      </div>

      {/* Pending approvals */}
      {pendingReservations.length > 0 && (
        <div className="pending-section">
          <h3 className="pending-section-title">⏳ Pending Approval Requests</h3>
          <div className="pending-list">
            {pendingReservations.map((r) => {
              const v = vehicles.find((v) => v.id === r.vehicleId);
              return (
                <div key={r.id} className="pending-card">
                  <div className="pending-card-info">
                    <div className="pending-card-vehicle">🚗 {v ? `${v.brand} ${v.model}` : `Vehicle #${r.vehicleId}`}</div>
                    <div className="pending-card-meta">
                      <span>👤 {r.renterName}</span><span>📅 {r.startDate} → {r.endDate}</span>
                      <span>💰 ₺{r.amount}</span><span className="txid-small">#{r.id}</span>
                    </div>
                  </div>
                  <div className="pending-card-actions">
                    <button className="approve-btn" onClick={() => handleApprove(r.id)} disabled={actionLoading !== null}>{actionLoading === r.id + '_approve' ? '...' : '✓ Approve'}</button>
                    <button className="reject-btn"  onClick={() => handleReject(r.id)}  disabled={actionLoading !== null}>{actionLoading === r.id + '_reject'  ? '...' : '✕ Reject'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return approvals */}
      {pendingReturnReservations.length > 0 && (
        <div className="pending-section">
          <h3 className="pending-section-title">📸 Return Requests Awaiting Approval</h3>
          <div className="pending-list">
            {pendingReturnReservations.map((r) => {
              const v = vehicles.find((v) => v.id === r.vehicleId);
              return (
                <div key={r.id} className="pending-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
                  <div className="pending-card-info" style={{ width: '100%' }}>
                    <div className="pending-card-vehicle">🚗 {v ? `${v.brand} ${v.model}` : `Vehicle #${r.vehicleId}`}</div>
                    <div className="pending-card-meta">
                      <span>👤 {r.renterName}</span><span>📅 {r.startDate} → {r.endDate}</span>
                      <span>📸 {r.returnPhotos?.length} photo{r.returnPhotos?.length !== 1 ? 's' : ''} submitted</span>
                    </div>
                  </div>
                  {r.returnPhotos?.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.returnPhotos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`Return ${i + 1}`} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #e0e0e0', cursor: 'pointer' }} />
                        </a>
                      ))}
                    </div>
                  )}
                  <button className="approve-btn" onClick={() => handleReturnApprove(r.id)} disabled={actionLoading !== null} style={{ alignSelf: 'flex-end' }}>
                    {actionLoading === r.id + '_return' ? '...' : '✓ Approve Return & Complete Rental'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rate renters */}
      {unratedCompleted.length > 0 && (
        <div className="pending-section">
          <h3 className="pending-section-title">⭐ Rate Your Renters</h3>
          <div className="pending-list">
            {unratedCompleted.map((r) => {
              const v = vehicles.find((v) => v.id === r.vehicleId);
              return (
                <div key={r.id} className="pending-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div className="pending-card-info" style={{ width: '100%' }}>
                    <div className="pending-card-vehicle">🚗 {v ? `${v.brand} ${v.model}` : `Vehicle #${r.vehicleId}`}</div>
                    <div className="pending-card-meta"><span>👤 {r.renterName}</span><span>📅 {r.startDate} → {r.endDate}</span><span>💰 ₺{r.amount}</span></div>
                  </div>
                  {openRating === r.id
                    ? <StarPicker label={`Rate ${r.renterName} as a renter`} onSubmit={(s, c) => handleRate(r, s, c)} loading={ratingLoading === r.id} />
                    : <button className="rate-btn" onClick={() => setOpenRating(r.id)}>⭐ Rate {r.renterName}</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vehicle listings */}
      {vehicles.length === 0 ? (
        <p className="no-vehicles">You have no listings yet.</p>
      ) : (
        <div className="dash-grid">
          {vehicles.map((vehicle) => {
            const res      = getConfirmedRes(vehicle.id);
            const isRented = !vehicle.available;
            const isEditing = editingVehicle === vehicle.id;

            return (
              <div key={vehicle.id} className={`dash-card ${isRented ? 'rented' : 'available'}`} style={{ opacity: vehicle.archived ? 0.7 : 1 }}>
                <div className="dash-card-img">
                  {vehicle.image ? (
                    <img src={vehicle.image.startsWith('data:') || (vehicle.image.startsWith('http') && !vehicle.image.startsWith('http://localhost')) ? vehicle.image : `/images/${vehicle.image}`} alt={`${vehicle.brand} ${vehicle.model}`}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className="vehicle-img-fallback" style={{ display: vehicle.image ? 'none' : 'flex' }}>🚗</div>
                  <div className={`status-pill ${isRented ? 'pill-rented' : vehicle.archived ? 'pill-archived' : 'pill-available'}`}>
                    {isRented ? '🔴 Rented' : vehicle.archived ? '📦 Archived' : '🟢 Available'}
                  </div>
                </div>

                <div className="dash-card-body">
                  <h3>{vehicle.brand} {vehicle.model}</h3>
                  <div className="dash-card-meta">
                    <span className="badge">{vehicle.segment}</span>
                    <span>📍 {vehicle.campus}</span>
                    <span className="price">₺{vehicle.pricePerDay}/day</span>
                  </div>

                  {/* Action bar — only when not rented */}
                  {!isRented && !isEditing && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setEditingVehicle(vehicle.id)}
                        style={{ flex: 1, padding: '7px', background: '#f5f5f5', color: '#333', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >✏️ Edit</button>
                      <button
                        onClick={() => handleArchive(vehicle.id)}
                        disabled={actionLoading === vehicle.id + '_archive'}
                        style={{ flex: 1, padding: '7px', background: vehicle.archived ? '#e8f5e9' : '#fff8e1', color: vehicle.archived ? '#2e7d32' : '#78580a', border: `1.5px solid ${vehicle.archived ? '#a5d6a7' : '#ffe082'}`, borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >
                        {actionLoading === vehicle.id + '_archive' ? '...' : vehicle.archived ? '✅ Publish' : '📦 Archive'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(vehicle.id)}
                        style={{ padding: '7px 10px', background: '#fff0f0', color: '#d3101f', border: '1.5px solid #ffcdd2', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >🗑️</button>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {deleteConfirm === vehicle.id && (
                    <div style={{ marginTop: '10px', padding: '12px', background: '#fff0f0', border: '1.5px solid #ffcdd2', borderRadius: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#c62828', marginBottom: '10px' }}>Delete this vehicle? This cannot be undone.</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDelete(vehicle.id)} disabled={actionLoading === vehicle.id + '_delete'}
                          style={{ flex: 1, padding: '8px', background: '#d3101f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          {actionLoading === vehicle.id + '_delete' ? '...' : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          style={{ flex: 1, padding: '8px', background: '#f5f5f5', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing && (
                    <EditVehicleForm vehicle={vehicle} onSave={() => { setEditingVehicle(null); load(); }} onCancel={() => setEditingVehicle(null)} />
                  )}

                  {/* Rental info */}
                  {isRented && res && !isEditing && (
                    <div className="rental-info">
                      <div className="rental-info-title">📋 Rental Details</div>
                      <div className="rental-info-row"><span>Renter</span><strong>{res.renterName}</strong></div>
                      <div className="rental-info-row"><span>Start</span><strong>{res.startDate}</strong></div>
                      <div className="rental-info-row"><span>End</span><strong>{res.endDate}</strong></div>
                      <div className="rental-info-row"><span>Amount</span><strong>₺{res.amount}</strong></div>
                      <div className="rental-info-row"><span>Transaction ID</span><strong className="txid">{res.transactionId}</strong></div>
                      <div className="rental-info-row"><span>Reservation No</span><strong>#{res.id}</strong></div>
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '8px', fontSize: '12px', color: '#78580a' }}>
                        ⏳ Waiting for renter to return the vehicle with photos.
                      </div>
                    </div>
                  )}
                  {isRented && !res && !isEditing && (
                    <div className="rented-no-record">🔴 This vehicle is currently rented.</div>
                  )}
                  {!isRented && !isEditing && !vehicle.archived && (
                    <div className="available-msg">✅ This vehicle is ready to rent.</div>
                  )}
                  {!isRented && !isEditing && vehicle.archived && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px', color: '#888' }}>
                      📦 This vehicle is archived and not visible to renters.
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

export default OwnerDashboard;
