import nodemailer from 'nodemailer';
import { EmailData } from '../types';

// Email transporter configuration with better timeout handling
// Create transporter only if credentials are provided
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 60000, // 60 seconds timeout for production
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // Connection pooling for better performance
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
    // Better error handling for production
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in production
      ciphers: 'SSLv3',
    },
    // For Gmail, use requireTLS
    requireTLS: true,
    debug: process.env.NODE_ENV === 'development',
  });
};

const transporter = createTransporter();

// ✅ Verify transporter configuration asynchronously (non-blocking)
// Only verify if SMTP credentials are provided
let emailServiceReady = false;
let emailVerificationAttempted = false;

if (transporter && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  // Log configuration (without sensitive data)
  console.log('📧 Email service configuration:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'false'}`);
  
  // Use setTimeout to make verification non-blocking
  // Don't block server startup - verify in background
  setTimeout(() => {
    if (emailVerificationAttempted || !transporter) return;
    emailVerificationAttempted = true;
    
    // Set a timeout for verification itself
    const verifyTimeout = setTimeout(() => {
      console.warn('⚠️ Email verification timed out - will attempt connection on first email send');
      emailServiceReady = false;
    }, 10000); // 10 second timeout for verification
    
    transporter.verify((error: Error | null, _success: boolean) => {
      clearTimeout(verifyTimeout);
      
      if (error) {
        // Only log timeout/connection errors once, not repeatedly
        // Check if error has a code property (Node.js errors have this)
        const errorWithCode = error as Error & { code?: string };
        if (errorWithCode.code === 'ETIMEDOUT' || errorWithCode.code === 'ECONNREFUSED' || errorWithCode.code === 'ENOTFOUND') {
          // Don't fail completely - try on first email send
          console.warn('⚠️ Email service verification failed (connection timeout)');
          console.warn('   Will attempt connection when sending first email.');
          console.warn('   Please verify SMTP credentials are correct in Render environment variables.');
          emailServiceReady = false;
        } else if (errorWithCode.code === 'EAUTH') {
          console.error('❌ Email authentication failed - check SMTP_USER and SMTP_PASSWORD');
          console.error('   For Gmail, make sure you are using an App Password, not your regular password.');
          emailServiceReady = false;
        } else {
          console.warn('⚠️ Email transporter verification failed:', error.message);
          console.warn('   Will attempt connection when sending first email.');
          emailServiceReady = false;
        }
      } else {
        console.log('✅ Email service is ready and verified');
        emailServiceReady = true;
      }
    });
  }, 3000); // Delay verification by 3 seconds to not block server startup
} else {
  console.warn('⚠️ SMTP credentials not configured - email functionality will be disabled');
  console.warn('   Please set SMTP_USER and SMTP_PASSWORD environment variables in Render dashboard.');
  console.warn('   For Gmail: Use App Password (16 characters) from Google Account settings.');
}

// Send email with retry logic and better error handling
export const sendEmail = async (emailData: EmailData): Promise<void> => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn(`⚠️ Email not sent to ${emailData.to}: SMTP not configured`);
    return; // Silently fail if email is not configured
  }

  // Recreate transporter if it doesn't exist (lazy initialization)
  const emailTransporter = transporter || createTransporter();
  if (!emailTransporter) {
    console.warn(`⚠️ Email not sent to ${emailData.to}: Could not create email transporter`);
    return;
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const htmlContent = getEmailTemplate(emailData.template, emailData.data);

      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@pgmanagement.com',
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
      });

      console.log(`✅ Email sent to ${emailData.to}: ${emailData.subject}`);
      emailServiceReady = true; // Mark as ready if successful
      return; // Success, exit function
    } catch (error) {
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as Error & { code?: string })?.code;
      const errorResponse = (error as any)?.response;

      // Log detailed error for debugging
      if (retryCount === 1) {
        console.warn(`⚠️ Email send attempt ${retryCount} failed:`, errorMessage);
        if (errorCode) console.warn(`   Error code: ${errorCode}`);
        if (errorResponse) {
          console.warn(`   SMTP Response: ${errorResponse}`);
        }
      }

      // If it's a connection error and we haven't exhausted retries, try again
      if (
        retryCount <= maxRetries &&
        (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ESOCKET')
      ) {
        const delay = 3000 * retryCount; // 3s, 6s, 9s
        console.warn(`⚠️ Retrying email send in ${delay/1000}s... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Exponential backoff
        continue;
      }

      // Authentication errors - don't retry
      if (errorCode === 'EAUTH') {
        console.error(`❌ Email authentication failed for ${emailData.to}`);
        console.error('   Please check SMTP_USER and SMTP_PASSWORD in Render environment variables.');
        console.error('   For Gmail: Make sure you are using an App Password (16 characters).');
        emailServiceReady = false;
        return;
      }

      // Log error but don't throw - email failures shouldn't break the application
      if (retryCount > maxRetries) {
        console.error(`❌ Failed to send email to ${emailData.to} after ${maxRetries + 1} attempts`);
        console.error(`   Last error: ${errorMessage}`);
        emailServiceReady = false;
      }
      return; // Exit after max retries or non-retryable error
    }
  }
};

// Email templates
const getEmailTemplate = (template: string, data: Record<string, any>): string => {
  const templates: Record<string, (data: any) => string> = {
    welcome: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">
            Welcome to ${data.propertyName || 'PG Management System'}!
          </h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello <strong>${data.name}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your tenant account has been created successfully for <strong>${data.propertyName || 'the property'}</strong>.
          </p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin-top: 0; margin-bottom: 10px;">Login Credentials:</p>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>Email:</strong> ${data.email}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>Password:</strong> ${data.password}
            </p>
          </div>
          <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 20px 0;">
            ⚠️ Please login and change your password immediately for security.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Login to Your Account
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this URL in your browser:<br/>
            <a href="${data.loginUrl}" style="color: #3b82f6; word-break: break-all;">${data.loginUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            Best regards,<br/>
            <strong style="color: #1f2937;">PG Management Team</strong>
          </p>
        </div>
      </div>
    `,
    invoiceGenerated: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">New Invoice Generated</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello <strong>${data.tenantName}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">A new invoice has been generated for <strong>${data.month}</strong>.</p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin-top: 0; margin-bottom: 10px;">Invoice Details:</p>
            <ul style="color: #4b5563; font-size: 14px; margin: 5px 0; padding-left: 20px;">
              <li>Base Rent: ₹${data.baseRent?.toLocaleString('en-IN') || 0}</li>
              <li>Electricity Charges: ₹${data.electricityCharges?.toLocaleString('en-IN') || 0}</li>
              <li>Other Charges: ₹${data.otherCharges?.toLocaleString('en-IN') || 0}</li>
              <li>Late Fees: ₹${data.lateFees?.toLocaleString('en-IN') || 0}</li>
              <li style="margin-top: 10px;"><strong style="color: #1f2937;">Total Amount: ₹${data.totalAmount?.toLocaleString('en-IN') || 0}</strong></li>
            </ul>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <strong>Due Date:</strong> ${data.dueDate}
          </p>
          <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 20px 0;">
            ⚠️ Please make the payment before the due date to avoid late fees.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">
            Best regards,
          </p>
          ${data.ownerName ? `<p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 5px 0;"><strong>${data.ownerName}</strong></p>` : ''}
          ${data.propertyName ? `<p style="color: #6b7280; font-size: 14px; margin-top: 5px; margin-bottom: 0;">${data.propertyName}</p>` : ''}
        </div>
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
    emailVerification: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Verify Your Email Address</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello <strong>${data.name}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering! Please verify your email address to complete your account setup.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this URL in your browser:<br/>
            <a href="${data.verificationUrl}" style="color: #3b82f6; word-break: break-all;">${data.verificationUrl}</a>
          </p>
          <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
            ⚠️ This link will expire in ${data.expiryHours} hours.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            If you didn't create an account, please ignore this email.<br/>
            Best regards,<br/>
            <strong style="color: #1f2937;">PG Management Team</strong>
          </p>
        </div>
      </div>
    `,
  };

  return templates[template]?.(data) || '<p>No template found</p>';
};
