import { useParams, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../context/AuthContext';
import OrderTracker from '../components/OrderTracker';
import { formatPrice } from '../utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const { getOrderById } = useAuth();
  const order = getOrderById(id);

  if (!order) {
    return (
      <main className="flex-shrink-0">
        <Container className="py-5 text-center">
          <i className="bi bi-question-circle display-4 text-muted d-block mb-3" />
          <h1 className="fw-bolder">Order not found</h1>
          <p className="text-muted">
            We couldn't find this order on your account.
          </p>
          <Button as={Link} to="/profile" variant="primary">
            Go to my orders
          </Button>
        </Container>
      </main>
    );
  }

  const placed = new Date(order.createdAt).toLocaleString();

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <div className="text-center mb-4">
          <i className="bi bi-check-circle-fill display-3 text-success d-block mb-2" />
          <h1 className="fw-bolder">Thank you for your order!</h1>
          <p className="text-muted mb-0">
            Order <strong>{order.number}</strong> · placed {placed}
          </p>
        </div>

        {/* Tracking */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <h5 className="fw-bolder mb-0">
                <i className="bi bi-geo me-2 text-primary" />
                Track your order
              </h5>
              <div className="text-muted small">
                {order.express.carrier} · Tracking&nbsp;
                <span className="fw-semibold">{order.trackingNumber}</span>
                <span className="ms-2">ETA {order.express.eta}</span>
              </div>
            </div>
            <OrderTracker statusIndex={order.statusIndex} />
          </Card.Body>
        </Card>

        <Row className="gx-4">
          <Col lg={7} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="fw-bolder mb-3">Items</h5>
                {order.items.map((it) => (
                  <div
                    key={`${it.id}-${it.size || ''}`}
                    className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom"
                  >
                    <img
                      src={it.image}
                      alt={it.name}
                      width={64}
                      height={48}
                      className="rounded"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{it.name}</div>
                      <div className="text-muted small">
                        {it.brand} · {it.qty} × {formatPrice(it.price)}
                        {it.size && <span> · Size {it.size}</span>}
                      </div>
                    </div>
                    <div className="fw-semibold">{formatPrice(it.lineTotal)}</div>
                  </div>
                ))}
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Shipping</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bolder fs-5">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="fw-bolder mb-3">Delivery &amp; payment</h5>
                <p className="mb-1 fw-semibold">Ship to</p>
                <p className="text-muted mb-3">
                  {order.address.fullName}
                  <br />
                  {order.address.addressLine}
                  <br />
                  {order.address.province}
                  <br />
                  {order.address.phone}
                </p>
                <p className="mb-1 fw-semibold">Delivery</p>
                <p className="text-muted mb-3">
                  {order.express.carrier} ({order.express.eta})
                </p>
                <p className="mb-1 fw-semibold">Payment</p>
                <p className="text-muted mb-0">{order.payment.label}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="d-flex gap-2">
          <Button as={Link} to="/products" variant="primary">
            <i className="bi bi-bag me-2" />
            Continue shopping
          </Button>
          <Button as={Link} to="/profile" variant="outline-secondary">
            View all orders
          </Button>
        </div>
      </Container>
    </main>
  );
}
