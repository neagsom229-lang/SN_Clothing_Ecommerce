import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

const SHIPPING_FLAT = 2.5;

export default function Cart() {
  const { detailed, subtotal, updateQty, removeItem, clear } = useCart();

  if (detailed.length === 0) {
    return (
      <main className="flex-shrink-0">
        <Container className="py-5 text-center">
          <i className="bi bi-cart-x display-1 text-muted d-block mb-3" />
          <h1 className="fw-bolder">Your cart is empty</h1>
          <p className="text-muted mb-4">
            Looks like you haven't added anything yet.
          </p>
          <Button as={Link} to="/products" variant="primary" size="lg">
            <i className="bi bi-bag me-2" />
            Start shopping
          </Button>
        </Container>
      </main>
    );
  }

  const shipping = SHIPPING_FLAT;
  const total = subtotal + shipping;

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <h1 className="fw-bolder mb-4">Shopping cart</h1>
        <Row className="gx-4">
          <Col lg={8} className="mb-4">
            {detailed.map(({ key, id, size, qty, product, lineTotal }) => (
              <Card key={key} className="mb-3 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    width={96}
                    height={72}
                    className="rounded"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <Link
                      to={`/product/${product.id}`}
                      className="text-decoration-none link-dark fw-semibold"
                    >
                      {product.name}
                    </Link>
                    <div className="text-muted small">
                      {product.brand}
                      {size && <span> · Size: {size}</span>}
                    </div>
                    <div className="card-price fs-6">{formatPrice(product.price)}</div>
                  </div>
                  <div className="input-group" style={{ width: '130px' }}>
                    <Button
                      variant="outline-secondary"
                      onClick={() => updateQty(id, size, qty - 1)}
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      min="1"
                      className="form-control text-center"
                      value={qty}
                      onChange={(e) =>
                        updateQty(id, size, Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => updateQty(id, size, qty + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-end" style={{ minWidth: '90px' }}>
                    <div className="fw-bolder">{formatPrice(lineTotal)}</div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={() => removeItem(id, size)}
                    >
                      <i className="bi bi-trash me-1" />
                      Remove
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
            <div className="d-flex justify-content-between">
              <Button as={Link} to="/products" variant="outline-secondary">
                <i className="bi bi-arrow-left me-2" />
                Continue shopping
              </Button>
              <Button variant="outline-danger" onClick={clear}>
                Clear cart
              </Button>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-bolder mb-3">Order summary</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Shipping (est.)</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bolder fs-5">Total</span>
                  <span className="fw-bolder fs-5">{formatPrice(total)}</span>
                </div>
                <div className="d-grid">
                  <Button as={Link} to="/checkout" variant="primary" size="lg">
                    Proceed to checkout
                    <i className="bi bi-arrow-right ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
