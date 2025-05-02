import { SMSMessage, SMSStatus } from '../../domain/entities/SMSMessage';

export interface SMSService {
  sendMessage(message: Partial<SMSMessage>): Promise<void>;
  sendTestMessage(message: Partial<SMSMessage>): Promise<void>;
  sendBulkMessages(data: FileRow[], options: BulkSendOptions): Promise<void>;
  fetchMessages(): Promise<SMSMessage[]>;
}

export interface BulkSendOptions {
  template?: string;
  delay?: number;
  maxRetries?: number;
}

export interface FileRow {
  phoneNumber: string;
  message?: string;
  [key: string]: any;
} 