const fs = require('fs').promises;
const path = require('path');

/**
 * Функції для роботи з email-шаблонами
 */
class EmailTemplateManager {
    constructor() {
        this.templatesPath = path.join(__dirname, '.');
    }

    /**
     * Завантажує HTML шаблон з файлу
     */
    async loadTemplate(templateName) {
        try {
            const templatePath = path.join(this.templatesPath, `${templateName}.html`);
            const templateContent = await fs.readFile(templatePath, 'utf8');
            return templateContent;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            throw new Error(`Failed to load email template: ${templateName}`);
        }
    }

    /**
     * Замінює плейсхолдери в шаблоні на реальні дані
     */
    replacePlaceholders(template, data) {
        let result = template;
        
        // Замінюємо всі плейсхолдери вигляду {{PLACEHOLDER}}
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = data[key] || '';
            result = result.replace(new RegExp(placeholder, 'g'), value);
        });
        
        // Обробляємо умовні блоки {{#if CONDITION}} ... {{else}} ... {{/if}}
        result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
            return data[condition] && data[condition].toString().trim() ? ifContent : elseContent;
        });
        
        // Обробляємо прості умовні блоки {{#if CONDITION}} ... {{/if}}
        result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            return data[condition] && data[condition].toString().trim() ? content : '';
        });
        
        return result;
    }

    /**
     * Створює email для клієнта з підтвердженням замовлення
     */
    async createClientConfirmationEmail(orderData) {
        try {
            const template = await this.loadTemplate('client-confirmation');
            
            const templateData = {
                CLIENT_NAME: orderData.name || 'Шановний клієнте',
                SERVICE_NAME: orderData.service || 'Фотосесія',
                CLIENT_PHONE: orderData.phone || 'Не вказано',
                CLIENT_EMAIL: orderData.email || 'Не вказано',
                PREFERRED_DATE: orderData.date || 'Не вказана',
                CLIENT_MESSAGE: orderData.message || 'Немає додаткових побажань'
            };
            
            const emailContent = this.replacePlaceholders(template, templateData);
            
            return {
                subject: `Підтвердження замовлення: ${templateData.SERVICE_NAME}`,
                html: emailContent,
                text: this.generateTextVersion(orderData, 'client')
            };
        } catch (error) {
            console.error('Error creating client email:', error);
            throw error;
        }
    }

    /**
     * Створює email для адміністратора про нове замовлення
     */
    async createAdminNotificationEmail(orderData, additionalData = {}) {
        try {
            const template = await this.loadTemplate('admin-notification');
            
            const currentDate = new Date();
            const templateData = {
                CLIENT_NAME: orderData.name || 'Невідомий',
                SERVICE_NAME: orderData.service || 'Не вказана послуга',
                CLIENT_PHONE: orderData.phone || 'Не вказано',
                CLIENT_EMAIL: orderData.email || 'Не вказано',
                PREFERRED_DATE: orderData.date || 'Не вказана',
                CLIENT_MESSAGE: orderData.message || '',
                ORDER_DATE: currentDate.toLocaleString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                NOTIFICATION_TIME: currentDate.toLocaleString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                ORDERS_TODAY: additionalData.ordersToday || '1',
                VIEWS_TODAY: additionalData.viewsToday || '-',
                RESPONSE_TIME: additionalData.responseTime || '<2h',
                CLIENT_IP: additionalData.clientIP || 'Unknown',
                CLIENT_USER_AGENT: additionalData.userAgent || 'Unknown'
            };
            
            const emailContent = this.replacePlaceholders(template, templateData);
            
            return {
                subject: `🔔 Нове замовлення: ${templateData.SERVICE_NAME} від ${templateData.CLIENT_NAME}`,
                html: emailContent,
                text: this.generateTextVersion(orderData, 'admin')
            };
        } catch (error) {
            console.error('Error creating admin email:', error);
            throw error;
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
     * Перевіряє, чи існують всі необхідні шаблони
     */
    async validateTemplates() {
        const requiredTemplates = ['client-confirmation', 'admin-notification'];
        const validationResults = {};

        for (const templateName of requiredTemplates) {
            try {
                await this.loadTemplate(templateName);
                validationResults[templateName] = true;
            } catch (error) {
                validationResults[templateName] = false;
                console.error(`Template ${templateName} is not available:`, error.message);
            }
        }

        return validationResults;
    }

    /**
     * Створює резервну HTML версію, якщо основний шаблон недоступний
     */
    createFallbackEmail(orderData, type) {
        const baseStyle = `
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #8B8C2C; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #ddd; }
                .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
            </style>
        `;

        if (type === 'client') {
            return {
                subject: `Підтвердження замовлення: ${orderData.service}`,
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>Дякую за замовлення!</h1>
                        </div>
                        <div class="content">
                            <p>Вітаю, <strong>${orderData.name}</strong>!</p>
                            <p>Ваше замовлення <strong>${orderData.service}</strong> успішно отримано.</p>
                            <p>Незабаром я зв'яжуся з вами для обговорення деталей.</p>
                            <p>З повагою,<br>Василина Петрик</p>
                        </div>
                        <div class="footer">
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
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>Нове замовлення!</h1>
                        </div>
                        <div class="content">
                            <p><strong>Клієнт:</strong> ${orderData.name}</p>
                            <p><strong>Послуга:</strong> ${orderData.service}</p>
                            <p><strong>Телефон:</strong> ${orderData.phone}</p>
                            <p><strong>Email:</strong> ${orderData.email}</p>
                            <p><strong>Дата:</strong> ${orderData.date || 'Не вказана'}</p>
                            <p><strong>Повідомлення:</strong> ${orderData.message || 'Немає'}</p>
                        </div>
                        <div class="footer">
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