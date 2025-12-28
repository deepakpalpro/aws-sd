export type OrderEventType =
  | "ORDER_CREATED"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_FAILED"
  | "INVENTORY_RESERVED"
  | "INVENTORY_FAILED"
  | "ORDER_SHIPPED";

export interface OrderEvent {
  orderId: string;
  eventType: OrderEventType;
  timestamp: string;
  source: string;
  payload: Record<string, any>;
  correlationId: string;
}
