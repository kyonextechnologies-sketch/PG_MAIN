import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  modals: {
    propertyModal: boolean;
    tenantModal: boolean;
    invoiceModal: boolean;
    maintenanceModal: boolean;
  };
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  setModalOpen: (modal: keyof UIState['modals'], open: boolean) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  modals: {
    propertyModal: false,
    tenantModal: false,
    invoiceModal: false,
    maintenanceModal: false,
  },
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setTheme: (theme) => set({ theme }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(notification => notification.id !== id)
  })),
  
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    )
  })),
  
  clearAllNotifications: () => set({ notifications: [] }),
  
  setModalOpen: (modal, open) => set((state) => ({
    modals: { ...state.modals, [modal]: open }
  })),
  
  closeAllModals: () => set({
    modals: {
      propertyModal: false,
      tenantModal: false,
      invoiceModal: false,
      maintenanceModal: false,
    }
  }),
}));
