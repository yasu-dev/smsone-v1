export interface SMSMessage {
  id: string;
  to: string;
  body: string;
  status: SMSStatus;
  isInternational: boolean;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  shortenedUrl?: string;
  originalUrl?: string;
  shortenedUrl2?: string;
  originalUrl2?: string;
}

export enum SMSStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
} 