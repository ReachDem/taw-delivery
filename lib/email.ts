import nodemailer from 'nodemailer';

// Create reusable transporter
const smtpPort = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.dm.aliyun.com',
    port: smtpPort,
    secure: smtpPort === 465, // SSL for 465, STARTTLS for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Verify connection on startup (non-fatal)
if (process.env.SMTP_HOST) {
    transporter.verify((error) => {
        if (error) {
            console.warn('⚠️ SMTP connection failed:', error.message);
        } else {
            console.log('✅ SMTP server is ready to send emails');
        }
    });
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Send an email using the configured transporter
 */
export async function sendEmail(options: SendEmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"TGVAIRWABO" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}

export default transporter;
