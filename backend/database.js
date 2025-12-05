// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'database.db');
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Ошибка при подключении к базе данных:', err.message);
                    reject(err);
                } else {
                    console.log('База данных подключена успешно');
                    this.createTables()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createTablesQuery = `
                -- Пользователи
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Сотрудники
                CREATE TABLE IF NOT EXISTS employees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    position TEXT NOT NULL,
                    description TEXT,
                    experience TEXT,
                    photo TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Продукты
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price REAL NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    category TEXT,
                    weight TEXT,
                    is_new BOOLEAN DEFAULT 0,
                    on_sale BOOLEAN DEFAULT 0,
                    old_price REAL,
                    is_popular BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Заказы
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    items TEXT NOT NULL,
                    total_amount REAL NOT NULL,
                    status TEXT DEFAULT 'processing',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );

                -- Отзывы
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    review TEXT NOT NULL,
                    stars INTEGER CHECK (stars >= 1 AND stars <= 5) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(product_id) REFERENCES products(id)
                );

                -- Магазины
                CREATE TABLE IF NOT EXISTS shops (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    address TEXT NOT NULL,
                    phone TEXT,
                    email TEXT,
                    working_hours TEXT,
                    latitude REAL,
                    longitude REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            this.db.exec(createTablesQuery, (err) => {
                if (err) {
                    console.error('Ошибка при создании таблиц:', err.message);
                    reject(err);
                } else {
                    console.log('Таблицы созданы успешно');
                    resolve();
                }
            });
        });
    }

    // Регистрация пользователя
    async register(userData) {
        return new Promise((resolve, reject) => {
            const { name, email, password } = userData;

            if (!email || !password) {
                return reject(new Error('Email и пароль обязательны'));
            }

            const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

            this.db.run(query, [name, email, password], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('Пользователь с таким email уже существует'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({
                        id: this.lastID,
                        name,
                        email,
                        message: 'Пользователь успешно зарегистрирован'
                    });
                }
            });
        });
    }

    // Авторизация пользователя
    async login(credentials) {
        return new Promise((resolve, reject) => {
            const { email, password } = credentials;

            if (!email || !password) {
                return reject(new Error('Email и пароль обязательны'));
            }

            const query = `SELECT id, name, email, password, created_at FROM users WHERE email = ?`;

            this.db.get(query, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve({
                        id: row.id,
                        name: row.name,
                        email: row.email,
                        password: row.password,
                        created_at: row.created_at
                    });
                } else {
                    reject(new Error('Пользователь не найден'));
                }
            });
        });
    }

    // Получение всех сотрудников
    async getAllEmployees() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, name, position, description, experience, photo, created_at
                FROM employees
                ORDER BY position, name
            `;

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Получение всех продуктов
    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, name, price, description, image_url, category, 
                       weight, is_new, on_sale, old_price, is_popular, created_at
                FROM products
                ORDER BY created_at DESC
            `;

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Получение популярных продуктов
    async getPopularProducts(limit = 4) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, name, price, description, image_url, category, 
                       weight, is_new, on_sale, old_price, is_popular, created_at
                FROM products
                WHERE is_popular = 1
                ORDER BY created_at DESC
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Получение продукта по ID
    async getProductById(productId) {
        return new Promise((resolve, reject) => {
            if (!productId) {
                return reject(new Error('ID товара обязателен'));
            }

            const query = `
                SELECT id, name, price, description, image_url, category, 
                       weight, is_new, on_sale, old_price, is_popular, created_at
                FROM products
                WHERE id = ?
            `;

            this.db.get(query, [productId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(row);
                } else {
                    reject(new Error('Товар не найден'));
                }
            });
        });
    }

    async getUserOrders(userId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
        this.db.all(query, [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение статистики пользователя
async getUserStats(userId) {
    return new Promise((resolve, reject) => {
        const stats = {};
        
        // Получаем общее количество заказов
        const countQuery = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
        const sumQuery = 'SELECT SUM(total_amount) as total FROM orders WHERE user_id = ?';
        const statusQuery = 'SELECT status, COUNT(*) as count FROM orders WHERE user_id = ? GROUP BY status';
        
        this.db.get(countQuery, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                stats.totalOrders = row.count || 0;
                
                this.db.get(sumQuery, [userId], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        stats.totalAmount = row.total || 0;
                        stats.averageOrder = stats.totalOrders > 0 ? stats.totalAmount / stats.totalOrders : 0;
                        
                        this.db.all(statusQuery, [userId], (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                stats.statusStats = rows || [];
                                resolve(stats);
                            }
                        });
                    }
                });
            }
        });
    });
}

    // Создание продукта
    async createProduct(productData) {
        return new Promise((resolve, reject) => {
            const { name, price, description, image_url, category, weight, is_new, on_sale, old_price, is_popular } = productData;

            if (!name || !price) {
                return reject(new Error('Название и цена товара обязательны'));
            }

            const query = `
                INSERT INTO products (name, price, description, image_url, category, 
                                     weight, is_new, on_sale, old_price, is_popular)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                name, 
                price, 
                description || null, 
                image_url || null, 
                category || null,
                weight || null, 
                is_new ? 1 : 0, 
                on_sale ? 1 : 0, 
                old_price || null, 
                is_popular ? 1 : 0
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...productData,
                        message: 'Товар успешно создан'
                    });
                }
            });
        });
    }

    // Создание сотрудника
    async createEmployee(employeeData) {
        return new Promise((resolve, reject) => {
            const { name, position, description, experience, photo } = employeeData;

            const query = `
                INSERT INTO employees (name, position, description, experience, photo)
                VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                name, 
                position, 
                description || null, 
                experience || null, 
                photo || null
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...employeeData,
                        message: 'Сотрудник успешно добавлен'
                    });
                }
            });
        });
    }

    // Получение всех магазинов
    async getAllShops() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, address, phone, email, working_hours, latitude, longitude, created_at
                FROM shops
                ORDER BY created_at
            `;

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Создание магазина
    async createShop(shopData) {
        return new Promise((resolve, reject) => {
            const { address, phone, email, working_hours, latitude, longitude } = shopData;

            if (!address) {
                return reject(new Error('Адрес магазина обязателен'));
            }

            const query = `
                INSERT INTO shops (address, phone, email, working_hours, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                address, 
                phone || null, 
                email || null, 
                working_hours || null,
                latitude || null, 
                longitude || null
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...shopData,
                        message: 'Магазин успешно создан'
                    });
                }
            });
        });
    }

    // Создание заказа
    async createOrder(orderData) {
        return new Promise((resolve, reject) => {
            const { user_id, items, total_amount, status } = orderData;

            const query = `
                INSERT INTO orders (user_id, items, total_amount, status)
                VALUES (?, ?, ?, ?)
            `;

            this.db.run(query, [
                user_id, 
                items, 
                total_amount, 
                status || 'processing'
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...orderData,
                        message: 'Заказ успешно создан'
                    });
                }
            });
        });
    }

    // Создание отзыва
    async createReview(reviewData) {
        return new Promise((resolve, reject) => {
            const { user_id, product_id, review, stars } = reviewData;

            if (stars < 1 || stars > 5) {
                return reject(new Error('Оценка должна быть от 1 до 5 звезд'));
            }

            const query = `
                INSERT INTO reviews (user_id, product_id, review, stars)
                VALUES (?, ?, ?, ?)
            `;

            this.db.run(query, [
                user_id, 
                product_id, 
                review, 
                stars
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        ...reviewData,
                        message: 'Отзыв успешно добавлен'
                    });
                }
            });
        });
    }

    // Закрытие соединения
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Соединение с базой данных закрыто');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;