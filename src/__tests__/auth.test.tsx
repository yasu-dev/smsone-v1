import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { vi, expect, describe, it } from 'vitest';
import useAuthStore from '../store/authStore';

// モックの設定
vi.mock('../store/authStore', () => ({
  default: vi.fn(() => ({
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    user: null,
    error: null,
    getTenantInfo: vi.fn(() => ({
      name: 'SMSOne（Topaz合同会社）',
      logoUrl: '/logo.svg'
    }))
  })),
}));

describe('Loginコンポーネント', () => {
  it('ログインフォームが正しく表示される', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/SMSOne（Topaz合同会社）/i)).toBeInTheDocument();
    expect(screen.getByText(/SMS配信プラットフォーム/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ユーザー名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('ログイン処理が正しく動作する', async () => {
    const mockLogin = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: false,
      user: null,
      error: null,
      getTenantInfo: vi.fn(() => ({
        name: 'SMSOne（Topaz合同会社）',
        logoUrl: '/logo.svg'
      }))
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/ユーザー名/i), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText(/パスワード/i), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ログイン/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password');
    });
  });

  it('エラーメッセージが表示される', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('ログインに失敗しました'));
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: false,
      user: null,
      error: 'ログインに失敗しました',
      getTenantInfo: vi.fn(() => ({
        name: 'SMSOne（Topaz合同会社）',
        logoUrl: '/logo.svg'
      }))
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument();
  });

  it('認証済みの場合はダッシュボードにリダイレクトされる', async () => {
    const navigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => navigate,
    }));

    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      user: {
        id: '1',
        username: 'admin',
        role: 'SYSTEM_ADMIN',
      },
      error: null,
      getTenantInfo: vi.fn(() => ({
        name: 'SMSOne（Topaz合同会社）',
        logoUrl: '/logo.svg'
      }))
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/dashboard');
    });
  });
}); 