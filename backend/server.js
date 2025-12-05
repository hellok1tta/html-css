// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from the parent directory (where HTML files are)
app.use(express.static(path.join(__dirname, '..')));

// Инициализация базы данных
const db = new Database();

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Основной маршрут для тестирования
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false,
                error: 'Все поля обязательны для заполнения' 
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const result = await db.register({
                name,
                email,
                password: hashedPassword
            });

            const token = jwt.sign({ 
                id: result.id, 
                email: result.email,
                name: result.name 
            }, JWT_SECRET, { expiresIn: '24h' });

            res.json({
                success: true,
                message: 'Пользователь успешно зарегистрирован',
                token,
                user: {
                    id: result.id,
                    name: result.name,
                    email: result.email
                }
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Внутренняя ошибка сервера' 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email и пароль обязательны' 
            });
        }

        // Получаем пользователя по email
        const user = await db.login({ email, password });

        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ 
                success: false,
                error: 'Неверный email или пароль' 
            });
        }

        const token = jwt.sign({ 
            id: user.id, 
            email: user.email,
            name: user.name 
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            message: 'Успешный вход в систему',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Маршруты для продуктов
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.getAllProducts();
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/products/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4;
        const products = await db.getPopularProducts(limit);
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Маршруты для сотрудников
app.get('/api/team', async (req, res) => {
    try {
        const employees = await db.getAllEmployees();
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Маршруты для магазинов
app.get('/api/shops', async (req, res) => {
    try {
        const shops = await db.getAllShops();
        res.json({
            success: true,
            data: shops
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Маршрут для проверки аутентификации
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        }
    });
});

// Маршруты для заказов пользователя
app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await db.getUserOrders(req.user.id);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Статистика пользователя
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await db.getUserStats(req.user.id);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Создание заказа
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount } = req.body;

        if (!items || !total_amount) {
            return res.status(400).json({ 
                success: false,
                error: 'Товары и общая сумма обязательны' 
            });
        }

        const result = await db.createOrder({
            user_id: req.user.id,
            items: JSON.stringify(items),
            total_amount
        });

        res.json({
            success: true,
            message: 'Заказ успешно создан',
            orderId: result.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Catch-all route for HTML pages
app.get('*', (req, res) => {
    // Check if the request is for an HTML page
    if (req.url.includes('.html') || !req.url.includes('.')) {
        const filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
        res.sendFile(filePath, (err) => {
            if (err) {
                // If file doesn't exist, send 404
                res.status(404).send(`
                    <html>
                        <head>
                            <title>Страница не найдена</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif; 
                                    text-align: center; 
                                    padding: 50px; 
                                    background: #f8e1c4;
                                }
                                h1 { color: #9c6644; }
                                a { 
                                    color: #9c6644; 
                                    text-decoration: none;
                                    font-weight: bold;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>404 - Страница не найдена</h1>
                            <p>Извините, запрашиваемая страница не существует.</p>
                            <p><a href="/">Вернуться на главную</a></p>
                        </body>
                    </html>
                `);
            }
        });
    } else {
        // For other files (CSS, JS, images), let static middleware handle it
        res.status(404).send('Not found');
    }
});

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Основной URL: http://localhost:${PORT}`);
    console.log(`📊 API доступно по адресу: http://localhost:${PORT}/api`);
    
    // Инициализация базы данных
    await db.init();
    
    console.log('✅ База данных подключена');
    console.log('\n📋 Доступные страницы:');
    console.log(`   📍 Главная: http://localhost:${PORT}/`);
    console.log(`   📍 О нас: http://localhost:${PORT}/about.html`);
    console.log(`   📍 Каталог: http://localhost:${PORT}/catalog.html`);
    console.log(`   📍 Контакты: http://localhost:${PORT}/contacts.html`);
    console.log(`   📍 Вход: http://localhost:${PORT}/login.html`);
    console.log(`   📍 Регистрация: http://localhost:${PORT}/register.html`);
    console.log(`   📍 Личный кабинет: http://localhost:${PORT}/dashboard.html`);
    console.log('\n🔑 Тестовый аккаунт:');
    console.log('   📧 Email: test@example.com');
    console.log('   🔐 Пароль: password123');
    console.log('\n✨ Сервер готов к работе!');
});