import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize socket connection
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    if (!token) {
      console.warn('⚠️ Cannot connect socket: No token provided');
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

    console.log(`🔌 Connecting to WebSocket: ${socketURL}`);
    console.log(`🔑 Token provided: ${token ? 'Yes' : 'No'}`);

    this.socket = io(socketURL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // 20 seconds timeout
      forceNew: true, // Force new connection
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Connection confirmed by server
    this.socket.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
    });

    // Connection error
    this.socket.on('connect_error', (error: Error & { type?: string }) => {
      // Only log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Socket connection error (this is normal if backend is not running):', {
          message: error.message,
          ...(error.type && { type: error.type }),
        });
      }
      this.isConnected = false;
      this.reconnectAttempts++;

      // Only log if max attempts reached (don't show to user)
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Max reconnection attempts reached. Socket will not reconnect automatically.');
          console.warn('💡 This is normal if the backend server is not running. Real-time features will be unavailable.');
        }
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;

      // Reconnect if disconnection was unexpected
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manually reconnect
        this.socket?.connect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ Socket reconnected after ${attempt} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      this.isConnected = false;
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Listen for notifications
   */
  onNotification(callback: (notification: any) => void): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on('notification', (data) => {
      console.log('📬 New notification received:', data);
      callback(data);
    });
  }

  /**
   * Listen for real-time data updates (create/update/delete)
   */
  onDataUpdate(
    resource: string,
    callback: (event: 'create' | 'update' | 'delete', data: any) => void
  ): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Call connect() first.');
      return;
    }

    const eventName = `${resource}:update`;
    this.socket.on(eventName, (payload: { event: 'create' | 'update' | 'delete'; data: any }) => {
      console.log(`🔄 Real-time update for ${resource}:`, payload);
      callback(payload.event, payload.data);
    });
  }

  /**
   * Unsubscribe from data updates
   */
  offDataUpdate(resource: string): void {
    if (!this.socket) return;
    const eventName = `${resource}:update`;
    this.socket.off(eventName);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('notification:read', notificationId);
  }

  /**
   * Listen for notification read acknowledgment
   */
  onNotificationReadAck(callback: (data: { notificationId: string }) => void): void {
    if (!this.socket) return;

    this.socket.on('notification:read:ack', callback);
  }

  /**
   * Subscribe to custom events
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Call connect() first.');
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Emit custom events
   */
  emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    this.socket.emit(event, ...args);
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();

