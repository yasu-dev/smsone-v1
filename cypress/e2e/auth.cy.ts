describe('認証機能のE2Eテスト', () => {
  beforeEach(() => {
    // テストごとにローカルストレージをクリア
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('正常なログインフロー', () => {
    // ログインフォームの入力
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // ダッシュボードへのリダイレクトを確認
    cy.url().should('include', '/dashboard');
    
    // ログイン状態の永続化を確認
    cy.window().its('localStorage').invoke('getItem', 'auth_token').should('exist');
    
    // ユーザー情報が正しく表示されることを確認
    cy.get('[data-testid="user-info"]').should('contain', 'testuser');
  });

  it('ログイン失敗時のエラー表示', () => {
    // 誤った認証情報でログイン試行
    cy.get('input[name="username"]').type('wronguser');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    // エラーメッセージの表示を確認
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'ログインエラー');
  });

  it('自動ログイン機能', () => {
    // 最初のログイン
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="remember-me"]').check();
    cy.get('button[type="submit"]').click();

    // ページをリロード
    cy.reload();

    // 自動的にログイン状態が維持されていることを確認
    cy.url().should('include', '/dashboard');
  });

  it('ログアウト機能', () => {
    // ログイン
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // ログアウトボタンをクリック
    cy.get('[data-testid="logout-button"]').click();

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');
    
    // ローカルストレージがクリアされていることを確認
    cy.window().its('localStorage').invoke('getItem', 'auth_token').should('not.exist');
  });

  it('保護されたルートへのアクセス制御', () => {
    // 未ログイン状態で保護されたルートにアクセス
    cy.visit('/dashboard');

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');

    // ログイン
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // 保護されたルートにアクセスできることを確認
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('セッション永続性', () => {
    // ログイン
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="remember-me"]').check();
    cy.get('button[type="submit"]').click();

    // ブラウザを閉じて再度開く動作をシミュレート
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', win.localStorage.getItem('auth_token'));
    });
    cy.reload();

    // ログイン状態が維持されていることを確認
    cy.url().should('include', '/dashboard');
  });

  it('同時セッション管理', () => {
    // 複数タブでのログイン状態を確認
    cy.window().then((win) => {
      const newTab = win.open('/dashboard');
      expect(newTab.localStorage.getItem('auth_token')).to.equal(win.localStorage.getItem('auth_token'));
    });
  });
}); 