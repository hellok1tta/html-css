// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Мобильное меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.textContent = mainNav.classList.contains('active') ? '✕' : '☰';
        });
    }
    
    // Закрытие меню при клике на ссылку
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                if (mobileMenuBtn) {
                    mobileMenuBtn.textContent = '☰';
                }
            }
        });
    });

    // Инициализация аутентификации
    if (window.auth) {
        // Проверяем авторизацию при загрузке страницы
        auth.checkAuth().then(() => {
            // Обновляем навигацию
            auth.updateNavigation();
            
            // Обновляем счетчик корзины
            updateCartCount();
        });
    }

    // Обработка кликов по кнопкам "В корзину"
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-primary[data-product], .btn-primary[data-product-id]')) {
            const button = e.target;
            const productId = button.dataset.productId || button.dataset.product;
            const productName = button.dataset.product || 'Товар';
            const price = parseFloat(button.dataset.price) || 0;
            
            // Если у нас есть глобальный объект catalog, используем его метод
            if (window.catalog && typeof catalog.addToCart === 'function') {
                catalog.addToCart(productId, productName, price);
            } else {
                // Иначе используем простую логику
                addToCart(productId, productName, price);
            }
        }
    });

    // Функция добавления в корзину
function addToCart(productId, productName, price) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(price),
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${productName} добавлен в корзину!`);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function showNotification(message) {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Обновляем счетчик при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

    // Инициализация счетчика корзины при загрузке
    updateCartCount();
});