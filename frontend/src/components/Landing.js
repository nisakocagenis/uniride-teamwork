function Landing({ onGetStarted }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-logo">UniRide</div>
        <button className="landing-nav-btn" onClick={onGetStarted}>Sign In</button>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">For University Students</div>
          <h1>Campus Car Sharing,<br />Safe & Affordable</h1>
          <p>
            Students with vehicles earn extra income while students without
            vehicles get easy access to safe, nearby cars on campus.
          </p>
          <div className="hero-actions">
            <button className="cta-btn" onClick={onGetStarted}>Get Started →</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-car-emoji">🚗</div>
          <div className="hero-glow" />
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Sign In</h3>
            <p>Log in with your university account and verify your identity.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Choose a Vehicle</h3>
            <p>Browse available cars on your campus and filter by date and price.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Rent Safely</h3>
            <p>Pay securely via Escrow system and pick up your vehicle.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of students who trust our platform.</p>
        <button className="cta-btn large" onClick={onGetStarted}>Sign In</button>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">UniRide</div>
        <p>Yaşar University — COMP 3304 Term Project</p>
      </footer>
    </div>
  );
}

export default Landing;
