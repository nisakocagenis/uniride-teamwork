import { useState, useEffect } from 'react';

function StarDisplay({ rating, count }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star-disp ${i <= Math.round(rating) ? 'star-full' : 'star-empty'}`}>★</span>
      ))}
      {rating > 0 && <span className="star-avg">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="star-count">({count})</span>}
    </div>
  );
}

function VehicleDetail({ vehicle, user, onBack, onRent, onManage }) {
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3001/api/users/${vehicle.ownerId}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:3003/api/ratings/user/${vehicle.ownerId}`).then(r => r.json()).catch(() => []),
    ]).then(([owner, ratingData]) => {
      setOwnerInfo(owner);
      setRatings(Array.isArray(ratingData) ? ratingData : []);
    });
  }, [vehicle.ownerId]);

  const isOwner = user && user.id === vehicle.ownerId;
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0;

  const ownerInitials = ownerInfo
    ? ownerInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="vehicle-detail">
      <button className="detail-back-btn" onClick={onBack}>← Back</button>

      <div className="detail-layout">
        {/* Sol kolon */}
        <div className="detail-left">
          {/* Araç görseli */}
          <div className="detail-img-wrap">
            {vehicle.image ? (
              <img
                src={vehicle.image.startsWith('http') ? vehicle.image : `/images/${vehicle.image}`}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="detail-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="detail-img-fallback"
              style={{ display: vehicle.image ? 'none' : 'flex' }}
            >
              🚗
            </div>
          </div>

          {/* Başlık ve fiyat kartı */}
          <div className="detail-info-card">
            <div className="detail-title-row">
              <div>
                <h1 className="detail-vehicle-name">
                  {vehicle.brand} {vehicle.model}
                  {vehicle.year && <span className="detail-year"> {vehicle.year}</span>}
                </h1>
              </div>
              <div className="detail-price-block">
                <span className="detail-price">₺{vehicle.pricePerDay}</span>
                <span className="detail-per-day">per day</span>
              </div>
            </div>

            <div className="detail-tags">
              <span className="badge">{vehicle.segment}</span>
              <span className="detail-campus">📍 {vehicle.campus}</span>
            </div>

            {vehicle.description && (
              <p className="detail-description">{vehicle.description}</p>
            )}

            <div className="detail-divider" />

            {/* Araç sahibi */}
            <div className="detail-owner-row">
              <div className="detail-owner-avatar">{ownerInitials}</div>
              <div className="detail-owner-info">
                <div className="detail-owner-name">
                  {ownerInfo ? ownerInfo.name : 'Araç Sahibi'}
                </div>
                <div className="detail-owner-uni">
                  {ownerInfo ? ownerInfo.university : ''}
                </div>
                <StarDisplay rating={avgRating} count={ratings.length} />
              </div>
            </div>
          </div>

          {/* Yorumlar */}
          {ratings.length > 0 && (
            <div className="detail-reviews-card">
              <div className="detail-reviews-title">⭐ Reviews about the owner</div>
              {ratings.slice(0, 5).map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-header">
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={i <= r.stars ? 'star-full' : 'star-empty'}>★</span>
                      ))}
                    </div>
                    <span className="review-from">{r.fromName}</span>
                  </div>
                  {r.comment && <p className="review-comment">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ kolon */}
        <div className="detail-right">
          {isOwner ? (
            <div className="detail-panel detail-owner-panel">
              <div className="detail-owner-panel-emoji">🚗</div>
              <div className="detail-owner-panel-text">This is your vehicle</div>
              <button className="detail-manage-btn" onClick={onManage}>
                Manage Vehicle
              </button>
            </div>
          ) : vehicle.available ? (
            <div className="detail-panel detail-rent-panel">
              <p className="detail-rent-hint">Ready to rent this vehicle?</p>
              <button className="rent-btn detail-rent-btn" onClick={() => onRent(vehicle)}>
                Rent Now
              </button>
            </div>
          ) : (
            <div className="detail-panel detail-unavail-panel">
              <div className="detail-unavail-emoji">🔒</div>
              <div className="detail-unavail-text">This vehicle is currently rented</div>
            </div>
          )}

          {/* Teknik detaylar */}
          <div className="detail-panel">
            <div className="detail-specs-title">ℹ Details</div>
            <div className="detail-specs-list">
              <div className="detail-spec-row">
                <span className="detail-spec-label">Brand</span>
                <span className="detail-spec-value">{vehicle.brand}</span>
              </div>
              <div className="detail-spec-row">
                <span className="detail-spec-label">Model</span>
                <span className="detail-spec-value">{vehicle.model}</span>
              </div>
              {vehicle.year && (
                <div className="detail-spec-row">
                  <span className="detail-spec-label">Year</span>
                  <span className="detail-spec-value">{vehicle.year}</span>
                </div>
              )}
              <div className="detail-spec-row">
                <span className="detail-spec-label">Segment</span>
                <span className="detail-spec-value">
                  <span className="badge">{vehicle.segment}</span>
                </span>
              </div>
              <div className="detail-spec-row">
                <span className="detail-spec-label">Campus</span>
                <span className="detail-spec-value">{vehicle.campus}</span>
              </div>
              <div className="detail-spec-row">
                <span className="detail-spec-label">Price/Day</span>
                <span className="detail-spec-value detail-spec-price">₺{vehicle.pricePerDay}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetail;
