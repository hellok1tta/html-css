// backend/seed.js
const Database = require('./database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    const db = new Database();
    
    try {
        console.log('🚀 Наполнение базы данных пекарни "Вкусный уголок"...');
        
        // Инициализируем базу данных
        await db.init();
        
        // Хешируем пароль для тестового пользователя
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Добавляем тестового пользователя
        console.log('\n👤 Добавляем тестового пользователя...');
        try {
            await db.register({
                name: 'Иван Иванов',
                email: 'test@example.com',
                password: hashedPassword
            });
            console.log('✓ Тестовый пользователь добавлен');
        } catch (error) {
            console.log(`ℹ️ ${error.message}`);
        }

        // Добавляем сотрудников
        console.log('\n👥 Добавляем сотрудников...');
        const employees = [
            {
                name: 'Иван Петров',
                position: 'Главный пекарь',
                description: 'Опыт работы более 15 лет. Специализируется на традиционном хлебе и выпечке. Закончил Московский колледж кулинарного мастерства.',
                experience: '15 лет',
                photo: 'images/ivan.jpg'
            },
            {
                name: 'Мария Сидорова',
                position: 'Кондитер',
                description: 'Создает потрясающие десерты и торты. Опыт работы в кондитерском искусстве 12 лет. Проходила стажировку во Франции.',
                experience: '12 лет',
                photo: 'images/maria.jpg'
            },
            {
                name: 'Алексей Козлов',
                position: 'Пекарь',
                description: 'Специалист по слоеному тесту и французской выпечке. Работает в пекарне с 2015 года.',
                experience: '8 лет',
                photo: 'images/alexey.jpg'
            },
            {
                name: 'Елена Новикова',
                position: 'Управляющая',
                description: 'Обеспечивает бесперебойную работу пекарни и заботится о каждом клиенте. Работает с нами с основания пекарни.',
                experience: '10 лет',
                photo: 'images/elena.jpg'
            }
        ];

        for (const employee of employees) {
            try {
                await db.createEmployee(employee);
                console.log(`✓ ${employee.name} - ${employee.position}`);
            } catch (error) {
                console.log(`✗ ${employee.name}: ${error.message}`);
            }
        }

        // Добавляем продукты
        console.log('\n🍞 Добавляем продукты...');
        const products = [
            // Популярные продукты
            {
                name: 'Ржаной хлеб',
                price: 150,
                description: 'Традиционный ржаной хлеб с хрустящей корочкой, приготовленный по старинному рецепту',
                image_url: 'images/hleb.jpg',
                category: 'Хлеб',
                weight: '500г',
                is_new: true,
                on_sale: false,
                is_popular: true
            },
            {
                name: 'Круассан с шоколадом',
                price: 120,
                description: 'Слоеный круассан с начинкой из бельгийского шоколада, нежный и воздушный',
                image_url: 'images/kruassan.jpg',
                category: 'Сдобная выпечка',
                weight: '100г',
                is_new: false,
                on_sale: false,
                is_popular: true
            },
            {
                name: 'Пирог с яблоками',
                price: 350,
                description: 'Домашний пирог с яблочной начинкой и корицей, идеально подходит к чаю',
                image_url: 'images/applepie.jpg',
                category: 'Пироги',
                weight: '800г',
                is_new: false,
                on_sale: true,
                old_price: 400,
                is_popular: true
            },
            {
                name: 'Эклеры (4 шт.)',
                price: 280,
                description: 'Набор из четырех эклеров с разными начинками: ваниль, шоколад, кофе, клубника',
                image_url: 'images/ekler.jpg',
                category: 'Десерты',
                weight: '200г',
                is_new: false,
                on_sale: false,
                is_popular: true
            },
            // Другие продукты
            {
                name: 'Багет французский',
                price: 90,
                description: 'Классический французский багет с хрустящей корочкой и нежным мякишем',
                image_url: 'images/baget.jpg',
                category: 'Хлеб',
                weight: '250г',
                is_new: false,
                on_sale: false,
                is_popular: false
            },
            {
                name: 'Пирог с вишней',
                price: 380,
                description: 'Сочный пирог со свежей вишней, идеальное сочетание сладкого и кислого',
                image_url: 'images/cherrypie.jpg',
                category: 'Пироги',
                weight: '800г',
                is_new: false,
                on_sale: false,
                is_popular: false
            },
            {
                name: 'Тирамису',
                price: 320,
                description: 'Классический итальянский десерт с кофе, маскарпоне и какао',
                image_url: 'images/tiramisu.jpg',
                category: 'Десерты',
                weight: '150г',
                is_new: true,
                on_sale: false,
                is_popular: false
            },
            {
                name: 'Пирожное "Картошка"',
                price: 85,
                description: 'Нежное пирожное из крошки бисквита с масляным кремом и какао',
                image_url: 'images/kartoshka.jpg',
                category: 'Десерты',
                weight: '80г',
                is_new: false,
                on_sale: true,
                old_price: 100,
                is_popular: false
            }
        ];

        let addedProducts = 0;
        for (const product of products) {
            try {
                await db.createProduct(product);
                addedProducts++;
                console.log(`✓ ${product.name} - ${product.price} руб. ${product.is_popular ? '(Популярный)' : ''}`);
            } catch (error) {
                console.log(`✗ ${product.name}: ${error.message}`);
            }
        }

        // Добавляем магазины
        console.log('\n🏪 Добавляем магазины...');
        const shops = [
            {
                address: 'г. Москва, ул. Пушкина, д. 10',
                phone: '+7 (495) 123-45-67',
                email: 'main@vkusniy-ugolok.ru',
                working_hours: 'Пн-Пт: 8:00-20:00, Сб-Вс: 9:00-18:00',
                latitude: 55.7558,
                longitude: 37.6176
            },
            {
                address: 'г. Москва, ул. Тверская, д. 15',
                phone: '+7 (495) 123-45-68',
                email: 'tverskaya@vkusniy-ugolok.ru',
                working_hours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-19:00',
                latitude: 55.7570,
                longitude: 37.6150
            }
        ];

        for (const shop of shops) {
            try {
                await db.createShop(shop);
                console.log(`✓ ${shop.address}`);
            } catch (error) {
                console.log(`✗ ${shop.address}: ${error.message}`);
            }
        }

        // Добавляем тестовые отзывы
        console.log('\n⭐ Добавляем тестовые отзывы...');
        const reviews = [
            {
                user_id: 1,
                product_id: 1,
                review: 'Лучший ржаной хлеб в городе! Ароматный и с хрустящей корочкой. Покупаю каждую неделю.',
                stars: 5
            },
            {
                user_id: 1,
                product_id: 3,
                review: 'Пирог с яблоками просто восхитительный! Идеальное сочетание сладкого и кислого. Рекомендую всем!',
                stars: 4
            },
            {
                user_id: 1,
                product_id: 4,
                review: 'Эклеры - просто объедение! Особенно понравился кофейный. Обязательно куплю еще.',
                stars: 5
            }
        ];

        for (const review of reviews) {
            try {
                await db.createReview(review);
                console.log(`✓ Отзыв на продукт ${review.product_id}`);
            } catch (error) {
                console.log(`✗ Отзыв на продукт ${review.product_id}: ${error.message}`);
            }
        }

        // Добавляем тестовые заказы
        console.log('\n📦 Добавляем тестовые заказы...');
        const orders = [
            {
                user_id: 1,
                items: JSON.stringify([
                    { id: 1, name: 'Ржаной хлеб', price: 150, quantity: 2 },
                    { id: 2, name: 'Круассан с шоколадом', price: 120, quantity: 3 }
                ]),
                total_amount: 660,
                status: 'completed'
            },
            {
                user_id: 1,
                items: JSON.stringify([
                    { id: 3, name: 'Пирог с яблоками', price: 350, quantity: 1 },
                    { id: 4, name: 'Эклеры (4 шт.)', price: 280, quantity: 1 }
                ]),
                total_amount: 630,
                status: 'delivery'
            },
            {
                user_id: 1,
                items: JSON.stringify([
                    { id: 5, name: 'Багет французский', price: 90, quantity: 2 },
                    { id: 7, name: 'Тирамису', price: 320, quantity: 1 }
                ]),
                total_amount: 500,
                status: 'processing'
            }
        ];

        for (const order of orders) {
            try {
                await db.createOrder(order);
                console.log(`✓ Заказ на ${order.total_amount} руб.`);
            } catch (error) {
                console.log(`✗ Заказ: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ НАПОЛНЕНИЕ БАЗЫ ДАННЫХ ЗАВЕРШЕНО');
        console.log('='.repeat(50));
        console.log(`📊 Статистика:`);
        console.log(`   👥 Сотрудников: ${employees.length}`);
        console.log(`   🍞 Товаров: ${addedProducts}`);
        console.log(`   🏪 Магазинов: ${shops.length}`);
        console.log(`   ⭐ Отзывов: ${reviews.length}`);
        console.log(`   📦 Заказов: ${orders.length}`);
        console.log('\n🎉 База данных готова к использованию!');
        console.log('\n🔑 Тестовый аккаунт:');
        console.log('   📧 Email: test@example.com');
        console.log('   🔐 Пароль: password123');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Ошибка при наполнении базы:', error);
    } finally {
        await db.close();
    }
}

// Запуск скрипта если он вызван напрямую
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;