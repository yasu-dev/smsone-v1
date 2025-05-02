import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import BillingManagement from '../pages/BillingManagement';
import useAuthStore from '../store/authStore';
import { useBillingStore } from '../store/billingStore';

// モックデータ
const mockInvoices = [
  {
    id: 'INV-001',
    date: '2024-02-01',
    amount: 55600,
    status: '支払済'
  },
  {
    id: 'INV-002',
    date: '2024-03-01',
    amount: 61200,
    status: '未払い'
  }
];

const mockCurrentUser = {
  id: 'USER-001',
  monthlyFee: 50000,
  nextBillingDate: '2024-04-01',
  usage: 8000,
  limit: 10000
};

// モック
vi.mock('../store/authStore');
vi.mock('../store/billingStore');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ userId: 'USER-001' }),
    useNavigate: () => vi.fn()
  };
});

describe('BillingManagement', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({
      user: { role: 'OPERATION_ADMIN' },
      tenant: { name: 'テスト企業' }
    });

    (useBillingStore as any).mockReturnValue({
      currentUser: mockCurrentUser,
      invoices: mockInvoices,
      isLoading: false,
      error: null,
      fetchUserById: vi.fn(),
      fetchInvoices: vi.fn(),
      processPayment: vi.fn(),
      exportCSV: vi.fn(),
      downloadPDF: vi.fn()
    });
  });

  it('請求情報が正しく表示される', () => {
    render(
      <BrowserRouter>
        <BillingManagement />
      </BrowserRouter>
    );

    expect(screen.getByText('請求・支払い管理')).toBeInTheDocument();
    expect(screen.getByText(/テスト企業 SMSビジネスプラン/)).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
    expect(screen.getByText('8,000 / 10,000')).toBeInTheDocument();
  });

  it('支払いボタンが正しく機能する', () => {
    const { processPayment } = useBillingStore();
    render(
      <BrowserRouter>
        <BillingManagement />
      </BrowserRouter>
    );

    const payButton = screen.getByText('今すぐ支払う');
    fireEvent.click(payButton);

    expect(processPayment).toHaveBeenCalledWith('INV-002');
  });

  it('CSV出力ボタンが正しく機能する', () => {
    const { exportCSV } = useBillingStore();
    render(
      <BrowserRouter>
        <BillingManagement />
      </BrowserRouter>
    );

    const csvButton = screen.getByText('CSV出力');
    fireEvent.click(csvButton);

    expect(exportCSV).toHaveBeenCalledWith('invoices');
  });
});