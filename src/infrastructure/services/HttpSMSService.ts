import { SMSService, BulkSendOptions, FileRow } from '../../application/services/SMSService';
import { SMSMessage } from '../../domain/entities/SMSMessage';

export class HttpSMSService implements SMSService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(message: Partial<SMSMessage>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  async sendTestMessage(message: Partial<SMSMessage>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sms/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send test message');
    }
  }

  async sendBulkMessages(data: FileRow[], options: BulkSendOptions): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sms/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, options }),
    });

    if (!response.ok) {
      throw new Error('Failed to send bulk messages');
    }
  }

  async fetchMessages(): Promise<SMSMessage[]> {
    const response = await fetch(`${this.baseUrl}/sms/messages`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }
} 