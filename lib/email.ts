import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmailVerification(
  email: string,
  token: string,
  name: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@socialapp.com",
    to: email,
    subject: "Потвърдете вашия имейл адрес",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Добре дошли, ${name}!</h1>
        <p>Благодарим ви, че се регистрирахте в нашата платформа. За да завършите регистрацията си, моля потвърдете вашия имейл адрес.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Потвърди имейл адрес
          </a>
        </div>
        <p>Ако не можете да кликнете върху бутона, копирайте и поставете следния линк в браузъра си:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><small>Този линк ще изтече след 24 часа.</small></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordReset(
  email: string,
  token: string,
  name: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@socialapp.com",
    to: email,
    subject: "Нулиране на парола",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Нулиране на парола</h1>
        <p>Здравейте, ${name}!</p>
        <p>Получихме заявка за нулиране на паролата за вашия акаунт. Ако не сте заявили това, моля игнорирайте този имейл.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Нулирай парола
          </a>
        </div>
        <p>Ако не можете да кликнете върху бутона, копирайте и поставете следния линк в браузъра си:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><small>Този линк ще изтече след 1 час.</small></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function send2FACode(email: string, code: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@socialapp.com",
    to: email,
    subject: "Код за двуфакторна автентификация",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Код за вход</h1>
        <p>Здравейте, ${name}!</p>
        <p>Вашият код за двуфакторна автентификация е:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${code}
          </div>
        </div>
        <p>Този код ще изтече след 10 минути.</p>
        <p><small>Ако не сте заявили този код, моля игнорирайте този имейл.</small></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendSecurityAlert(
  email: string,
  name: string,
  action: string,
  details: any
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@socialapp.com",
    to: email,
    subject: "Сигурностно известие",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Сигурностно известие</h1>
        <p>Здравейте, ${name}!</p>
        <p>Искаме да ви уведомим за следната дейност във вашия акаунт:</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <strong>Действие:</strong> ${action}<br>
          <strong>Време:</strong> ${new Date().toLocaleString("bg-BG")}<br>
          <strong>IP адрес:</strong> ${details.ipAddress || "Неизвестен"}<br>
          <strong>Устройство:</strong> ${details.userAgent || "Неизвестно"}
        </div>
        <p>Ако това не сте вие, моля незабавно влезте в акаунта си и променете паролата си.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
