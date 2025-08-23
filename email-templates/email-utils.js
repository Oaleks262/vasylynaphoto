const { generateClientEmail, generateAdminEmail } = require('./email-generators');

/**
 * Функції для роботи з email-шаблонами
 * Тепер використовуємо серверні генератори з inline стилями для кращої сумісності
 */
class EmailTemplateManager {
    constructor() {
        // Більше не потребуємо файлові шаблони - все генерується на сервері
    }

    /**
     * Перевіряє, чи працюють генератори email (замінює перевірку шаблонів)
     */
    async validateTemplates() {
        try {
            // Тестуємо генератори з простими даними
            const testData = {
                name: 'Test User',
                service: 'Test Service',
                phone: '+380000000000',
                email: 'test@example.com'
            };
            
            const clientEmail = generateClientEmail(testData);
            const adminEmail = generateAdminEmail(testData);
            
            return {
                'client-confirmation': !!(clientEmail && clientEmail.html && clientEmail.subject),
                'admin-notification': !!(adminEmail && adminEmail.html && adminEmail.subject)
            };
        } catch (error) {
            console.error('Error validating email generators:', error);
            return {
                'client-confirmation': false,
                'admin-notification': false
            };
        }
    }

    /**
     * Створює email для клієнта з підтвердженням замовлення
     */
    async createClientConfirmationEmail(orderData) {
        try {
            // Використовуємо серверний генератор
            const emailData = generateClientEmail(orderData);
            return emailData;
        } catch (error) {
            console.error('Error creating client email:', error);
            // Fallback до простого email якщо генератор не працює
            return this.createFallbackEmail(orderData, 'client');
        }
    }

    /**
     * Створює email для адміністратора про нове замовлення
     */
    async createAdminNotificationEmail(orderData, additionalData = {}) {
        try {
            // Використовуємо серверний генератор
            const emailData = generateAdminEmail(orderData, additionalData);
            return emailData;
        } catch (error) {
            console.error('Error creating admin email:', error);
            // Fallback до простого email якщо генератор не працює
            return this.createFallbackEmail(orderData, 'admin');
        }
    }

    /**
     * Генерує текстову версію email для клієнтів, які не підтримують HTML
     */
    generateTextVersion(orderData, type) {
        if (type === 'client') {
            return `
Дякую за ваше замовлення!

Вітаю, ${orderData.name || 'Шановний клієнте'}!

Ваше замовлення успішно отримано. Я дуже рада, що ви обрали мене для створення ваших особливих спогадів.

Деталі замовлення:
- Послуга: ${orderData.service || 'Фотосесія'}
- Ім'я: ${orderData.name || 'Не вказано'}
- Телефон: ${orderData.phone || 'Не вказано'}
- Email: ${orderData.email || 'Не вказано'}
- Бажана дата: ${orderData.date || 'Не вказана'}
- Повідомлення: ${orderData.message || 'Немає додаткових побажань'}

Що далі?
✓ Я зв'яжуся з вами протягом 24 годин для підтвердження
✓ Обговоримо всі деталі: локацію, стиль, кількість фото
✓ Узгодимо точну дату та час фотосесії
✓ За день до зйомки нагадаю про всі важливі моменти
✓ Готові фото надішлю протягом 3-7 робочих днів

Контакти:
Телефон: +38 (095) 596-36-41
Email: vasilinapetrik@gmail.com
Instagram: @vasylynapetryk

З теплими побажаннями,
Василина Петрик
Професійний фотограф у Львові
            `.trim();
        } else {
            return `
НОВЕ ЗАМОВЛЕННЯ!

Клієнт: ${orderData.name || 'Невідомий'}
Послуга: ${orderData.service || 'Не вказана'}
Телефон: ${orderData.phone || 'Не вказано'}
Email: ${orderData.email || 'Не вказано'}
Бажана дата: ${orderData.date || 'Не вказана'}

Повідомлення клієнта:
${orderData.message || 'Немає додаткових побажань'}

Рекомендовані дії:
1. Зателефонувати: ${orderData.phone}
2. Надіслати email: ${orderData.email}

Отримано: ${new Date().toLocaleString('uk-UA')}
            `.trim();
        }
    }


    /**
     * Створює резервну HTML версію, якщо генератори не працюють
     */
    createFallbackEmail(orderData, type) {
        if (type === 'client') {
            return {
                subject: `Підтвердження замовлення: ${orderData.service}`,
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: #8B8C2C; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">Дякую за замовлення!</h1>
                        </div>
                        <div style="padding: 20px; background: white;">
                            <p>Вітаю, <strong>${orderData.name}</strong>!</p>
                            <p>Ваше замовлення <strong>${orderData.service}</strong> успішно отримано.</p>
                            <p>Незабаром я зв'яжуся з вами для обговорення деталей.</p>
                            <p>З повагою,<br><strong>Василина Петрик</strong></p>
                        </div>
                        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px;">
                            <p>vasylynaphoto.com.ua | +38 (095) 596-36-41</p>
                        </div>
                    </div>
                `,
                text: this.generateTextVersion(orderData, 'client')
            };
        } else {
            return {
                subject: `Нове замовлення: ${orderData.service}`,
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: #8B8C2C; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">Нове замовлення!</h1>
                        </div>
                        <div style="padding: 20px; background: white;">
                            <p><strong>Клієнт:</strong> ${orderData.name}</p>
                            <p><strong>Послуга:</strong> ${orderData.service}</p>
                            <p><strong>Телефон:</strong> <a href="tel:${orderData.phone}">${orderData.phone}</a></p>
                            <p><strong>Email:</strong> <a href="mailto:${orderData.email}">${orderData.email}</a></p>
                            <p><strong>Дата:</strong> ${orderData.date || 'Не вказана'}</p>
                            <p><strong>Повідомлення:</strong> ${orderData.message || 'Немає'}</p>
                        </div>
                        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px;">
                            <p>Отримано: ${new Date().toLocaleString('uk-UA')}</p>
                        </div>
                    </div>
                `,
                text: this.generateTextVersion(orderData, 'admin')
            };
        }
    }
}

module.exports = EmailTemplateManager;