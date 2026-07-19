import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (form.password.length < 6) e.password = 'Use at least 6 characters.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const res = await register({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setSubmitting(false);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <main className="flex-shrink-0">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <i className="bi bi-person-plus display-5 text-primary" />
                  <h1 className="fw-bolder h3 mt-2">Create your account</h1>
                  <p className="text-muted mb-0">
                    Register to check out and track your orders
                  </p>
                </div>

                {serverError && <Alert variant="danger">{serverError}</Alert>}

                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      value={form.name}
                      onChange={set('name')}
                      isInvalid={!!errors.name}
                      placeholder="Your name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      isInvalid={!!errors.email}
                      placeholder="name@example.com"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          value={form.password}
                          onChange={set('password')}
                          isInvalid={!!errors.password}
                          placeholder="Min. 6 characters"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm password</Form.Label>
                        <Form.Control
                          type="password"
                          value={form.confirm}
                          onChange={set('confirm')}
                          isInvalid={!!errors.confirm}
                          placeholder="Repeat password"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.confirm}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-grid mb-3">
                    <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                      {submitting ? 'Creating account…' : 'Create account'}
                    </Button>
                  </div>
                </Form>

                <p className="text-center text-muted mb-0">
                  Already have an account?{' '}
                  <Link to="/login" state={location.state}>
                    Sign in
                  </Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
