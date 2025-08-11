// DOM завантажений
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Головна функція ініціалізації
function initializeApp() {
    initMobileMenu();
    initScrollEffects();
    initSmoothScrolling();
    initScrollAnimations();
    initPortfolioEffects();
    initServiceCards();
    initOrderModal();
    loadDynamicContent();
}

// Мобільне меню
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            
            if (navMenu.classList.contains('active')) {
                icon.className = 'fas fa-times';
                document.body.style.overflow = 'hidden'; // Блокуємо скрол
            } else {
                icon.className = 'fas fa-bars';
                document.body.style.overflow = ''; // Розблоковуємо скрол
            }
        });

        // Закриваємо меню при кліку на посилання
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                document.body.style.overflow = '';
            });
        });

        // Закриваємо меню при кліку поза ним
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                document.body.style.overflow = '';
            }
        });
    }
}

// Ефекти скролу для хедера
function initScrollEffects() {
    const header = document.getElementById('header');
    
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Плавний скрол для навігації
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Анімації при скролі
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Додаємо спостереження для всіх елементів з класом fade-in
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Ефекти для портфоліо
function initPortfolioEffects() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach((item, index) => {
        // Додаємо затримку для анімації
        item.style.animationDelay = `${index * 0.1}s`;
        
        // Клік для переходу на сторінку портфоліо
        item.addEventListener('click', () => {
            // Визначаємо категорію на основі заголовка
            const title = item.querySelector('h3')?.textContent || '';
            let category = 'all';
            
            if (title.toLowerCase().includes('індивідуальн')) category = 'individual';
            else if (title.toLowerCase().includes('сімейн')) category = 'family';
            else if (title.toLowerCase().includes('творч')) category = 'creative';
            else if (title.toLowerCase().includes('бренд')) category = 'brand';
            
            // Переходимо на сторінку портфоліо з параметром категорії
            window.location.href = `portfolio.html?category=${category}`;
        });
        
        // Додаємо cursor pointer
        item.style.cursor = 'pointer';
    });
}

// Модальне вікно для зображень
function openImageModal(src, alt, title) {
    // Створюємо модальне вікно
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${src}" alt="${alt}" loading="lazy">
                <h3>${title}</h3>
            </div>
        </div>
    `;
    
    // Додаємо стилі для модального вікна
    const modalStyles = `
        .image-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            padding: 1rem;
        }
        
        .modal-content {
            max-width: 90vw;
            max-height: 90vh;
            text-align: center;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content img {
            max-width: 100%;
            max-height: calc(90vh - 80px);
            object-fit: contain;
            border-radius: 10px;
            display: block;
        }
        
        .modal-content h3 {
            color: white;
            margin-top: 1rem;
            font-size: 1.2rem;
            font-weight: 400;
            max-width: 100%;
            word-wrap: break-word;
        }
        
        .modal-close {
            position: absolute;
            top: -50px;
            right: -10px;
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
        }
        
        .modal-close:hover {
            background: rgba(255,255,255,0.2);
        }
        
        @media (max-width: 768px) {
            .image-modal {
                padding: 0.5rem;
            }
            
            .modal-content {
                max-width: 95vw;
                max-height: 95vh;
            }
            
            .modal-content img {
                max-height: calc(95vh - 100px);
                border-radius: 8px;
            }
            
            .modal-content h3 {
                font-size: 1rem;
                margin-top: 0.8rem;
                padding: 0 0.5rem;
            }
            
            .modal-close {
                top: -45px;
                right: -5px;
                font-size: 1.8rem;
                width: 36px;
                height: 36px;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    // Додаємо стилі до документа
    if (!document.querySelector('#modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Додаємо модальне вікно до сторінки
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Закриття модального вікна
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });
    
    // Закриття на Escape
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Ефекти для карток послуг
function initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
        // Анімаційна затримка
        card.style.animationDelay = `${index * 0.15}s`;
        
        // Hover ефекти
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(-10px) scale(1)';
        });
    });
}

// Ініціалізація модального вікна замовлення
function initOrderModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('closeOrderModal');
    const form = document.getElementById('orderForm');
    
    if (!modal || !closeBtn || !form) return;
    
    // Відкриття модального вікна при кліку на кнопки замовлення
    document.addEventListener('click', (e) => {
        if (e.target.matches('.service-order-btn')) {
            e.preventDefault();
            const serviceCard = e.target.closest('.service-card');
            let serviceName = 'Фотосесія';
            
            if (serviceCard) {
                const serviceTitle = serviceCard.querySelector('h3');
                serviceName = serviceTitle ? serviceTitle.textContent : serviceName;
            }
            
            document.getElementById('modalServiceName').textContent = serviceName.toLowerCase();
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    });
    
    // Закриття модального вікна
    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        form.reset();
    };
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Відправка форми
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Відправляється...';
        
        const formData = {
            name: document.getElementById('orderName').value,
            phone: document.getElementById('orderPhone').value,
            email: document.getElementById('orderEmail').value,
            service: document.getElementById('modalServiceName').textContent,
            date: document.getElementById('orderDate').value,
            message: document.getElementById('orderMessage').value
        };
        
        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Замовлення успішно відправлено! Ми зв\'яжемося з вами найближчим часом.');
                closeModal();
            } else {
                alert('Помилка відправки замовлення. Спробуйте ще раз або зателефонуйте.');
            }
        } catch (error) {
            console.error('Error sending order:', error);
            alert('Помилка відправки замовлення. Перевірте з\'єднання з інтернетом.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити замовлення';
        }
    });
}

// Завантаження динамічного контенту
async function loadDynamicContent() {
    try {
        await Promise.all([
            loadServices(),
            loadPortfolio()
        ]);
    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

// Завантаження послуг з API
async function loadServices() {
    try {
        console.log('Loading services from API...');
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Failed to load services');
        }
        
        const services = await response.json();
        console.log('Services loaded:', services);
        const servicesGrid = document.getElementById('services-grid');
        
        if (servicesGrid && services.length > 0) {
            servicesGrid.innerHTML = services.map(service => `
                <div class="service-card fade-in">
                    <i class="${service.icon}"></i>
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-price">від ${service.price} грн</div>
                    <button class="service-order-btn">Замовити</button>
                </div>
            `).join('');
            
            console.log('Services grid updated');
            
            // Повторно ініціалізуємо ефекти для нових елементів
            initServiceCards();
            initScrollAnimations();
        } else {
            console.log('No services found or services grid not found');
        }
    } catch (error) {
        console.error('Error loading services:', error);
        // Показати помилку користувачу
        const servicesGrid = document.getElementById('services-grid');
        if (servicesGrid) {
            servicesGrid.innerHTML = `
                <div class="error-message">
                    <p>Помилка завантаження послуг. Спробуйте оновити сторінку.</p>
                </div>
            `;
        }
    }
}

// Завантаження портфоліо з API (обмежено 9 фото)
async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) {
            throw new Error('Failed to load portfolio');
        }
        
        const allPortfolio = await response.json();
        const portfolioGrid = document.getElementById('portfolio-grid');
        
        if (portfolioGrid && allPortfolio.length > 0) {
            // Групуємо по категоріях
            const categories = {
                individual: [],
                family: [],
                creative: [],
                brand: [],
                other: []
            };
            
            // Розподіляємо фото по категоріях
            allPortfolio.forEach(item => {
                const category = item.category || getCategoryFromTitle(item.title);
                if (categories[category]) {
                    categories[category].push(item);
                } else {
                    categories.other.push(item);
                }
            });
            
            // Вибираємо по 2 фото з кожної категорії + 1 рандомне
            let selectedPortfolio = [];
            
            // По 2 фото з кожної основної категорії
            Object.keys(categories).forEach(category => {
                if (category !== 'other' && categories[category].length > 0) {
                    const shuffled = categories[category].sort(() => 0.5 - Math.random());
                    selectedPortfolio.push(...shuffled.slice(0, 2));
                }
            });
            
            // Додаємо рандомне фото якщо є місце
            if (selectedPortfolio.length < 9) {
                const remaining = allPortfolio.filter(item => !selectedPortfolio.includes(item));
                const shuffledRemaining = remaining.sort(() => 0.5 - Math.random());
                selectedPortfolio.push(...shuffledRemaining.slice(0, 9 - selectedPortfolio.length));
            }
            
            // Обмежуємо до 9 фото і перемішуємо
            selectedPortfolio = selectedPortfolio.slice(0, 9).sort(() => 0.5 - Math.random());
            
            portfolioGrid.innerHTML = selectedPortfolio.map(item => `
                <div class="portfolio-item fade-in">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                    <div class="portfolio-overlay">
                        <h3>${item.title}</h3>
                        ${item.description ? `<p>${item.description}</p>` : ''}
                    </div>
                </div>
            `).join('');
            
            // Повторно ініціалізуємо ефекти для нових елементів
            initPortfolioEffects();
            initScrollAnimations();
        }
    } catch (error) {
        console.error('Error loading portfolio:', error);
        // Залишаємо статичний контент якщо API недоступне
    }
}

// Допоміжна функція для визначення категорії з назви (якщо немає category поля)
function getCategoryFromTitle(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('індивідуальн') || titleLower.includes('портрет')) return 'individual';
    if (titleLower.includes('сімейн') || titleLower.includes('родин')) return 'family';
    if (titleLower.includes('творч') || titleLower.includes('арт')) return 'creative';
    if (titleLower.includes('бренд') || titleLower.includes('комерц')) return 'brand';
    return 'individual'; // за замовчуванням
}

// Оптимізація продуктивності
function initPerformanceOptimizations() {
    // Lazy loading для зображень
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Debounce для scroll подій
    let scrollTimeout;
    const originalScrollHandler = window.onscroll;
    
    window.onscroll = function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            if (originalScrollHandler) {
                originalScrollHandler();
            }
        }, 16); // ~60fps
    };
}

// Обробка помилок
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('JavaScript error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
}

// Аналітика та відстеження (якщо потрібно)
function initAnalytics() {
    // Відстеження кліків на кнопки замовлення
    document.querySelectorAll('.cta-button, .service-order-btn').forEach(button => {
        button.addEventListener('click', () => {
            const buttonType = button.classList.contains('cta-button') ? 'hero-cta' : 'service-order';
            const serviceName = button.closest('.service-card')?.querySelector('h3')?.textContent || 'general';
            console.log(`Order button clicked: ${buttonType} - ${serviceName}`);
        });
    });
    
    // Відстеження контактних посилань
    document.querySelectorAll('.contact-icons a, .footer-contact a').forEach(link => {
        link.addEventListener('click', () => {
            const type = link.href.includes('tel:') ? 'phone' : 
                        link.href.includes('mailto:') ? 'email' : 'social';
            console.log(`Contact link clicked: ${type}`);
        });
    });
}

// Ініціалізація додаткових функцій після завантаження
window.addEventListener('load', () => {
    initPerformanceOptimizations();
    setupErrorHandling();
    initAnalytics();
});

// Експорт функцій для можливого використання в інших скриптах
window.PhotographerSite = {
    loadServices,
    loadPortfolio,
    openImageModal
};