import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { useAuth, ORDER_STEPS } from '../context/AuthContext';
import OrderTracker from '../components/OrderTracker';
import { avatarImage } from '../utils/images';
import { formatPrice } from '../utils/format';

export default function Profile() {
  const { user, myOrders, logout } = useAuth();

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <Row className="gx-4">
          {/* Sidebar profile card */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <img
                  src={avatarImage(user.name)}
                  alt={user.name}
                  width={110}
                  height={110}
                  className="rounded-circle mb-3"
                />
                <h4 className="fw-bolder mb-0">{user.name}</h4>
                <p className="text-muted">{user.email}</p>
                <div className="d-flex justify-content-center gap-4 my-3">
                  <div>
                    <div className="fs-4 fw-bolder">{myOrders.length}</div>
                    <div className="text-muted small">Orders</div>
                  </div>
                  <div>
                    <div className="fs-4 fw-bolder">
                      {formatPrice(
                        myOrders.reduce((sum, o) => sum + o.total, 0)
                      )}
                    </div>
                    <div className="text-muted small">Spent</div>
                  </div>
                </div>
                <div className="d-grid gap-2">
                  <Button as={Link} to="/products" variant="primary">
                    Continue shopping
                  </Button>
                  <Button variant="outline-secondary" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2" />
                    Log out
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Orders */}
          <Col lg={8} id="orders">
            <h1 className="fw-bolder h3 mb-4">My orders</h1>

            {myOrders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <i className="bi bi-box-seam display-5 text-muted d-block mb-3" />
                  <h5 className="fw-bold">No orders yet</h5>
                  <p className="text-muted">Your placed orders will appear here.</p>
                  <Button as={Link} to="/products" variant="primary">
                    Start shopping
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              myOrders.map((order) => (
                <Card key={order.id} className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bolder mb-1">{order.number}</h5>
                        <div className="text-muted small">
                          {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                          {order.items.reduce((n, i) => n + i.qty, 0)} item(s) ·{' '}
                          {formatPrice(order.total)}
                        </div>
                      </div>
                      <Badge bg="info" className="text-dark">
                        {ORDER_STEPS[order.statusIndex]?.label}
                      </Badge>
                    </div>

                    <OrderTracker statusIndex={order.statusIndex} />

                    <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                      {order.items.slice(0, 4).map((it) => (
                        <img
                          key={`${it.id}-${it.size || ''}`}
                          src={it.image}
                          alt={it.name}
                          width={46}
                          height={36}
                          className="rounded"
                          style={{ objectFit: 'cover' }}
                        />
                      ))}
                      <div className="ms-auto text-muted small">
                        {order.express.carrier} · {order.trackingNumber}
                      </div>
                      <Button
                        as={Link}
                        to={`/order/${order.id}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        View details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Col>
        </Row>
      </Container>
    </main>
  );
}
