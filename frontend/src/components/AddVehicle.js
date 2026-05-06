import { useState, useRef } from 'react';
import API_BASE_URLS from "../config/api";

function AddVehicle({ user, onAdded }) {
  const [form, setForm] = useState({
    brand: '',
    model: '',
    segment: 'Economy',
    pricePerDay: '',
    campus: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      let imageUrl = '';

      if (imageFile) {
        imageUrl = await fileToBase64(imageFile);
      }

      const res = await fetch(`${API_BASE_URLS.VEHICLE}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ownerId: user.id, image: imageUrl }),
      });

      if (res.ok) {
        setSuccess('Vehicle listed successfully!');
        setForm({ brand: '', model: '', segment: 'Economy', pricePerDay: '', campus: '' });
        setImageFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SEGMENTS = [
    { value: 'Economy',  icon: '🚗', desc: 'Budget-friendly' },
    { value: 'Standart', icon: '🚙', desc: 'Mid-range' },
    { value: 'Premium',  icon: '🏎️', desc: 'Luxury' },
    { value: 'SUV',      icon: '🚐', desc: 'Sport utility' },
  ];

  return (
    <div className="add-vehicle-page">
      <div className="add-vehicle-header">
        <h2>List a Vehicle</h2>
        <p>Fill in the details below to list your vehicle on UniRide.</p>
      </div>

      <form onSubmit={handleSubmit} className="add-vehicle-layout">

        {/* Left column */}
        <div className="av-left">

          {/* Vehicle Info */}
          <div className="av-section">
            <div className="av-section-title">🚗 Vehicle Information</div>
            <div className="av-row">
              <div className="av-field">
                <label>Brand</label>
                <input
                  placeholder="e.g. Toyota"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />
              </div>
              <div className="av-field">
                <label>Model</label>
                <input
                  placeholder="e.g. Corolla"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="av-field">
              <label>Category</label>
              <div className="segment-picker">
                {SEGMENTS.map((s) => (
                  <div
                    key={s.value}
                    className={`segment-option ${form.segment === s.value ? 'segment-selected' : ''}`}
                    onClick={() => setForm({ ...form, segment: s.value })}
                  >
                    <span className="segment-icon">{s.icon}</span>
                    <span className="segment-name">{s.value}</span>
                    <span className="segment-desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Location */}
          <div className="av-section">
            <div className="av-section-title">📍 Pricing & Location</div>
            <div className="av-row">
              <div className="av-field">
                <label>Price per Day (₺)</label>
                <div className="av-input-prefix">
                  <span>₺</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.pricePerDay}
                    onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="av-field">
                <label>Campus</label>
                <input
                  placeholder="e.g. Yaşar University"
                  value={form.campus}
                  onChange={(e) => setForm({ ...form, campus: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right column — Photo */}
        <div className="av-right">
          <div className="av-section av-photo-section">
            <div className="av-section-title">📷 Vehicle Photo</div>

            {preview ? (
              <div className="av-preview-wrap">
                <img src={preview} alt="Preview" className="av-preview-img" />
                <button
                  type="button"
                  className="av-remove-btn"
                  onClick={() => { setPreview(null); setImageFile(null); fileInputRef.current.value = ''; }}
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <div
                className="av-upload-zone"
                onClick={() => fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="av-upload-icon">📸</div>
                <p className="av-upload-title">Drop photo here or click to upload</p>
                <p className="av-upload-hint">JPG, PNG, JPEG · max 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Submit */}
          <div className="av-submit-area">
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <button type="submit" className="av-submit-btn" disabled={loading}>
              {loading ? (
                <span>Listing vehicle...</span>
              ) : (
                <span>🚀 List Vehicle</span>
              )}
            </button>
            <p className="av-submit-note">Your vehicle will be visible to renters immediately after listing.</p>
          </div>
        </div>

      </form>
    </div>
  );
}

export default AddVehicle;
