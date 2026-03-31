const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const nodemailer = require('nodemailer');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const sharp = require('sharp');
const EmailTemplateManager = require('./email-templates/email-utils');
require('dotenv').config();

// Перевірка обов'язкових змінних середовища
const REQUIRED_ENV = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error('   Please check your .env file');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 2711;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,  // Відключаємо CSP що може блокувати JSON
}));
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test successful', timestamp: new Date().toISOString() });
});

// Order rate limiting
const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // max 5 orders per hour per IP
});

// Email транспортер
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Ініціалізуємо менеджер email-шаблонів
const emailManager = new EmailTemplateManager();

// Multer конфігурація
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});

// Функція для конвертації в WebP
async function convertToWebP(inputPath, outputPath, quality = 80) {
    try {
        await sharp(inputPath)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toFile(outputPath);
        
        // Видаляємо оригінальний файл після конвертації
        await fs.unlink(inputPath);
        return true;
    } catch (error) {
        console.error('Error converting to WebP:', error);
        return false;
    }
}

// Data files
const DATA_DIR = './data';
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Helper functions
function getCategoryDisplayName(category) {
    const names = {
        'individual': 'Індивідуальна фотосесія',
        'family': 'Сімейна фотосесія', 
        'creative': 'Творча зйомка',
        'brand': 'Брендінг фото'
    };
    return names[category] || 'Фото';
}

function getCategoryDescription(category) {
    const descriptions = {
        'individual': 'індивідуальні',
        'family': 'сімейні',
        'creative': 'творчі',
        'brand': 'брендингові'
    };
    return descriptions[category] || 'загальна';
}

async function readJsonFile(filePath) {
    try {
        console.log(`Reading file: ${filePath}`);
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`Successfully read ${filePath}, found ${parsed.length} items`);
        return parsed;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeJsonFile(filePath, data) {
    try {
        console.log(`Writing to file: ${filePath}`);
        console.log(`Data to write:`, JSON.stringify(data, null, 2));
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`Successfully wrote to ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        return false;
    }
}

// Auth middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Initialize data
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir('public/uploads', { recursive: true });
        
        // Перевіряємо email-шаблони
        console.log('Checking email templates...');
        const templateValidation = await emailManager.validateTemplates();
        const allTemplatesValid = Object.values(templateValidation).every(isValid => isValid);
        
        if (allTemplatesValid) {
            console.log('✅ All email templates are available');
        } else {
            console.warn('⚠️ Some email templates are missing, fallback templates will be used');
            console.warn('Template validation results:', templateValidation);
        }
        
        // Default services
        if (!(await fs.access(SERVICES_FILE).then(() => true).catch(() => false))) {
            const defaultServices = [
                {
                    id: 1,
                    name: "Індивідуальні фотосесії",
                    description: "Персональні фотосесії для розкриття вашої індивідуальності та стилю",
                    price: 1500,
                    icon: "fas fa-user"
                },
                {
                    id: 2,
                    name: "Сімейні фотосесії",
                    description: "Теплі та щирі сімейні портрети, які передають ваші стосунки",
                    price: 2000,
                    icon: "fas fa-users"
                },
                {
                    id: 3,
                    name: "Творчі зйомки",
                    description: "Концептуальні та художні фотосесії для втілення ваших ідей",
                    price: 2500,
                    icon: "fas fa-palette"
                },
                {
                    id: 4,
                    name: "Зйомки для брендів",
                    description: "Професійні фото для вашого бізнесу, товарів та послуг",
                    price: 3000,
                    icon: "fas fa-briefcase"
                }
            ];
            await writeJsonFile(SERVICES_FILE, defaultServices);
        }
        
        // Default portfolio
        if (!(await fs.access(PORTFOLIO_FILE).then(() => true).catch(() => false))) {
            await writeJsonFile(PORTFOLIO_FILE, []);
        }
        
        // Default orders
        if (!(await fs.access(ORDERS_FILE).then(() => true).catch(() => false))) {
            await writeJsonFile(ORDERS_FILE, []);
        }

        // Admin credentials — зберігаємо хеш пароля, не plaintext
        if (!(await fs.access(ADMIN_FILE).then(() => true).catch(() => false))) {
            const plainPassword = process.env.ADMIN_PASSWORD;
            if (plainPassword) {
                const hash = await bcryptjs.hash(plainPassword, 12);
                await writeJsonFile(ADMIN_FILE, { passwordHash: hash });
                console.log('✅ Admin credentials initialized');
            } else {
                console.error('❌ ADMIN_PASSWORD not set — admin login will not work');
            }
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Публічні API
app.get('/api/services', async (req, res) => {
    const services = await readJsonFile(SERVICES_FILE);
    res.json(services);
});

app.get('/api/portfolio', async (req, res) => {
    const portfolio = await readJsonFile(PORTFOLIO_FILE);
    res.json(portfolio);
});

// Відправка замовлення
app.post('/api/order', orderLimiter, [
    body('name').trim().isLength({ min: 2 }).escape(),
    body('phone').trim().isMobilePhone('uk-UA'),
    body('email').isEmail().normalizeEmail(),
    body('service').trim().notEmpty(),
    body('message').trim().isLength({ max: 500 }).escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, phone, email, service, message, date } = req.body;
    
    try {
        // Створюємо об'єкт замовлення
        const currentDate = new Date();
        const order = {
            id: Date.now(), // Унікальний ID на основі timestamp
            name,
            phone,
            email,
            service,
            message: message || '',
            date: date || '',
            status: 'new', // new, contacted, confirmed, completed, cancelled
            createdAt: currentDate.toISOString(),
            clientIP: req.ip || req.connection.remoteAddress || 'Unknown',
            userAgent: req.get('User-Agent') || 'Unknown'
        };
        
        // Зберігаємо замовлення в JSON файл
        const orders = await readJsonFile(ORDERS_FILE);
        orders.unshift(order); // Додаємо в початок масиву (найновіші зверху)
        await writeJsonFile(ORDERS_FILE, orders);
        
        // Збираємо дані для email
        const orderData = { name, phone, email, service, message, date };
        
        // Статистика для email адміністратора
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const ordersToday = orders.filter(o => new Date(o.createdAt) >= todayStart).length;
        
        const additionalData = {
            clientIP: order.clientIP,
            userAgent: order.userAgent,
            ordersToday: ordersToday.toString(),
            viewsToday: '-',
            responseTime: '<2h'
        };
        
        // Створюємо email для адміністратора
        let adminEmail;
        try {
            adminEmail = await emailManager.createAdminNotificationEmail(orderData, additionalData);
        } catch (templateError) {
            console.warn('Using fallback admin email template:', templateError.message);
            adminEmail = emailManager.createFallbackEmail(orderData, 'admin');
        }
        
        // Створюємо email для клієнта
        let clientEmail;
        try {
            clientEmail = await emailManager.createClientConfirmationEmail(orderData);
        } catch (templateError) {
            console.warn('Using fallback client email template:', templateError.message);
            clientEmail = emailManager.createFallbackEmail(orderData, 'client');
        }
        
        // Відправляємо email адміністратору
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO,
            subject: adminEmail.subject,
            html: adminEmail.html,
            text: adminEmail.text
        });
        
        // Відправляємо підтвердження клієнту
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: clientEmail.subject,
            html: clientEmail.html,
            text: clientEmail.text
        });
        
        console.log(`Order #${order.id} saved and emails sent for ${name} (${service})`);
        res.json({ 
            message: 'Замовлення успішно відправлено! Перевірте свою пошту для підтвердження.',
            orderId: order.id 
        });
        
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Помилка відправки замовлення' });
    }
});

// Адмін логін
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
        }

        if (email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({ error: 'Невірні дані' });
        }

        const adminData = await readJsonFile(ADMIN_FILE);
        if (!adminData || !adminData.passwordHash) {
            return res.status(500).json({ error: 'Помилка конфігурації сервера' });
        }

        const passwordValid = await bcryptjs.compare(password, adminData.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Невірні дані' });
        }

        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, message: 'Успішний вхід' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// Зміна паролю адміна
app.post('/api/admin/change-password', authenticateAdmin, [
    body('currentPassword').isLength({ min: 1 }),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Невалідні дані' });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const adminData = await readJsonFile(ADMIN_FILE);
        if (!adminData || !adminData.passwordHash) {
            return res.status(500).json({ error: 'Помилка конфігурації сервера' });
        }

        const currentValid = await bcryptjs.compare(currentPassword, adminData.passwordHash);
        if (!currentValid) {
            return res.status(401).json({ error: 'Неправильний поточний пароль' });
        }

        const newHash = await bcryptjs.hash(newPassword, 12);
        const success = await writeJsonFile(ADMIN_FILE, { passwordHash: newHash });
        if (!success) {
            return res.status(500).json({ error: 'Помилка збереження нового паролю' });
        }

        res.json({ message: 'Пароль успішно змінено' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Помилка збереження нового паролю' });
    }
});

// Адмін API для замовлень
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const orders = await readJsonFile(ORDERS_FILE);
        
        // Додаємо статистику
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const stats = {
            total: orders.length,
            today: orders.filter(o => new Date(o.createdAt) >= todayStart).length,
            new: orders.filter(o => o.status === 'new').length,
            contacted: orders.filter(o => o.status === 'contacted').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            completed: orders.filter(o => o.status === 'completed').length
        };
        
        res.json({
            orders: orders.slice(0, 100), // Останні 100 замовлень
            stats
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).json({ error: 'Помилка завантаження замовлень' });
    }
});

// Оновлення статусу замовлення
app.put('/api/admin/orders/:id', authenticateAdmin, [
    body('status').isIn(['new', 'contacted', 'confirmed', 'completed', 'cancelled'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Невалідні дані' });
    }
    
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    try {
        const orders = await readJsonFile(ORDERS_FILE);
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Замовлення не знайдено' });
        }
        
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        
        const success = await writeJsonFile(ORDERS_FILE, orders);
        if (success) {
            console.log(`Order #${orderId} status updated to ${status}`);
            res.json({ message: 'Статус оновлено', order: orders[orderIndex] });
        } else {
            res.status(500).json({ error: 'Помилка збереження' });
        }
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Помилка оновлення замовлення' });
    }
});

// Видалення замовлення
app.delete('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
    const orderId = parseInt(req.params.id);
    
    try {
        const orders = await readJsonFile(ORDERS_FILE);
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Замовлення не знайдено' });
        }
        
        const deletedOrder = orders[orderIndex];
        orders.splice(orderIndex, 1);
        
        const success = await writeJsonFile(ORDERS_FILE, orders);
        if (success) {
            console.log(`Order #${orderId} deleted`);
            res.json({ message: 'Замовлення видалено', order: deletedOrder });
        } else {
            res.status(500).json({ error: 'Помилка збереження' });
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Помилка видалення замовлення' });
    }
});

// Адмін API (захищені)
app.put('/api/admin/services/:id', authenticateAdmin, async (req, res) => {
    const serviceId = parseInt(req.params.id);
    const { price } = req.body;
    
    console.log(`Updating service ${serviceId} with price ${price}`);
    
    const services = await readJsonFile(SERVICES_FILE);
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    
    if (serviceIndex === -1) {
        console.log(`Service ${serviceId} not found`);
        return res.status(404).json({ error: 'Service not found' });
    }
    
    console.log(`Old price: ${services[serviceIndex].price}, New price: ${price}`);
    services[serviceIndex].price = price;
    
    const success = await writeJsonFile(SERVICES_FILE, services);
    if (success) {
        console.log(`Service ${serviceId} price updated successfully`);
        res.json({ message: 'Ціна оновлена' });
    } else {
        console.log(`Failed to save service ${serviceId}`);
        res.status(500).json({ error: 'Помилка збереження' });
    }
});


// Масове завантаження фото
app.post('/api/admin/portfolio/bulk', authenticateAdmin, upload.array('images', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Файли не завантажено' });
    }
    
    const { category, titlePrefix } = req.body;
    const portfolio = await readJsonFile(PORTFOLIO_FILE);
    const addedItems = [];
    
    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        // Конвертуємо в WebP
        const webpFilename = file.filename.replace(/\.[^/.]+$/, '.webp');
        const inputPath = `public/uploads/${file.filename}`;
        const outputPath = `public/uploads/${webpFilename}`;
        
        const converted = await convertToWebP(inputPath, outputPath);
        const finalFilename = converted ? webpFilename : file.filename;
        
        const newItem = {
            id: Date.now() + i, // Уникальний ID
            title: titlePrefix || getCategoryDisplayName(category || 'individual') || 'Фото',
            description: `Фотографія з категорії ${getCategoryDescription(category || 'individual')}`,
            image: `/uploads/${finalFilename}`,
            category: category || 'individual',
            createdAt: new Date().toISOString()
        };
        
        portfolio.push(newItem);
        addedItems.push(newItem);
    }
    
    const success = await writeJsonFile(PORTFOLIO_FILE, portfolio);
    if (success) {
        res.json({ 
            message: `Завантажено ${addedItems.length} фото`,
            items: addedItems 
        });
    } else {
        res.status(500).json({ error: 'Помилка збереження' });
    }
});

// Редагування портфоліо айтема
app.put('/api/admin/portfolio/:id', authenticateAdmin, [
    body('title').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Невалідні дані' });
    }
    
    const itemId = parseInt(req.params.id);
    const { title, description } = req.body;
    const portfolio = await readJsonFile(PORTFOLIO_FILE);
    
    const itemIndex = portfolio.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Фото не знайдено' });
    }
    
    // Оновлюємо дані
    portfolio[itemIndex].title = title;
    if (description !== undefined) {
        portfolio[itemIndex].description = description;
    }
    portfolio[itemIndex].updatedAt = new Date().toISOString();
    
    const success = await writeJsonFile(PORTFOLIO_FILE, portfolio);
    if (success) {
        res.json({ message: 'Фото оновлено', item: portfolio[itemIndex] });
    } else {
        res.status(500).json({ error: 'Помилка збереження' });
    }
});

app.delete('/api/admin/portfolio/:id', authenticateAdmin, async (req, res) => {
    const itemId = parseInt(req.params.id);
    const portfolio = await readJsonFile(PORTFOLIO_FILE);
    
    const itemIndex = portfolio.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Фото не знайдено' });
    }
    
    const item = portfolio[itemIndex];

    // Видаляємо файл тільки якщо шлях знаходиться всередині папки uploads
    try {
        const uploadsDir = path.resolve('public/uploads');
        const filePath = path.resolve(`public${item.image}`);
        if (filePath.startsWith(uploadsDir + path.sep) || filePath === uploadsDir) {
            await fs.unlink(filePath);
        } else {
            console.warn(`Blocked suspicious file path: ${filePath}`);
        }
    } catch (error) {
        console.error('File delete error:', error);
    }
    
    portfolio.splice(itemIndex, 1);
    
    const success = await writeJsonFile(PORTFOLIO_FILE, portfolio);
    if (success) {
        res.json({ message: 'Фото видалено' });
    } else {
        res.status(500).json({ error: 'Помилка видалення' });
    }
});

// Спеціальні роути для чистих URL
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

// Головна сторінка на root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files
app.use('/', express.static('public'));

// Fallback для SPA - якщо файл не знайдено, повертаємо index.html
app.get('*', (req, res) => {
    // Перевіряємо чи це API запит
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Для всіх інших запитів повертаємо index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initializeData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});