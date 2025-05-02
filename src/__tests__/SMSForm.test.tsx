import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SMSForm } from '../presentation/components/SMSForm';
import { SMSService } from '../application/services/SMSService';

describe('SMSForm', () => {
  const mockSMSService: SMSService = {
    sendMessage: jest.fn(),
    sendTestMessage: jest.fn(),
    sendBulkMessages: jest.fn(),
    fetchMessages: jest.fn(),
  };

  it('should render form elements', () => {
    render(<SMSForm smsService={mockSMSService} />);
    
    expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should call sendMessage when form is submitted', async () => {
    render(<SMSForm smsService={mockSMSService} />);
    
    fireEvent.change(screen.getByPlaceholderText('Phone number'), {
      target: { value: '+1234567890' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('Message'), {
      target: { value: 'Test message' },
    });
    
    fireEvent.click(screen.getByText('Send'));
    
    expect(mockSMSService.sendMessage).toHaveBeenCalledWith({
      to: '+1234567890',
      body: 'Test message',
    });
  });
}); 