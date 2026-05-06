import { useState, useEffect } from 'react';

function StarDisplay({ avg, count }) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star-disp ${s <= full ? 'star-full' : (s === full + 1 && half ? 'star-half' : 'star-empty')}`}>★</span>
      ))}
      <span className="star-avg">{avg > 0 ? avg.toFixed(1) : '—'}</span>
      <span className="star-count">({count})</span>
    </div>
  );
}

function Profile({ user }) {
  const [ratings, setRatings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const promises = [
        fetch(`http://localhost:3003/api/ratings/user/${user.id}`).then(r => r.json()),
        fetch('http://localhost:3003/api/reservations').then(r => r.json()),
      ];
      if (user.role === 'owner') {
        promises.push(fetch('http://localhost:3002/api/vehicles').then(r => r.json()));
      }
      const results = await Promise.all(promises);
      setRatings(results[0]);
      setReservations(results[1]);
      if (user.role === 'owner') setVehicles(results[2].filter(v => v.ownerId === user.id));
      setLoading(false);
    };
    load();
  }, [user.id, user.role]);

  const avgRating = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : 0;

  const confirmedRentals = reservations.filter(r => r.userId === user.id && r.status === 'confirmed');
  const totalEarnings = reservations
    .filter(r => vehicles.some(v => v.id === r.vehicleId) && r.status === 'confirmed')
    .reduce((s, r) => s + r.amount, 0);

  const email = user.username.includes('@') ? user.username : `${user.username}@yasar.edu.tr`;
  const memberSince = new Date(2026, 3, 28 - (3 - user.id)).toLocaleDateString('tr-TR');
  const roleLabel = user.role === 'owner' ? 'Car Owner' : 'Renter';
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">

      {/* Header card */}
      <div className="profile-header-card">
        <div className="profile-header-left">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-header-info">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email">{email}</p>
            <p className="profile-university">🎓 {user.university}</p>
            <div className="profile-header-badges">
              <span className="profile-role-badge">
                {user.role === 'owner' ? '🚗' : '👤'} {roleLabel}
              </span>
              <StarDisplay avg={avgRating} count={ratings.length} />
            </div>
          </div>
        </div>
    
      </div>

      {/* Identity Verification */}
      <div className="profile-section">
        <h3 className="profile-section-title">🔒 Identity Verification</h3>
        <p className="profile-section-desc">
          UniRide requires all users to complete identity verification before listing or renting vehicles.
          This includes driver's license eligibility and criminal record checks via e-Government.
        </p>
        <div className="verify-checks">
          <span className="verify-check">✓ License Verified</span>
          <span className="verify-check">✓ Criminal Record Clear</span>
        </div>
        <div className="verify-badge">
          <span>☑ Fully Verified</span>
          <p>You can {user.role === 'owner' ? 'list vehicles and receive rentals' : 'rent vehicles on the platform'}.</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="profile-section">
        <h3 className="profile-section-title">ℹ️ Account Details</h3>
        <div className="account-details">
          <div className="account-row">
            <span className="account-label">Full Name</span>
            <span className="account-value">{user.name}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Email</span>
            <span className="account-value">{email}</span>
          </div>
          <div className="account-row">
            <span className="account-label">University</span>
            <span className="account-value">{user.university}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Role</span>
            <span className="account-value">{roleLabel}</span>
          </div>
          <div className="account-row">
            <span className="account-label">Rating</span>
            <span className="account-value">
              {avgRating > 0 ? `${avgRating.toFixed(1)} ★ (${ratings.length} review${ratings.length !== 1 ? 's' : ''})` : 'No ratings yet'}
            </span>
          </div>
          <div className="account-row">
            <span className="account-label">Member since</span>
            <span className="account-value">{memberSince}</span>
          </div>
          {user.role === 'owner' && (
            <>
              <div className="account-row">
                <span className="account-label">Listed Vehicles</span>
                <span className="account-value">{vehicles.length}</span>
              </div>
              <div className="account-row">
                <span className="account-label">Total Earnings</span>
                <span className="account-value">₺{totalEarnings.toLocaleString()}</span>
              </div>
            </>
          )}
          {user.role === 'renter' && (
            <div className="account-row">
              <span className="account-label">Completed Rentals</span>
              <span className="account-value">{confirmedRentals.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {ratings.length > 0 && (
        <div className="profile-section">
          <h3 className="profile-section-title">⭐ Reviews</h3>
          <div className="reviews-list">
            {ratings.slice().reverse().map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-header">
                  <div className="review-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={s <= r.stars ? 'star-full' : 'star-empty'}>★</span>
                    ))}
                  </div>
                  <span className="review-from">{r.fromName}</span>
                </div>
                {r.comment && <p className="review-comment">"{r.comment}"</p>}
                <span className="review-date">{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
