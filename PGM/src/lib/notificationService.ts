import { useUIStore } from '@/store/ui';

class NotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Check for notifications every 30 minutes
    this.intervalId = setInterval(() => {
      this.checkAndSendNotifications();
    }, 30 * 60 * 1000); // 30 minutes
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private checkAndSendNotifications() {
    // const { tickets, shouldSendNotification, markNotificationSent } = useMaintenanceStore.getState();
    const { addNotification } = useUIStore.getState();

    // Check each open ticket
    // tickets
    //   .filter(ticket => ticket.status === 'OPEN')
    //   .forEach(ticket => {
    //     if (shouldSendNotification(ticket.id)) {
    //       // Send notification
    //       addNotification({
    //         type: 'warning',
    //         title: 'Maintenance Request Reminder',
    //         message: `High priority maintenance request from ${ticket.tenantId}: ${ticket.title}`,
    //         read: false,
    //       });

    //       // Mark as sent
    //       markNotificationSent(ticket.id);
    //     }
    //   });
  }

  // Manual trigger for testing
  triggerNotification(ticketId: string) {
    // const { tickets } = useMaintenanceStore.getState();
    const { addNotification } = useUIStore.getState();
    
    // const ticket = tickets.find(t => t.id === ticketId);
    // if (ticket && ticket.status === 'OPEN') {
    //   addNotification({
    //     type: 'warning',
    //     title: 'Maintenance Request Reminder',
    //     message: `Maintenance request from ${ticket.tenantId}: ${ticket.title}`,
    //     read: false,
    //   });
    // }
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Auto-start the service when the module is imported
if (typeof window !== 'undefined') {
  notificationService.start();
}

