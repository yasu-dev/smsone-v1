import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Send, FileText, Clock, ShieldCheck, FileCheck, Globe, PencilLine, ChevronRight, Settings, Link, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import useTemplateStore from '../../store/templateStore';
import useSMSStore from '../../store/smsStore';
import useAuthStore from '../../store/authStore';
import { Template } from '../../types';
import SenderNumberSelect from './SenderNumberSelect';
import ShortenedUrlInput from './ShortenedUrlInput';
import SurveyTagInput from './SurveyTagInput';
import PhoneNumberInput from './PhoneNumberInput';
import { calculateSMSLength, calculateSMSMessageCount, isSMSLengthExceeded, SMS_CHARACTER_LIMITS } from '../../utils/smsUtils';
import TagHighlighter from '../ui/TagHighlighter';
import useSenderNumberStore from '../../store/senderNumberStore';

// 送信ステップを定義
enum SendStep {
  RECIPIENT = 0,
  CONTENT = 1,
  OPTIONS = 2,
  CONFIRM = 3,
}

const IndividualSendForm: React.FC = () => {
  // 送信ステップの状態
  const [currentStep, setCurrentStep] = useState<SendStep>(SendStep.RECIPIENT);

  // 既存の状態
  const [recipient, setRecipient] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const isLongSMSEnabled = true;
  const [isSending, setIsSending] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [multipleUrlsEnabled, setMultipleUrlsEnabled] = useState(true);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [urlTagIndex, setUrlTagIndex] = useState(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const { templates, fetchTemplates, isLoading: isLoadingTemplates } = useTemplateStore();
  const { sendMessage, sendTestMessage } = useSMSStore();
  const { hasPermission } = useAuthStore();
  
  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Update character count when content changes
  useEffect(() => {
    const smsLength = calculateSMSLength(content, { enableLongSMS: isLongSMSEnabled });
    setCharacterCount(smsLength);
    setMessageCount(calculateSMSMessageCount(content, { enableLongSMS: isLongSMSEnabled }));
    
    // URLタグが含まれる数を数えて、次のタグのインデックスを準備する
    const urlTagRegex = /{URL(\d*)}/g;
    const matches = content.match(urlTagRegex) || [];
    
    if (matches.length > 0) {
      const indices = matches.map((match) => {
        const indexMatch = match.match(/{URL(\d*)}/);
        return indexMatch && indexMatch[1] ? parseInt(indexMatch[1], 10) : 1;
      });
      
      const maxIndex = Math.max(...indices, 0);
      setUrlTagIndex(maxIndex + 1);
    } else {
      setUrlTagIndex(1);
    }
  }, [content, isLongSMSEnabled]);

  // 次のステップに進む関数
  const goToNextStep = () => {
    if (currentStep < SendStep.CONFIRM) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 前のステップに戻る関数
  const goToPreviousStep = () => {
    if (currentStep > SendStep.RECIPIENT) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 特定のステップに直接ジャンプする関数
  const goToStep = (step: SendStep) => {
    setCurrentStep(step);
  };

  // 送信先ステップのバリデーション
  const validateRecipientStep = () => {
    if (!isTestMode && !recipient) {
      toast.error('宛先を入力してください');
      return false;
    }
    
    if (isTestMode && !testRecipient) {
      toast.error('テスト送信用携帯番号を入力してください');
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
    if (!content) {
      toast.error('本文を入力してください');
      return false;
    }
    
    // 正規表現で{URL}タグがあるかチェック（数字付きも含む）
    const hasUrlTags = /{URL\d*}/.test(content);
    
    // 本文に{URL}タグがあるのに短縮元URLが設定されていない場合
    if (hasUrlTags && !originalUrl) {
      toast.error('本文に{URL}タグがありますが、短縮元URLが設定されていません');
      return false;
    }
    
    // 文字数制限チェック
    if (isSMSLengthExceeded(content, { enableLongSMS: isLongSMSEnabled })) {
      const limit = 660; // 文字数制限を660文字に統一
      toast.error(`文字数制限(${limit}文字)を超えています`);
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
    
    return true;
  };

  // 各ステップを検証してから次へ進む
  const validateAndProceed = () => {
    let isValid = false;
    
    switch (currentStep) {
      case SendStep.RECIPIENT:
        isValid = validateRecipientStep();
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

  const handleTemplateSelect = (template: Template) => {
    setContent(template.content);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
    
    // テンプレートに短縮元URLが含まれている場合は設定
    if (template.originalUrl) {
      setOriginalUrl(template.originalUrl);
    }
  };

  // 電話番号入力ハンドラ
  const handlePhoneNumberChange = (value: string, international: boolean, country?: string) => {
    setRecipient(value);
    setIsInternational(international);
    setCountryCode(country);
  };

  // 確認モードに移行
  const handleConfirm = () => {
    if (!validateRecipientStep() || !validateContentStep() || !validateOptionsStep()) return;
    goToStep(SendStep.CONFIRM);
  };
  
  // フォーム検証
  const validateForm = () => {
    return validateRecipientStep() && validateContentStep() && validateOptionsStep();
  };

  // 編集モードに戻る
  const handleBackToEdit = () => {
    goToStep(SendStep.RECIPIENT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== SendStep.CONFIRM) {
      validateAndProceed();
      return;
    }
    
    if (!validateForm()) return;
    
    const actualRecipient = isTestMode ? testRecipient : recipient;
    
    setIsSending(true);
    
    try {
      // 予約日時がある場合はメモに追加
      const scheduledDateString = isScheduled ? `予約送信: ${scheduledDate} ${scheduledTime}` : undefined;
      
      if (isTestMode) {
        // テスト送信
        await sendTestMessage({
          recipient: testRecipient,
          content,
          sender: senderNumber,
          templateId: selectedTemplate || undefined,
          originalUrl: originalUrl || undefined,
          isInternational,
          countryCode,
          memo: scheduledDateString
        });
        toast.success(`テスト送信を完了しました`);
      } else {
        // 通常送信
        await sendMessage({
          recipient: actualRecipient,
          content,
          sender: senderNumber,
          templateId: selectedTemplate || undefined,
          originalUrl: originalUrl || undefined,
          isInternational,
          countryCode,
          memo: scheduledDateString
        });
        toast.success('メッセージを送信しました');
      }
      
      // 送信後の処理
      resetForm();
    } catch (error) {
      toast.error('送信に失敗しました');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // フォームリセット
  const resetForm = () => {
    setRecipient('');
    setContent('');
    setSelectedTemplate('');
    setCurrentStep(SendStep.RECIPIENT);
    setIsScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
    setOriginalUrl('');
    setTestRecipient('');
    setIsTestMode(false);
    setIsInternational(false);
    setCountryCode(undefined);
    setUrlTagIndex(1);
    setShowAdvancedOptions(false);
  };

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
  
  const handleOriginalUrlUpdate = (url: string) => {
    setOriginalUrl(url);
  };
  
  const handleInsertTag = (tag: string) => {
    const textArea = document.getElementById('content') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const newContent = content.substring(0, start) + tag + content.substring(end);
      setContent(newContent);
      
      // カーソル位置を挿入したタグの後ろに設定
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      // テキストエリアが見つからない場合は末尾に追加
      setContent(content + tag);
    }
    
    // URLタグを挿入した後、次のタグインデックスを更新
    if (tag.startsWith('{URL')) {
      // タグパターンを正規表現で検出
      const match = tag.match(/{URL(\d*)}/) || [];
      const currentIndex = match[1] ? parseInt(match[1], 10) : 1;
      setUrlTagIndex(currentIndex + 1);
    }
  };

  // テスト送信モードを切り替え
  const toggleTestMode = () => {
    setIsTestMode(!isTestMode);
  };

  // 高度なオプションの表示/非表示を切り替え
  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  // 文字数制限値
  const characterLimit = 660; // 文字数制限を660文字に統一

  // Animation variants
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
                {step === SendStep.RECIPIENT && '宛先'}
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

  return (
    <motion.div 
      className="card"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="mb-5">
        <h2 className="text-lg font-medium text-grey-900">個別送信</h2>
        <p className="mt-1 text-sm text-grey-500">
          送信者名と本文を入力して個別にSMSを送信します。
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="mt-6">
        <motion.div className="space-y-6" variants={container}>
          {/* ステップ1: 送信先設定 */}
          {currentStep === SendStep.RECIPIENT && (
            <>
              <motion.div variants={item}>
                <div className="flex items-center mb-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTestMode}
                      onChange={toggleTestMode}
                      className="form-checkbox"
                    />
                    <span className="ml-2 text-sm font-medium text-grey-700">テスト送信モード</span>
                  </label>
                  <div className="ml-2 text-sm text-grey-500">
                    {isTestMode ? '実際には送信せず、テスト用携帯番号にのみ送信します' : null}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <SenderNumberSelect 
                  onChange={handleSenderNumberChange}
                  initialSenderNumber={senderNumber}
                  disabled={false}
                />
              </motion.div>
              
              {isTestMode ? (
                <motion.div variants={item}>
                  <label htmlFor="test-recipient" className="form-label flex items-center">
                    テスト送信用携帯番号 <span className="text-error-500 ml-1">*</span>
                  </label>
                  <div className="mt-1">
                    <PhoneNumberInput
                      value={testRecipient}
                      onChange={(value, isIntl, code) => {
                        setTestRecipient(value);
                        setIsInternational(isIntl);
                        setCountryCode(code);
                      }}
                      userType={hasPermission('internationalSms') ? 'both' : 'domestic'}
                      disabled={false}
                      required
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={item}>
                  <label htmlFor="recipient" className="form-label">
                    宛先（電話番号）{isInternational && <span className="ml-2 text-xs text-primary-600">国際送信対応</span>}
                  </label>
                  <div className="mt-1">
                    <PhoneNumberInput
                      value={recipient}
                      onChange={handlePhoneNumberChange}
                      userType={hasPermission('internationalSms') ? (isInternational ? 'international' : 'domestic') : 'domestic'}
                      disabled={false}
                      allowInternational={isInternational}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={item} className="pt-4 flex justify-end">
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

          {/* ステップ2: 本文入力 */}
          {currentStep === SendStep.CONTENT && (
            <>
              <motion.div variants={item}>
                <div className="flex items-center justify-between">
                  <label htmlFor="content" className="form-label">
                    本文 <span className="text-error-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="inline-flex items-center text-primary-600 hover:text-primary-500 text-sm"
                    >
                      <PencilLine className="h-4 w-4 mr-1" />
                      テンプレートを使用
                    </button>
                  </div>
                </div>
                <div className="mt-1">
                  <textarea
                    id="content"
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="メッセージを入力してください。動的タグや短縮URLタグを使用できます。"
                    className="form-input"
                  />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-grey-500 flex items-center">
                    <span className={characterCount > characterLimit ? 'text-error-600' : ''}>
                      文字数: {characterCount} / {characterLimit}文字
                    </span>
                    {messageCount > 1 && (
                      <span className="ml-2 px-2 py-0.5 bg-grey-100 rounded-full text-xs">
                        {messageCount}通分
                      </span>
                    )}
                    {characterCount > characterLimit && (
                      <span className="text-error-600 ml-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        制限を超えています
                      </span>
                    )}
                  </div>
                </div>
                
                {/* タグ使用ガイド */}
                <div className="mt-2 text-sm text-grey-500">
                  <p>利用可能なタグ: 
                    <span className="tag-badge-common">お客様の名前を入力</span>
                    <span className="tag-badge-common">注文番号を入力</span>
                    <span className="tag-badge-common">予約日時を入力</span>
                    <span className="tag-badge-url">URL1</span>
                    <span className="tag-badge-url">URL2</span>
                    <span className="tag-badge-url">アンケート</span>
                  </p>
                </div>
                
                {/* 送信内容タグボタン */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <SurveyTagInput onInsertTag={handleInsertTag} disabled={false} />
                </div>
              </motion.div>

              <motion.div variants={item}>
                <ShortenedUrlInput 
                  onUpdate={handleOriginalUrlUpdate}
                  onInsertTag={handleInsertTag}
                  initialUrl={originalUrl}
                  showMultipleUrls={multipleUrlsEnabled}
                  urlIndex={urlTagIndex}
                  disabled={false}
                />
              </motion.div>

              {/* Template selector dropdown */}
              {showTemplates && (
                <motion.div 
                  className="mt-2 border border-grey-200 rounded-md shadow-sm overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-3 bg-grey-50 border-b border-grey-200">
                    <h4 className="font-medium text-grey-900">テンプレート選択</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {isLoadingTemplates ? (
                      <div className="p-4 text-center text-grey-500">読み込み中...</div>
                    ) : templates.length === 0 ? (
                      <div className="p-4 text-center text-grey-500">テンプレートがありません</div>
                    ) : (
                      templates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border-b border-grey-200 hover:bg-grey-50 cursor-pointer"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <p className="font-medium text-grey-900">{template.name}</p>
                          <p className="text-sm text-grey-500 mt-1 line-clamp-2">
                            <TagHighlighter text={template.content} interactive={false} isPreview={true} />
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Preview box */}
              {content && (
                <motion.div variants={item} className="mt-4 p-4 border border-grey-200 rounded-md bg-grey-50">
                  <p className="text-sm font-medium text-grey-700 mb-2">プレビュー:</p>
                  <div className="text-sm text-grey-800 whitespace-pre-wrap">
                    <TagHighlighter 
                      text={content} 
                      interactive={false}
                      isPreview={true}
                      showAsText={true}
                    />
                  </div>
                </motion.div>
              )}

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

          {/* ステップ3: オプション設定 */}
          {currentStep === SendStep.OPTIONS && (
            <>
              <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-grey-800">送信オプション</h3>
                </div>

                <div className="bg-grey-50 p-4 rounded-md border border-grey-200">
                  <div className="flex items-center mb-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={() => setIsScheduled(!isScheduled)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 flex items-center text-sm font-medium text-grey-700">
                        <Clock className="h-4 w-4 mr-1" />
                        送信予約
                      </span>
                    </label>
                    <div className="ml-2 text-sm text-grey-500">
                      {isScheduled ? '指定した日時にSMSを送信します' : null}
                    </div>
                  </div>

                  {isScheduled && (
                    <motion.div 
                      className="flex space-x-4 mt-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex-1">
                        <label htmlFor="scheduled-date" className="form-label">
                          予約日
                        </label>
                        <input
                          type="date"
                          id="scheduled-date"
                          className="form-input"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="scheduled-time" className="form-label">
                          予約時間
                        </label>
                        <input
                          type="time"
                          id="scheduled-time"
                          className="form-input"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
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

          {/* ステップ4: 確認画面 */}
          {currentStep === SendStep.CONFIRM && (
            <motion.div 
              variants={item}
              className="border border-grey-200 rounded-md p-4 bg-grey-50"
            >
              <h3 className="font-medium text-grey-900 mb-3">送信内容の確認</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-grey-500">宛先</p>
                    <p className="text-sm text-grey-900 flex items-center">
                      {isInternational && (
                        <span className="mr-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          <Globe className="h-3 w-3 mr-1" />
                          国際
                        </span>
                      )}
                      {isTestMode ? testRecipient : recipient}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-grey-500">送信者</p>
                    <p className="text-sm text-grey-900">{senderNumber}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-grey-500">本文</p>
                  <div className="text-sm text-grey-900 whitespace-pre-wrap p-3 bg-white rounded border border-grey-200">
                    <TagHighlighter 
                      text={content} 
                      interactive={false}
                      isPreview={true}
                      showAsText={true}
                    />
                  </div>
                </div>
                
                {originalUrl && (
                  <div>
                    <p className="text-sm font-medium text-grey-500">短縮元URL</p>
                    <p className="text-sm text-grey-900 font-mono">{originalUrl}</p>
                  </div>
                )}
                
                {isScheduled && scheduledDate && scheduledTime && (
                  <div>
                    <p className="text-sm font-medium text-grey-500">予約送信日時</p>
                    <p className="text-sm text-grey-900">
                      {scheduledDate} {scheduledTime}
                    </p>
                  </div>
                )}
                
                {isTestMode && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
                    <p className="text-sm text-warning-800 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-warning-500" />
                      テスト送信モードが有効です。送信先は「{testRecipient}」のみとなります。
                    </p>
                  </div>
                )}
              </div>

              <motion.div variants={item} className="pt-4 flex space-x-4 justify-between">
                <button
                  type="button"
                  onClick={handleBackToEdit}
                  className="btn-secondary flex-1"
                >
                  編集に戻る
                </button>
                
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary flex-1"
                >
                  {isSending ? (
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
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
};

export default IndividualSendForm;