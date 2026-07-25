import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Badge from 'react-bootstrap/Badge';
import { CATEGORIES } from '../data/products';
import { CATEGORY_THEME } from '../utils/images';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SearchBox from './SearchBox';

// Import logo from the correct path
import logo from '../assets/logos/logo.png';

function NavbarMenu() {
  const { count } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="announce-bar">
        <Container fluid="lg" className="d-flex justify-content-center justify-content-md-between align-items-center">
          <span className="d-none d-md-inline">
            <i className="bi bi-truck me-1" />
            Free shipping on orders over $50
          </span>
          <span className="fw-medium">
            <i className="bi bi-stars me-1" />
            New arrivals dropping weekly
          </span>
          <span className="d-none d-md-inline">
            <i className="bi bi-telephone me-1" />
            097 932 5903
          </span>
        </Container>
      </div>

      <Navbar
        expand="lg"
        className={`bg-body-tertiary border-bottom navbar-sn ${scrolled ? 'navbar-sn--scrolled' : ''}`}
        sticky="top"
      >
        <Container fluid="lg">
          <Navbar.Brand as={Link} to="/">
            <img
              src={logo}
              alt="SN Clothing"
              height="45"
              className="d-inline-block align-top"
              style={{ objectFit: 'contain' }}
            />
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-2 order-lg-3">
            <button
              type="button"
              className="btn btn-link d-lg-none nav-icon-btn"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((o) => !o)}
            >
              <i className="bi bi-search fs-5" />
            </button>
            <Navbar.Toggle aria-controls="navbarScroll" />
          </div>

          <Navbar.Collapse id="navbarScroll">
            <Nav className="me-auto my-2 my-lg-0" navbarScroll>
              <Nav.Link as={NavLink} to="/" end className="nav-link-underline">
                Home
              </Nav.Link>
              <Nav.Link as={NavLink} to="/products" className="nav-link-underline">
                Products
              </Nav.Link>

              <NavDropdown title="Category" id="navbarScrollingDropdown" className="nav-link-underline">
                {CATEGORIES.map((c) => (
                  <NavDropdown.Item key={c.key} as={Link} to={`/category/${c.key}`} className="category-item">
                    <span
                      className="swatch-dot"
                      style={{ backgroundColor: CATEGORY_THEME[c.key]?.from }}
                    />
                    <span>
                      <div className="category-item__label">{c.label}</div>
                      {c.blurb && <div className="category-item__blurb">{c.blurb}</div>}
                    </span>
                  </NavDropdown.Item>
                ))}
              </NavDropdown>

              <Nav.Link as={NavLink} to="/about" className="nav-link-underline">
                About
              </Nav.Link>
              <Nav.Link as={NavLink} to="/contact" className="nav-link-underline">
                Contact
              </Nav.Link>
            </Nav>

<div className="me-lg-3 my-2 my-lg-0 d-none d-lg-block search-wrap">
  <SearchBox />
</div>

            <Nav className="align-items-lg-center gap-lg-1">
              
              <Nav.Link as={NavLink} to="/cart" className="position-relative nav-icon-link">
                <i className="bi bi-cart3 fs-5" />
                <span className="ms-1 d-lg-none">Cart</span>
                {count > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle cart-badge-pop"
                  >
                    {count}
                  </Badge>
                )}
              </Nav.Link>

              {isAuthenticated ? (
                <NavDropdown
                  align="end"
                  title={
                    <span>
                      <i className="bi bi-person-circle me-1" />
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                  }
                  id="accountDropdown"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2" />
                    My profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/profile#orders">
                    <i className="bi bi-box-seam me-2" />
                    My orders
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2" />
                    Log out
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={NavLink} to="/login">
                  <i className="bi bi-person me-1" />
                  Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {mobileSearchOpen && (
        <div className="mobile-search-bar d-lg-none">
          <Container fluid="lg" className="py-2">
            <SearchBox />
          </Container>
        </div>
      )}
    </>
  );
}

export default NavbarMenu;