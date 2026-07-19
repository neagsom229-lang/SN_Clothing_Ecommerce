import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { categoryLabel } from '../data/products';
import { getSizesForCategory } from '../utils/sizes';
import { getProductImage, productImage } from '../utils/images';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Products with a size run (apparel, shoes) can't be added straight from
  // the grid — send the shopper to the PDP to choose a size first, the way
  // Zara/ASOS-style stores do. Accessories have no sizes, so they add instantly.
  const needsSize = Boolean(getSizesForCategory(product.category));

  const handleAdd = () => {
    if (needsSize) {
      navigate(`/product/${product.id}`);
      return;
    }
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const onSale = product.compareAtPrice > product.price;
  const discountPct = onSale
    ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : 0;

  // Get the product image (real or SVG fallback)
  const imageSrc = getProductImage(product);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Use SVG fallback
      const fallbackSrc = productImage({
        name: product.name,
        brand: product.brand,
        category: product.category,
        icon: product.icon || 'shirt'
      });
      // Set the image src to fallback
      const imgElement = document.querySelector(`img[src="${imageSrc}"]`);
      if (imgElement) {
        imgElement.src = fallbackSrc;
      }
    }
  };

  return (
    <Card className="h-100 shadow-sm border-0 product-card">
      <div className="card-img-wrap">
        <div className="card-corner-stack card-corner-stack--right">
          {product.isNew && <span className="tag-chip cat-accessories">New</span>}
          {onSale && <span className="tag-chip cat-women">-{discountPct}%</span>}
          <button
            type="button"
            className={`wishlist-btn${wishlisted ? ' is-active' : ''}`}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={() => setWishlisted((w) => !w)}
          >
            <i className={`bi ${wishlisted ? 'bi-heart-fill' : 'bi-heart'}`} />
          </button>
        </div>
        <Link to={`/product/${product.id}`} className="text-decoration-none d-block">
          <span className={`tag-chip card-corner-tag cat-${product.category}`}>
            {categoryLabel(product.category)}
          </span>
          <Card.Img 
            variant="top" 
            src={imageSrc} 
            alt={product.name}
            onError={handleImageError}
          />
        </Link>
        <button type="button" className="card-quick-add" onClick={handleAdd}>
          {needsSize ? (
            <>
              <i className="bi bi-rulers me-1" />
              Select size
            </>
          ) : (
            <>
              <i className={`bi ${added ? 'bi-check-lg' : 'bi-cart-plus'} me-1`} />
              {added ? 'Added to cart' : 'Quick add'}
            </>
          )}
        </button>
      </div>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="card-brand">{product.brand}</span>
          <span className="text-warning small">
            <i className="bi bi-star-fill me-1" />
            {product.rating}
          </span>
        </div>
        <Card.Title className="h6">
          <Link to={`/product/${product.id}`} className="text-decoration-none link-dark">
            {product.name}
          </Link>
        </Card.Title>
        <Card.Text className="text-muted small flex-grow-1">
          {product.description}
        </Card.Text>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <span>
            <span className="card-price">{formatPrice(product.price)}</span>
            {onSale && (
              <span className="card-price-compare ms-2">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </span>
          {/* <Button
            variant={added ? 'success' : 'primary'}
            size="sm"
            onClick={handleAdd}
          >
            {needsSize ? (
              <>
                <i className="bi bi-rulers me-1" />
                Select size
              </>
            ) : (
              <>
                <i className={`bi ${added ? 'bi-check-lg' : 'bi-cart-plus'} me-1`} />
                {added ? 'Added' : 'Add'}
              </>
            )}
          </Button> */}
        </div>
      </Card.Body>
    </Card>
  );
}