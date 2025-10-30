/**
 * WebSocket service for real-time notifications
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Message queuing while disconnected
 * - Heartbeat/ping-pong for connection health
 * - Event-driven architecture
 */

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type MessageHandler = (message: WebSocketMessage) => void;

export class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private messageHandlers: Set<MessageHandler> = new Set();
  private isIntentionallyClosed = false;
  private url: string;

  constructor() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.DEV ? '8000' : window.location.port; // Backend port in dev
    this.url = `${protocol}//${host}:${port}/ws/notifications/`;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      console.log(`[WebSocket] Connecting to ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('[WebSocket] Disconnecting');
    this.isIntentionallyClosed = true;
    this.stopPing();
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      console.log('[WebSocket] Queueing message (not connected)');
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Get connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleOpen(event: Event) {
    console.log('[WebSocket] Connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Process queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }

    // Start heartbeat
    this.startPing();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('[WebSocket] Received:', message.type);

      // Notify all subscribers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Handler error:', error);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  private handleError(event: Event) {
    console.error('[WebSocket] Error:', event);
  }

  private handleClose(event: CloseEvent) {
    console.log(`[WebSocket] Closed (code: ${event.code}, reason: ${event.reason})`);
    this.stopPing();

    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.clearReconnectTimeout();

    // Exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startPing() {
    this.stopPing();

    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance
let wsServiceInstance: NotificationWebSocketService | null = null;

export const getWebSocketService = (): NotificationWebSocketService => {
  if (!wsServiceInstance) {
    wsServiceInstance = new NotificationWebSocketService();
  }
  return wsServiceInstance;
};
