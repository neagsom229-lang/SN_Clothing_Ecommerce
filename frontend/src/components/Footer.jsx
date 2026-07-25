import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { CATEGORIES } from '../data/products';
import { CATEGORY_THEME } from '../utils/images';
import { PAYMENT_METHODS } from '../data/checkout';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer text-white-50 mt-auto pt-5 pb-4">
      <Container>
        {/* Newsletter
        <Row className="align-items-center pb-5 mb-4 border-bottom border-secondary newsletter-row">
          <Col lg={6} className="mb-3 mb-lg-0">
            <h5 className="text-white mb-2">Join the SN Clothing list</h5>
            <p className="mb-0 small">
              New arrivals, restocks, and subscriber-only discounts — no spam.
            </p>
          </Col>
          <Col lg={6}>
            <form
              className="newsletter-form d-flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="newsletter-input"
                aria-label="Email address"
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
              </button>
            </form>
          </Col>
        </Row> */}

        <Row className="gy-4">
          <Col lg={4} md={6}>
            <div className="footer-wordmark mb-3">SN Clothing</div>
            <p className="mb-3">
              Your one-stop shop for men's, women's, and kids' clothing, shoes,
              and accessories. Quality styles, delivered to your door.
            </p>
            <div className="d-flex gap-2 fs-5">
              <a className="footer-social" href="#!" aria-label="Facebook">
                <i className="bi bi-facebook" />
              </a>
              <a className="footer-social" href="#!" aria-label="Twitter">
                <i className="bi bi-twitter-x" />
              </a>
              <a className="footer-social" href="#!" aria-label="Instagram">
                <i className="bi bi-instagram" />
              </a>
              <a className="footer-social" href="#!" aria-label="YouTube">
                <i className="bi bi-youtube" />
              </a>
            </div>
          </Col>

          <Col lg={2} md={6}>
            <h6 className="text-white mb-3">Shop</h6>
            <ul className="list-unstyled">
              {CATEGORIES.map((c) => (
                <li className="mb-2" key={c.key}>
                  <Link
                    className="footer-link link-secondary text-decoration-none"
                    to={`/products?category=${c.key}`}
                  >
                    <span
                      className="swatch-dot"
                      style={{ backgroundColor: CATEGORY_THEME[c.key]?.from }}
                    />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col lg={2} md={6}>
            <h6 className="text-white mb-3">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link className="footer-link link-secondary text-decoration-none" to="/about">
                  About us
                </Link>
              </li>
              <li className="mb-2">
                <Link className="footer-link link-secondary text-decoration-none" to="/contact">
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link className="footer-link link-secondary text-decoration-none" to="/products">
                  All products
                </Link>
              </li>
            </ul>
          </Col>

          <Col lg={4} md={6}>
            <h6 className="text-white mb-3">Get in touch</h6>
            <ul className="list-unstyled">
              <li className="mb-2 d-flex align-items-start">
                <i className="bi bi-geo-alt me-2 mt-1" />
                Mean Chey, Phnom Penh
              </li>
              <li className="mb-2">
                <a
                  href="mailto:chheangsamnang.wu@gmail.com"
                  className="footer-link link-secondary text-decoration-none"
                >
                  <i className="bi bi-envelope me-2" />
                  chheangsamnang.wu@gmail.com
                </a>
              </li>
              <li className="mb-2">
                <a
                  href="tel:+855979325903"
                  className="footer-link link-secondary text-decoration-none"
                >
                  <i className="bi bi-telephone me-2" />
                  097 932 5903
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span className="footer-accept-label">We accept</span>
            {PAYMENT_METHODS.filter((m) => m.logo).map((m) => (
              <img
                key={m.key}
                src={m.logo}
                alt={m.label}
                title={m.label}
                className="brand-logo brand-logo--sm"
              />
            ))}
          </div>

          <div className="d-flex align-items-center gap-3 footer-trust">
            <span>
              <i className="bi bi-shield-check me-1" />
              Secure checkout
            </span>
            <span>
              <i className="bi bi-arrow-repeat me-1" />
              Easy returns
            </span>
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small">
          <span>&copy; {year} SN Clothing — quality fashion. Built by Mr. Chheang Samnang</span>
          <button
            type="button"
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
          >
            Back to top <i className="bi bi-arrow-up ms-1" />
          </button>
        </div>
      </Container>
    </footer>
  );
}