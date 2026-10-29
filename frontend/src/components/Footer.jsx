function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <span className="footer-brand-logo">
            RealEstate AI
          </span>

          <p className="footer-brand-text">
            An AI-powered real-estate marketplace helping buyers
            discover properties, ask community questions, and
            connect with trusted agents.
          </p>
        </div>

        <div className="footer-section">
          <h4>Browse</h4>
          <ul>
            <li>
              <a href="/properties">Properties</a>
            </li>
            <li>
              <a href="/questions">Community Q&A</a>
            </li>
            <li>
              <a href="/">Home</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Account</h4>
          <ul>
            <li>
              <a href="/login">Login</a>
            </li>
            <li>
              <a href="/register">Register</a>
            </li>
            <li>
              <a href="/dashboard">Dashboard</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Agents</h4>
          <ul>
            <li>
              <a href="/my-properties">My Properties</a>
            </li>
            <li>
              <a href="/properties/create">List a Property</a>
            </li>
            <li>
              <a href="/received-inquiries">Inquiries</a>
            </li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          © {currentYear} RealEstate AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
