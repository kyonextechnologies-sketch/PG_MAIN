import nodemailer from 'nodemailer';
import { EmailData } from '../types';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000, // 10 seconds timeout
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// ✅ Verify transporter configuration asynchronously (non-blocking)
// Only verify if SMTP credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  // Use setTimeout to make verification non-blocking
  setTimeout(() => {
    transporter.verify((error: Error | null, _success: boolean) => {
      if (error) {
        // Only log timeout/connection errors once, not repeatedly
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
          // Suppress repeated timeout errors - they're expected if SMTP is not accessible
          // Only log once on startup
          if (!process.env.EMAIL_VERIFICATION_LOGGED) {
            console.warn('⚠️ Email service unavailable (SMTP connection timeout)');
            console.warn('   Emails will be skipped if SMTP is not accessible.');
            process.env.EMAIL_VERIFICATION_LOGGED = 'true';
          }
        } else {
          console.warn('⚠️ Email transporter verification failed:', error.message);
        }
      } else {
        console.log('✅ Email service is ready');
        process.env.EMAIL_VERIFICATION_LOGGED = 'true';
      }
    });
  }, 1000); // Delay verification by 1 second to not block server startup
} else {
  console.warn('⚠️ SMTP credentials not configured - email functionality will be disabled');
}

// Send email
export const sendEmail = async (emailData: EmailData): Promise<void> => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn(`⚠️ Email not sent to ${emailData.to}: SMTP not configured`);
    return; // Silently fail if email is not configured
  }

  try {
    const htmlContent = getEmailTemplate(emailData.template, emailData.data);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pgmanagement.com',
      to: emailData.to,
      subject: emailData.subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent to ${emailData.to}: ${emailData.subject}`);
  } catch (error) {
    console.error('❌ Error sending email:', error instanceof Error ? error.message : error);
    // Don't throw error - email failures shouldn't break the application
    // Log the error but allow the application to continue
  }
};

// Email templates
const getEmailTemplate = (template: string, data: Record<string, any>): string => {
  const templates: Record<string, (data: any) => string> = {
    welcome: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to PG Management System!</h2>
        <p>Hello ${data.name},</p>
        <p>Your tenant account has been created successfully.</p>
        <p><strong>Login Credentials:</strong></p>
        <p>Email: ${data.email}<br/>Password: ${data.password}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: <a href="${data.loginUrl}">${data.loginUrl}</a></p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    invoiceGenerated: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Invoice Generated</h2>
        <p>Hello ${data.tenantName},</p>
        <p>A new invoice has been generated for ${data.month}.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Base Rent: ₹${data.baseRent}</li>
          <li>Electricity Charges: ₹${data.electricityCharges}</li>
          <li>Other Charges: ₹${data.otherCharges}</li>
          <li>Late Fees: ₹${data.lateFees}</li>
          <li><strong>Total Amount: ₹${data.totalAmount}</strong></li>
        </ul>
        <p>Due Date: ${data.dueDate}</p>
        <p>Please make the payment before the due date to avoid late fees.</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    paymentConfirmation: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Received</h2>
        <p>Hello ${data.tenantName},</p>
        <p>We have received your payment successfully.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Amount: ₹${data.amount}</li>
          <li>Payment Method: ${data.method}</li>
          <li>Transaction ID: ${data.transactionId}</li>
          <li>Date: ${data.date}</li>
        </ul>
        <p>Thank you for your payment!</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    paymentReminder: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Reminder</h2>
        <p>Hello ${data.tenantName},</p>
        <p>This is a friendly reminder that your payment for ${data.month} is due soon.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Total Amount: ₹${data.amount}</li>
          <li>Due Date: ${data.dueDate}</li>
          <li>Days Remaining: ${data.daysRemaining}</li>
        </ul>
        <p>Please make the payment before the due date to avoid late fees.</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    overduePayment: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #d32f2f;">
        <h2>Overdue Payment Notice</h2>
        <p>Hello ${data.tenantName},</p>
        <p>Your payment for ${data.month} is overdue.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Total Amount: ₹${data.amount}</li>
          <li>Due Date: ${data.dueDate}</li>
          <li>Days Overdue: ${data.daysOverdue}</li>
          <li>Late Fees: ₹${data.lateFees}</li>
        </ul>
        <p>Please make the payment immediately to avoid further penalties.</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    billApproved: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Electricity Bill Approved</h2>
        <p>Hello ${data.tenantName},</p>
        <p>Your electricity bill for ${data.month} has been approved.</p>
        <p><strong>Bill Details:</strong></p>
        <ul>
          <li>Previous Reading: ${data.previousReading}</li>
          <li>Current Reading: ${data.currentReading}</li>
          <li>Units Consumed: ${data.units}</li>
          <li>Rate per Unit: ₹${data.ratePerUnit}</li>
          <li><strong>Total Amount: ₹${data.amount}</strong></li>
        </ul>
        <p>This amount will be added to your next invoice.</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    billRejected: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Electricity Bill Rejected</h2>
        <p>Hello ${data.tenantName},</p>
        <p>Your electricity bill for ${data.month} has been rejected.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>Please resubmit the correct meter reading.</p>
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    ticketUpdate: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Maintenance Ticket Update</h2>
        <p>Hello ${data.name},</p>
        <p>Your maintenance ticket has been updated.</p>
        <p><strong>Ticket Details:</strong></p>
        <ul>
          <li>Title: ${data.title}</li>
          <li>Status: ${data.status}</li>
          <li>Priority: ${data.priority}</li>
          <li>Category: ${data.category}</li>
        </ul>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        <br/>
        <p>Best regards,<br/>PG Management Team</p>
      </div>
    `,
    'password-reset': (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #007bff;">
          <h1 style="color: #007bff; margin: 0;">🔒 Password Reset</h1>
        </div>
        
        <div style="padding: 30px 0;">
          <p style="font-size: 16px; color: #333;">Hello ${data.name},</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; padding: 30px 0;">
            <a href="${data.resetUrl}" style="display: inline-block; padding: 15px 40px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; transition: background-color 0.3s;">
              Reset Your Password
            </a>
          </div>
          
          <p style="font-size: 13px; color: #999; text-align: center;">
            This link will expire in 1 hour
          </p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #ffc107; border-radius: 4px;">
            <p style="font-size: 13px; color: #666; margin: 0;">
              <strong>⚠️ Security Tip:</strong> If you didn't request this password reset, please ignore this email. Your account is safe.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 10px 0;">
              Can't click the button? Copy and paste this link:
            </p>
            <p style="font-size: 11px; color: #007bff; word-break: break-all; margin: 5px 0;">
              ${data.resetUrl}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 2px solid #eee; font-size: 12px; color: #999;">
          <p>Best regards,<br/><strong>PG Management Team</strong></p>
          <p>© 2025 Smart PG Manager. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  return templates[template]?.(data) || '<p>No template found</p>';
};
