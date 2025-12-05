
class BakeryAPI {
    constructor() {
        this.API_BASE = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
    }

    // Общий метод для запросов
    async request(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Проверяем статус ответа
            if (!response.ok) {
                // Если ответ 401 (Unauthorized), удаляем токен
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
                
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Получение продуктов
    async getProducts() {
        return this.request('/products');
    }

        async getPopularProducts(limit = 4) {
        return this.request(`/products/popular?limit=${limit}`);
    }

    // Получение продукта по ID
    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    // Получение сотрудников
    async getTeam() {
        return this.request('/team');
    }

    // Получение магазинов
    async getShops() {
        return this.request('/shops');
    }

    // Получение заказов пользователя
    async getUserOrders() {
        return this.request('/user/orders');
    }

    // Получение статистики пользователя
    async getUserStats() {
        return this.request('/user/stats');
    }

    // Создание заказа
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }
}

// Создаем глобальный объект API
window.api = new BakeryAPI();