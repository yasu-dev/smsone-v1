
import React, { useState, useEffect } from 'react';
import { Info, Globe } from 'lucide-react';
import useSenderNumberStore from '../../store/senderNumberStore';
import useAuthStore from '../../store/authStore';

interface SenderNumberSelectProps {
  onChange: (senderNumber: string) => void;
  initialSenderNumber?: string;
  disabled?: boolean;
}

const SenderNumberSelect: React.FC<SenderNumberSelectProps> = ({
  onChange,
  initialSenderNumber,
  disabled = false
}) => {
  const { 
    fetchSenderNumbers, 
    getAvailableSenderNumbers,
    isLoading 
  } = useSenderNumberStore();
  
  const { user } = useAuthStore();
  const [senderNumber, setSenderNumber] = useState<string>(initialSenderNumber || '');
  
  // 初期データの読み込み
  useEffect(() => {
    fetchSenderNumbers();
  }, [fetchSenderNumbers]);
  
  // 初期値設定
  useEffect(() => {
    if (!initialSenderNumber && !senderNumber) {
      // 現在のユーザーIDに基づいて送信者名をフィルタリング
      const availableNumbers = getAvailableSenderNumbers(user?.id);
      if (availableNumbers.length > 0) {
        const defaultNumber = availableNumbers[0].number;
        setSenderNumber(defaultNumber);
        onChange(defaultNumber);
      }
    }
  }, [getAvailableSenderNumbers, initialSenderNumber, senderNumber, onChange, user?.id]);
  
  // 利用可能な送信元番号一覧（現在のユーザーに基づくフィルタリング）
  const availableSenderNumbers = getAvailableSenderNumbers(user?.id);
  
  // 送信元番号選択変更ハンドラ
  const handleSenderNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSenderNumber(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div>
        <label htmlFor="sender-number" className="form-label">
          送信者名表示
        </label>
        
        <select
          id="sender-number"
          className="form-select"
          value={senderNumber}
          onChange={handleSenderNumberChange}
          disabled={disabled || isLoading || availableSenderNumbers.length === 0}
        >
          {availableSenderNumbers.length === 0 ? (
            <option value="">利用可能な送信者名がありません</option>
          ) : (
            <>
              {/* 電話番号のグループ */}
              {availableSenderNumbers.filter(sn => sn.isPhoneNumber).length > 0 && (
                <optgroup label="電話番号">
                  {availableSenderNumbers
                    .filter(sn => sn.isPhoneNumber)
                    .map((sn) => (
                      <option key={sn.id} value={sn.number}>
                        {sn.number}{sn.description ? ` (${sn.description})` : ''}
                      </option>
                    ))
                  }
                </optgroup>
              )}
              
              {/* 国際送信対応の送信者名グループ */}
              {availableSenderNumbers.some(sn => sn.isInternational) && (
                <optgroup label="国際送信対応の送信者名">
                  {availableSenderNumbers
                    .filter(sn => sn.isInternational)
                    .map((sn) => (
                      <option key={sn.id} value={sn.number}>
                        {sn.number}{sn.description ? ` (${sn.description})` : ''}
                      </option>
                    ))
                  }
                </optgroup>
              )}
            </>
          )}
        </select>
        
        <div className="mt-2 text-sm text-grey-600 flex items-start">
          <Info className="h-4 w-4 text-grey-400 mr-1 flex-shrink-0 mt-0.5" />
          <p>
            ドコモ、au、楽天モバイル宛ての送信者名表示です。
            電話番号形式は通常の国内送信に使用され、ソフトバンク宛ての送信時は送信元番号は「21061」で固定されます。
            <br />
            {availableSenderNumbers.some(sn => sn.isInternational) && (
              <span className="flex items-center mt-1">
                <Globe className="h-4 w-4 mr-1 text-primary-500" />
                <span className="text-primary-600">国際送信対応</span>の送信者名は国際宛先への送信に使用できます。
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SenderNumberSelect;