import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserRole } from '../types/tenant';
import PermissionRoute from '../routes/PermissionRoute';
import { ROLE_PERMISSIONS } from '../utils/permissions';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// モックデータの作成
const mockHasPermission = jest.fn();
jest.mock('../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    hasPermission: mockHasPermission
  })
}));

const mockUseTenant = jest.fn();
jest.mock('../store/TenantContext', () => ({
  useTenant: () => mockUseTenant()
}));

const mockUser = (role: UserRole) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role,
  permissions: ROLE_PERMISSIONS[role],
  tenantId: '1'
});

describe('権限制御のテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SYSTEM_ADMIN', () => {
    beforeEach(() => {
      mockUseTenant.mockReturnValue({
        user: mockUser(UserRole.SYSTEM_ADMIN),
        isAuthenticated: true
      });
      // システム管理者はすべての権限を持つ
      mockHasPermission.mockReturnValue(true);
    });

    it('全ての画面にアクセスできる', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="tenant:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });
  });

  describe('TENANT_ADMIN', () => {
    beforeEach(() => {
      mockUseTenant.mockReturnValue({
        user: mockUser(UserRole.TENANT_ADMIN),
        isAuthenticated: true
      });
      // テナント管理者はテナント設定以外の権限を持つ
      mockHasPermission.mockImplementation((permission) => {
        return permission !== 'tenant:read';
      });
    });

    it('テナント設定以外の画面にアクセスできる', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="user:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });

    it('テナント設定画面にはアクセスできない', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="tenant:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.queryByText('テストコンテンツ')).not.toBeInTheDocument();
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
    });
  });

  describe('OPERATION_ADMIN', () => {
    beforeEach(() => {
      mockUseTenant.mockReturnValue({
        user: mockUser(UserRole.OPERATION_ADMIN),
        isAuthenticated: true
      });
      // 運用管理者は限定された権限を持つ
      mockHasPermission.mockImplementation((permission) => {
        return permission === 'operation:read' || permission === 'operation:write';
      });
    });

    it('運用管理画面にアクセスできる', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="operation:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });

    it('テナント設定画面にアクセスできない', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="tenant:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.queryByText('テストコンテンツ')).not.toBeInTheDocument();
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
    });
  });

  describe('OPERATION_USER', () => {
    beforeEach(() => {
      mockUseTenant.mockReturnValue({
        user: mockUser(UserRole.OPERATION_USER),
        isAuthenticated: true
      });
      // 運用担当者は読み取り権限のみ持つ
      mockHasPermission.mockImplementation((permission) => {
        return permission === 'operation:read';
      });
    });

    it('運用参照のみ可能', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="operation:read">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });

    it('運用管理画面に書き込みできない', () => {
      render(
        <BrowserRouter>
          <PermissionRoute permission="operation:write">
            <div>テストコンテンツ</div>
          </PermissionRoute>
        </BrowserRouter>
      );
      expect(screen.queryByText('テストコンテンツ')).not.toBeInTheDocument();
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
    });
  });
}); 