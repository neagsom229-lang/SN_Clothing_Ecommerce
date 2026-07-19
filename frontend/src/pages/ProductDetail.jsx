import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { getProductById, categoryLabel, getProductsByCategory } from '../data/products';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { getSizesForCategory } from '../utils/sizes';

export default function ProductDetail() {
  const { id } = useParams();
  const product = getProductById(id);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const sizes = product ? getSizesForCategory(product.category) : null;
  const [size, setSize] = useState('');

  if (!product) {
    return (
      <main className="flex-shrink-0">
        <Container className="py-5 text-center">
          <i className="bi bi-box-seam display-4 text-muted d-block mb-3" />
          <h1 className="fw-bolder">Product not found</h1>
          <Button as={Link} to="/products" variant="primary" className="mt-2">
            Back to products
          </Button>
        </Container>
      </main>
    );
  }

  const onSale = product.compareAtPrice > product.price;
  const discountPct = onSale
    ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : 0;
  const needsSize = Boolean(sizes);
  const canAdd = !needsSize || size;

  const related = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const buyNow = () => {
    addItem(product, qty, size || null);
    navigate('/cart');
  };

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/products' }}>
            Products
          </Breadcrumb.Item>
          <Breadcrumb.Item
            linkAs={Link}
            linkProps={{ to: `/category/${product.category}` }}
          >
            {categoryLabel(product.category)}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
        </Breadcrumb>

        <Row className="gx-5 align-items-center">
          <Col lg={6} className="mb-4 mb-lg-0 position-relative">
            {product.isNew && (
              <span className="tag-chip cat-accessories position-absolute mt-3 ms-3" style={{ zIndex: 1 }}>
                New
              </span>
            )}
            {onSale && (
              <span
                className="tag-chip cat-women position-absolute mt-3 ms-3"
                style={{ zIndex: 1, left: product.isNew ? '4.5rem' : 0 }}
              >
                -{discountPct}%
              </span>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="img-fluid rounded shadow-sm product-hero-img"
            />
          </Col>
          <Col lg={6}>
            <span className={`tag-chip cat-${product.category} mb-2`}>
              {categoryLabel(product.category)}
            </span>
            <div className="card-brand mt-2">{product.brand}</div>
            <h1 className="fw-bolder">{product.name}</h1>
            <div className="mb-3">
              <span className="text-warning">
                {'★'.repeat(Math.round(product.rating))}
                <span className="text-muted">
                  {'★'.repeat(5 - Math.round(product.rating))}
                </span>
              </span>
              <span className="text-muted ms-2">{product.rating} / 5</span>
            </div>
            <p className="fs-2 fw-bolder mb-3">
              <span className="card-price">{formatPrice(product.price)}</span>
              {onSale && (
                <span className="card-price-compare fs-5 ms-2">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </p>
            <p className="lead text-muted">{product.description}</p>

            <p className="mb-3">
              {product.stock > 0 ? (
                <span className="text-success">
                  <i className="bi bi-check-circle me-1" />
                  In stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-danger">Out of stock</span>
              )}
            </p>

            {sizes && (
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold">Size</span>
                  <a href="#!" className="small text-decoration-none">
                    Size guide
                  </a>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-chip${size === s ? ' is-selected' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {!size && (
                  <div className="form-text">Select a size to add this item to your cart.</div>
                )}
              </div>
            )}

            <div className="d-flex align-items-center gap-3 mb-4">
              <label htmlFor="qty" className="fw-semibold mb-0">
                Quantity
              </label>
              <div className="input-group" style={{ width: '140px' }}>
                <Button
                  variant="outline-secondary"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  className="form-control text-center"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Button
                variant={added ? 'success' : 'outline-primary'}
                size="lg"
                disabled={!canAdd}
                onClick={() => {
                  addItem(product, qty, size || null);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1200);
                }}
              >
                <i className={`bi ${added ? 'bi-check-lg' : 'bi-cart-plus'} me-2`} />
                {added ? 'Added to cart' : 'Add to cart'}
              </Button>
              <Button variant="primary" size="lg" disabled={!canAdd} onClick={buyNow}>
                Buy now
              </Button>
            </div>
          </Col>
        </Row>

        {related.length > 0 && (
          <section className="mt-5 pt-4 border-top">
            <span className="eyebrow d-inline-flex">You may also like</span>
            <h2 className="mb-4">More from {categoryLabel(product.category)}</h2>
            <Row className="gx-4 gy-4">
              {related.map((p) => (
                <Col key={p.id} sm={6} lg={3}>
                  <Link
                    to={`/product/${p.id}`}
                    className="text-decoration-none d-block related-card"
                  >
                    <img src={p.image} alt={p.name} className="img-fluid rounded mb-2" />
                    <div className="card-brand">{p.brand}</div>
                    <div className="fw-semibold text-dark small">{p.name}</div>
                    <div className="card-price fs-6">{formatPrice(p.price)}</div>
                  </Link>
                </Col>
              ))}
            </Row>
          </section>
        )}
      </Container>
    </main>
  );
}
