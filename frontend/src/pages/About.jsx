// src/pages/About.jsx
import { coverImage, avatarImage, getMediaImage } from '../utils/images';
import { MEDIA } from '../data/media';

// Import team photos - USE THE EXACT FILENAME FROM YOUR FOLDER
import ibbiePhoto from '../assets/team/ibbie-eckart.jpg'; // ✅ Correct filename

// Comment out other imports until you add the photos
// import ardenPhoto from '../assets/team/arden-vasek.jpg';
// import toribioPhoto from '../assets/team/toribio-nerthus.jpg';
// import malvinaPhoto from '../assets/team/malvina-cilla.jpg';

const team = [
    { 
        name: 'Mr.Chheang Samnang', 
        role: 'Founder & CEO',
        photo: ibbiePhoto // ✅ Now uses real photo
    },
    { 
        name: 'Arden Vasek', 
        role: 'CFO',
        photo: null // Uses avatar fallback
    },
    { 
        name: 'Toribio Nerthus', 
        role: 'Operations Manager',
        photo: null // Uses avatar fallback
    },
    { 
        name: 'Malvina Cilla', 
        role: 'CTO',
        photo: null // Uses avatar fallback
    },
];

export default function About() {
    // Get real images from MEDIA with fallbacks
    const heroImage = getMediaImage('aboutHero', MEDIA) || getMediaImage('bannerMen', MEDIA);
    const foundingImage = getMediaImage('aboutStory', MEDIA) || getMediaImage('bannerWomen', MEDIA);
    const growthImage = getMediaImage('aboutGrowth', MEDIA) || getMediaImage('bannerKids', MEDIA);

    return (
        <main className="flex-shrink-0">
            {/* Header with Background Image */}
            <header 
                className="py-5"
                style={{
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '400px',
                    position: 'relative',
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                }} />
                <div className="container px-5" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-xxl-6">
                            <div className="text-center my-5">
                                <span className="eyebrow d-inline-flex" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                    Our story
                                </span>
                                <h1 className="fw-bolder mb-3" style={{ color: 'white' }}>
                                    Our mission is to make great style accessible to everyone.
                                </h1>
                                <p className="lead fw-normal mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    SN Clothing was built on a simple idea: quality
                                    clothing, shoes, and accessories should be easy to find, fairly
                                    priced, and backed by people who genuinely want to help. From
                                    your first order to lifelong support, we're here for it.
                                </p>
                                <a className="btn btn-primary btn-lg" href="#scroll-target">
                                    Read our story
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* About section one - Our founding */}
            <section className="py-5 bg-light" id="scroll-target">
                <div className="container px-5 my-5">
                    <div className="row gx-5 align-items-center">
                        <div className="col-lg-6">
                            <img
                                className="img-fluid rounded mb-5 mb-lg-0"
                                src={foundingImage}
                                alt="Our founding"
                                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = coverImage('Our founding', 'founding');
                                }}
                            />
                        </div>
                        <div className="col-lg-6">
                            <h2 className="fw-bolder">Our founding</h2>
                            <p className="lead fw-normal text-muted mb-0">
                                We built SN Clothing because we believe everyone deserves access to well-made, affordable fashion. From day one, our mission has been to cut through the noise—no gimmicks, no overpriced tags, just honest clothing that works for real life. We handpick every piece in our collection, focusing on fabrics that last, fits that flatter, and styles that transition effortlessly from work to weekend. Our team travels the world to 
                                find the best materials and partners who share our commitment to ethical production.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About section two - Growth & beyond */}
            <section className="py-5">
                <div className="container px-5 my-5">
                    <div className="row gx-5 align-items-center">
                        <div className="col-lg-6 order-first order-lg-last">
                            <img
                                className="img-fluid rounded mb-5 mb-lg-0"
                                src={growthImage}
                                alt="Growth and beyond"
                                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = coverImage('Growth & beyond', 'growth');
                                }}
                            />
                        </div>
                        <div className="col-lg-6">
                            <h2 className="fw-bolder">Growth &amp; beyond</h2>
                            <p className="lead fw-normal text-muted mb-0">
                                From our humble beginnings, SN Clothing has grown into a brand that's about more than just clothes—it's about community. We've created jobs, supported local artisans, and built connections with customers who share our passion for quality fashion. As we look to the future, we're focused on deepening our impact: supporting local economies, promoting sustainable practices, and making fashion more accessible to everyone. Our growth story is still being written, and we're grateful to 
                                have you along for the journey. Together, we're building something truly special.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team members section */}
            <section className="py-5 bg-light">
                <div className="container px-5 my-5">
                    <div className="text-center">
                        <h2 className="fw-bolder">Our team</h2>
                        <p className="lead fw-normal text-muted mb-5">
                            Dedicated to quality and your success
                        </p>
                    </div>
                    <div className="row gx-5 row-cols-1 row-cols-sm-2 row-cols-xl-4 justify-content-center">
                        {team.map((member) => {
                            // Use real photo if available, otherwise use avatar fallback
                            const memberImage = member.photo || avatarImage(member.name);
                            
                            return (
                                <div className="col mb-5" key={member.name}>
                                    <div className="text-center">
                                        <img
                                            className="img-fluid rounded-circle mb-4"
                                            src={memberImage}
                                            alt={member.name}
                                            style={{ 
                                                width: '150px', 
                                                height: '150px', 
                                                objectFit: 'cover',
                                                border: '3px solid #fff',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onError={(e) => {
                                                // If real photo fails, use avatar
                                                e.target.src = avatarImage(member.name);
                                            }}
                                        />
                                        <h5 className="fw-bolder">{member.name}</h5>
                                        <div className="fst-italic text-muted">{member.role}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </main>
    );
}