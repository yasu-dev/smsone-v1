import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, FileText, AlertCircle, Info, Send, 
  Clock, ShieldCheck, FileSpreadsheet, FileDown, X, Check, Globe, FileUp, ChevronDown, MessageSquare,
  ChevronRight, AlertTriangle, Calendar, PhoneOutgoing, FileCheck, Loader2, ArrowLeft, Download, Trash
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import SenderNumberSelect from './SenderNumberSelect';
import ShortenedUrlInput from './ShortenedUrlInput';
import PhoneNumberInput from './PhoneNumberInput';
import SurveyTagInput from './SurveyTagInput';
import { calculateSMSLength, calculateSMSMessageCount, SMS_CHARACTER_LIMITS, getNextUrlTagIndex } from '../../utils/smsUtils';
import useSMSStore from '../../store/smsStore';
import useAuthStore from '../../store/authStore';
import useSenderNumberStore from '../../store/senderNumberStore';
import TagHighlighter from '../ui/TagHighlighter';
import { Button } from '../ui/button';
import { Table } from '../ui/table';

interface FileRow {
  [key: string]: string;
}

type FileFormat = 'csv' | 'excel';
type FileEncoding = 'shift-jis' | 'utf-8';

// 送信ステップを定義
enum SendStep {
  FILE_UPLOAD = 0,
  CONTENT = 1,
  OPTIONS = 2,
  CONFIRM = 3,
}

const BulkSendForm: React.FC = () => {
  // 送信ステップの状態
  const [currentStep, setCurrentStep] = useState<SendStep>(SendStep.FILE_UPLOAD);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<FileRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [multipleUrlsEnabled, setMultipleUrlsEnabled] = useState(true);
  const [isLongSMSEnabled, setIsLongSMSEnabled] = useState(true);
  const [fileEncoding, setFileEncoding] = useState<FileEncoding>('shift-jis');
  const [fileFormat, setFileFormat] = useState<FileFormat>('csv');
  const [showDropZone, setShowDropZone] = useState(false);
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);
  const [isTestMode, setIsTestMode] = useState(false);
  const [hasInternationalNumbers, setHasInternationalNumbers] = useState(false);
  const [urlTagIndex, setUrlTagIndex] = useState(1);
  const [message, setMessage] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const { sendTestMessage, sendBulkMessages } = useSMSStore();
  const { hasPermission } = useAuthStore();
  
  // 海外送信権限チェックを削除
  // 一括送信権限チェック - 常にtrueにして表示されるようにする
  const canUseBulkSending = true;
  
  // 文字数と通数の計算
  const characterCount = calculateSMSLength(message || previewTemplate, { enableLongSMS: isLongSMSEnabled });
  const messageCount = calculateSMSMessageCount(message || previewTemplate, { enableLongSMS: isLongSMSEnabled });
  
  // 文字数制限値 (660文字に統一)
  const characterLimit = 660;
  
  // 文字数状態に基づいたクラス名
  const getCharCountClass = (count: number) => {
    if (count > characterLimit) return 'text-error-600 font-medium';
    if (count > characterLimit * 0.9) return 'text-warning-600';
    return '';
  };
  
  // 次のステップに進む関数
  const goToNextStep = () => {
    if (currentStep < SendStep.CONFIRM) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 前のステップに戻る関数
  const goToPreviousStep = () => {
    if (currentStep > SendStep.FILE_UPLOAD) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 特定のステップに直接ジャンプする関数
  const goToStep = (step: SendStep) => {
    setCurrentStep(step);
  };

  // ファイルアップロードステップのバリデーション
  const validateFileUploadStep = () => {
    if (!file || parsedData.length === 0) {
      toast.error('送信するファイルを選択してください');
      return false;
    }

    if (!senderNumber) {
      toast.error('送信者名を選択してください');
      return false;
    }
    
    return true;
  };

  // 本文ステップのバリデーション
  const validateContentStep = () => {
    if (!previewTemplate) {
      toast.error('本文を入力してください');
      return false;
    }
    
    // URLタグパターンを検出
    const urlTagPattern = /{URL\d*}/;
    
    // 本文に{URL}タグがあるのに短縮元URLが設定されていない場合（ファイルの場合は各行に設定されているかチェック）
    if (urlTagPattern.test(previewTemplate) && !originalUrl) {
      // 各行にoriginal_url列があるか確認
      const hasUrlInFile = parsedData.some(row => 
        ('original_url' in row && row.original_url) || 
        ('K' in row && row.K)
      );
      if (!hasUrlInFile) {
        toast.error('本文にURLタグがありますが、短縮元URLが設定されていません');
        return false;
      }
    }
    
    // 文字数チェック
    if (characterCount > characterLimit) {
      toast.error(`文字数制限(${characterLimit}文字)を超えています`);
      return false;
    }
    
    return true;
  };

  // オプションステップのバリデーション
  const validateOptionsStep = () => {
    // 送信予約が有効で日時が未入力の場合
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error('予約送信の日時を入力してください');
      return false;
    }
    
    if (isTestMode && !testRecipient) {
      toast.error('テスト送信用携帯番号を入力してください');
      return false;
    }
    
    return true;
  };

  // 各ステップを検証してから次へ進む
  const validateAndProceed = () => {
    let isValid = false;
    
    switch (currentStep) {
      case SendStep.FILE_UPLOAD:
        isValid = validateFileUploadStep();
        break;
      case SendStep.CONTENT:
        isValid = validateContentStep();
        break;
      case SendStep.OPTIONS:
        isValid = validateOptionsStep();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      if (currentStep === SendStep.OPTIONS) {
        // オプションステップから確認ステップへ
        goToStep(SendStep.CONFIRM);
      } else {
        goToNextStep();
      }
    }
  };
  
  // プレビュー更新時にURLタグインデックスを更新
  useEffect(() => {
    if (previewTemplate) {
      setUrlTagIndex(getNextUrlTagIndex(previewTemplate));
    }
  }, [previewTemplate]);

  // message変更時にプレビュー更新
  useEffect(() => {
    if (message) {
      setPreviewTemplate(message);
    }
  }, [message]);

  // ドラッグ&ドロップ関連のイベントハンドラ
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setShowDropZone(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setShowDropZone(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setShowDropZone(false);
      
      if (e.dataTransfer?.files.length) {
        const file = e.dataTransfer.files[0];
        handleFile(file);
      }
    };

    // イベントリスナー登録
    const div = dropZoneRef.current;
    if (div) {
      div.addEventListener('dragover', handleDragOver);
      div.addEventListener('dragleave', handleDragLeave);
      div.addEventListener('drop', handleDrop);
    }

    // クリーンアップ
    return () => {
      if (div) {
        div.removeEventListener('dragover', handleDragOver);
        div.removeEventListener('dragleave', handleDragLeave);
        div.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  // ファイル拡張子からファイル形式を自動検出
  const detectFileFormat = (fileName: string): FileFormat => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      return 'excel';
    }
    return 'csv';
  };

  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    handleFile(selectedFile);
  };

  // 国際電話番号かどうかを判断する関数
  const isInternationalPhoneNumber = (phoneNumber: string): boolean => {
    // 国際電話番号のパターン: +から始まる、または国コードと思われる数字から始まる
    const internationalPattern = /^\+|^00|^81[0-9]/;
    return internationalPattern.test(phoneNumber);
  };

  // アップロード進捗シミュレーション
  const startProgressSimulation = () => {
    return setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 20;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200) as unknown as number;
  };
  
  // ファイル処理（共通部分）
  const handleFile = (selectedFile: File) => {
    if (!selectedFile) return;
    
    if (isConfirmMode) {
      setIsConfirmMode(false);
    }
    
    // ファイル拡張子からフォーマットを自動検出
    const detectedFormat = detectFileFormat(selectedFile.name);
    setFileFormat(detectedFormat);
    
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxFileSize) {
      toast.error('ファイルサイズは50MB以内である必要があります');
      resetFileUpload();
      return;
    }
    
    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);
    
    // アップロード進捗シミュレーション
    const progressInterval = startProgressSimulation();
    
    try {
      // ファイル形式に応じた処理
      if (detectedFormat === 'excel') {
        parseExcelFile(selectedFile, progressInterval);
      } else {
        parseCsvFile(selectedFile, progressInterval);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('ファイルの処理中にエラーが発生しました');
      console.error(error);
      resetFileUpload();
    }
  };

  // Excel形式のパース処理
  const parseExcelFile = (file: File, progressInterval: number) => {
    // XLSXがまだロードされていない場合は処理しない
    if (!XLSX || typeof XLSX.read !== 'function') {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('Excel処理ライブラリの読み込みに失敗しました');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 最初のシートを取得
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // シートからJSONデータに変換
        const rawData = XLSX.utils.sheet_to_json<FileRow>(worksheet, { 
          header: 'A',
          blankrows: false
        });

        // ヘッダー行（1行目）を取得
        const headerRow = rawData[0];
        
        // ヘッダー行から項目名と列のマッピングを作成
        const headerMapping: Record<string, string> = {};
        
        // 標準項目名のリスト
        const standardFields = {
          tel: ['tel', 'phone', 'telephone', '電話番号', '電話', 'tel_no', 'telno'],
          customerName: ['customer', 'customername', 'name', 'customer_name', '顧客名', '名前', 'お客様名'],
          orderNumber: ['order', 'ordernumber', 'order_number', '注文番号', 'オーダー番号'],
          appointmentDate: ['appointment', 'appointmentdate', 'date', 'appointment_date', '予約日', '日付'],
          companyName: ['company', 'companyname', 'company_name', '会社名', '企業名'],
          memo: ['memo', 'note', 'comment', 'メモ', '備考'],
          templateId: ['template', 'templateid', 'template_id', 'テンプレート', 'テンプレートID'],
          message: ['message', 'content', 'text', 'メッセージ', '本文', 'メール本文', 'sms本文', 'smsメッセージ'],
          original_url: ['url', 'link', 'original_url', 'originalurl', 'リンク', 'URL'],
          send_datetime: ['senddate', 'senddatetime', 'send_date', 'send_datetime', '送信日時', '配信日時'],
          skip: ['skip', 'exclude', 'スキップ', '除外']
        };
        
        // 特定の列（B: 顧客名、J: メッセージなど）を明示的にマッピング
        if (rawData.length > 0) {
          // ヘッダー行のテキストに基づいてマッピング
          Object.keys(headerRow).forEach(column => {
            const headerValue = headerRow[column]?.toString().trim().toLowerCase();
            if (!headerValue) return;
            
            // 標準フィールドとマッチするか確認
            let mapped = false;
            Object.entries(standardFields).forEach(([field, aliases]) => {
              if (aliases.includes(headerValue)) {
                headerMapping[column] = field;
                mapped = true;
              }
            });
            
            // マッピングされなかった場合はそのままの列名を使用
            if (!mapped) {
              headerMapping[column] = headerValue;
            }
          });
        }
        
        // 実際のデータをヘッダーマッピングに基づいて変換
        const processedData = rawData.slice(1).map(row => {
                const newRow: FileRow = {};
          
          // 各列をマッピングに従って変換
          Object.keys(row).forEach(column => {
            if (headerMapping[column]) {
              newRow[headerMapping[column]] = row[column];
                  } else {
              newRow[column] = row[column];
            }
          });
          
          // 元の列データも保持（互換性のため）
          Object.keys(row).forEach(column => {
            newRow[column] = row[column];
          });
          
                return newRow;
              });
        
        // ヘッダー行も変換して保持
        const convertedHeaderRow: FileRow = {};
        Object.keys(headerRow).forEach(column => {
          convertedHeaderRow[column] = headerRow[column];
          if (headerMapping[column]) {
            convertedHeaderRow[headerMapping[column]] = headerRow[column];
          }
        });
        
        // ヘッダー行を追加したデータを作成
        const finalData = [convertedHeaderRow, ...processedData];
        
            clearInterval(progressInterval);
        setUploadProgress(100);
            setIsUploading(false);
        
        processFileData(finalData, file.name);
      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        toast.error('Excelファイルの解析に失敗しました');
        console.error(error);
        resetFileUpload();
      }
    };
    
    reader.onerror = () => {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('ファイルの読み込みに失敗しました');
      resetFileUpload();
    };
    
    reader.readAsBinaryString(file);
  };

  // CSV形式のパース処理
  const parseCsvFile = (file: File, progressInterval: number) => {
    // Papaがまだロードされていない場合は処理しない
    if (!Papa || typeof Papa.parse !== 'function') {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('CSV処理ライブラリの読み込みに失敗しました');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        
        const config = {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            clearInterval(progressInterval);
            setUploadProgress(100);
            setIsUploading(false);
            
            // ヘッダー行（1行目）を取得
            const headerRow = results.meta.fields.reduce((acc: Record<string, string>, field: string) => {
              acc[field] = field;
              return acc;
            }, {});
            
            // 標準項目名のリスト
            const standardFields = {
              'tel': ['tel', '電話番号', 'phone', '宛先'],
              'customerName': ['customerName', '顧客名', 'name', '名前', 'お名前', 'customer'],
              'message': ['message', 'メッセージ', 'msg', 'text'],
              'orderNumber': ['orderNumber', '注文番号', 'order', '注文'],
              'appointmentDate': ['appointmentDate', '予約日', 'date', '日付'],
              'companyName': ['companyName', '会社名', 'company'],
              'memo': ['memo', 'メモ', 'note'],
              'original_url': ['original_url', 'url', 'URL', '短縮URL', '短縮元URL']
            };
            
            // ヘッダーマッピングを作成
            const headerMapping: Record<string, string> = {};
            results.meta.fields.forEach((field: string) => {
              const headerValue = field.trim().toLowerCase();
              
              // 標準フィールドとマッチするか確認
              Object.entries(standardFields).forEach(([standardField, aliases]) => {
                if (aliases.includes(headerValue)) {
                  headerMapping[field] = standardField;
                }
              });
              
              // マッピングされなかった場合はそのままの列名を使用
              if (!headerMapping[field]) {
                headerMapping[field] = field;
              }
            });
            
            // データを変換
            const processedData = results.data.map((row: any) => {
              const newRow: FileRow = {};
              
              // 各列をマッピングに従って変換
              Object.keys(row).forEach(column => {
                if (headerMapping[column]) {
                  newRow[headerMapping[column]] = row[column];
                }
                
                // 元の列データも保持（互換性のため）
                newRow[column] = row[column];
              });
          
          return newRow;
        });
        
            // ヘッダー行も変換して保持
            const convertedHeaderRow: FileRow = { ...headerRow };
            Object.keys(headerRow).forEach(column => {
              if (headerMapping[column]) {
                convertedHeaderRow[headerMapping[column]] = headerRow[column];
              }
            });
            
            // ヘッダー行を追加したデータを作成
            const finalData = [convertedHeaderRow, ...processedData];
            
            processFileData(finalData, file.name);
          },
          error: (error: any) => {
        clearInterval(progressInterval);
        setIsUploading(false);
            toast.error('ファイルの解析に失敗しました');
            console.error(error);
            resetFileUpload();
          }
        };
        
        Papa.parse(content as string, config);
      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        toast.error('CSVファイルの解析に失敗しました');
        console.error(error);
        resetFileUpload();
      }
    };
    
    reader.onerror = () => {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('ファイルの読み込みに失敗しました');
      resetFileUpload();
    };
    
    if (fileEncoding === 'utf-8') {
      reader.readAsText(file, 'utf-8');
    } else {
      // Shift-JISの場合
      reader.readAsText(file, 'shift-jis');
    }
  };

  // ファイルデータの処理（共通部分）
  const processFileData = (data: FileRow[], fileName: string) => {
    // データが存在しない場合
    if (data.length === 0) {
      toast.error('ファイルにデータが含まれていません');
      resetFileUpload();
      return;
    }

    // 1行目をヘッダー行として扱い、送信データから除外
    const headerRow = data[0];
    const dataRows = data.slice(1);
    
    // データがヘッダー行のみの場合
    if (dataRows.length === 0) {
      toast.error('ファイルに送信データが含まれていません（ヘッダー行のみ）');
      resetFileUpload();
      return;
    }
    
    // 最大レコード数チェック
    if (dataRows.length > 500000) {
      toast.error('ファイルに含まれるレコード数が多すぎます（最大50万レコード）');
      resetFileUpload();
      return;
    }
    
    // 必須項目（電話番号）のチェック - 項目名で判断
    const firstDataRow = dataRows[0];
    const hasTelField = Object.keys(firstDataRow).some(key => 
      key === 'tel' || 
      key.toLowerCase() === '電話番号' || 
      key.toLowerCase() === 'phone' ||
      key.toLowerCase() === '宛先'
    );
    
    if (!hasTelField) {
      toast.error('ファイル形式が正しくありません。宛先電話番号の列が必要です（項目名：tel、電話番号、phoneなど）');
      resetFileUpload();
      return;
    }
    
    // 実際の電話番号が存在するか確認
    const hasPhoneNumbers = dataRows.some(row => {
      return Object.entries(row).some(([key, value]) => {
        return (key === 'tel' || 
                key.toLowerCase() === '電話番号' || 
                key.toLowerCase() === 'phone' ||
                key.toLowerCase() === '宛先') && value;
      });
    });
    
    if (!hasPhoneNumbers) {
      toast.error('ファイルに有効な電話番号が含まれていません');
      resetFileUpload();
      return;
    }
    
    // 国際電話番号の有無をチェック
    let foundInternational = false;
    // 各行の電話番号を確認
    for (const row of dataRows) {
      // 電話番号関連のフィールドを探す
      const phoneNumber = Object.entries(row)
        .filter(([key]) => key === 'tel' || 
                          key.toLowerCase() === '電話番号' || 
                          key.toLowerCase() === 'phone' ||
                          key.toLowerCase() === '宛先')
        .map(([_, value]) => value)
        .find(Boolean) || '';
        
      if (isInternationalPhoneNumber(phoneNumber)) {
        foundInternational = true;
        break;
      }
    }
    setHasInternationalNumbers(foundInternational);
    
    // ヘッダー行を含むすべてのデータをセット（表示用）
    setParsedData(data);
    
    // プレビュー用のテンプレート生成（2行目のデータを参照）
    if (firstDataRow) {
      const messageValue = Object.entries(firstDataRow)
        .filter(([key]) => key === 'message' || 
                          key.toLowerCase() === 'メッセージ' || 
                          key.toLowerCase() === 'msg' ||
                          key.toLowerCase() === 'text')
        .map(([_, value]) => value)
        .find(Boolean);
        
      if (messageValue) {
        setPreviewTemplate(messageValue);
        setMessage(messageValue);
      }
    }
    
    // 短縮元URLがファイルにある場合（2行目のデータを参照）
    if (firstDataRow) {
      const urlValue = Object.entries(firstDataRow)
        .filter(([key]) => key === 'original_url' || 
                          key.toLowerCase() === 'url' || 
                          key.toLowerCase() === 'url' ||
                          key.toLowerCase() === '短縮url' ||
                          key.toLowerCase() === '短縮元url')
        .map(([_, value]) => value)
        .find(Boolean);
        
      if (urlValue) {
        setOriginalUrl(urlValue);
      }
    }
    
    toast.success(`${dataRows.length}件のデータを読み込みました${foundInternational ? '（国際電話番号を含む）' : ''}`);
  };

  // ファイルアップロードのリセット
  const resetFileUpload = () => {
    setFile(null);
    setParsedData([]);
    setPreviewTemplate('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setHasInternationalNumbers(false);
    setIsFileUploaded(false);
  };

  // 確認モードに移行
  const handleConfirm = () => {
    if (!validateForm()) return;
    setIsConfirmMode(true);
  };
  
  // フォーム検証
  const validateForm = () => {
    if (!file || parsedData.length === 0) {
      toast.error('送信するファイルを選択してください');
      return false;
    }
    
    if (isTestMode && !testRecipient) {
      toast.error('テスト送信用携帯番号を入力してください');
      return false;
    }
    
    // URLタグパターンを検出
    const urlTagPattern = /{URL\d*}/;
    
    // 本文に{URL}タグがあるのに短縮元URLが設定されていない場合（ファイルの場合は各行に設定されているかチェック）
    if (urlTagPattern.test(previewTemplate) && !originalUrl) {
      // 各行にoriginal_url列があるか確認
      const hasUrlInFile = parsedData.some(row => 
        ('original_url' in row && row.original_url) || 
        ('K' in row && row.K)
      );
      if (!hasUrlInFile) {
        toast.error('本文にURLタグがありますが、短縮元URLが設定されていません');
        return false;
      }
    }
    
    // 文字数チェック
    if (characterCount > characterLimit) {
      toast.error(`文字数制限(${characterLimit}文字)を超えています`);
      return false;
    }
    
    return true;
  };

  // 編集モードに戻る
  const handleBackToEdit = () => {
    setIsConfirmMode(false);
  };

  // 電話番号入力ハンドラ
  const handlePhoneNumberChange = (value: string, international: boolean, country?: string) => {
    setTestRecipient(value);
    setIsInternational(international);
    setCountryCode(country);
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 確認ステップ以外では、次のステップに進む
    if (currentStep !== SendStep.CONFIRM) {
      validateAndProceed();
      return;
    }
    
    // 最終確認ステップでの送信処理
    if (!validateFileUploadStep() || !validateContentStep() || !validateOptionsStep()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 1行目をヘッダー行として扱い、送信対象から除外
      const dataToSend = parsedData.slice(1);
      
      const bulkMessages = dataToSend.map((row, index) => {
        // skip列が "true" または "1" または "yes" の場合はスキップ
        const skipValue = Object.entries(row)
          .filter(([key]) => key === 'skip' || key.toLowerCase() === 'スキップ')
          .map(([_, value]) => value)
          .find(value => value === 'true' || value === '1' || value === 'yes');
          
        if (skipValue) return null;
        
        // 各行から電話番号を取得
        const phoneNumber = Object.entries(row)
          .filter(([key]) => key === 'tel' || 
                            key.toLowerCase() === '電話番号' || 
                            key.toLowerCase() === 'phone' ||
                            key.toLowerCase() === '宛先')
          .map(([_, value]) => value)
          .find(Boolean) || '';
        
        // 電話番号が空の場合はスキップ
        if (!phoneNumber) return null;
        
        // メッセージ内容を取得
        let messageContent = message || previewTemplate;
        
        // メッセージフィールドを探す
        const rowMessageValue = Object.entries(row)
          .filter(([key]) => key === 'message' || 
                            key.toLowerCase() === 'メッセージ' || 
                            key.toLowerCase() === 'msg' ||
                            key.toLowerCase() === 'text')
          .map(([_, value]) => value)
          .find(Boolean);
          
        if (rowMessageValue) {
          // 行ごとに個別メッセージがある場合はそれを使用
          messageContent = rowMessageValue;
        }
        
        // メッセージ内のタグを置換
        Object.keys(row).forEach(key => {
          const tagPattern = new RegExp(`{${key}}`, 'g');
          messageContent = messageContent.replace(tagPattern, row[key] || '');
        });
        
        // 特別なタグの置換（顧客名など）
        const customerNameValue = Object.entries(row)
          .filter(([key]) => key === 'customerName' || 
                            key.toLowerCase() === '顧客名' || 
                            key.toLowerCase() === 'name' ||
                            key.toLowerCase() === '名前' ||
                            key.toLowerCase() === 'お名前')
          .map(([_, value]) => value)
          .find(Boolean);
          
        if (messageContent.includes('{customerName}') && customerNameValue) {
          messageContent = messageContent.replace(/{customerName}/g, customerNameValue);
        }
        
        // URL置換をプレビュー
        const urlTagPattern = /{URL\d*}/g;
        if (urlTagPattern.test(messageContent)) {
          // URL値を探す
          const urlValue = Object.entries(row)
            .filter(([key]) => key === 'original_url' || 
                              key.toLowerCase() === 'url' || 
                              key.toLowerCase() === 'url' ||
                              key.toLowerCase() === '短縮url' ||
                              key.toLowerCase() === '短縮元url')
            .map(([_, value]) => value)
            .find(Boolean) || originalUrl || '';
          
          // URLタグを見つけて置換
          const urlTags = messageContent.match(urlTagPattern) || [];
          urlTags.forEach(tag => {
            messageContent = messageContent.replace(tag, urlValue);
          });
        }
        
        return {
          recipient: isTestMode ? testRecipient : phoneNumber,
          content: messageContent,
          sender: senderNumber,
          isInternational: isInternational || isInternationalPhoneNumber(phoneNumber)
        };
      }).filter(Boolean); // nullをフィルタリング
      
      // テスト送信モードの場合
      if (isTestMode && testRecipient) {
        // 最初のメッセージのみをテスト送信
        if (bulkMessages.length > 0) {
          const testMessage = bulkMessages[0];
          if (testMessage) {
        await sendTestMessage({
          recipient: testRecipient,
              content: testMessage.content,
          sender: senderNumber,
              originalUrl: originalUrl || undefined,
          isInternational,
          countryCode
        });
            toast.success('テスト送信を完了しました');
          }
      } else {
          toast.error('送信対象のメッセージがありません');
        }
      } else {
        // 実際の一括送信処理
        // API形式に合わせて一括送信の引数を調整
        await sendBulkMessages(dataToSend, {
          sender: senderNumber,
          messageTemplate: previewTemplate,
          originalUrl: originalUrl,
          isScheduled: isScheduled,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          isInternational: hasInternationalNumbers
        });
        
        toast.success(`${dataToSend.length}件のSMS送信を開始しました${hasInternationalNumbers ? '（国際電話番号を含む）' : ''}`);
      }
      
      // 送信完了後、フォームをリセット
      resetForm();
      
    } catch (error) {
      toast.error('送信処理中にエラーが発生しました');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // フォームリセット
  const resetForm = () => {
    resetFileUpload();
    setIsScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
    setOriginalUrl('');
    setIsConfirmMode(false);
    setTestRecipient('');
    setIsTestMode(false);
    setIsInternational(false);
    setCountryCode(undefined);
    setHasInternationalNumbers(false);
    setUrlTagIndex(1);
    setMessage('');
    setIsFileUploaded(false);
  };

  // 送信者名変更ハンドラ
  const handleSenderNumberChange = (number: string) => {
    setSenderNumber(number);
    
    // 送信者名が国際送信対応かチェック
    const selectedSender = useSenderNumberStore.getState().senderNumbers.find(sn => sn.number === number);
    if (selectedSender && selectedSender.isInternational) {
      // 国際送信対応の送信者名が選択された場合、国際送信モードを有効化
      setIsInternational(true);
    } else {
      // 通常の電話番号が選択された場合は国際送信モードを無効化
      setIsInternational(false);
      setCountryCode(undefined);
    }
  };
  
  // 短縮元URL更新ハンドラ
  const handleOriginalUrlUpdate = (url: string) => {
    setOriginalUrl(url);
  };
  
  // タグ挿入ハンドラ
  const handleInsertTag = (tag: string) => {
    try {
      toast.success(`${tag}を挿入しました`);
      return true;
    } catch (error) {
      console.error(error);
      toast.error('タグの挿入に失敗しました');
      return false;
    }
  };

  // テスト送信モードを切り替え
  const toggleTestMode = () => {
    setIsTestMode(!isTestMode);
    if (isConfirmMode) {
      setIsConfirmMode(false);
    }
  };

  // ファイルフォーマット変更ハンドラ
  const handleFileFormatChange = (format: FileFormat) => {
    setFileFormat(format);
    resetFileUpload();
  };

  // エンコーディング変更ハンドラ
  const handleEncodingChange = (encoding: FileEncoding) => {
    setFileEncoding(encoding);
    
    // ファイルが既にアップロードされている場合は再解析
    if (file) {
      handleFile(file);
    }
  };

  // アニメーション定義
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  // ステップインジケーターを描画する関数
  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {Object.values(SendStep).filter(v => typeof v === 'number').map((step) => (
            <div 
              key={step} 
              className={`flex items-center ${Number(step) < currentStep ? 'cursor-pointer' : ''}`}
              onClick={() => Number(step) < currentStep && goToStep(step as SendStep)}
            >
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm
                  ${currentStep === step 
                    ? 'bg-primary-600 text-white' 
                    : Number(step) < currentStep 
                      ? 'bg-primary-100 text-primary-600 border border-primary-300' 
                      : 'bg-grey-100 text-grey-500 border border-grey-300'
                  }`}
              >
                {Number(step) + 1}
              </div>
              <span 
                className={`ml-2 text-sm font-medium 
                  ${currentStep === step 
                    ? 'text-primary-600' 
                    : Number(step) < currentStep 
                      ? 'text-primary-500' 
                      : 'text-grey-500'
                  }`}
              >
                {step === SendStep.FILE_UPLOAD && 'ファイル'}
                {step === SendStep.CONTENT && '本文'}
                {step === SendStep.OPTIONS && 'オプション'}
                {step === SendStep.CONFIRM && '確認'}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-1">
          <div className="absolute top-0 left-4 right-4 h-1 bg-grey-200"></div>
          <div 
            className="absolute top-0 left-4 h-1 bg-primary-500 transition-all duration-300"
            style={{ width: `${(currentStep / (Object.keys(SendStep).length / 2 - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // サンプルExcelダウンロードハンドラ
  const handleDownloadSample = () => {
    // サンプルデータ
    const sampleData = [
      { tel: '09012345678', customerName: 'サンプル名前', message: 'こんにちは{customerName}様、サンプルメッセージです。' },
      { tel: '08011112222', customerName: 'テスト太郎', message: 'こんにちは{customerName}様、サンプルメッセージです。' }
    ];
    
    // ワークブック生成
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // ワークシート追加
    XLSX.utils.book_append_sheet(wb, ws, 'サンプルデータ');
    
    // ダウンロード
    XLSX.writeFile(wb, 'sms_sample_data.xlsx');
  };

  // テスト用関数（開発時にのみ実行）
  const runTests = () => {
    console.log('=== テスト実行中 ===');
    
    // 1. プレビュー表示テスト
    console.log('1. プレビュー表示テスト:');
    // ヘッダー行が表示されないことを確認
    const previewData = parsedData.slice(1, 4);
    console.log(`- プレビューデータ数: ${previewData.length} (期待値: ヘッダー行を除いた件数)`);
    
    // 2. 文字数/通数テスト
    console.log('2. 文字数/通数表示テスト:');
    const testCharCount = 150;
    const testMessageCount = 2;
    console.log(`- 文字数テスト(${testCharCount}文字): クラス=${getCharCountClass(testCharCount)}`);
    console.log(`- 通数テスト(${testMessageCount}通): 通数スタイル=${testMessageCount > 1 ? 'warning' : 'normal'}`);
    
    console.log('=== テスト完了 ===');
  };
  
  // DEBUG: 開発環境でのみテスト実行
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // runTests();
    }
  }, [parsedData]);

  // 電話番号のフォーマット関数
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // 数字以外の文字を除去
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // 日本の携帯電話/固定電話の一般的なフォーマット
    if (cleaned.startsWith('0')) {
      if (cleaned.length === 11) { // 携帯電話の場合（例: 090-1234-5678）
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      } else if (cleaned.length === 10) { // 固定電話の場合（例: 03-1234-5678）
        return cleaned.replace(/(\d{2,4})(\d{2,4})(\d{4})/, '$1-$2-$3');
      }
    }
    
    // 国際形式の場合や他の形式の場合はそのまま返す
    return phoneNumber;
  };

  // メッセージプレビュー生成関数
  const createPreview = (rowData: Record<string, any>, templateMessage: string): string => {
    if (!templateMessage) return '';
    
    let preview = templateMessage;
    
    // ファイルからのメッセージ内容を優先チェック（J列を明示的に優先）
    if (rowData['J'] !== undefined && rowData['J'] !== null && rowData['J'] !== '') {
      // J列のメッセージが存在する場合、テンプレートを置き換える
      preview = String(rowData['J']);
      console.log('J列のメッセージを使用:', preview);
    } else {
      // J列がない場合は他のメッセージフィールドを探す
      const messageField = Object.keys(rowData).find(key => 
        key === 'message' || 
        key.toLowerCase() === 'メッセージ' || 
        key.toLowerCase() === 'sms' || 
        key.toLowerCase() === '内容'
      );
      
      if (messageField && rowData[messageField]) {
        preview = String(rowData[messageField]);
        console.log('他のメッセージフィールドを使用:', messageField, preview);
      }
    }
    
    // 1. 通常のタグ置換（例：{customerName} → 実際の顧客名）
    Object.keys(rowData).forEach(key => {
      const tagPattern = new RegExp(`{${key}}`, 'g');
      if (rowData[key] !== undefined && rowData[key] !== null) {
        preview = preview.replace(tagPattern, String(rowData[key]));
      }
    });
    
    // 2. 特別なタグの置換（顧客名） - B列を優先的にチェック
    let customerName = '';
    
    // B列の値を優先的に確認
    if (rowData['B'] !== undefined && rowData['B'] !== null && rowData['B'] !== '') {
      customerName = String(rowData['B']);
    } else {
      // B列がない場合は他の顧客名フィールドを探す
      const nameField = Object.keys(rowData).find(key => 
        key === 'customerName' || 
        key.toLowerCase() === '顧客名' || 
        key.toLowerCase() === 'name' ||
        key.toLowerCase() === '名前' ||
        key.toLowerCase() === 'お名前'
      );
      
      if (nameField && rowData[nameField]) {
        customerName = String(rowData[nameField]);
      }
    }
    
    if (preview.includes('{customerName}') && customerName) {
      preview = preview.replace(/{customerName}/g, customerName);
    }
    
    // 3. URL置換
    const urlTagPattern = /{URL\d*}/g;
    if (urlTagPattern.test(preview)) {
      const urlField = Object.keys(rowData).find(key => 
        key === 'original_url' || 
        key === 'url' ||
        key === 'K'
      );
      
      const url = (urlField && rowData[urlField]) ? String(rowData[urlField]) : '';
      const urlTags = preview.match(urlTagPattern) || [];
      
      urlTags.forEach(tag => {
        preview = preview.replace(tag, url);
      });
    }
    
    return preview;
  };

  return (
    <motion.div 
      className="card"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="mb-5">
        <h2 className="text-lg font-medium text-grey-900">一斉送信</h2>
        <p className="mt-1 text-sm text-grey-500">
          CSVファイルまたはExcelファイルをアップロードして複数の宛先にSMSを一括送信します。
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="mt-6">
        <motion.div className="space-y-6" variants={container}>
          {/* ステップ1: ファイルアップロード */}
          {currentStep === SendStep.FILE_UPLOAD && (
            <>
          <motion.div variants={item}>
                <SenderNumberSelect 
                  onChange={handleSenderNumberChange}
                  initialSenderNumber={senderNumber}
                  disabled={isProcessing}
                />
          </motion.div>

            <motion.div variants={item}>
                <div className="mt-4">
                  <label className="form-label">送信ファイル</label>
              <div className="mt-1">
                    <div
                      ref={dropZoneRef}
                      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors
                        ${showDropZone ? 'border-primary-500 bg-primary-50' : 'border-grey-300'}
                        ${file ? 'bg-grey-50' : 'hover:bg-grey-50'}
                      `}
                    >
                      {isUploading ? (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <FileUp className="w-12 h-12 text-primary-400 animate-bounce" />
                          </div>
                          <h3 className="text-sm font-medium text-grey-900">
                            ファイルをアップロード中...
                          </h3>
                          <div className="relative w-full h-2 bg-grey-200 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-primary-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : file ? (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <FileCheck className="w-12 h-12 text-success-500" />
                          </div>
                          <h3 className="text-sm font-medium text-grey-900">
                            {file.name}
                          </h3>
                          <p className="text-xs text-grey-500">
                            {parsedData.length}件のデータが読み込まれました
                            {hasInternationalNumbers && (
                              <span className="text-primary-600 ml-1">（国際電話番号を含む）</span>
                            )}
                          </p>
                          <div className="flex justify-center space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={resetFileUpload}
                              className="btn btn-sm btn-outline"
                            >
                              <X className="w-4 h-4 mr-1" />
                              削除
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Upload className="w-12 h-12 text-grey-400" />
                          </div>
                          <h3 className="text-sm font-medium text-grey-900">
                            CSVまたはExcelファイルをドラッグ&ドロップ
                          </h3>
                          <p className="text-xs text-grey-500">
                            または
                          </p>
                          <div>
                            <label htmlFor="file-upload" className="btn btn-sm btn-outline">
                              <FileText className="w-4 h-4 mr-1" />
                              ファイルを選択
                            </label>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              className="sr-only"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              disabled={isProcessing}
                />
              </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex space-x-2">
                    <div className="flex items-center text-xs text-grey-500">
                      <button
                        type="button"
                        onClick={handleDownloadSample}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        サンプルファイルをダウンロード
                      </button>
                    </div>
                  </div>
                </div>
          </motion.div>
          
              <motion.div variants={item} className="mt-2 flex flex-col space-y-2">
                <h4 className="text-sm font-medium text-grey-900">
                  ファイル設定
                </h4>
                <div className="flex space-x-4">
                  <div>
                    <label className="text-xs text-grey-700 mb-1 block">ファイル形式</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleFileFormatChange('csv')}
                        className={`btn btn-xs ${fileFormat === 'csv' ? 'btn-primary' : 'btn-outline'}`}
                      >
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFileFormatChange('excel')}
                        className={`btn btn-xs ${fileFormat === 'excel' ? 'btn-primary' : 'btn-outline'}`}
                      >
                        Excel
                      </button>
                    </div>
                  </div>
                  
                  {fileFormat === 'csv' && (
                    <div>
                      <label className="text-xs text-grey-700 mb-1 block">文字コード</label>
                      <div className="flex space-x-2">
                <button
                  type="button"
                          onClick={() => handleEncodingChange('shift-jis')}
                          className={`btn btn-xs ${fileEncoding === 'shift-jis' ? 'btn-primary' : 'btn-outline'}`}
                        >
                          Shift-JIS
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEncodingChange('utf-8')}
                          className={`btn btn-xs ${fileEncoding === 'utf-8' ? 'btn-primary' : 'btn-outline'}`}
                        >
                          UTF-8
                </button>
              </div>
            </div>
                  )}
                </div>
              </motion.div>
              
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={validateAndProceed}
                  className="btn btn-primary"
                  disabled={!file || isProcessing}
                >
                  次へ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </>
          )}

          {/* ステップ2: 本文設定 */}
          {currentStep === SendStep.CONTENT && (
            <>
              <motion.div variants={item}>
                <div className="mb-4">
                  <label htmlFor="message" className="form-label flex justify-between items-center">
                    <span>メッセージ本文</span>
                    <span className="text-xs text-grey-500">
                      <span className={getCharCountClass(characterCount)}>
                        {characterCount}文字
                      </span>
                      {messageCount > 1 && (
                        <span className="ml-2 px-2 py-0.5 bg-warning-50 text-warning-600 rounded-full text-xs">
                          {messageCount}通
                        </span>
                      )}
                    </span>
                  </label>
            <div className="mt-1">
              <textarea
                      id="message"
                rows={5}
                      value={message || previewTemplate}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input"
                      placeholder="メッセージ本文を入力してください。ファイル内の列名を{列名}の形式で挿入すると、送信時に置換されます。"
                      disabled={isProcessing}
              />
            </div>
                  <div className="mt-2">
                    <div className="p-3 border rounded-md bg-grey-50">
                      <div className="text-xs font-medium text-grey-700 mb-2">プレビュー:</div>
                      <div className="text-sm whitespace-pre-wrap bg-white p-3 border rounded-md">
                        {message || previewTemplate}
                      </div>
                    </div>
              </div>
            </div>
            
                <div className="mt-4">
                  <label className="form-label flex items-center">
                    <span>タグを挿入</span>
                    <span className="ml-2 text-xs text-grey-500">ボタンをクリックすると本文にタグが挿入されます</span>
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const textArea = document.getElementById('message') as HTMLTextAreaElement;
                        if (textArea) {
                          const tag = '{customerName}';
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const newContent = message.substring(0, start) + tag + message.substring(end);
                          setMessage(newContent);
                          
                          // カーソル位置を挿入したタグの後ろに設定
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + tag.length, start + tag.length);
                          }, 0);
                          
                          toast.success('タグを挿入しました');
                        }
                      }}
                    >
                      顧客名
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const textArea = document.getElementById('message') as HTMLTextAreaElement;
                        if (textArea) {
                          const tag = '{orderNumber}';
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const newContent = message.substring(0, start) + tag + message.substring(end);
                          setMessage(newContent);
                          
                          // カーソル位置を挿入したタグの後ろに設定
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + tag.length, start + tag.length);
                          }, 0);
                          
                          toast.success('タグを挿入しました');
                        }
                      }}
                    >
                      注文番号
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const textArea = document.getElementById('message') as HTMLTextAreaElement;
                        if (textArea) {
                          const tag = '{appointmentDate}';
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const newContent = message.substring(0, start) + tag + message.substring(end);
                          setMessage(newContent);
                          
                          // カーソル位置を挿入したタグの後ろに設定
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + tag.length, start + tag.length);
                          }, 0);
                          
                          toast.success('タグを挿入しました');
                        }
                      }}
                    >
                      予約日
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const textArea = document.getElementById('message') as HTMLTextAreaElement;
                        if (textArea) {
                          const tag = '{companyName}';
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const newContent = message.substring(0, start) + tag + message.substring(end);
                          setMessage(newContent);
                          
                          // カーソル位置を挿入したタグの後ろに設定
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + tag.length, start + tag.length);
                          }, 0);
                          
                          toast.success('タグを挿入しました');
                        }
                      }}
                    >
                      会社名
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const textArea = document.getElementById('message') as HTMLTextAreaElement;
                        if (textArea) {
                          const tag = `{URL${urlTagIndex}}`;
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const newContent = message.substring(0, start) + tag + message.substring(end);
                          setMessage(newContent);
                          
                          // カーソル位置を挿入したタグの後ろに設定
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + tag.length, start + tag.length);
                          }, 0);
                          
                          toast.success('URLタグを挿入しました');
                        }
                      }}
                    >
                      URL{urlTagIndex}
                    </button>
                  </div>
            </div>
            
                <div className="mt-4">
                  <ShortenedUrlInput
                    onUpdate={handleOriginalUrlUpdate}
                    onInsertTag={(tag) => {
                      const textArea = document.getElementById('message') as HTMLTextAreaElement;
                      if (textArea) {
                        const start = textArea.selectionStart;
                        const end = textArea.selectionEnd;
                        const newContent = message.substring(0, start) + tag + message.substring(end);
                        setMessage(newContent);
                        
                        // カーソル位置を挿入したタグの後ろに設定
                        setTimeout(() => {
                          textArea.focus();
                          textArea.setSelectionRange(start + tag.length, start + tag.length);
                        }, 0);
                      }
                    }}
                    initialUrl={originalUrl}
                    disabled={isProcessing}
                  />
            </div>
            
                {/* アップロードされたファイルからメッセージプレビュー */}
                {parsedData.length > 0 && (
                  <div className="mt-8 border border-grey-200 rounded-lg p-4 bg-grey-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-grey-900 flex items-center">
                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                        アップロードファイルの内容
                      </h3>
                      <div className="flex items-center">
                        <span className="text-xs text-grey-500 mr-2">
                          {file?.name} - 全{parsedData.length}件
                        </span>
                </div>
              </div>

                    {/* アップロードされたファイル内容のテーブル表示 */}
                    <div className="bg-white border border-grey-200 rounded-lg overflow-auto mb-6">
                      <table className="w-full text-sm">
                        <thead className="bg-grey-50 text-grey-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">No.</th>
                            <th className="px-4 py-2 text-left font-medium">電話番号</th>
                            {(parsedData[0]?.customerName !== undefined || parsedData[0]?.B !== undefined) && (
                              <th className="px-4 py-2 text-left font-medium">顧客名</th>
                            )}
                            {(parsedData[0]?.message !== undefined || parsedData[0]?.J !== undefined || parsedData[0]?.C !== undefined) && (
                              <th className="px-4 py-2 text-left font-medium">メッセージ</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-grey-200">
                          {/* 1行目（ヘッダー行）は背景色を変えて表示 */}
                          {parsedData.length > 0 && (
                            <tr className="bg-grey-100">
                              <td className="px-4 py-2 text-center">ヘッダー</td>
                              <td className="px-4 py-2 font-medium">{parsedData[0].tel || parsedData[0].A || 'tel'}</td>
                              {(parsedData[0]?.customerName !== undefined || parsedData[0]?.B !== undefined) && (
                                <td className="px-4 py-2">{parsedData[0].customerName || parsedData[0].B || 'customerName'}</td>
                              )}
                              {(parsedData[0]?.message !== undefined || parsedData[0]?.J !== undefined || parsedData[0]?.C !== undefined) && (
                                <td className="px-4 py-2 whitespace-pre-wrap max-w-xs">{parsedData[0].message || parsedData[0].C || parsedData[0].J || 'message'}</td>
                              )}
                            </tr>
                          )}
                          {/* 2行目以降（データ行）を表示 */}
                          {parsedData.slice(1, 5).map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-grey-50'}>
                              <td className="px-4 py-2 text-center">{index + 1}</td>
                              <td className="px-4 py-2 font-medium">{row.tel || row.A || ''}</td>
                              {(parsedData[0]?.customerName !== undefined || parsedData[0]?.B !== undefined) && (
                                <td className="px-4 py-2">{row.customerName || row.B || ''}</td>
                              )}
                              {(parsedData[0]?.message !== undefined || parsedData[0]?.J !== undefined || parsedData[0]?.C !== undefined) && (
                                <td className="px-4 py-2 whitespace-pre-wrap max-w-xs">{row.message || row.C || row.J || ''}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mb-4 bg-primary-50 border border-primary-100 p-3 rounded-md flex items-start">
                      <Info className="w-5 h-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-grey-700">
                        <p className="font-medium mb-1">ファイル内容とメッセージについて</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>ファイル内にメッセージ列がある場合は、そのメッセージが優先して使用されます</li>
                          <li>メッセージ列がない場合は、上記テキストエリアで設定したメッセージテンプレートが使用されます</li>
                          <li>{'{customerName}'} などのタグは、対応する項目のデータに置き換えられます</li>
                          <li>エクセルファイルの場合、顧客名とメッセージ内容の列は自動的に認識されます</li>
                        </ul>
                        
                        <p className="font-medium mt-3 mb-1">使用可能なタグ一覧：</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>{'{customerName}'} - 顧客名</li>
                          <li>{'{orderNumber}'} - 注文番号</li>
                          <li>{'{appointmentDate}'} - 予約日</li>
                          <li>{'{companyName}'} - 会社名</li>
                          <li>{'{URL}'} - 短縮URL</li>
                          <li>{'{tel}'} - 電話番号</li>
                          <li>{'{memo}'} - メモ</li>
                        </ul>
                        <p className="mt-2 text-xs text-grey-500">※ アップロードファイルの項目名に合わせて {'{項目名}'} の形式でタグを使用することもできます</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-grey-900 mb-3 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        プレビュー:
                      </h3>

                      <div className="space-y-4">
                        {/* 1行目はヘッダーなので、2行目以降のデータでプレビュー */}
                        {parsedData.slice(1, 4).map((row, index) => {
                          // 行ごとのメッセージ内容を生成
                          let messageContent = message || previewTemplate;
                          if (row.message || row.C || row.J) {
                            messageContent = row.message || row.C || row.J || '';
                          }
                          
                          // タグ置換をプレビュー
                          Object.keys(row).forEach(key => {
                            const tagPattern = new RegExp(`{${key}}`, 'g');
                            messageContent = messageContent.replace(tagPattern, row[key] || '');
                          });
                          
                          // URL置換をプレビュー
                          const urlTagPattern = /{URL\d*}/g;
                          if (urlTagPattern.test(messageContent)) {
                            const url = row.original_url || row.K || originalUrl || '';
                            const urlTags = messageContent.match(urlTagPattern) || [];
                            urlTags.forEach(tag => {
                              messageContent = messageContent.replace(tag, url);
                            });
                          }
                          
                          const smsLength = calculateSMSLength(messageContent, { enableLongSMS: isLongSMSEnabled });
                          const smsCount = calculateSMSMessageCount(messageContent, { enableLongSMS: isLongSMSEnabled });
                          
                          return (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-grey-200 p-3">
                              <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                                  <div className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center font-medium text-xs">
                                    {index + 1}
                                  </div>
                                  <div className="ml-2 font-medium text-grey-700 text-sm">
                                    宛先: {row.tel || row.A || ''}
                                  </div>
                                </div>
                                <div className="text-xs text-grey-500">
                                  <span className={getCharCountClass(smsLength)}>文字数: {smsLength}</span> / 
                                  <span className={smsCount > 1 ? 'text-warning-600 ml-1' : 'ml-1'}>通数: {smsCount}</span>
                                </div>
                              </div>
                              
                              {/* スマホのSMS風デザイン */}
                              <div className="border rounded-lg p-3 bg-grey-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                      S
                                    </div>
                                    <div className="ml-2">
                                      <div className="text-xs font-medium text-grey-800">{senderNumber || '送信者'}</div>
                                      <div className="text-xs text-grey-500">SMS</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 text-grey-900 whitespace-pre-wrap text-sm mt-1">
                                  {messageContent}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
              
              <motion.div variants={item} className="pt-4 flex space-x-4 justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="btn-secondary px-6"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={validateAndProceed}
                  className="btn-primary px-6"
                >
                  次へ <ChevronRight className="ml-1 h-4 w-4" />
                </button>
          </motion.div>
            </>
          )}

          {/* ステップ3: 送信オプション */}
          {currentStep === SendStep.OPTIONS && (
            <>
              <motion.div variants={item}>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-grey-900 mb-3">送信オプション</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                      <input
                          type="checkbox"
                          checked={isScheduled}
                          onChange={() => setIsScheduled(!isScheduled)}
                          className="form-checkbox"
                          disabled={isProcessing}
                        />
                        <span className="ml-2 text-sm font-medium text-grey-700">予約送信</span>
                    </label>
                      
                      {isScheduled && (
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="scheduled-date" className="form-label">日付</label>
                      <input
                              type="date"
                              id="scheduled-date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="form-input"
                              disabled={isProcessing}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label htmlFor="scheduled-time" className="form-label">時間</label>
                            <input
                              type="time"
                              id="scheduled-time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="form-input"
                              disabled={isProcessing}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTestMode}
                          onChange={toggleTestMode}
                          className="form-checkbox"
                          disabled={isProcessing}
                        />
                        <span className="ml-2 text-sm font-medium text-grey-700">テスト送信モード</span>
                    </label>
                      
                      {isTestMode && (
                        <div className="mt-2">
                          <label htmlFor="test-recipient" className="form-label">テスト送信用電話番号</label>
                          <div className="mt-1">
                            <PhoneNumberInput
                              value={testRecipient}
                              onChange={handlePhoneNumberChange}
                              placeholder="例: 09012345678"
                              disabled={isProcessing}
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="pt-4 flex space-x-4 justify-between">
                    <button
                      type="button"
                  onClick={goToPreviousStep}
                  className="btn-secondary px-6"
                >
                  戻る
                    </button>
                    <button
                      type="button"
                  onClick={validateAndProceed}
                  className="btn-primary px-6"
                >
                  確認 <FileCheck className="ml-1 h-4 w-4" />
                    </button>
              </motion.div>
            </>
          )}

          {/* ステップ4: 確認 */}
          {currentStep === SendStep.CONFIRM && (
            <>
              <motion.div variants={item} className="space-y-4">
                <h3 className="text-base font-medium text-grey-900">送信内容確認</h3>

                {/* 日時指定の表示 */}
                {isScheduled && (
                  <div className="bg-info-50 p-4 rounded-md">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-info-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-grey-900">予約送信が設定されています</h4>
                        <p className="text-sm text-grey-600">
                          {`${scheduledDate} ${scheduledTime}`} に送信されます
                  </p>
                  </div>
                    </div>
                  </div>
                )}

                {/* テストモードの表示 */}
                {isTestMode && (
                  <div className="bg-warning-50 p-4 rounded-md">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-grey-900">テスト送信モードが有効です</h4>
                        <p className="text-sm text-grey-600">
                          テスト送信先: {testRecipient}
                  </p>
                </div>
                    </div>
                  </div>
                )}

                {/* ファイル内容の表示 */}
                <div className="border border-grey-200 rounded-md overflow-hidden">
                  <div className="bg-grey-50 px-4 py-3 border-b border-grey-200">
                    <h4 className="text-sm font-medium text-grey-900">アップロードファイル内容</h4>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm text-grey-600 mb-2">
                      <FileText className="w-4 h-4 mr-1.5" />
                      <span className="font-medium">{file?.name}</span>
                      <span className="mx-1">-</span>
                      <span>{parsedData.length - 1}件</span>
                    </div>

                    <div className="mt-3 border border-grey-200 rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-grey-200">
                        <thead className="bg-grey-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                              No
                            </th>
                            {/* ヘッダー行から項目名を動的に生成 */}
                            {parsedData.length > 0 && Object.keys(parsedData[0]).slice(0, 5).map((header, idx) => (
                              <th key={idx} scope="col" className="px-3 py-2 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-grey-200">
                          {parsedData.slice(1, 4).map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-grey-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-grey-500">
                                {rowIndex + 1}
                              </td>
                              {/* 項目値を動的に表示 */}
                              {Object.keys(parsedData[0]).slice(0, 5).map((header, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-xs text-grey-900">
                                  {row[header] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {parsedData.length > 4 && (
                      <div className="mt-2 text-xs text-grey-500 text-right">
                        ...他 {parsedData.length - 4} 件
                      </div>
                    )}
                  </div>
                </div>

                {/* メッセージ内容 */}
                <div className="border border-grey-200 rounded-md overflow-hidden">
                  <div className="bg-grey-50 px-4 py-3 border-b border-grey-200">
                    <h4 className="text-sm font-medium text-grey-900">メッセージテンプレート</h4>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-grey-700 whitespace-pre-line">{message || previewTemplate}</p>
                    {/* アップロードされたファイルにメッセージ列が含まれる場合の注記 */}
                    {parsedData.length > 0 && (Object.keys(parsedData[0]).some(key => 
                      key === 'message' || 
                      key === 'J' || 
                      key.toLowerCase() === 'メッセージ' || 
                      key.toLowerCase() === 'sms' || 
                      key.toLowerCase() === '内容'
                    )) && (
                      <div className="mt-2 text-xs text-grey-500 italic flex items-start">
                        <AlertCircle className="w-3 h-3 inline mr-1 mt-0.5 flex-shrink-0" />
                        <span>
                          ファイルにメッセージ列（J列）が含まれる場合、各行のメッセージがこのテンプレートより優先されます
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS実際の送信内容 */}
                <div className="border border-grey-200 rounded-md overflow-hidden">
                  <div className="bg-grey-50 px-4 py-3 border-b border-grey-200">
                    <h4 className="text-sm font-medium text-grey-900">SMS送信内容（プレビュー）</h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* 1行目はヘッダーなので、2行目以降のデータでプレビュー - 表示数を5件に制限 */}
                      {parsedData.slice(1, 6).map((row, index) => {
                        // メッセージ内容を取得（優先順位: J列 > message列 > テンプレート）
                        let messageContent = message || previewTemplate;
                        
                        // J列のメッセージを優先（明示的にundefind/null/空文字チェック）
                        if (row['J'] !== undefined && row['J'] !== null && row['J'] !== '') {
                          messageContent = String(row['J']);
                        } else {
                          // J列がない場合は他のメッセージフィールドを探す
                          const messageField = Object.keys(row).find(key => 
                            key === 'message' || 
                            key.toLowerCase() === 'メッセージ' || 
                            key.toLowerCase() === 'sms' || 
                            key.toLowerCase() === '内容'
                          );
                          
                          if (messageField && row[messageField]) {
                            messageContent = String(row[messageField]);
                          }
                        }
                        
                        // 電話番号を取得
                        const telField = Object.keys(row).find(key => 
                          key === 'tel' || 
                          key.toLowerCase() === '電話番号' || 
                          key.toLowerCase() === 'phone' ||
                          key.toLowerCase() === '宛先' ||
                          key === 'A'
                        );
                        
                        // 顧客名を取得（B列を優先）
                        let customerName = '';
                        if (row['B'] !== undefined && row['B'] !== null && row['B'] !== '') {
                          customerName = String(row['B']);
                        } else {
                          const customerNameField = Object.keys(row).find(key => 
                            key === 'customerName' || 
                            key.toLowerCase() === '顧客名' || 
                            key.toLowerCase() === 'name' ||
                            key.toLowerCase() === '名前' ||
                            key.toLowerCase() === 'お名前'
                          );
                          
                          if (customerNameField && row[customerNameField]) {
                            customerName = String(row[customerNameField]);
                          }
                        }
                        
                        // プレビュー生成
                        const preview = createPreview(row, messageContent);
                        console.log(`行 ${index + 1} のプレビュー: ${preview}`);
                        
                        return (
                          <div key={index} className="p-3 bg-grey-50 rounded-md">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <PhoneOutgoing className="h-4 w-4 text-primary-500 mt-0.5" />
                      </div>
                              <div className="ml-2 flex-1">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-grey-700">
                                    {telField ? formatPhoneNumber(row[telField] || '') : ''}
                                  </span>
                                  {customerName && (
                                    <>
                                      <span className="mx-1 text-grey-400">|</span>
                                      <span className="text-xs text-grey-600">{customerName}</span>
                                    </>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-grey-900 whitespace-pre-line">{preview}</p>
                                <div className="mt-1 text-right">
                                  <span className="text-xs text-grey-500">
                                    {calculateSMSLength(preview, { enableLongSMS: isLongSMSEnabled })}文字
                                    {' / '}
                                    {calculateSMSMessageCount(preview, { enableLongSMS: isLongSMSEnabled })}通
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {parsedData.length > 6 && (
                      <div className="mt-3 text-xs text-grey-500 text-right">
                        ...他 {parsedData.length - 6} 件
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 送信確認 */}
                <div>
                  <h3 className="text-base font-medium text-grey-900 mb-2">送信確認</h3>
                  <div className="bg-grey-50 p-4 rounded-md">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-grey-400 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-grey-900">以下の内容でSMSを送信します</h4>
                        <ul className="mt-2 text-sm text-grey-700 space-y-1">
                          <li>• 送信者ID: <span className="font-medium">{senderNumber}</span></li>
                          <li>• 送信件数: <span className="font-medium">{parsedData.length - 1}件</span></li>
                          {isTestMode && (
                            <li>• テスト送信先: <span className="font-medium">{testRecipient}</span></li>
                          )}
                          {isScheduled && (
                            <li>• 送信日時: <span className="font-medium">{`${scheduledDate} ${scheduledTime}`}</span></li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* 確認ステップのボタン */}
              {currentStep === SendStep.CONFIRM && (
                <div className="flex items-center justify-between mt-8">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="btn-secondary flex-1"
                    disabled={isProcessing}
                  >
                    編集に戻る
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        送信中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        SMS送信
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
};

export default BulkSendForm;