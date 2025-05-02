import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルなモックの設定
global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// CSRFトークンのモック
document.querySelector = vi.fn().mockImplementation((selector) => {
  if (selector === 'meta[name="csrf-token"]') {
    return { content: 'mock-csrf-token' };
  }
  return null;
});

// エラー監視の設定
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      /Warning/.test(args[0]) ||
      /React does not recognize the.*prop on a DOM element/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// グローバルなモックを設定
vi.mock('../store/authStore', () => ({
  default: vi.fn(() => ({
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    user: null,
  })),
})); 