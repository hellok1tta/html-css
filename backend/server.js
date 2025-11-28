// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Инициализация базы данных
const db = new sqlite3.Database(':memory:');

// Создание таблиц
db.serialize(() => {
    // Таблица пользователей
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица заказов
    db.run(`CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Создание тестового пользователя
    const hashedPassword = bcrypt.hashSync('password123', 10);
    db.run(`INSERT INTO users (email, password, name) VALUES (?, ?, ?)`, 
        ['test@example.com', hashedPassword, 'Тестовый Пользователь']);

    // Создание тестовых заказов
    const orders = [
        { user_id: 1, items: 'Ржаной хлеб, Круассан с шоколадом', total_amount: 270, status: 'completed' },
        { user_id: 1, items: 'Пирог с яблоками, Эклеры (4 шт.)', total_amount: 630, status: 'delivery' },
        { user_id: 1, items: 'Багет французский, Тирамису', total_amount: 410, status: 'processing' }
    ];

    const stmt = db.prepare(`INSERT INTO orders (user_id, items, total_amount, status) VALUES (?, ?, ?, ?)`);
    orders.forEach(order => {
        stmt.run(order.user_id, order.items, order.total_amount, order.status);
    });
    stmt.finalize();
});

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

// Маршруты аутентификации
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        // Проверка существования пользователя
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            if (row) {
                return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
            }

            // Хеширование пароля и создание пользователя
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', 
                [email, hashedPassword, name], 
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Ошибка при создании пользователя' });
                    }

                    const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
                    res.json({ 
                        message: 'Пользователь успешно зарегистрирован',
                        token,
                        user: { id: this.lastID, email, name }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({
            message: 'Успешный вход в систему',
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    });
});

// Маршруты для заказов
app.get('/api/orders', authenticateToken, (req, res) => {
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', 
        [req.user.id], 
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при получении заказов' });
            }
            res.json(rows);
        }
    );
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', 
        [req.params.id, req.user.id], 
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при получении заказа' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Заказ не найден' });
            }
            res.json(row);
        }
    );
});

app.post('/api/orders', authenticateToken, (req, res) => {
    const { items, total_amount } = req.body;

    if (!items || !total_amount) {
        return res.status(400).json({ error: 'Товары и общая сумма обязательны' });
    }

    db.run('INSERT INTO orders (user_id, items, total_amount) VALUES (?, ?, ?)',
        [req.user.id, JSON.stringify(items), total_amount],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при создании заказа' });
            }
            res.json({ 
                message: 'Заказ успешно создан',
                orderId: this.lastID 
            });
        }
    );
});

app.put('/api/orders/:id', authenticateToken, (req, res) => {
    const { status } = req.body;

    db.run('UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
        [status, req.params.id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при обновлении заказа' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Заказ не найден' });
            }
            res.json({ message: 'Заказ успешно обновлен' });
        }
    );
});

app.delete('/api/orders/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM orders WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при удалении заказа' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Заказ не найден' });
            }
            res.json({ message: 'Заказ успешно удален' });
        }
    );
});

// Статистика пользователя
app.get('/api/stats', authenticateToken, (req, res) => {
    const stats = {};

    // Общее количество заказов
    db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', 
        [req.user.id], 
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Ошибка сервера' });
            stats.totalOrders = row.count;

            // Общая сумма заказов
            db.get('SELECT SUM(total_amount) as total FROM orders WHERE user_id = ?', 
                [req.user.id], 
                (err, row) => {
                    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
                    stats.totalAmount = row.total || 0;

                    // Средний чек
                    stats.averageOrder = stats.totalOrders > 0 ? stats.totalAmount / stats.totalOrders : 0;

                    // Статистика по статусам
                    db.all('SELECT status, COUNT(*) as count FROM orders WHERE user_id = ? GROUP BY status',
                        [req.user.id],
                        (err, rows) => {
                            if (err) return res.status(500).json({ error: 'Ошибка сервера' });
                            stats.statusStats = rows;
                            res.json(stats);
                        }
                    );
                }
            );
        }
    );
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
});

module.exports = app;