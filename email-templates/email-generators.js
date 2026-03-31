/**
 * Email генератори з inline стилями для максимальної сумісності
 * Працює в Gmail, Outlook, Apple Mail, Spark та інших клієнтах
 */

// Екранування HTML для безпечного вставлення даних від користувача
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Базові кольори в стилі сайту
const colors = {
    olive: '#8B8C2C',
    darkOlive: '#6B6B20',
    lightOlive: '#A5A642',
    beige: '#F5E6D3',
    lightBeige: '#FAF0E6',
    white: '#FFFFFF',
    darkText: '#2C2C2C',
    lightText: '#666666',
    gray: '#999999'
};

/**
 * Генерує email для клієнта з підтвердженням замовлення
 */
function generateClientEmail(orderData) {
    const name = escapeHtml(orderData.name);
    const service = escapeHtml(orderData.service);
    const phone = escapeHtml(orderData.phone);
    const email = escapeHtml(orderData.email);
    const date = escapeHtml(orderData.date);
    const message = escapeHtml(orderData.message);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Підтвердження замовлення</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.white};">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${colors.beige} 0%, ${colors.lightBeige} 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid ${colors.olive};">
            
            <!-- Logo -->
            <div style="margin-bottom: 20px;">
                <img src="https://vasylynaphoto.com.ua/img/logo.png" alt="Василина Петрик - Логотип" style="width: 60px; height: auto; display: block; margin: 0 auto;">
            </div>
            
            <h1 style="color: ${colors.olive}; font-size: 26px; margin: 0 0 5px 0; font-weight: 400;">Василина Петрик</h1>
            <p style="color: ${colors.darkOlive}; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Фотограф</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 20px;">
            <h2 style="color: ${colors.olive}; font-size: 22px; margin-bottom: 15px;">Дякую за ваше замовлення!</h2>
            
            <p style="color: ${colors.darkText}; line-height: 1.6; margin-bottom: 20px;">
                Вітаю, <strong>${name}</strong>! Ваше замовлення успішно отримано. Я дуже рада, що ви обрали мене для створення ваших особливих спогадів.
            </p>
            
            <!-- Order Details -->
            <div style="background-color: ${colors.lightBeige}; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid ${colors.olive};">
                <h3 style="color: ${colors.olive}; margin: 0 0 15px 0; font-size: 18px;">Деталі замовлення</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: ${colors.lightText}; font-weight: bold;">Послуга:</td>
                        <td style="padding: 5px 0; color: ${colors.darkText};">${service}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: ${colors.lightText}; font-weight: bold;">Телефон:</td>
                        <td style="padding: 5px 0; color: ${colors.darkText};">${phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: ${colors.lightText}; font-weight: bold;">Email:</td>
                        <td style="padding: 5px 0; color: ${colors.darkText};">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: ${colors.lightText}; font-weight: bold;">Бажана дата:</td>
                        <td style="padding: 5px 0; color: ${colors.darkText};">${date || 'Не вказана'}</td>
                    </tr>
                </table>
                
                ${message ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${colors.olive};">
                    <p style="color: ${colors.lightText}; font-weight: bold; margin: 0 0 5px 0;">Ваше повідомлення:</p>
                    <p style="color: ${colors.darkText}; margin: 0; line-height: 1.5;">${message}</p>
                </div>
                ` : ''}
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: ${colors.beige}; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <h3 style="color: ${colors.olive}; margin: 0 0 15px 0; font-size: 18px;">Що далі?</h3>
                <div style="line-height: 1.6;">
                    ✓ Я зв'яжуся з вами протягом 24 годин<br>
                    ✓ Обговоримо всі деталі фотосесії<br>
                    ✓ Узгодимо дату та місце зйомки<br>
                    ✓ Готові фото надішлю протягом 3-7 днів
                </div>
            </div>
            
            <p style="color: ${colors.darkText}; line-height: 1.6; margin: 20px 0;">
                Якщо у вас є додаткові питання, зв'яжіться зі мною будь-яким зручним способом.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://vasylynaphoto.com.ua/portfolio" style="background: ${colors.olive}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                    Переглянути портфоліо
                </a>
            </div>
        </div>
        
        <!-- Contacts -->
        <div style="background-color: ${colors.lightBeige}; padding: 20px; text-align: center;">
            <h3 style="color: ${colors.olive}; margin: 0 0 15px 0;">Контакти</h3>
            <p style="margin: 5px 0; color: ${colors.darkText};">📞 +38 (095) 596-36-41</p>
            <p style="margin: 5px 0; color: ${colors.darkText};">✉️ vasilinapetrik@gmail.com</p>
            <p style="margin: 5px 0; color: ${colors.darkText};">📷 @vasylynapetryk</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: ${colors.olive}; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">З теплими побажаннями,<br><strong>Василина Петрик</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">© 2024 Професійний фотограф у Львові</p>
        </div>
        
    </div>
</body>
</html>
    `.trim();
    
    const textVersion = `
Дякую за ваше замовлення!

Вітаю, ${name}!

Ваше замовлення успішно отримано:
- Послуга: ${service}
- Телефон: ${phone}  
- Email: ${email}
- Бажана дата: ${date || 'Не вказана'}
${message ? `- Повідомлення: ${message}` : ''}

Що далі?
✓ Я зв'яжуся з вами протягом 24 годин
✓ Обговоримо всі деталі фотосесії
✓ Узгодимо дату та місце зйомки
✓ Готові фото надішлю протягом 3-7 днів

Контакти:
📞 +38 (095) 596-36-41
✉️ vasilinapetrik@gmail.com
📷 @vasylynapetryk

З теплими побажаннями,
Василина Петрик
Професійний фотограф у Львові
    `.trim();
    
    return {
        subject: `Підтвердження замовлення: ${service}`,
        html,
        text: textVersion
    };
}

/**
 * Генерує email для адміністратора про нове замовлення
 */
function generateAdminEmail(orderData, additionalData = {}) {
    const name = escapeHtml(orderData.name);
    const service = escapeHtml(orderData.service);
    const phone = escapeHtml(orderData.phone);
    const email = escapeHtml(orderData.email);
    const date = escapeHtml(orderData.date);
    const message = escapeHtml(orderData.message);
    const { clientIP = 'Unknown', userAgent = 'Unknown', ordersToday = '1' } = additionalData;
    const currentTime = new Date().toLocaleString('uk-UA');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Нове замовлення</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <div style="max-width: 650px; margin: 0 auto; background-color: ${colors.white};">
        
        <!-- Header -->
        <div style="background: ${colors.olive}; color: white; padding: 25px 20px; text-align: center;">
            <div style="background: rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 50%; display: inline-block; line-height: 50px; font-size: 24px; margin-bottom: 10px;">
                🔔
            </div>
            <h1 style="margin: 0; font-size: 24px;">Нове замовлення!</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Сповіщення від сайту</p>
        </div>
        
        <!-- Quick Summary -->
        <div style="background: ${colors.lightBeige}; padding: 20px; border-bottom: 3px solid ${colors.olive};">
            <h2 style="color: ${colors.olive}; margin: 0 0 10px 0; font-size: 18px;">📋 Швидкий огляд</h2>
            <p style="margin: 0; color: ${colors.darkText}; font-size: 16px;">
                <strong>${name}</strong> замовив/ла <strong style="color: ${colors.olive};">${service}</strong>
            </p>
            <p style="margin: 5px 0 0 0; color: ${colors.lightText}; font-size: 14px;">
                Отримано: ${currentTime} | Замовлень сьогодні: ${ordersToday}
            </p>
        </div>
        
        <!-- Client Details -->
        <div style="padding: 25px 20px;">
            <h3 style="color: ${colors.olive}; margin: 0 0 15px 0; font-size: 18px;">👤 Дані клієнта</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 10px; background: ${colors.lightBeige}; border: 1px solid ${colors.beige}; font-weight: bold; color: ${colors.darkText}; width: 30%;">Ім'я</td>
                    <td style="padding: 10px; background: white; border: 1px solid ${colors.beige}; color: ${colors.darkText};">${name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: ${colors.lightBeige}; border: 1px solid ${colors.beige}; font-weight: bold; color: ${colors.darkText};">Телефон</td>
                    <td style="padding: 10px; background: white; border: 1px solid ${colors.beige}; color: ${colors.darkText}; font-family: monospace; font-weight: bold;">
                        <a href="tel:${phone}" style="color: #007bff; text-decoration: none;">${phone}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: ${colors.lightBeige}; border: 1px solid ${colors.beige}; font-weight: bold; color: ${colors.darkText};">Email</td>
                    <td style="padding: 10px; background: white; border: 1px solid ${colors.beige}; color: ${colors.darkText};">
                        <a href="mailto:${email}" style="color: ${colors.olive}; text-decoration: none; font-weight: bold;">${email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: ${colors.lightBeige}; border: 1px solid ${colors.beige}; font-weight: bold; color: ${colors.darkText};">Послуга</td>
                    <td style="padding: 10px; background: white; border: 1px solid ${colors.beige}; color: ${colors.olive}; font-weight: bold;">${service}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: ${colors.lightBeige}; border: 1px solid ${colors.beige}; font-weight: bold; color: ${colors.darkText};">Бажана дата</td>
                    <td style="padding: 10px; background: white; border: 1px solid ${colors.beige}; color: ${colors.darkText};">${date || 'Не вказана'}</td>
                </tr>
            </table>
            
            ${message ? `
            <div style="background: ${colors.beige}; border-left: 4px solid ${colors.olive}; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4 style="color: ${colors.olive}; margin: 0 0 10px 0; font-size: 16px;">💬 Повідомлення клієнта</h4>
                <p style="margin: 0; color: ${colors.darkText}; line-height: 1.6; font-style: italic;">"${message}"</p>
            </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                <h4 style="color: ${colors.olive}; margin: 0 0 15px 0;">🎯 Швидкі дії</h4>
                <div style="margin-bottom: 10px;">
                    <a href="tel:${phone}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px 10px; display: inline-block; font-weight: bold;">
                        📞 Дзвінок
                    </a>
                    <a href="mailto:${email}" style="background: ${colors.olive}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block; font-weight: bold;">
                        ✉️ Email
                    </a>
                </div>
                <p style="margin: 10px 0 0 0; color: ${colors.lightText}; font-size: 13px;">
                    💡 Рекомендую зв'язатися протягом 2-4 годин
                </p>
            </div>
        </div>
        
        <!-- Technical Info -->
        <div style="background: ${colors.darkText}; color: white; padding: 15px 20px; font-size: 12px;">
            <h4 style="margin: 0 0 10px 0; color: ${colors.olive};">Технічна інформація</h4>
            <p style="margin: 0; opacity: 0.8;">IP: ${clientIP}</p>
            <p style="margin: 0; opacity: 0.8;">User Agent: ${userAgent.substring(0, 80)}${userAgent.length > 80 ? '...' : ''}</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">Відправлено: ${currentTime}</p>
        </div>
        
    </div>
</body>
</html>
    `.trim();
    
    const textVersion = `
🔔 НОВЕ ЗАМОВЛЕННЯ!

Клієнт: ${name}
Послуга: ${service}
Телефон: ${phone}
Email: ${email}
Бажана дата: ${date || 'Не вказана'}

${message ? `Повідомлення: "${message}"` : ''}

Швидкі дії:
📞 Дзвінок: ${phone}
✉️ Email: ${email}

Технічна інформація:
IP: ${clientIP}
Отримано: ${currentTime}
Замовлень сьогодні: ${ordersToday}
    `.trim();
    
    return {
        subject: `🔔 Нове замовлення: ${service} від ${name}`,
        html,
        text: textVersion
    };
}

module.exports = {
    generateClientEmail,
    generateAdminEmail
};