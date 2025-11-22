/**
 * Dynamic Content Loader
 * Loads dynamic content from the database and populates the index.html page
 */

const API_BASE = 'api';

// Load all dynamic content on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllDynamicContent();
});

async function loadAllDynamicContent() {
    console.log('Starting to load dynamic content...');

    try {
        // Load settings and dynamic content in parallel
        const [settings, heroFeatures, loanTypes, howItWorksSteps, faqs] = await Promise.all([
            fetchSettings(),
            fetchDynamicContent('hero_features'),
            fetchDynamicContent('loan_types'),
            fetchDynamicContent('how_it_works'),
            fetchDynamicContent('faqs')
        ]);

        console.log('Loaded data:', { settings, heroFeatures, loanTypes, howItWorksSteps, faqs });

        // Populate the page
        if (settings) {
            populateHeroSection(settings);
            populateLoanTypesSection(settings, loanTypes);
            populateHowItWorksSection(settings, howItWorksSteps);
        } else {
            console.error('No settings loaded!');
        }

        if (heroFeatures) populateHeroFeatures(heroFeatures);
        if (faqs) populateFAQs(faqs, settings);

        console.log('Dynamic content loading complete!');

    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

async function fetchSettings() {
    try {
        const response = await fetch(`${API_BASE}/public-settings.php`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
    return null;
}

async function fetchDynamicContent(type) {
    try {
        const response = await fetch(`${API_BASE}/public-content.php?type=${type}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
    }
    return [];
}

// Populate Hero Section
function populateHeroSection(settings) {
    const hero = settings.hero;
    if (!hero) return;

    console.log('Populating hero section with:', hero);

    // Hero title
    const titleEl = document.querySelector('.hero-content h1');
    if (titleEl && hero.title) {
        titleEl.textContent = hero.title.value;
        console.log('Updated hero title to:', hero.title.value);
    }

    // Hero subtitle
    const subtitleEl = document.querySelector('.hero-subtitle');
    if (subtitleEl && hero.subtitle) {
        subtitleEl.textContent = hero.subtitle.value;
        console.log('Updated hero subtitle');
    }

    // CTA button text
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton && hero.cta_text) {
        ctaButton.textContent = hero.cta_text.value + ' →';
        console.log('Updated CTA button');
    }

    // Hero note
    const noteEl = document.querySelector('.hero-note');
    if (noteEl && hero.note) {
        noteEl.textContent = hero.note.value;
        console.log('Updated hero note');
    }

    // Hero image
    const imageEl = document.querySelector('.hero-image img');
    if (imageEl && hero.image_url) {
        imageEl.src = hero.image_url.value;
        console.log('Updated hero image');
    }
}

// Populate Hero Features (the 3 checkmarks)
function populateHeroFeatures(features) {
    const container = document.querySelector('.hero-features');
    if (!container || features.length === 0) return;

    // Clear existing features
    container.innerHTML = '';

    // Sort by order_index
    const sortedFeatures = features.sort((a, b) => a.order_index - b.order_index);

    // Add each feature
    sortedFeatures.forEach(feature => {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'feature';
        featureDiv.innerHTML = `
            <svg class="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>${escapeHtml(feature.feature_text)}</span>
        `;
        container.appendChild(featureDiv);
    });
}

// Populate Loan Types Section
function populateLoanTypesSection(settings, loanTypes) {
    console.log('Populating loan types with settings:', settings.loan_types, 'and data:', loanTypes);

    // Section titles
    if (settings.loan_types) {
        const titleEl = document.querySelector('#loan-types .section-title');
        if (titleEl && settings.loan_types.section_title) {
            titleEl.textContent = settings.loan_types.section_title.value;
            console.log('Updated loan types title');
        }

        const subtitleEl = document.querySelector('#loan-types .section-subtitle');
        if (subtitleEl && settings.loan_types.section_subtitle) {
            subtitleEl.textContent = settings.loan_types.section_subtitle.value;
            console.log('Updated loan types subtitle');
        }
    }

    // Loan type cards
    const container = document.querySelector('.loan-grid');
    if (!container) {
        console.error('Loan grid container not found!');
        return;
    }

    if (loanTypes.length === 0) {
        console.log('No loan types to display');
        return;
    }

    // Clear existing cards (keep only dynamic ones)
    container.innerHTML = '';

    // Sort by order_index
    const sortedTypes = loanTypes.sort((a, b) => a.order_index - b.order_index);

    // Add each loan type card
    sortedTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = 'loan-card';

        // Add featured class if applicable
        if (type.is_featured == 1) {
            card.classList.add('featured');
        }

        // Parse features if they exist
        let featuresHTML = '';
        if (type.features) {
            try {
                const features = JSON.parse(type.features);
                if (features.length > 0) {
                    featuresHTML = '<ul class="loan-features">';
                    features.forEach(feature => {
                        featuresHTML += `
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                ${escapeHtml(feature)}
                            </li>
                        `;
                    });
                    featuresHTML += '</ul>';
                }
            } catch (e) {
                console.error('Error parsing loan type features:', e);
            }
        }

        // Add badge if featured
        const badgeHTML = type.is_featured == 1 ? '<span class="badge">MOST POPULAR</span>' : '';

        card.innerHTML = `
            ${badgeHTML}
            <div class="loan-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${getIconPath(type.icon_name)}
                </svg>
                <h3>${escapeHtml(type.title)}</h3>
            </div>
            <p>${escapeHtml(type.description || '')}</p>
            ${featuresHTML}
        `;
        container.appendChild(card);
    });
}

// Populate How It Works Section
function populateHowItWorksSection(settings, steps) {
    console.log('Populating how it works with settings:', settings.how_it_works, 'and data:', steps);

    // Section titles
    if (settings.how_it_works) {
        const titleEl = document.querySelector('#how-it-works .section-title');
        if (titleEl && settings.how_it_works.section_title) {
            titleEl.textContent = settings.how_it_works.section_title.value;
            console.log('Updated how it works title');
        }

        const subtitleEl = document.querySelector('#how-it-works .section-subtitle');
        if (subtitleEl && settings.how_it_works.section_subtitle) {
            subtitleEl.textContent = settings.how_it_works.section_subtitle.value;
            console.log('Updated how it works subtitle');
        }
    }

    // Steps
    const container = document.querySelector('.steps');
    if (!container) {
        console.error('Steps container not found!');
        return;
    }

    if (steps.length === 0) {
        console.log('No steps to display');
        return;
    }

    // Clear existing steps
    container.innerHTML = '';

    // Sort by order_index
    const sortedSteps = steps.sort((a, b) => a.order_index - b.order_index);

    // Add each step
    sortedSteps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';

        const imageHTML = step.image_url
            ? `<img src="${escapeHtml(step.image_url)}" alt="${escapeHtml(step.title)}" class="step-image">`
            : '';

        stepDiv.innerHTML = `
            <div class="step-number">${step.step_number}</div>
            ${imageHTML}
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.description || '')}</p>
        `;
        container.appendChild(stepDiv);
    });
}

// Populate FAQs
function populateFAQs(faqs, settings) {
    console.log('Populating FAQs with data:', faqs);

    const container = document.querySelector('.faq-grid');
    if (!container) {
        console.error('FAQ container not found!');
        return;
    }

    if (faqs.length === 0) {
        console.log('No FAQs to display');
        return;
    }

    // Clear existing FAQs
    container.innerHTML = '';

    // Sort by order_index
    const sortedFAQs = faqs.sort((a, b) => a.order_index - b.order_index);

    // Add each FAQ
    sortedFAQs.forEach(faq => {
        const faqDiv = document.createElement('div');
        faqDiv.className = 'faq-item';
        faqDiv.innerHTML = `
            <div class="faq-question">
                ${escapeHtml(faq.question)}
                <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>
            <div class="faq-answer">
                <p>${escapeHtml(faq.answer)}</p>
            </div>
        `;
        container.appendChild(faqDiv);

        // Add click handler for toggle
        const questionEl = faqDiv.querySelector('.faq-question');
        questionEl.addEventListener('click', () => {
            faqDiv.classList.toggle('active');
        });
    });
}

// Helper function to get icon SVG path
function getIconPath(iconName) {
    const icons = {
        // Time & Calendar
        'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',

        // Finance & Money
        'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
        'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
        'trending-down': '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',

        // Business & Documents
        'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        'package': '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',

        // Tools & Actions
        'refresh': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        'rotate-cw': '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
        'settings': '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>',
        'tool': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

        // Charts & Analytics
        'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
        'pie-chart': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
        'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',

        // Communication
        'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
        'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',

        // Other useful icons
        'check': '<polyline points="20 6 9 17 4 12"/>',
        'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    };
    return icons[iconName] || icons['file-text'];
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
