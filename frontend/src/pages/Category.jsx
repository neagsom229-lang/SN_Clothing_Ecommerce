import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ProductCard from '../components/ProductCard';
import {
  CATEGORIES,
  categoryLabel,
  getBrandsByCategory,
  getProductsGroupedByBrand,
} from '../data/products';
import { getMediaImage } from '../utils/images';
import { MEDIA } from '../data/media';

export default function Category() {
  const { category } = useParams();
  const [brandFilter, setBrandFilter] = useState('all');

  const valid = CATEGORIES.some((c) => c.key === category);
  const brands = useMemo(
    () => (valid ? getBrandsByCategory(category) : []),
    [category, valid]
  );
  const groups = useMemo(
    () => (valid ? getProductsGroupedByBrand(category) : []),
    [category, valid]
  );

  // Get category banner image
  const bannerKey = `banner${category.charAt(0).toUpperCase() + category.slice(1)}`;
  const bannerImage = getMediaImage(bannerKey, MEDIA);

  if (!valid) {
    return (
      <main className="flex-shrink-0">
        <Container className="py-5 text-center">
          <i className="bi bi-exclamation-triangle display-4 text-warning d-block mb-3" />
          <h1 className="fw-bolder">Unknown category</h1>
          <p className="text-muted">We couldn't find that category.</p>
          <Button as={Link} to="/products" variant="primary">
            Browse all products
          </Button>
        </Container>
      </main>
    );
  }

  const visibleGroups =
    brandFilter === 'all' ? groups : groups.filter((g) => g.brand === brandFilter);

  return (
    <main className="flex-shrink-0">
      {/* Category hero with banner image */}
      <section 
        className={`category-hero category-hero--${category} text-white py-5`}
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container className="py-4">
          <p className="eyebrow eyebrow--on-dark mb-1">Shop by brand</p>
          <h1 className="display-5 fw-bolder mb-2">{categoryLabel(category)}</h1>
          <p className="lead mb-0 opacity-75">
            Explore every {categoryLabel(category).toLowerCase()} product, organised by brand.
          </p>
        </Container>
      </section>

      <section className="py-5">
        <Container>
          {/* Brand filter */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant={brandFilter === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setBrandFilter('all')}
            >
              All brands
            </Button>
            {brands.map((b) => (
              <Button
                key={b}
                size="sm"
                variant={brandFilter === b ? 'primary' : 'outline-primary'}
                onClick={() => setBrandFilter(b)}
              >
                {b}
              </Button>
            ))}
          </div>

          {/* Products grouped by brand */}
          {visibleGroups.map((group) => (
            <div key={group.brand} className="mb-5" id={`brand-${group.brand}`}>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-4">
                <h2 className="h3 fw-bolder mb-0">{group.brand}</h2>
                <span className="text-muted small">{group.items.length} item(s)</span>
              </div>
              <Row className="gx-4 gy-4">
                {group.items.map((p) => (
                  <Col key={p.id} sm={6} lg={4} xl={3}>
                    <ProductCard product={p} />
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Container>
      </section>
    </main>
  );
}