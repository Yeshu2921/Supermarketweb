
import "./Footer.css";

function Footer() {
  return (
    <footer className="admin-footer">
      <p>
        © {new Date().getFullYear()} FreshMart Supermarket.
        All rights reserved.
      </p>

      <span>Supermarket Management System</span>
    </footer>
  );
}

export default Footer;
