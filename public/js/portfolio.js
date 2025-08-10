// Portfolio Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initPortfolioPage();
});

function initPortfolioPage() {
    initPortfolioFilter();
    initImageModal();
    loadPortfolioItems();
    
    // Читаємо параметр категорії з URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category && category !== 'all') {
        // Затримуємо активацію фільтра щоб дати час завантажитись елементам
        setTimeout(() => {
            const filterBtn = document.querySelector(`[data-filter="${category}"]`);
            if (filterBtn) {
                filterBtn.click();
            }
        }, 500);
    }
}

// Фільтрація портфоліо
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Зміна активної кнопки
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const portfolioItems = document.querySelectorAll('.portfolio-item');
            
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    item.style.animation = 'slideIn 0.5s ease';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Модальне вікно для зображень
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const closeBtn = modal.querySelector('.close-modal');
    
    if (!modal || !modalImg || !modalCaption || !closeBtn) return;
    
    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
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
    
    // Додаємо обробники для кліку на зображення
    document.addEventListener('click', (e) => {
        if (e.target.matches('.portfolio-item img')) {
            const img = e.target;
            const item = img.closest('.portfolio-item');
            const title = item.querySelector('h3')?.textContent || '';
            const description = item.querySelector('p')?.textContent || '';
            
            modalImg.src = img.src;
            modalImg.alt = img.alt;
            modalCaption.innerHTML = `<strong>${title}</strong><br>${description}`;
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    });
}

// Завантаження елементів портфоліо з API
async function loadPortfolioItems() {
    try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) {
            throw new Error('Failed to load portfolio');
        }
        
        const portfolio = await response.json();
        const gallery = document.getElementById('portfolioGallery');
        
        if (gallery && portfolio.length > 0) {
            gallery.innerHTML = portfolio.map((item, index) => `
                <div class="portfolio-item" data-category="${getCategoryFromTitle(item.title)}" style="animation-delay: ${index * 0.1}s">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                    <div class="portfolio-item-content">
                        <div class="portfolio-item-category">${getCategoryName(getCategoryFromTitle(item.title))}</div>
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                </div>
            `).join('');
            
            // Ініціалізація анімацій для нових елементів
            initPortfolioAnimations();
        } else {
            // Показуємо заглушку якщо немає елементів
            gallery.innerHTML = `
                <div class="portfolio-empty">
                    <p>Портфоліо поповнюється. Слідкуйте за оновленнями!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading portfolio:', error);
        // Показуємо статичні елементи або заглушку
        displayFallbackPortfolio();
    }
}

// Визначення категорії з назви
function getCategoryFromTitle(title) {
    const categoryKeywords = {
        'individual': ['індивідуальн', 'портрет', 'персональн'],
        'family': ['сімейн', 'родин', 'дітей', 'дитячі'],
        'creative': ['творч', 'арт', 'концепт', 'художн'],
        'brand': ['бренд', 'комерц', 'бізнес', 'корпорат']
    };
    
    const titleLower = title.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => titleLower.includes(keyword))) {
            return category;
        }
    }
    
    return 'individual'; // За замовчуванням
}

// Отримання назви категорії
function getCategoryName(category) {
    const names = {
        'individual': 'Індивідуальні',
        'family': 'Сімейні',
        'creative': 'Творчі',
        'brand': 'Бренди'
    };
    
    return names[category] || 'Інше';
}

// Анімації для елементів портфоліо
function initPortfolioAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    document.querySelectorAll('.portfolio-item').forEach(item => {
        observer.observe(item);
    });
}

// Фолбек портфоліо якщо API недоступне
function displayFallbackPortfolio() {
    const gallery = document.getElementById('portfolioGallery');
    if (gallery) {
        gallery.innerHTML = `
            <div class="portfolio-item" data-category="individual">
                <img src="/uploads/placeholder-1.jpg" alt="Індивідуальна фотосесія" loading="lazy">
                <div class="portfolio-item-content">
                    <div class="portfolio-item-category">Індивідуальні</div>
                    <h3>Індивідуальна фотосесія</h3>
                    <p>Персональна фотосесія в студії</p>
                </div>
            </div>
            <div class="portfolio-item" data-category="family">
                <img src="/uploads/placeholder-2.jpg" alt="Сімейна фотосесія" loading="lazy">
                <div class="portfolio-item-content">
                    <div class="portfolio-item-category">Сімейні</div>
                    <h3>Сімейна фотосесія</h3>
                    <p>Теплі моменти з родиною</p>
                </div>
            </div>
            <div class="portfolio-item" data-category="creative">
                <img src="/uploads/placeholder-3.jpg" alt="Творча зйомка" loading="lazy">
                <div class="portfolio-item-content">
                    <div class="portfolio-item-category">Творчі</div>
                    <h3>Творча зйомка</h3>
                    <p>Концептуальна фотографія</p>
                </div>
            </div>
            <div class="portfolio-item" data-category="brand">
                <img src="/uploads/placeholder-4.jpg" alt="Брендінг фото" loading="lazy">
                <div class="portfolio-item-content">
                    <div class="portfolio-item-category">Бренди</div>
                    <h3>Брендінг фото</h3>
                    <p>Комерційна фотозйомка</p>
                </div>
            </div>
        `;
        
        initPortfolioAnimations();
    }
}