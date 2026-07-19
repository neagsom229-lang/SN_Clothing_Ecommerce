import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import ProductCard from '../components/ProductCard';
import products, { CATEGORIES, getAllBrands } from '../data/products';

const SORTS = {
  featured: { label: 'Featured', fn: null },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Top rated', fn: (a, b) => b.rating - a.rating },
  newest: { label: 'Newest', fn: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) },
};

const ALL_BRANDS = getAllBrands();
const PRICE_MAX = Math.ceil(Math.max(...products.map((p) => p.price)));

function FilterPanel({ brands, toggleBrand, maxPrice, setMaxPrice, minRating, setMinRating, onSaleOnly, setOnSaleOnly, newOnly, setNewOnly, onClear }) {
  return (
    <>
      <div className="mb-4">
        <h6 className="filter-heading">Price</h6>
        <Form.Range
          min={0}
          max={PRICE_MAX}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
        />
        <div className="d-flex justify-content-between text-muted small">
          <span>$0</span>
          <span>Up to ${maxPrice}</span>
        </div>
      </div>

      <div className="mb-4">
        <h6 className="filter-heading">Brand</h6>
        <div className="d-flex flex-column gap-1">
          {ALL_BRANDS.map((b) => (
            <Form.Check
              key={b}
              type="checkbox"
              id={`brand-${b}`}
              label={b}
              checked={brands.includes(b)}
              onChange={() => toggleBrand(b)}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="filter-heading">Rating</h6>
        <div className="d-flex flex-column gap-1">
          {[0, 4, 4.5].map((r) => (
            <Form.Check
              key={r}
              type="radio"
              name="minRating"
              id={`rating-${r}`}
              label={r === 0 ? 'Any rating' : `${r}+ stars`}
              checked={minRating === r}
              onChange={() => setMinRating(r)}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="filter-heading">Highlights</h6>
        <Form.Check
          type="switch"
          id="filter-new"
          label="New arrivals"
          checked={newOnly}
          onChange={(e) => setNewOnly(e.target.checked)}
        />
        <Form.Check
          type="switch"
          id="filter-sale"
          label="On sale"
          checked={onSaleOnly}
          onChange={(e) => setOnSaleOnly(e.target.checked)}
        />
      </div>

      <Button variant="outline-secondary" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const query = (searchParams.get('q') || '').toLowerCase().trim();
  const sort = searchParams.get('sort') || 'featured';

  const [brands, setBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [minRating, setMinRating] = useState(0);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleBrand = (b) =>
    setBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const clearFilters = () => {
    setBrands([]);
    setMaxPrice(PRICE_MAX);
    setMinRating(0);
    setOnSaleOnly(false);
    setNewOnly(false);
  };

  const activeFilterCount =
    brands.length +
    (maxPrice < PRICE_MAX ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (newOnly ? 1 : 0);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      const matchesBrand = brands.length === 0 || brands.includes(p.brand);
      const matchesPrice = p.price <= maxPrice;
      const matchesRating = p.rating >= minRating;
      const matchesSale = !onSaleOnly || p.compareAtPrice > p.price;
      const matchesNew = !newOnly || p.isNew;
      return (
        matchesCategory &&
        matchesQuery &&
        matchesBrand &&
        matchesPrice &&
        matchesRating &&
        matchesSale &&
        matchesNew
      );
    });
    const sorter = SORTS[sort]?.fn;
    return sorter ? [...list].sort(sorter) : list;
  }, [category, query, sort, brands, maxPrice, minRating, onSaleOnly, newOnly]);

  const setCategory = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'all') next.delete('category');
    else next.set('category', key);
    setSearchParams(next);
  };

  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    setSearchParams(next);
  };

  const filterProps = {
    brands,
    toggleBrand,
    maxPrice,
    setMaxPrice,
    minRating,
    setMinRating,
    onSaleOnly,
    setOnSaleOnly,
    newOnly,
    setNewOnly,
    onClear: clearFilters,
  };

  return (
    <main className="flex-shrink-0">
      <section className="py-5">
        <Container className="px-4 px-md-5">
          <div className="text-center mb-5">
            <span className="eyebrow d-inline-flex">Full catalogue</span>
            <h1 className="fw-bolder">All products</h1>
            <p className="lead fw-normal text-muted mb-0">
              Browse our full range of men's, women's, and kids' clothing, shoes, and accessories.
            </p>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
            <Button
              size="sm"
              variant={category === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setCategory('all')}
            >
              All
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c.key}
                size="sm"
                variant={category === c.key ? 'primary' : 'outline-primary'}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {query && (
            <p className="text-center text-muted">
              Showing results for <strong>&ldquo;{searchParams.get('q')}&rdquo;</strong> ·{' '}
              <Link to={category === 'all' ? '/products' : `/products?category=${category}`}>
                clear search
              </Link>
            </p>
          )}

          <Row className="gx-4">
            <Col lg={3} className="d-none d-lg-block">
              <div className="filter-panel">
                <h6 className="filter-heading mb-3">
                  <i className="bi bi-sliders me-2" />
                  Filters
                </h6>
                <FilterPanel {...filterProps} />
              </div>
            </Col>

            <Col lg={9}>
              <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-lg-none"
                    onClick={() => setShowFilters(true)}
                  >
                    <i className="bi bi-sliders me-1" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="badge bg-primary ms-1">{activeFilterCount}</span>
                    )}
                  </Button>
                  <span className="text-muted small">
                    {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                  </span>
                </div>
                <Form.Select
                  size="sm"
                  style={{ width: 'auto' }}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort products"
                >
                  {Object.entries(SORTS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      Sort: {label}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-search fs-1 text-muted d-block mb-3" />
                  <h4 className="fw-bold">No products found</h4>
                  <p className="text-muted">Try a different category, filter, or search term.</p>
                  <Button variant="outline-primary" onClick={clearFilters} className="me-2">
                    Clear filters
                  </Button>
                  <Button as={Link} to="/products" variant="primary">
                    View all products
                  </Button>
                </div>
              ) : (
                <Row className="gx-4 gy-4">
                  {filtered.map((p) => (
                    <Col key={p.id} sm={6} xl={4}>
                      <ProductCard product={p} />
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <FilterPanel {...filterProps} />
        </Offcanvas.Body>
      </Offcanvas>
    </main>
  );
}
