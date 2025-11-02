import { toast } from 'react-toastify';

export const showToast = {
  success: (message: string, title?: string) => {
    toast.success(
      title ? `${title}: ${message}` : message,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }
    );
  },

  error: (message: string, title?: string) => {
    toast.error(
      title ? `${title}: ${message}` : message,
      {
        position: "top-right",
        autoClose: 7000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  },

  info: (message: string, title?: string) => {
    toast.info(
      title ? `${title}: ${message}` : message,
      {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  },

  warning: (message: string, title?: string) => {
    toast.warning(
      title ? `${title}: ${message}` : message,
      {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  },
};

// CRUD Operation Toasts
export const crudToasts = {
  create: {
    success: (item: string) => showToast.success(`${item} created successfully!`, 'Success'),
    error: (item: string) => showToast.error(`Failed to create ${item}. Please try again.`, 'Error'),
  },
  update: {
    success: (item: string) => showToast.success(`${item} updated successfully!`, 'Success'),
    error: (item: string) => showToast.error(`Failed to update ${item}. Please try again.`, 'Error'),
  },
  delete: {
    success: (item: string) => showToast.success(`${item} deleted successfully!`, 'Success'),
    error: (item: string) => showToast.error(`Failed to delete ${item}. Please try again.`, 'Error'),
  },
  save: {
    success: (item: string) => showToast.success(`${item} saved successfully!`, 'Success'),
    error: (item: string) => showToast.error(`Failed to save ${item}. Please try again.`, 'Error'),
  },
};

// Authentication Toasts
export const authToasts = {
  login: {
    success: (name?: string) => showToast.success(`Welcome back${name ? `, ${name}` : ''}!`, 'Login Successful'),
    error: () => showToast.error('Invalid credentials. Please check your email and password.', 'Login Failed'),
  },
  logout: {
    success: () => showToast.info('You have been logged out successfully.', 'Logout'),
  },
  signup: {
    success: (name?: string) => showToast.success(`Account created successfully${name ? ` for ${name}` : ''}!`, 'Signup Successful'),
    error: (message?: string) => showToast.error(message || 'Failed to create account. Please try again.', 'Signup Failed'),
  },
  passwordReset: {
    success: () => showToast.success('Password reset link sent to your email.', 'Password Reset'),
    error: () => showToast.error('Failed to send password reset link. Please try again.', 'Error'),
  },
};

// Payment Toasts
export const paymentToasts = {
  initiated: (amount: number, method: string) => showToast.info(`Payment of ₹${amount.toLocaleString()} initiated via ${method}`, 'Payment Initiated'),
  success: (amount: number) => showToast.success(`Payment of ₹${amount.toLocaleString()} completed successfully!`, 'Payment Successful'),
  failed: (reason?: string) => showToast.error(`Payment failed${reason ? `: ${reason}` : ''}. Please try again.`, 'Payment Failed'),
  pending: (amount: number) => showToast.warning(`Payment of ₹${amount.toLocaleString()} is pending approval.`, 'Payment Pending'),
  timeout: () => showToast.error('Payment request timed out. Please try again.', 'Payment Timeout'),
};

// Notification Toasts
export const notificationToasts = {
  sent: (type: string) => showToast.info(`${type} notification sent successfully.`, 'Notification Sent'),
  failed: (type: string) => showToast.error(`Failed to send ${type} notification.`, 'Notification Failed'),
  acknowledged: (type: string) => showToast.success(`${type} notification acknowledged.`, 'Acknowledged'),
};