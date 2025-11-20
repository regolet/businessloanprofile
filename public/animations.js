// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    // Animate loan cards
    const loanCards = document.querySelectorAll('.loan-card');
    loanCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Animate steps
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.animationDelay = `${index * 0.15}s`;
        observer.observe(step);
    });

    // Animate FAQ items
    const faqItemsToAnimate = document.querySelectorAll('.faq-item');
    faqItemsToAnimate.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.animationDelay = `${index * 0.1}s`;
        observer.observe(item);
    });

    // Animate media logos
    const mediaLogos = document.querySelectorAll('.media-logo-img');
    mediaLogos.forEach((logo, index) => {
        logo.style.opacity = '0';
        logo.style.animation = 'fadeIn 0.5s ease-out forwards';
        logo.style.animationDelay = `${0.5 + index * 0.1}s`;
    });

    // Animate hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.animation = 'slideInLeft 0.8s ease-out forwards';
        heroContent.style.animationDelay = '0.2s';
    }

    // Animate hero image
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.opacity = '0';
        heroImage.style.animation = 'slideInRight 0.8s ease-out forwards';
        heroImage.style.animationDelay = '0.4s';
    }

    // Animate section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.style.opacity = '0';
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.6s ease-out forwards';
                    titleObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        titleObserver.observe(title);
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // FAQ accordion toggle
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add parallax effect to hero
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const hero = document.querySelector('.hero');
                if (hero && scrolled < hero.offsetHeight) {
                    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    });
});
