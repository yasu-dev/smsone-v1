import { calculateSMSLength, calculateSMSMessageCount, SMS_CHARACTER_LIMITS } from './smsUtils';

/**
 * SMS文字数計算テストケース
 */
interface TestCase {
  description: string;
  text: string;
  expectedLength: number;
  expectedMessageCount: number;
}

/**
 * テストケースの実行結果
 */
interface TestResult {
  description: string;
  text: string;
  textLength: number;
  calcLength: number;
  expectedLength: number; // 期待される文字数
  lengthPass: boolean;
  expectedMessageCount: number;
  calcMessageCount: number;
  messageCountPass: boolean;
}

/**
 * テストケースを定義
 */
const testCases: TestCase[] = [
  {
    description: '空文字列のテスト',
    text: '',
    expectedLength: 0,
    expectedMessageCount: 0
  },
  {
    description: '70文字以下のテスト（1通）',
    text: 'A'.repeat(65),
    expectedLength: 65,
    expectedMessageCount: 1
  },
  {
    description: '70文字ちょうどのテスト（1通）',
    text: 'A'.repeat(70),
    expectedLength: 70,
    expectedMessageCount: 1
  },
  {
    description: '71文字のテスト（2通）',
    text: 'A'.repeat(71),
    expectedLength: 71,
    expectedMessageCount: 2
  },
  {
    description: '136文字のテスト（70+66, 2通）',
    text: 'A'.repeat(136),
    expectedLength: 136,
    expectedMessageCount: 2
  },
  {
    description: '137文字のテスト（70+66+1, 3通）',
    text: 'A'.repeat(137),
    expectedLength: 137,
    expectedMessageCount: 3
  },
  {
    description: '202文字のテスト（70+66+66, 3通）',
    text: 'A'.repeat(202),
    expectedLength: 202,
    expectedMessageCount: 3
  },
  {
    description: '203文字のテスト（70+66+66+1, 4通）',
    text: 'A'.repeat(203),
    expectedLength: 203,
    expectedMessageCount: 4
  },
  {
    description: '350文字のテスト（70+66*5=400文字で6通）',
    text: 'A'.repeat(350),
    expectedLength: 350,
    expectedMessageCount: 6
  },
  {
    description: '660文字ちょうどのテスト（10通）',
    text: 'A'.repeat(660),
    expectedLength: 660,
    expectedMessageCount: 10
  },
  {
    description: '改行を含むテスト',
    text: 'こんにちは\nお元気ですか？',
    expectedLength: 14, // 11文字 + 改行1つ(2文字分)
    expectedMessageCount: 1
  },
  {
    description: 'URLタグを含むテスト',
    text: 'こちらのリンクをクリックしてください: {URL1}',
    expectedLength: 21 + SMS_CHARACTER_LIMITS.URL_HTTPS, // 「こちらのリンクをクリックしてください: 」(21文字) + URL(20文字)
    expectedMessageCount: 1
  },
  {
    description: '複数のURLタグを含むテスト',
    text: 'リンク1: {URL1} またはリンク2: {URL2}',
    expectedLength: 20 + (SMS_CHARACTER_LIMITS.URL_HTTPS * 2), // 「リンク1:  またはリンク2: 」(20文字) + URL(20文字) x 2
    expectedMessageCount: 1
  }
];

/**
 * 全テストケースを実行
 */
export const runSMSTests = (): TestResult[] => {
  return testCases.map(testCase => {
    const calcLength = calculateSMSLength(testCase.text);
    const calcMessageCount = calculateSMSMessageCount(testCase.text);
    
    return {
      description: testCase.description,
      text: testCase.text,
      textLength: testCase.text.length,
      calcLength,
      expectedLength: testCase.expectedLength,
      lengthPass: calcLength === testCase.expectedLength,
      expectedMessageCount: testCase.expectedMessageCount,
      calcMessageCount,
      messageCountPass: calcMessageCount === testCase.expectedMessageCount
    };
  });
};

/**
 * テスト結果をコンソールに出力
 */
export const logTestResults = (results: TestResult[]): void => {
  console.log('=== SMS計算テスト結果 ===');
  
  results.forEach(result => {
    console.log(`\n[${result.description}]`);
    console.log(`テキスト: "${result.text.length > 30 ? result.text.substring(0, 30) + '...' : result.text}"`);
    console.log(`文字数: 実測=${result.textLength}, 計算=${result.calcLength}, 期待値=${result.expectedLength} => ${result.lengthPass ? '✓' : '✗'}`);
    console.log(`通数: 計算=${result.calcMessageCount}, 期待値=${result.expectedMessageCount} => ${result.messageCountPass ? '✓' : '✗'}`);
  });
  
  const passedLengthCount = results.filter(r => r.lengthPass).length;
  const passedMessageCount = results.filter(r => r.messageCountPass).length;
  
  console.log(`\n=== テスト結果集計 ===`);
  console.log(`文字数計算: ${passedLengthCount}/${results.length} 成功`);
  console.log(`通数計算: ${passedMessageCount}/${results.length} 成功`);
  console.log(`全体: ${passedLengthCount === results.length && passedMessageCount === results.length ? '成功' : '失敗'}`);
};

// テスト結果を取得
const testResults = runSMSTests();

// コンソールに結果を出力
logTestResults(testResults);

// テスト結果をエクスポート
export default testResults; 