import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import Spinner from 'react-bootstrap/Spinner';
import { formatPrice } from '../utils/format';
import {
  PAYMENT_METHODS,
  EXPRESS_CARRIERS,
  PROVINCES,
  getPayment,
  getCarrier,
} from '../data/checkout';
import { createPaymentIntent, createOrder as createBackendOrder } from '../api/client';
import StripeCheckoutForm from '../components/StripeCheckoutForm';
import BakongPayment from '../components/BakongPayment';

export default function Checkout() {
  const { detailed, subtotal, clear } = useCart();
  const { user, token, placeOrder } = useAuth();
  const { loading: productsLoading, error: productsError } = useProducts();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    province: '',
    addressLine: '',
    carrier: 'jt',
    payment: 'aba',
  });
  const [errors, setErrors] = useState({});

  // Stripe (real card, test mode) checkout state.
  const [stripeSecret, setStripeSecret] = useState(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // Bakong expired state
  const [bakongExpired, setBakongExpired] = useState(false);
  const [bakongSubmitting, setBakongSubmitting] = useState(false);
  const [bakongError, setBakongError] = useState(null);
  const [bakongStarted, setBakongStarted] = useState(false);
  const [bakongFinalizeError, setBakongFinalizeError] = useState(null);
  const [bakongPendingOrder, setBakongPendingOrder] = useState(null);

  useEffect(() => {
    setStripeSecret(null);
    setStripeError(null);
    setBakongExpired(false);
    setBakongError(null);
    if (bakongStarted) {
      setBakongError('Your cart or delivery changed. Please regenerate the QR.');
      setBakongStarted(false);
    }
  }, [form.carrier, form.payment]);

  if (productsError) {
    return (
      <main className="flex-shrink-0 text-center py-5">
        <Container>
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2" />
            Failed to load products: {productsError}
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Container>
      </main>
    );
  }

  if (detailed.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const carrier = getCarrier(form.carrier);
  const payment = getPayment(form.payment);
  const shipping = carrier.fee;
  const total = subtotal + shipping;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Recipient name is required.';
    if (!/^[0-9+\-\s]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.';
    if (form.carrier !== 'pickup') {
      if (!form.province) e.province = 'Please choose a province / city.';
      if (!form.addressLine.trim()) e.addressLine = 'Street / house address is required.';
    }
    return e;
  };

  const buildLocalOrder = (extra = {}) => {
    const items = detailed.map(({ product, size, qty, lineTotal }) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      size,
      qty,
      lineTotal,
    }));

    return placeOrder({
      items,
      subtotal,
      shipping,
      total,
      payment: { key: payment.key, label: payment.label },
      express: { carrier: carrier.carrier, fee: carrier.fee, eta: carrier.eta },
      address: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        province: form.province,
        addressLine: form.addressLine.trim(),
      },
      ...extra,
    });
  };

  const handleStripePaid = async (paymentIntentId) => {
    setStripeError(null);
    try {
      const { order: backendOrder } = await createBackendOrder({
        items: detailed.map(({ product, size, qty }) => ({ id: product.id, qty, size })),
        carrier: form.carrier,
        shipping: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          province: form.province,
          addressLine: form.addressLine.trim(),
        },
        paymentIntentId,
        token,
      });

      const order = buildLocalOrder({
        paymentIntentId,
        backendOrderId: backendOrder.id,
        backendOrderNumber: backendOrder.order_number,
      });

      clear();
      navigate(`/order/${order.id}`, {
        state: { paymentSuccess: true, orderNumber: backendOrder.order_number },
      });
    } catch (err) {
      setStripeError(err.message || 'Could not save the order. Please try again.');
    }
  };

  const handleBakongPaid = async (backendOrderId, md5, orphaned) => {
    setBakongError(null);
    setBakongFinalizeError(null);
    setBakongSubmitting(true);
    try {
      if (orphaned) {
        const order = buildLocalOrder({
          backendOrderId,
          backendOrderNumber: `SN-REC-${md5.slice(0, 6)}`,
          paymentMethod: 'bakong',
          md5,
        });
        clear();
        navigate(`/order/${order.id}`, {
          state: { warning: 'We recovered your payment. Please confirm your delivery details in your profile.' },
        });
        return;
      }

      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setBakongError('Please fill in all delivery details before completing payment.');
        setBakongSubmitting(false);
        return;
      }

      const { order: backendOrder } = await createBackendOrder({
        items: detailed.map(({ product, size, qty }) => ({ id: product.id, qty, size })),
        carrier: form.carrier,
        shipping: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          province: form.province,
          addressLine: form.addressLine.trim(),
        },
        paymentMethod: 'bakong',
        md5,
        token,
      });

      const order = buildLocalOrder({
        backendOrderId: backendOrder.id,
        backendOrderNumber: backendOrder.order_number,
        paymentMethod: 'bakong',
        md5,
      });

      clear();
      navigate(`/order/${order.id}`, {
        state: { paymentSuccess: true, orderNumber: backendOrder.order_number },
      });
    } catch (err) {
      setBakongFinalizeError(err.message || 'Could not finalize order after payment. Please try again.');
      setBakongPendingOrder({ md5, backendOrderId });
    } finally {
      setBakongSubmitting(false);
    }
  };

  const retryBakongFinalization = async () => {
    if (!bakongPendingOrder) return;
    await handleBakongPaid(bakongPendingOrder.backendOrderId, bakongPendingOrder.md5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (payment.key === 'stripe') {
      if (stripeSecret) return;
      setStripeBusy(true);
      setStripeError(null);
      try {
        const res = await createPaymentIntent({
          items: detailed.map(({ product, size, qty }) => ({ id: product.id, qty, size })),
          carrier: form.carrier,
        });
        setStripeSecret(res.clientSecret);
      } catch (err) {
        setStripeError(err.message || 'Could not start the payment. Please try again.');
      } finally {
        setStripeBusy(false);
      }
      return;
    }

    if (payment.qr) {
      // For Bakong KHQR, submission is handled inside BakongPayment component automatically via scanning/polling
      return;
    }

    // Cash on delivery
    const order = buildLocalOrder();
    clear();
    navigate(`/order/${order.id}`);
  };

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <h1 className="fw-bolder mb-4">Checkout</h1>
        <Form noValidate onSubmit={handleSubmit}>
          <Row className="gx-4">
            <Col lg={7} className="mb-4">
              {/* Delivery details */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="fw-bolder mb-3">
                    <i className="bi bi-geo-alt me-2 text-primary" />
                    Delivery details
                  </h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Label>Recipient name</Form.Label>
                      <Form.Control
                        value={form.fullName}
                        onChange={set('fullName')}
                        isInvalid={!!errors.fullName}
                        placeholder="Full name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.fullName}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6}>
                      <Form.Label>Phone number</Form.Label>
                      <Form.Control
                        value={form.phone}
                        onChange={set('phone')}
                        isInvalid={!!errors.phone}
                        placeholder="0XX XXX XXX"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6}>
                      <Form.Label>Province / City</Form.Label>
                      <Form.Select
                        value={form.province}
                        onChange={set('province')}
                        isInvalid={!!errors.province}
                      >
                        <option value="">Select location…</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.province}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6}>
                      <Form.Label>Street / house address</Form.Label>
                      <Form.Control
                        value={form.addressLine}
                        onChange={set('addressLine')}
                        isInvalid={!!errors.addressLine}
                        placeholder="House no, street, sangkat…"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.addressLine}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Express carrier */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="fw-bolder mb-3">
                    <i className="bi bi-truck me-2 text-primary" />
                    Delivery / express
                  </h5>
                  <Row className="g-3">
                    {EXPRESS_CARRIERS.map((c) => (
                      <Col md={4} key={c.key}>
                        <label
                          className={`option-tile w-100 h-100${
                            form.carrier === c.key ? ' is-selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="carrier"
                            className="d-none"
                            checked={form.carrier === c.key}
                            onChange={() => setForm((f) => ({ ...f, carrier: c.key }))}
                          />
                          {c.logo ? (
                            <img
                              src={c.logo}
                              alt={`${c.carrier} logo`}
                              className="brand-logo d-block mx-auto mb-2"
                            />
                          ) : (
                            <i className={`bi ${c.icon} brand-logo-icon fs-2 d-block mx-auto mb-2 text-primary`} />
                          )}
                          <span className="fw-semibold d-block">{c.carrier}</span>
                          <span className="text-muted small d-block">{c.eta}</span>
                          <span className="text-primary small">
                            {c.fee === 0 ? 'Free ($0.00)' : formatPrice(c.fee)}
                          </span>
                          {c.addressInfo && (
                            <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem' }}>{c.addressInfo}</span>
                          )}
                        </label>
                      </Col>
                    ))}
                  </Row>
                  {form.carrier === 'pickup' && (
                    <div className="alert alert-info mt-3 mb-0 small">
                      <i className="bi bi-info-circle me-2" />
                      You'll pick up your order at our store. We'll notify you when it's ready.
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Payment method */}
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bolder mb-3">
                    <i className="bi bi-credit-card me-2 text-primary" />
                    Payment method
                  </h5>
                  <Row className="g-3">
                    {PAYMENT_METHODS.map((m) => (
                      <Col xs={6} md={3} key={m.key}>
                        <label
                          className={`option-tile w-100 h-100${
                            form.payment === m.key ? ' is-selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            className="d-none"
                            checked={form.payment === m.key}
                            onChange={() => setForm((f) => ({ ...f, payment: m.key }))}
                          />
                          {m.logo ? (
                            <img
                              src={m.logo}
                              alt={`${m.label} logo`}
                              className="brand-logo mx-auto"
                            />
                          ) : (
                            <i className={`bi ${m.icon} brand-logo-icon`} />
                          )}
                          <span className="fw-semibold d-block mt-2">{m.label}</span>
                        </label>
                      </Col>
                    ))}
                  </Row>

                  {/* Card (Stripe), Bakong KHQR, or Cash */}
                  {payment.card ? (
                    <>
                      {stripeError && (
                        <div className="alert alert-danger mt-4 mb-0">{stripeError}</div>
                      )}
                      {stripeSecret ? (
                        <StripeCheckoutForm
                          clientSecret={stripeSecret}
                          total={total}
                          onPaid={handleStripePaid}
                        />
                      ) : (
                        <div className="alert alert-secondary mt-4 mb-0">
                          <i className="bi bi-credit-card-2-front me-2" />
                          Click <strong>Continue to payment</strong> below to enter your card
                          details securely with Stripe.
                        </div>
                      )}
                    </>
                  ) : payment.qr ? (
                  <>
                  {bakongError && (
                  <div className="alert alert-danger mt-4 mb-0">{bakongError}</div>
                  )}
                  {bakongExpired ? (
                  <div className="alert alert-warning mt-4 p-4 text-center">
                  <p className="fw-semibold mb-2">QR Code Expired</p>
                  <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
                  Try Again
                  </Button>
                  </div>
                  ) : !bakongStarted ? (
                  <>
                  <div className="alert alert-secondary mt-4 mb-3">
                  <i className="bi bi-info-circle me-2" />
                  Please review your delivery details above, then click Continue to generate
                  the payment QR. Payment will be for {formatPrice(total)}.
                  </div>
                  <div className="d-grid">
                  <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                  const found = validate();
                  setErrors(found);
                  if (Object.keys(found).length > 0) {
                  setBakongError('Please fill in all delivery details before generating the payment QR.');
                  return;
                  }
                  setBakongError(null);
                  setBakongStarted(true);
                  }}
                  >
                  <i className="bi bi-qr-code me-2" />
                  Continue to QR Payment
                  </Button>
                  </div>
                  </>
                  ) : (
                  <BakongPayment
                  items={detailed.map(({ product, size, qty }) => ({
                  id: product.id,
                  qty,
                  size,
                  }))}
                  carrier={form.carrier}
                  currency="USD"
                  token={token}
                  expectedTotal={total}
                  onSuccess={handleBakongPaid}
                  onExpired={() => setBakongExpired(true)}
                  />
                  )}
                  {bakongFinalizeError && (
                  <div className="alert alert-warning mt-3">
                  <p className="fw-semibold mb-2">Payment received, but we couldn't finalize your order.</p>
                  <p className="small mb-3">Reference: {bakongPendingOrder?.md5?.slice(0, 12)}</p>
                  <Button onClick={retryBakongFinalization} variant="primary" size="sm">
                  Retry Finalization
                  </Button>
                  </div>
                  )}
                  {bakongSubmitting && (
                  <div className="text-center mt-3 text-primary fw-semibold">
                  Payment confirmed! Finalizing your order…
                  </div>
                  )}
                  </>
                  ) : (
                    <div className="alert alert-secondary mt-4 mb-0">
                      <i className="bi bi-cash-coin me-2" />
                      You'll pay <strong>{formatPrice(total)}</strong> in cash when your
                      order is delivered.
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Order summary */}
            <Col lg={5}>
              <Card className="border-0 shadow-sm sticky-lg-top" style={{ top: '90px' }}>
                <Card.Body>
                  <h5 className="fw-bolder mb-3">Your order</h5>
                  {detailed.map(({ key, size, qty, product, lineTotal }) => (
                    <div
                      key={key}
                      className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        width={44}
                        height={34}
                        className="rounded"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1 small">
                        <div className="fw-semibold">{product.name}</div>
                        <div className="text-muted">
                          {qty} × {formatPrice(product.price)}
                          {size && <span> · Size {size}</span>}
                        </div>
                      </div>
                      <div className="small fw-semibold">{formatPrice(lineTotal)}</div>
                    </div>
                  ))}

                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">
                      Shipping · {carrier.carrier}
                    </span>
                    <span>{formatPrice(shipping)}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bolder fs-5">Total</span>
                    <span className="fw-bolder fs-5">{formatPrice(total)}</span>
                  </div>

                  {!(payment.card && stripeSecret) && !payment.qr && (
                    <div className="d-grid">
                      <Button type="submit" variant="primary" size="lg" disabled={stripeBusy}>
                        <i className="bi bi-shield-lock me-2" />
                        {payment.card
                          ? stripeBusy
                            ? 'Starting payment…'
                            : 'Continue to payment'
                          : 'Place order'}
                      </Button>
                    </div>
                  )}
                  {payment.card && !stripeSecret && (
                    <div className="d-grid">
                      <Button type="submit" variant="primary" size="lg" disabled={stripeBusy}>
                        <i className="bi bi-credit-card me-2" />
                        {stripeBusy ? 'Starting payment…' : 'Continue to payment'}
                      </Button>
                    </div>
                  )}
                  <p className="text-muted small text-center mt-2 mb-0">
                    Signed in as {user.email}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </main>
  );
}
