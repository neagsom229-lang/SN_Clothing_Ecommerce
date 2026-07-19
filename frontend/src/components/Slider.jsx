import { Link } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import Button from 'react-bootstrap/Button';
import { getMediaImage } from '../utils/images';
import { MEDIA } from '../data/media';

const slides = [
    {
        eyebrow: "Men's · New arrivals",
        title: 'New season, new you',
        text: 'Fresh menswear essentials — tees, denim, and jackets that go the distance.',
        cta: 'Shop men',
        to: '/products?category=men',
        category: 'men',
        imageKey: 'bannerMen'
    },
    {
        eyebrow: "Women's · Everyday edit",
        title: 'Effortless everyday style',
        text: 'Dresses, blouses, and layers designed to move with you.',
        cta: 'Shop women',
        to: '/products?category=women',
        category: 'women',
        imageKey: 'bannerWomen'
    },
    {
        eyebrow: "Kids' · Play-tested",
        title: 'Made for playtime',
        text: 'Comfortable, durable kidswear that keeps up with busy days.',
        cta: 'Shop kids',
        to: '/products?category=kids',
        category: 'kids',
        imageKey: 'bannerKids'
    },
    {
        eyebrow: "Shoes · Step up",
        title: 'Walk with confidence',
        text: 'From sneakers to boots — footwear that combines comfort, durability, and style for every occasion.',
        cta: 'Shop shoes',
        to: '/products?category=shoes',
        category: 'shoes',
        imageKey: 'bannerShoes'
    },
    {
        eyebrow: "Accessories · Final touch",
        title: 'Complete your look',
        text: 'Bags, belts, watches, and more — the perfect finishing touches to elevate any outfit.',
        cta: 'Shop accessories',
        to: '/products?category=accessories',
        category: 'accessories',
        imageKey: 'bannerAccessories'
    },
];

function Slider() {
    return (
        <Carousel fade>
            {slides.map((slide) => {
                const imageSrc = getMediaImage(slide.imageKey, MEDIA);
                return (
                    <Carousel.Item key={slide.title}>
                        <div 
                            className={`hero-slide category-hero category-hero--${slide.category}`}
                            style={{
                                backgroundImage: `url(${imageSrc})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="hero-slide__body">
                                <span className="eyebrow eyebrow--on-dark">{slide.eyebrow}</span>
                                <h1 className="hero-slide__title">{slide.title}</h1>
                                <p className="hero-slide__text">{slide.text}</p>
                                <Button as={Link} to={slide.to} variant="light" size="lg">
                                    {slide.cta}
                                </Button>
                            </div>
                        </div>
                    </Carousel.Item>
                );
            })}
        </Carousel>
    );
}

export default Slider;