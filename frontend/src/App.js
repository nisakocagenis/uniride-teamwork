import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import VehicleList from './components/VehicleList';
import VehicleDetail from './components/VehicleDetail';
import AddVehicle from './components/AddVehicle';
import OwnerDashboard from './components/OwnerDashboard';
import MyRentals from './components/MyRentals';
import Profile from './components/Profile';
import RentModal from './components/RentModal';
import Confirmation from './components/Confirmation';
import './App.css';
import API_BASE_URLS from "./config/api";

function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [view, setView] = useState('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URLS.USER}/api/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = (tok, usr) => {
    setToken(tok);
    setUser(usr);
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URLS.USER}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('vehicles');
    setReservation(null);
    setPage('landing');
  };

  const handleRentSuccess = (res) => {
    setSelectedVehicle(null);
    setReservation(res);
  };

  const handleBack = () => {
    setReservation(null);
    setRefreshKey((k) => k + 1);
    setView('vehicles');
  };

  const handleViewDetail = (vehicle) => {
    setDetailVehicle(vehicle);
  };

  const handleCloseDetail = () => {
    setDetailVehicle(null);
  };

  if (!user && page === 'landing') {
    return <Landing onGetStarted={() => setPage('login')} />;
  }

  if (!user && page === 'login') {
    return <Login onLogin={handleLogin} onBack={() => setPage('landing')} onGoRegister={() => setPage('register')} />;
  }

  if (!user && page === 'register') {
    return <Register onLogin={handleLogin} onBack={() => setPage('landing')} onGoLogin={() => setPage('login')} />;
  }

  if (reservation) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-logo">UniRide</div>
        </nav>
        <main className="main-content">
          <Confirmation reservation={reservation} onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-logo">UniRide</div>
        <div className="nav-center">
          <button
            className={view === 'vehicles' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('vehicles')}
          >
            Vehicles
          </button>
          {user.role === 'owner' && (
            <>
              <button
                className={view === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setView('dashboard')}
              >
                My Listings
              </button>
              <button
                className={view === 'add' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setView('add')}
              >
                Add Vehicle
              </button>
            </>
          )}
          {user.role === 'renter' && (
            <button
              className={view === 'rentals' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setView('rentals')}
            >
              My Rentals
            </button>
          )}
          <button
            className={view === 'profile' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('profile')}
          >
            My Profile
          </button>
        </div>
        <div className="nav-user">
          <span>👤 {user.name}</span>
          <span className="role-badge">
            {user.role === 'owner' ? 'Car Owner' : 'Renter'}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'vehicles' && !detailVehicle && (
          <VehicleList
            key={refreshKey}
            user={user}
            onRent={setSelectedVehicle}
            onViewDetail={handleViewDetail}
          />
        )}
        {view === 'vehicles' && detailVehicle && (
          <VehicleDetail
            vehicle={detailVehicle}
            user={user}
            onBack={handleCloseDetail}
            onRent={(v) => { setSelectedVehicle(v); }}
            onManage={() => { setDetailVehicle(null); setView('dashboard'); }}
          />
        )}
        {view === 'dashboard' && user.role === 'owner' && (
          <OwnerDashboard key={refreshKey} user={user} />
        )}
        {view === 'add' && user.role === 'owner' && (
          <AddVehicle
            user={user}
            onAdded={() => {
              setView('dashboard');
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
        {view === 'rentals' && user.role === 'renter' && (
          <MyRentals key={refreshKey} user={user} />
        )}
        {view === 'profile' && (
          <Profile key={refreshKey} user={user} />
        )}
      </main>

      {selectedVehicle && (
        <RentModal
          vehicle={selectedVehicle}
          user={user}
          token={token}
          onClose={() => setSelectedVehicle(null)}
          onSuccess={handleRentSuccess}
        />
      )}
    </div>
  );
}

export default App;
