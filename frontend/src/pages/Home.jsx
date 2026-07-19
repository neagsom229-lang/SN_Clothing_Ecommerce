import { Link } from 'react-router-dom';
import Slider from '../components/Slider';
import ProductCard from '../components/ProductCard';
import products, { CATEGORIES } from '../data/products';
import { coverImage, avatarImage, CATEGORY_THEME, getMediaImage } from '../utils/images';
import { MEDIA } from '../data/media';

// Feature the top-rated product from each category, then fill to four.
const featured = (() => {
    const byRating = [...products].sort((a, b) => b.rating - a.rating);
    const picks = [];
    const seen = new Set();
    for (const p of byRating) {
        if (!seen.has(p.category)) {
            picks.push(p);
            seen.add(p.category);
        }
    }
    for (const p of byRating) {
        if (picks.length >= 4) break;
        if (!picks.includes(p)) picks.push(p);
    }
    return picks.slice(0, 4);
})();

const posts = [
    {
        title: 'How to build a capsule wardrobe',
        badge: 'Guide',
        author: 'Kelly Rowan',
        meta: 'March 12, 2026 · 6 min read',
        text: 'A handful of well-chosen pieces that mix and match into weeks of outfits.',
        img: getMediaImage('blog1', MEDIA),
    },
    {
        title: 'This season\u2019s must-have colours',
        badge: 'Trends',
        author: 'Josiah Barclay',
        meta: 'March 23, 2026 · 4 min read',
        text: 'From warm neutrals to bold accents — what to add to your rotation.',
        img: getMediaImage('blog2', MEDIA),
    },
    {
        title: 'Caring for your favourite fabrics',
        badge: 'Guide',
        author: 'Evelyn Martinez',
        meta: 'April 2, 2026 · 10 min read',
        text: 'Simple washing and storage habits that keep clothes looking new for longer.',
        img: getMediaImage('blog3', MEDIA),
    },
];

export default function Home() {
    return (
        <main className="flex-shrink-0">
            <Slider />

            {/* Shop by category */}
            <section className="py-5">
                <div className="container px-4 px-md-5">
                    <span className="eyebrow">Five departments, one cart</span>
                    <h2 className="mb-4">Shop by category</h2>
                    <div className="row gx-3 gy-3">
                        {CATEGORIES.map((c) => {
                            const bannerKey = `banner${c.key.charAt(0).toUpperCase() + c.key.slice(1)}`;
                            const categoryImage = getMediaImage(bannerKey, MEDIA);
                            
                            return (
                                <div className="col-6 col-md-4 col-lg" key={c.key}>
                                    <Link
                                        to={`/category/${c.key}`}
                                        className="category-tile"
                                        style={{
                                            backgroundImage: `url(${categoryImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    >
                                        <div className="category-tile-overlay">
                                            <i className={`bi ${c.icon} category-tile__icon`} />
                                            <span className="category-tile__label">{c.label}</span>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured products */}
            <section className="py-5">
                <div className="container px-4 px-md-5">
                    <div className="d-flex align-items-end justify-content-between mb-4">
                        <div>
                            <span className="eyebrow">This week's picks</span>
                            <h2 className="mb-0">Featured products</h2>
                        </div>
                        <Link to="/products" className="btn btn-outline-primary">
                            View all
                        </Link>
                    </div>
                    <div className="row gx-4 gy-4">
                        {featured.map((p) => (
                            <div className="col-sm-6 col-lg-3" key={p.id}>
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why shop with us */}
            <section className="py-5 bg-light" id="features">
                <div className="container px-5 my-4">
                    <div className="row gx-5">
                        <div className="col-lg-4 mb-5 mb-lg-0">
                            <span className="eyebrow">Why SN Clothing</span>
                            <h2 className="mb-3">Why shop with us</h2>
                            <p className="text-muted mb-4">
                                Curated styles, fair prices, and support that actually helps.
                            </p>
                            <Link className="btn btn-primary" to="/products">
                                Shop all products
                            </Link>
                        </div>
                        <div className="col-lg-8">
                            <div className="row gx-5 row-cols-1 row-cols-md-2">
                                <div className="col mb-5 h-100">
                                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                        <i className="bi bi-truck" />
                                    </div>
                                    <h2 className="h5">Free fast shipping</h2>
                                    <p className="mb-0">
                                        Free delivery on orders over $50, with most items
                                        arriving in two business days.
                                    </p>
                                </div>
                                <div className="col mb-5 h-100">
                                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                        <i className="bi bi-shield-lock" />
                                    </div>
                                    <h2 className="h5">Secure checkout</h2>
                                    <p className="mb-0">
                                        Pay with ABA, ACLEDA, Wing, or cash on delivery — your
                                        details stay protected.
                                    </p>
                                </div>
                                <div className="col mb-5 mb-md-0 h-100">
                                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                        <i className="bi bi-arrow-repeat" />
                                    </div>
                                    <h2 className="h5">30-day returns</h2>
                                    <p className="mb-0">
                                        Changed your mind? Send it back within 30 days for a
                                        full, no-questions-asked refund.
                                    </p>
                                </div>
                                <div className="col h-100">
                                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                        <i className="bi bi-headset" />
                                    </div>
                                    <h2 className="h5">24/7 support</h2>
                                    <p className="mb-0">
                                        Real people, ready to help any time of day via chat,
                                        email, or phone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <div className="py-5">
                <div className="container px-5 my-3">
                    <div className="row gx-5 justify-content-center">
                        <div className="col-lg-10 col-xl-7">
                            <div className="text-center">
                                <div className="fs-4 mb-4 fst-italic">
                                    "Ordered a jacket on Monday and it arrived two days later,
                                    perfectly packaged. Great prices and the support team
                                    actually answered on the first ring. I'll be back!"
                                </div>
                                <div className="d-flex align-items-center justify-content-center">
                                    <img
                                        className="rounded-circle me-3"
                                        width={40}
                                        height={40}
                                        src={avatarImage('Jordan Lee', 40)}
                                        alt="Jordan Lee"
                                    />
                                    <div className="fw-bold">
                                        Jordan Lee
                                        <span className="fw-bold text-primary mx-1">/</span>
                                        Verified buyer
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blog preview */}
            <section className="py-5 bg-light">
                <div className="container px-5 my-3">
                    <div className="row gx-5 justify-content-center">
                        <div className="col-lg-8 col-xl-6">
                            <div className="text-center">
                                <span className="eyebrow d-inline-flex">From the journal</span>
                                <h2 className="fw-bolder">From our blog</h2>
                                <p className="lead fw-normal text-muted mb-5">
                                    Guides, edits, and news to help you pick the right pieces.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="row gx-5">
                        {posts.map((post) => (
                            <div className="col-lg-4 mb-5" key={post.title}>
                                <div className="card h-100 shadow border-0">
                                    <img
                                        className="card-img-top blog-cover"
                                        src={post.img || coverImage(post.title)}
                                        alt={post.title}
                                        onError={(e) => {
                                            e.target.src = coverImage(post.title);
                                        }}
                                    />
                                    <div className="card-body p-4">
                                        <div className="badge bg-primary bg-gradient rounded-pill mb-2">
                                            {post.badge}
                                        </div>
                                        <a
                                            className="text-decoration-none link-dark stretched-link"
                                            href="#!"
                                        >
                                            <h5 className="card-title mb-3">{post.title}</h5>
                                        </a>
                                        <p className="card-text mb-0">{post.text}</p>
                                    </div>
                                    <div className="card-footer p-4 pt-0 bg-transparent border-top-0">
                                        <div className="d-flex align-items-center">
                                            <img
                                                className="rounded-circle me-3"
                                                width={40}
                                                height={40}
                                                src={avatarImage(post.author, 40)}
                                                alt={post.author}
                                            />
                                            <div className="small">
                                                <div className="fw-bold">{post.author}</div>
                                                <div className="text-muted">{post.meta}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Newsletter call to action */}
                    <aside className="bg-primary bg-gradient rounded-3 p-4 p-sm-5 mt-2">
                        <div className="d-flex align-items-center justify-content-between flex-column flex-xl-row text-center text-xl-start">
                            <div className="mb-4 mb-xl-0">
                                <div className="fs-3 fw-bold text-white">
                                    New products, delivered to you.
                                </div>
                                <div className="text-white-50">
                                    Sign up for our newsletter for the latest updates.
                                </div>
                            </div>
                            <div className="ms-xl-4">
                                <div className="input-group mb-2">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Email address..."
                                        aria-label="Email address..."
                                        aria-describedby="button-newsletter"
                                    />
                                    <button
                                        className="btn btn-outline-light"
                                        id="button-newsletter"
                                        type="button"
                                    >
                                        Sign up
                                    </button>
                                </div>
                                <div className="small text-white-50">
                                    We care about privacy, and will never share your data.
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}