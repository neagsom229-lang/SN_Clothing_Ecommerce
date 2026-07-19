import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

export default function NotFound() {
  return (
    <main className="flex-shrink-0">
      <section className="py-5">
        <div className="container px-5 my-5 text-center">
          <i className="bi bi-compass display-1 text-primary d-block mb-3" />
          <h1 className="fw-bolder display-4">404</h1>
          <p className="lead text-muted mb-4">
            Sorry, we couldn&rsquo;t find the page you were looking for.
          </p>
          <Button as={Link} to="/" variant="primary" size="lg">
            <i className="bi bi-house-door me-2" />
            Back to home
          </Button>
        </div>
      </section>
    </main>
  );
}
