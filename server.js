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
require('dotenv').config();

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

// Debug middleware
app.use('/api/admin/login', (req, res, next) => {
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    console.log('Raw body length:', req.get('content-length'));
    next();
});

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

// Helper functions
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
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: `Нове замовлення: ${service}`,
        html: `
            <h2>Нове замовлення фотосесії</h2>
            <p><strong>Послуга:</strong> ${service}</p>
            <p><strong>Ім'я:</strong> ${name}</p>
            <p><strong>Телефон:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Бажана дата:</strong> ${date || 'Не вказана'}</p>
            <p><strong>Повідомлення:</strong></p>
            <p>${message}</p>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Замовлення успішно відправлено!' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Помилка відправки замовлення' });
    }
});

// Адмін логін - спрощена версія без rate limiting
app.post('/api/admin/login', (req, res) => {
    try {
        console.log('Login request received');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
        }
        
        console.log(`Comparing: "${email}" === "${process.env.ADMIN_EMAIL}"`);
        console.log(`Comparing: "${password}" === "${process.env.ADMIN_PASSWORD}"`);
        
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { email: email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('Login successful, token created');
            res.json({ token, message: 'Успішний вхід' });
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ error: 'Невірні дані' });
        }
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
    
    // Перевіряємо поточний пароль
    if (currentPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Неправильний поточний пароль' });
    }
    
    try {
        // Читаємо .env файл
        const envPath = path.join(__dirname, '.env');
        let envContent = await fs.readFile(envPath, 'utf8');
        
        // Замінюємо пароль в .env файлі
        envContent = envContent.replace(
            /ADMIN_PASSWORD=.*/,
            `ADMIN_PASSWORD=${newPassword}`
        );
        
        // Записуємо оновлений .env файл
        await fs.writeFile(envPath, envContent);
        
        // Оновлюємо змінну середовища в пам'яті
        process.env.ADMIN_PASSWORD = newPassword;
        
        res.json({ message: 'Пароль успішно змінено' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Помилка збереження нового паролю' });
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
            title: `${titlePrefix || category || 'Фото'} ${i + 1}`,
            description: `Фотографія з категорії ${category || 'загальна'}`,
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

app.delete('/api/admin/portfolio/:id', authenticateAdmin, async (req, res) => {
    const itemId = parseInt(req.params.id);
    const portfolio = await readJsonFile(PORTFOLIO_FILE);
    
    const itemIndex = portfolio.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Фото не знайдено' });
    }
    
    const item = portfolio[itemIndex];
    
    // Delete file
    try {
        await fs.unlink(`public${item.image}`);
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