import { runSMSTests, logTestResults } from './utils/smsTests';

// テストを実行
const testResults = runSMSTests();

// 結果をログに出力
logTestResults(testResults);

// 全テストの成功・失敗を確認
const allTestsPassed = testResults.every(result => result.lengthPass && result.messageCountPass);

console.log(`\n総合判定: ${allTestsPassed ? '全テスト成功' : '一部テスト失敗'}`);

// 特定の値で計算テスト
function testSpecificValue(chars: number): void {
  console.log(`\n=== ${chars}文字のテスト ===`);
  
  import('./utils/smsUtils').then(({ calculateSMSLength, calculateSMSMessageCount }) => {
    const text = 'A'.repeat(chars);
    const length = calculateSMSLength(text);
    const messageCount = calculateSMSMessageCount(text);
    
    console.log(`文字数: ${chars}`);
    console.log(`計算文字数: ${length}`);
    console.log(`通数: ${messageCount}`);
    
    // 70文字までは1通、それ以上は70を引いた後66で割って切り上げた数に1を足す
    const expectedCount = chars <= 70 ? 1 : 1 + Math.ceil((chars - 70) / 66);
    console.log(`期待通数: ${expectedCount}`);
    console.log(`判定: ${messageCount === expectedCount ? '✓' : '✗'}`);
  });
}

// 特定のケースをテスト
testSpecificValue(65);   // 1通
testSpecificValue(70);   // 1通
testSpecificValue(71);   // 2通
testSpecificValue(136);  // 2通
testSpecificValue(137);  // 3通
testSpecificValue(350);  // 5通
testSpecificValue(660);  // 10通 