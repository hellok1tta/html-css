// js/auth.js
class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.API_BASE = 'http://localhost:3000/api';
    }

    // Проверка авторизации
    async checkAuth() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE}/auth/check`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    // Регистрация
    async register(name, email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    }

    // Вход
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    }

    // Выход
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Получение данных пользователя
    getUser() {
        return this.user;
    }

    // Проверка роли (если нужно будет добавлять админку)
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    // Обновление навигации на основе авторизации
    updateNavigation() {
        const nav = document.querySelector('.main-nav ul');
        const authSection = document.querySelector('.auth-section');
        
        if (!nav) return;

        if (this.token && this.user) {
            // Убираем ссылки на вход/регистрацию
            const authLinks = nav.querySelectorAll('a[href="login.html"], a[href="register.html"]');
            authLinks.forEach(link => link.parentElement.remove());
            
            // Добавляем ссылку на личный кабинет если её нет
            if (!nav.querySelector('a[href="dashboard.html"]')) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="dashboard.html">Личный кабинет</a>`;
                nav.appendChild(li);
            }
            
            // Добавляем кнопку выхода если есть auth-section
            if (authSection) {
                authSection.innerHTML = `
                    <span>Привет, ${this.user.name}!</span>
                    <button class="btn btn-outline btn-sm" onclick="auth.logout()">Выйти</button>
                `;
            }
        } else {
            // Добавляем ссылки на вход/регистрацию если их нет
            if (!nav.querySelector('a[href="login.html"]')) {
                const loginLi = document.createElement('li');
                loginLi.innerHTML = `<a href="login.html">Вход</a>`;
                nav.appendChild(loginLi);
            }
            
            if (!nav.querySelector('a[href="register.html"]')) {
                const registerLi = document.createElement('li');
                registerLi.innerHTML = `<a href="register.html">Регистрация</a>`;
                nav.appendChild(registerLi);
            }
        }
    }
}

// Создаем глобальный объект auth
window.auth = new Auth();