// SMS計算テスト実行スクリプト

// 計算用定数
const SMS_CHARACTER_LIMITS = {
  STANDARD: 70,  // 通常SMS: 70文字
  DOCOMO_LONG: 660,  // ドコモ長文SMS: 660文字
  OTHER_LONG: 670,  // au/SoftBank/楽天 長文SMS: 670文字
  SMS_LIMIT: 660,  // 統一された文字数上限: 660文字
  URL_HTTP: 19,  // HTTP短縮URL: 19文字
  URL_HTTPS: 20,  // HTTPS短縮URL: 20文字
  LINE_BREAK: 2,  // 改行コード: 2文字分
  SEGMENT_SIZE: 66,  // 長文SMS分割サイズ: 66文字
};

// SMSメッセージの文字数を計算する関数
const calculateSMSLength = (text) => {
  if (!text) return 0;
  
  // 改行を2文字としてカウント（元の\nを削除して2文字分追加）
  let processedText = text.replace(/\n/g, '##');
  
  // URLタグを短縮URL文字数に置き換え
  processedText = processedText.replace(/{URL(\d*)}/g, (match, p1) => {
    // HTTPSの場合は20文字、HTTP(または不明)の場合は19文字と仮定
    return '#'.repeat(SMS_CHARACTER_LIMITS.URL_HTTPS);
  });
  
  // アンケートタグも短縮URL文字数に置き換え（19文字固定）
  processedText = processedText.replace(/{[A-Za-z0-9_]+}/g, (match) => {
    // アンケートの短縮URLは19文字固定
    return '#'.repeat(SMS_CHARACTER_LIMITS.URL_HTTP);
  });
  
  return processedText.length;
};

// SMSメッセージが分割されるときの通数を計算する関数
const calculateSMSMessageCount = (text) => {
  const length = calculateSMSLength(text);
  const standardLimit = SMS_CHARACTER_LIMITS.STANDARD;
  const segmentSize = SMS_CHARACTER_LIMITS.SEGMENT_SIZE;
  
  if (length === 0) return 0;
  
  // 70文字までは1通
  if (length <= standardLimit) {
    return 1;
  }
  
  // 70文字を超えた場合は、超過分を66文字ごとに分割して1を足す
  return 1 + Math.ceil((length - standardLimit) / segmentSize);
};

// テストケース定義
const testCases = [
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
    expectedLength: 40, // 「こちらのリンクをクリックしてください: 」 + URLタグの変換結果
    expectedMessageCount: 1
  },
  {
    description: '複数のURLタグを含むテスト',
    text: 'リンク1: {URL1} またはリンク2: {URL2}',
    expectedLength: 56, // 「リンク1:  またはリンク2: 」 + URLタグの変換結果 x 2
    expectedMessageCount: 1
  }
];

// テストの実行と結果の出力
const runSMSTests = () => {
  const results = testCases.map(testCase => {
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
  
  return results;
};

// 特定の値で計算テスト
function testSpecificValue(chars) {
  console.log(`\n=== ${chars}文字のテスト ===`);
  
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
}

// テスト実行
runSMSTests();

// 特定ケースのテスト
testSpecificValue(65);   // 1通
testSpecificValue(70);   // 1通
testSpecificValue(71);   // 2通
testSpecificValue(136);  // 2通
testSpecificValue(137);  // 3通
testSpecificValue(350);  // 5通
testSpecificValue(660);  // 10通 