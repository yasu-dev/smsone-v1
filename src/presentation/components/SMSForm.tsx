import React, { useState } from 'react';
import { SMSService } from '../../application/services/SMSService';
import { SMSMessage } from '../../domain/entities/SMSMessage';

interface SMSFormProps {
  smsService: SMSService;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const SMSForm: React.FC<SMSFormProps> = ({ smsService, onSuccess, onError }) => {
  const [message, setMessage] = useState<Partial<SMSMessage>>({
    to: '',
    body: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await smsService.sendMessage(message);
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={message.to}
        onChange={(e) => setMessage({ ...message, to: e.target.value })}
        placeholder="Phone number"
      />
      <textarea
        value={message.body}
        onChange={(e) => setMessage({ ...message, body: e.target.value })}
        placeholder="Message"
      />
      <button type="submit">Send</button>
    </form>
  );
}; 