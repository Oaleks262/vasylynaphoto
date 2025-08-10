// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
});

let authToken = localStorage.getItem('adminToken');

function initAdminPanel() {
    if (authToken) {
        showAdminPanel();
        loadAdminData();
    } else {
        showLoginForm();
    }
    
    initLoginForm();
    initTabs();
    initLogout();
    initChangePasswordForm();
}

// Показ форми логіну
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

// Показ адмін панелі
function showAdminPanel() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

// Ініціалізація форми логіну
function initLoginForm() {
    const form = document.querySelector('.login-form');
    const errorDiv = document.getElementById('loginError');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> Входжу...';
        errorDiv.textContent = '';
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                authToken = data.token;
                localStorage.setItem('adminToken', authToken);
                showAdminPanel();
                loadAdminData();
            } else {
                errorDiv.textContent = data.error || 'Помилка входу';
            }
        } catch (error) {
            errorDiv.textContent = 'Помилка з\'єднання';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Увійти';
        }
    });
}

// Ініціалізація табів
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Зміна активного табу
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Показ відповідного контенту
            tabContents.forEach(content => {
                content.style.display = content.id === tabName + 'Tab' ? 'block' : 'none';
            });
        });
    });
}

// Logout функціонал
function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        authToken = null;
        showLoginForm();
    });
}

// Завантаження даних адмін панелі
async function loadAdminData() {
    await Promise.all([
        loadServices(),
        loadPortfolio()
    ]);
}

// Завантаження послуг
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        const servicesList = document.getElementById('servicesList');
        
        servicesList.innerHTML = services.map(service => `
            <div class="service-item">
                <div class="service-header">
                    <h3>${service.name}</h3>
                    <div class="service-price">${service.price} грн</div>
                </div>
                <p>${service.description}</p>
                <div class="service-edit">
                    <input type="number" id="price-${service.id}" value="${service.price}" min="0">
                    <button onclick="updateServicePrice(${service.id})" type="button" class="update-btn">Оновити ціну</button>
                </div>
            </div>
        `).join('');
        
        console.log(`Loaded ${services.length} services in admin panel`);
    } catch (error) {
        console.error('Error loading services:', error);
        showMessage('Помилка завантаження послуг', 'error');
    }
}

// Оновлення ціни послуги
async function updateServicePrice(serviceId) {
    console.log(`updateServicePrice called with serviceId: ${serviceId}`);
    
    const priceInput = document.getElementById(`price-${serviceId}`);
    if (!priceInput) {
        console.error(`Price input not found for service ${serviceId}`);
        showMessage('Помилка: поле ціни не знайдено', 'error');
        return;
    }
    
    const price = parseInt(priceInput.value);
    console.log(`Input value: ${priceInput.value}, parsed price: ${price}`);
    
    if (isNaN(price) || price < 0) {
        showMessage('Введіть коректну ціну', 'error');
        return;
    }
    
    if (!authToken) {
        showMessage('Помилка авторизації. Увійдіть знову.', 'error');
        return;
    }
    
    try {
        console.log(`Updating service ${serviceId} price to ${price}`);
        const response = await fetch(`/api/admin/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ price })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            showMessage('Ціна оновлена успішно', 'success');
            setTimeout(() => {
                loadServices(); // Перезавантажуємо список після короткої затримки
            }, 500);
        } else {
            showMessage(data.error || `Помилка ${response.status}: ${response.statusText}`, 'error');
        }
    } catch (error) {
        console.error('Error updating price:', error);
        showMessage(`Помилка з'єднання: ${error.message}`, 'error');
    }
}

// Завантаження портфоліо
async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();
        const portfolioList = document.getElementById('portfolioList');
        
        portfolioList.innerHTML = portfolio.map(item => `
            <div class="portfolio-item">
                <img src="${item.image}" alt="${item.title}" class="portfolio-item-image">
                <div class="portfolio-item-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="portfolio-item-actions">
                        <button onclick="deletePortfolioItem(${item.id})" class="delete-btn">Видалити</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Ініціалізація форми завантаження фото
        initBulkUploadForm();
    } catch (error) {
        console.error('Error loading portfolio:', error);
        showMessage('Помилка завантаження портфоліо', 'error');
    }
}


// Видалення елемента портфоліо
async function deletePortfolioItem(itemId) {
    if (!confirm('Ви впевнені, що хочете видалити це фото?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/portfolio/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Фото видалено', 'success');
            loadPortfolio(); // Перезавантажуємо портфоліо
        } else {
            showMessage(data.error || 'Помилка видалення', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showMessage('Помилка видалення', 'error');
    }
}

// Показ повідомлень
function showMessage(text, type) {
    // Видаляємо попередні повідомлення
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Додаємо повідомлення до активного табу
    const activeTab = document.querySelector('.tab-content:not([style*="display: none"])');
    if (activeTab) {
        activeTab.insertBefore(message, activeTab.firstChild);
        
        // Автоматичне приховування через 5 секунд
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Ініціалізація форми масового завантаження
function initBulkUploadForm() {
    const form = document.getElementById('bulkUploadForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const files = document.getElementById('bulkFiles').files;
        const category = document.getElementById('bulkCategory').value;
        const titlePrefix = document.getElementById('titlePrefix').value;
        
        if (files.length === 0) {
            showMessage('Оберіть файли для завантаження', 'error');
            return;
        }
        
        if (files.length > 20) {
            showMessage('Максимум 20 файлів за раз', 'error');
            return;
        }
        
        // Додаємо файли до FormData
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        formData.append('category', category);
        formData.append('titlePrefix', titlePrefix);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> Завантажується...';
        
        try {
            const response = await fetch('/api/admin/portfolio/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                showMessage(`${data.message}. Фото конвертовані в WebP формат.`, 'success');
                form.reset();
                loadPortfolio(); // Перезавантажуємо портфоліо
            } else {
                let errorMsg = 'Помилка завантаження фото';
                if (response.status === 413) {
                    errorMsg = 'Файл занадто великий. Максимум 50MB на файл.';
                } else {
                    try {
                        const data = await response.json();
                        errorMsg = data.error || errorMsg;
                    } catch {
                        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                showMessage(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Error uploading photos:', error);
            let errorMsg = 'Помилка з\'єднання';
            if (error.message.includes('413')) {
                errorMsg = 'Файл занадто великий. Зменште розмір файлів.';
            }
            showMessage(errorMsg, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Завантажити фото';
        }
    });
    
    // Показ кількості обраних файлів
    const fileInput = document.getElementById('bulkFiles');
    fileInput.addEventListener('change', (e) => {
        const fileCount = e.target.files.length;
        const label = fileInput.parentElement.querySelector('small');
        if (fileCount > 0) {
            label.textContent = `Обрано ${fileCount} файл(ів). Фото будуть автоматично конвертовані в формат WebP`;
        } else {
            label.textContent = 'Фото будуть автоматично конвертовані в формат WebP';
        }
    });
}

// Ініціалізація форми зміни паролю
function initChangePasswordForm() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Валідація
        if (newPassword !== confirmPassword) {
            showMessage('Паролі не співпадають', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showMessage('Пароль повинен містити мінімум 6 символів', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> Змінюється...';
        
        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Пароль успішно змінено', 'success');
                form.reset();
            } else {
                showMessage(data.error || 'Помилка зміни паролю', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showMessage('Помилка з\'єднання', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Змінити пароль';
        }
    });
}

// Експорт функцій для використання в HTML
window.updateServicePrice = updateServicePrice;
window.deletePortfolioItem = deletePortfolioItem;