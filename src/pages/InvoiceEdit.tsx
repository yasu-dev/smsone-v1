import React from 'react';
import { Container, Paper } from '@mui/material';
import InvoiceTemplate from '../components/billing/InvoiceTemplate';
import toast from 'react-hot-toast';

const InvoiceEdit: React.FC = () => {
  const handleSave = (data: any) => {
    // データの保存処理（APIへの送信等）
    console.log('保存されたデータ:', data);
    toast.success('請求書データが保存されました');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <InvoiceTemplate
          initialData={{
            companyName: '株式会社サンプル',
            companyAddress: '東京都渋谷区1-1-1',
            clientName: '株式会社クライアント',
            clientAddress: '東京都新宿区2-2-2',
            invoiceNumber: 'INV-2024-001',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [
              {
                description: '商品A',
                quantity: 2,
                unitPrice: 1000,
              },
              {
                description: '商品B',
                quantity: 1,
                unitPrice: 2000,
              },
            ],
          }}
          onSave={handleSave}
        />
      </Paper>
    </Container>
  );
};

export default InvoiceEdit; 