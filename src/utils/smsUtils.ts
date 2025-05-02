/**
 * SMS文字数計算ユーティリティ
 */

/**
 * 長文SMSオプション設定
 */
export interface SMSLengthOptions {
  enableLongSMS: boolean;  // 長文SMSオプション
  carrier?: 'docomo' | 'au' | 'softbank' | 'rakuten';  // キャリア指定
}

/**
 * 文字数制限値の定数
 */
export const SMS_CHARACTER_LIMITS = {
  STANDARD: 70,  // 通常SMS: 70文字
  DOCOMO_LONG: 660,  // ドコモ長文SMS: 660文字
  OTHER_LONG: 670,  // au/SoftBank/楽天 長文SMS: 670文字
  SMS_LIMIT: 660,  // 統一された文字数上限: 660文字
  URL_HTTP: 19,  // HTTP短縮URL: 19文字
  URL_HTTPS: 20,  // HTTPS短縮URL: 20文字
  LINE_BREAK: 2,  // 改行コード: 2文字分
  SEGMENT_SIZE: 66,  // 長文SMS分割サイズ: 66文字
};

/**
 * SMSメッセージの文字数を計算する
 * 
 * @param text SMS本文
 * @param options 長文SMSなどのオプション
 * @returns 計算された文字数
 */
export const calculateSMSLength = (text: string, options: SMSLengthOptions = { enableLongSMS: false }): number => {
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

/**
 * 指定されたキャリアと長文SMSオプションに基づく文字数制限を返す
 * 
 * @param options 長文SMSなどのオプション
 * @returns 文字数制限値
 */
export const getSMSCharacterLimit = (options: SMSLengthOptions = { enableLongSMS: false }): number => {
  // すべてのSMSは長文SMSとして扱い、660文字に統一
  return SMS_CHARACTER_LIMITS.SMS_LIMIT;
};

/**
 * SMSメッセージが文字数制限を超えているかチェック
 * 
 * @param text SMS本文
 * @param options 長文SMSなどのオプション
 * @returns 制限を超えている場合はtrue
 */
export const isSMSLengthExceeded = (text: string, options: SMSLengthOptions = { enableLongSMS: false }): boolean => {
  const length = calculateSMSLength(text, options);
  const limit = getSMSCharacterLimit(options);
  return length > limit;
};

/**
 * 通常SMS 1通分に相当する文字数を計算
 * 
 * @param text SMS本文
 * @param options 長文SMSなどのオプション
 * @returns 通常SMS何通分に相当するか
 */
export const calculateSMSMessageCount = (text: string, options: SMSLengthOptions = { enableLongSMS: false }): number => {
  const length = calculateSMSLength(text, options);
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

/**
 * テキスト内のURLタグをカウントして次のインデックスを決定する
 * 
 * @param text URLタグを含むテキスト
 * @returns 次に使用すべきURLタグインデックス
 */
export const getNextUrlTagIndex = (text: string): number => {
  if (!text) return 1;
  
  const urlTagRegex = /{URL(\d*)}/g;
  const matches = text.match(urlTagRegex) || [];
  
  if (matches.length === 0) return 1;
  
  const indices = matches.map(match => {
    const indexMatch = match.match(/{URL(\d*)}/);
    return indexMatch && indexMatch[1] ? parseInt(indexMatch[1], 10) : 1;
  });
  
  return Math.max(...indices, 0) + 1;
};

/**
 * 既存のURLタグのインデックスを正規化する（連番になるように）
 * 
 * @param text URLタグを含むテキスト
 * @returns 正規化されたテキスト
 */
export const normalizeUrlTags = (text: string): string => {
  if (!text) return text;
  
  let normalizedText = text;
  let urlTagIndex = 1;
  
  // URLタグを抽出
  const urlTagRegex = /{URL(\d*)}/g;
  const matches = [...text.matchAll(urlTagRegex)];
  
  // URLタグを順番に置き換え
  for (const match of matches) {
    const fullMatch = match[0];
    normalizedText = normalizedText.replace(fullMatch, `{URL${urlTagIndex}}`);
    urlTagIndex++;
  }
  
  return normalizedText;
};

import { SMSMessage } from '../types';

// 文字数に基づいた国内SMS送信料金を計算する関数
export const calculateDomesticSMSPrice = (characterCount: number): number => {
  if (characterCount <= 70) return 3.3;
  if (characterCount <= 134) return 6.6;
  if (characterCount <= 201) return 9.9;
  if (characterCount <= 268) return 13.2;
  if (characterCount <= 335) return 16.5;
  if (characterCount <= 402) return 19.8;
  if (characterCount <= 469) return 23.1;
  if (characterCount <= 536) return 26.4;
  if (characterCount <= 603) return 29.7;
  if (characterCount <= 670) return 33.0;
  return 33.0; // 最大文字数は670文字
};

// 簡易的な国際SMS送信料金を計算する関数
export const calculateInternationalSMSPrice = (characterCount: number, countryCode?: string): number => {
  // 国別の基本料金
  const baseRatesByCountry: Record<string, number> = {
    'US': 50, // アメリカ
    'GB': 60, // イギリス
    'CN': 70, // 中国
    'KR': 50, // 韓国
    'TH': 80, // タイ
    // デフォルト
    'DEFAULT': 100,
  };
  
  // 基本料金を取得（1通分）
  const baseRate = countryCode ? (baseRatesByCountry[countryCode] || baseRatesByCountry['DEFAULT']) : baseRatesByCountry['DEFAULT'];
  
  // 文字数に基づく通数計算（簡易的に70文字ごとに1通として計算）
  const messageUnits = Math.ceil(characterCount / 70);
  
  return baseRate * messageUnits;
};

// メッセージの送信料金を計算
export const calculateSMSPrice = (message: SMSMessage): number => {
  // 文字数がない場合は内容から計算
  const characterCount = message.characterCount || message.content.length;
  
  if (message.isInternational) {
    return calculateInternationalSMSPrice(characterCount, message.countryCode);
  } else {
    return calculateDomesticSMSPrice(characterCount);
  }
};

// 総送信料金を計算
export const calculateTotalSMSPrice = (messages: SMSMessage[]): number => {
  return messages.reduce((total, message) => {
    // 既に料金が計算されていればそれを使用、なければ計算
    const price = message.price || calculateSMSPrice(message);
    return total + price;
  }, 0);
};

// 平均送信料金を計算
export const calculateAverageSMSPrice = (messages: SMSMessage[]): number => {
  if (messages.length === 0) return 0;
  return calculateTotalSMSPrice(messages) / messages.length;
};

// 日付別の送信料金を集計
export const calculateDailySMSPrices = (messages: SMSMessage[], days: number = 7): { date: string; price: number }[] => {
  const result: { date: string; price: number }[] = [];
  const now = new Date();
  
  // 過去n日分の日付を生成
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // その日に送信されたメッセージを抽出
    const dayMessages = messages.filter(msg => {
      const msgDate = new Date(msg.createdAt).toISOString().split('T')[0];
      return msgDate === dateString;
    });
    
    // その日の総送信料金を計算
    const dailyPrice = calculateTotalSMSPrice(dayMessages);
    
    result.unshift({ date: dateString, price: dailyPrice });
  }
  
  return result;
};