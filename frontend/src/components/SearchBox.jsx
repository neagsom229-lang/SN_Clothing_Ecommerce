import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import products, { categoryLabel } from '../data/products';
import { formatPrice } from '../utils/format';

const MAX_RESULTS = 5;

function matchProducts(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
    .slice(0, MAX_RESULTS);
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const results = matchProducts(query);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goToSearch = (q) => {
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    setOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      navigate(`/product/${results[activeIndex].id}`);
      setOpen(false);
      return;
    }
    goToSearch(query.trim());
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-box" ref={boxRef}>
      <Form
        className="d-flex"
        role="search"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Form.Control
          type="search"
          placeholder="Search products"
          className="me-2"
          aria-label="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" variant="outline-primary">
          <i className="bi bi-search" />
        </Button>
      </Form>

      {open && query.trim().length >= 2 && (
        <div className="search-suggest">
          {results.length === 0 ? (
            <div className="search-suggest__empty">
              No matches for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            <>
              {results.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  className={`search-suggest__item${i === activeIndex ? ' is-active' : ''}`}
                  onClick={() => {
                    navigate(`/product/${p.id}`);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <img src={p.image} alt="" />
                  <span className="search-suggest__text">
                    <span className="search-suggest__name">{p.name}</span>
                    <span className="search-suggest__meta">
                      {p.brand} · {categoryLabel(p.category)}
                    </span>
                  </span>
                  <span className="card-price fs-6">{formatPrice(p.price)}</span>
                </button>
              ))}
              <button
                type="button"
                className="search-suggest__all"
                onClick={() => goToSearch(query.trim())}
              >
                View all results for &ldquo;{query.trim()}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
