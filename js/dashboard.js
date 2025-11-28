// js/dashboard.js
class Dashboard {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.init();
    }

    init() {
        this.loadOrders();
        this.initCharts();
        this.initEventListeners();
        this.renderOrdersTable();
    }

    loadOrders() {
        // Mock data - в реальном приложении данные будут приходить с сервера
        this.orders = [
            {
                id: 'ORD-001',
                date: '2024-01-15',
                items: ['Ржаной хлеб', 'Круассан с шоколадом'],
                amount: 270,
                status: 'completed'
            },
            {
                id: 'ORD-002',
                date: '2024-01-12',
                items: ['Пирог с яблоками', 'Эклеры (4 шт.)'],
                amount: 630,
                status: 'delivery'
            },
            {
                id: 'ORD-003',
                date: '2024-01-10',
                items: ['Багет французский', 'Тирамису'],
                amount: 410,
                status: 'processing'
            },
            {
                id: 'ORD-004',
                date: '2024-01-08',
                items: ['Пирог с вишней'],
                amount: 380,
                status: 'completed'
            },
            {
                id: 'ORD-005',
                date: '2024-01-05',
                items: ['Круассан с шоколадом', 'Пирожное "Картошка"'],
                amount: 205,
                status: 'completed'
            },
            {
                id: 'ORD-006',
                date: '2024-01-03',
                items: ['Ржаной хлеб', 'Багет французский', 'Эклеры (4 шт.)'],
                amount: 520,
                status: 'cancelled'
            }
        ];
    }

    initCharts() {
        this.createOrdersChart();
        this.createCategoriesChart();
        this.createActivityChart();
        this.createStatusChart();
    }

    createOrdersChart() {
        const ctx = document.getElementById('ordersChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                datasets: [{
                    label: 'Количество заказов',
                    data: [3, 5, 2, 4, 6, 8, 7, 9, 5, 4, 6, 7],
                    borderColor: '#9c6644',
                    backgroundColor: 'rgba(156, 102, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createCategoriesChart() {
        const ctx = document.getElementById('categoriesChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Хлеб', 'Пироги', 'Десерты', 'Торты', 'Сдобная выпечка'],
                datasets: [{
                    data: [25, 20, 30, 15, 10],
                    backgroundColor: [
                        '#f8e1c4',
                        '#e6b89c',
                        '#9c6644',
                        '#7f5539',
                        '#fff9f0'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Активность',
                    data: [12, 19, 8, 15, 22, 18, 11],
                    backgroundColor: '#e6b89c'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createStatusChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Завершенные', 'В обработке', 'Доставка', 'Отмененные'],
                datasets: [{
                    data: [65, 15, 10, 10],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#17a2b8',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initEventListeners() {
        // Фильтрация заказов
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.renderOrdersTable();
        });

        document.getElementById('sortOrders').addEventListener('change', (e) => {
            this.sortOrders(e.target.value);
            this.renderOrdersTable();
        });

        // Сортировка по заголовкам таблицы
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                this.sortOrders(th.dataset.sort);
                this.renderOrdersTable();
            });
        });

        // Пагинация
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (link.classList.contains('prev')) {
                    this.prevPage();
                } else if (link.classList.contains('next')) {
                    this.nextPage();
                } else if (!isNaN(parseInt(link.textContent))) {
                    this.goToPage(parseInt(link.textContent));
                }
            });
        });

        // Выход из системы
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    sortOrders(criteria) {
        switch(criteria) {
            case 'date':
                this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'id':
                this.orders.sort((a, b) => a.id.localeCompare(b.id));
                break;
            case 'amount':
                this.orders.sort((a, b) => b.amount - a.amount);
                break;
            case 'status':
                this.orders.sort((a, b) => a.status.localeCompare(b.status));
                break;
            case 'newest':
                this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                this.orders.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'price-high':
                this.orders.sort((a, b) => b.amount - a.amount);
                break;
            case 'price-low':
                this.orders.sort((a, b) => a.amount - b.amount);
                break;
        }
    }

    renderOrdersTable() {
        const tbody = document.getElementById('ordersTableBody');
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredOrders = this.orders;
        if (statusFilter !== 'all') {
            filteredOrders = this.orders.filter(order => order.status === statusFilter);
        }

        // Пагинация
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + this.itemsPerPage);

        tbody.innerHTML = paginatedOrders.map(order => `
            <tr class="fade-in-up">
                <td>${this.formatDate(order.date)}</td>
                <td>${order.id}</td>
                <td>
                    <div class="order-items">
                        ${order.items.map(item => `<span class="order-item">${item}</span>`).join('')}
                    </div>
                </td>
                <td>${order.amount} ₽</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="dashboard.viewOrder('${order.id}')">
                        Подробнее
                    </button>
                </td>
            </tr>
        `).join('');

        this.updatePagination(filteredOrders.length);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Завершен',
            'processing': 'В обработке',
            'delivery': 'Доставка',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.querySelector('.pagination');
        
        let paginationHTML = `
            <button class="page-link prev" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="page-link ${i === this.currentPage ? 'active' : ''}">${i}</button>
            `;
        }

        paginationHTML += `
            <button class="page-link next" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Добавляем обработчики событий для новых кнопок
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (link.classList.contains('prev')) {
                    this.prevPage();
                } else if (link.classList.contains('next')) {
                    this.nextPage();
                } else if (!isNaN(parseInt(link.textContent))) {
                    this.goToPage(parseInt(link.textContent));
                }
            });
        });
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderOrdersTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.orders.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrdersTable();
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderOrdersTable();
    }

    viewOrder(orderId) {
        // В реальном приложении здесь будет переход на страницу деталей заказа
        alert(`Просмотр заказа ${orderId}`);
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // В реальном приложении здесь будет запрос на сервер для выхода
            window.location.href = 'index.html';
        }
    }
}

// Инициализация dashboard когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Анимация появления элементов при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
});