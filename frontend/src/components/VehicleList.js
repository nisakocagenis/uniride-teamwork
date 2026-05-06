import { useState, useEffect } from 'react';
import API_BASE_URLS from "../config/api";

const SEGMENTS = [
  { key: 'Eco',      label: '🌿 Eco',      match: 'Economy'  },
  { key: 'Standart', label: '🚗 Standart', match: 'Standart' },
  { key: 'SUV',      label: '🛻 SUV',      match: 'SUV'      },
  { key: 'Premium',  label: '⭐ Premium',  match: 'Premium'  },
];

function VehicleList({ user: _user, onRent, onViewDetail }) {
  const [vehicles, setVehicles] = useState([]);
  const [ownerInfo, setOwnerInfo] = useState({}); // ownerId → { name, avg, count }
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [vehicleRes, ratingRes] = await Promise.all([
        fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles`),
        fetch(`${API_BASE_URLS.RESERVATION}/api/ratings`),
      ]);
      const vehicleData = await vehicleRes.json();
      const ratingData = await ratingRes.json();
      setVehicles(vehicleData);

      const ownerIds = [...new Set(vehicleData.map((v) => v.ownerId).filter(Boolean))];
      const userResults = await Promise.all(
        ownerIds.map((id) =>
          fetch(`${API_BASE_URLS.USER}/api/users/${id}`)
            .then((r) => r.json())
            .catch(() => null)
        )
      );

      const info = {};
      ownerIds.forEach((id, i) => {
        const user = userResults[i];
        const ownerRatings = ratingData.filter(
          (r) => r.toUserId === id && r.type === 'renter_to_owner'
        );
        const avg = ownerRatings.length
          ? ownerRatings.reduce((s, r) => s + r.stars, 0) / ownerRatings.length
          : null;
        info[id] = { name: user?.name || '—', avg, count: ownerRatings.length };
      });
      setOwnerInfo(info);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading">Loading vehicles...</div>;

  const available = vehicles.filter((v) => v.available && !v.archived);
  const allPrices  = available.map((v) => v.pricePerDay);
  const minAll     = allPrices.length ? Math.min(...allPrices) : 0;
  const maxAll     = allPrices.length ? Math.max(...allPrices) : 9999;

  const toggleSegment = (key) => {
    setSegments((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const activeSegmentMatches = SEGMENTS
    .filter((s) => segments.includes(s.key))
    .map((s) => s.match);

  const filtered = available
    .filter((v) => activeSegmentMatches.length === 0 || activeSegmentMatches.includes(v.segment))
    .filter((v) => minPrice === '' || v.pricePerDay >= Number(minPrice))
    .filter((v) => maxPrice === '' || v.pricePerDay <= Number(maxPrice));

  const hasFilters = segments.length > 0 || minPrice !== '' || maxPrice !== '';
  const clearFilters = () => { setSegments([]); setMinPrice(''); setMaxPrice(''); };

  const segmentBadge = (seg) => {
    const found = SEGMENTS.find((s) => s.match === seg);
    return found ? found.label : seg;
  };

  return (
    <div className="vehicle-list">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>Available Vehicles</h2>
        <span style={{ fontSize: '14px', color: '#888' }}>
          {filtered.length} of {available.length} vehicles
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '14px', padding: '18px 22px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>

        {/* Segment pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {SEGMENTS.map((s) => {
            const active = segments.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSegment(s.key)}
                style={{
                  padding: '7px 16px', borderRadius: '99px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px', transition: 'all 0.18s',
                  border: `2px solid ${active ? '#d3101f' : '#e0e0e0'}`,
                  background: active ? '#fff0f0' : '#fafafa',
                  color: active ? '#d3101f' : '#666',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ width: '1px', height: '36px', background: '#f0f0f0', flexShrink: 0 }} />

        {/* Price range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#444', whiteSpace: 'nowrap' }}>₺ / day</span>
          <input
            type="number"
            placeholder={`Min ${minAll}`}
            value={minPrice}
            min={0}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              width: '90px', padding: '7px 10px', borderRadius: '8px',
              border: `1.5px solid ${minPrice !== '' ? '#d3101f' : '#e0e0e0'}`,
              fontSize: '14px', outline: 'none',
            }}
          />
          <span style={{ color: '#aaa' }}>—</span>
          <input
            type="number"
            placeholder={`Max ${maxAll}`}
            value={maxPrice}
            min={0}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              width: '90px', padding: '7px 10px', borderRadius: '8px',
              border: `1.5px solid ${maxPrice !== '' ? '#d3101f' : '#e0e0e0'}`,
              fontSize: '14px', outline: 'none',
            }}
          />
        </div>

        {hasFilters && (
          <>
            <div style={{ width: '1px', height: '36px', background: '#f0f0f0', flexShrink: 0 }} />
            <button
              onClick={clearFilters}
              style={{ background: 'none', border: 'none', color: '#d3101f', fontWeight: 600, fontSize: '14px', cursor: 'pointer', padding: '4px 0', whiteSpace: 'nowrap' }}
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>No vehicles match your filters.</p>
          <button onClick={clearFilters} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#d3101f', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="vehicle-grid">
          {filtered.map((vehicle) => (
            <div
              key={vehicle.id}
              className="vehicle-card"
              onClick={() => onViewDetail(vehicle)}
              style={{ cursor: 'pointer' }}
            >
              <div className="vehicle-img-wrap">
                {vehicle.image ? (
                  <img
                    src={vehicle.image.startsWith('data:') || (vehicle.image.startsWith('http') && !vehicle.image.startsWith('http://localhost')) ? vehicle.image : `/images/${vehicle.image}`}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="vehicle-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="vehicle-img-fallback" style={{ display: vehicle.image ? 'none' : 'flex' }}>
                  🚗
                </div>
                {vehicle.segment && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: vehicle.segment === 'Economy' ? '#22c55e' : vehicle.segment === 'Premium' ? '#7a0010' : vehicle.segment === 'SUV' ? '#f59e0b' : '#6b7280',
                    color: '#fff', fontSize: '11px', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '99px',
                  }}>
                    {segmentBadge(vehicle.segment)}
                  </div>
                )}
              </div>
              <div className="vehicle-card-body">
                <h3>{vehicle.brand} {vehicle.model}</h3>
                <div className="vehicle-details">
                  <span className="badge">{vehicle.segment}</span>
                  <p>📍 {vehicle.campus}</p>
                  {vehicle.km != null && <p style={{ fontSize: '13px', color: '#888', margin: '2px 0' }}>🛣 {vehicle.km.toLocaleString()} km</p>}
                  <p className="price">₺{vehicle.pricePerDay}/day</p>
                </div>
                {ownerInfo[vehicle.ownerId] && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      👤 {ownerInfo[vehicle.ownerId].name}
                    </span>
                    {ownerInfo[vehicle.ownerId].avg !== null ? (
                      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                        ★ {ownerInfo[vehicle.ownerId].avg.toFixed(1)}
                        <span style={{ color: '#aaa', fontWeight: 400 }}> ({ownerInfo[vehicle.ownerId].count})</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#bbb' }}>No ratings yet</span>
                    )}
                  </div>
                )}
                <button
                  className="rent-btn"
                  onClick={(e) => { e.stopPropagation(); onRent(vehicle); }}
                >
                  Rent Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleList;
