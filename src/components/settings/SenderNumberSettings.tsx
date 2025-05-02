import React, { useState, useEffect, useRef } from 'react';
import useSenderNumberStore from '../../store/senderNumberStore';
import useAuthStore from '../../store/authStore';
import { SenderNumber } from '../../types';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Pencil, Check, Trash2, Phone, X, Plus, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { motion } from 'framer-motion';

// アニメーション設定
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface SenderNumberSettingsProps {
  userId?: string;
  hideInternationalSettings?: boolean;
  hideSharing?: boolean;
}

export function SenderNumberSettings({ 
  userId: propUserId, 
  hideInternationalSettings = false,
  hideSharing = false
}: SenderNumberSettingsProps) {
  // 送信者番号ストアから必要な情報を取得
  const { 
    senderNumbers, 
    isLoading, 
    loadSenderNumbers, 
    addSenderNumber, 
    updateSenderNumber, 
    deleteSenderNumber 
  } = useSenderNumberStore();
  
  const { user } = useAuthStore();
  
  const [newNumber, setNewNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  
  // スクロール用のref
  const domesticSectionRef = useRef<HTMLDivElement>(null);
  const internationalSectionRef = useRef<HTMLDivElement>(null);
  
  // 初期ロード時に送信者番号を取得
  useEffect(() => {
    loadSenderNumbers().catch(err => {
      toast.error('送信者番号の読み込みに失敗しました');
      console.error(err);
    });
  }, [loadSenderNumbers]);
  
  // ユーザーID (プロパティ経由で渡された場合はそれを使用、そうでない場合は現在ログイン中のユーザー)
  const effectiveUserId = propUserId || user?.id || undefined;
  const isAdmin = user?.role === 'admin';
  
  // 送信者名をフィルタリング
  const phoneNumbers = senderNumbers.filter(num => 
    (num.userId === undefined || num.userId === effectiveUserId || isAdmin)
  );

  // 国内送信用の番号
  const domesticNumbers = phoneNumbers.filter(num => !num.isInternational);
  
  // 国際送信用の番号
  const internationalNumbers = phoneNumbers.filter(num => num.isInternational);

  // 国内/国際切り替え
  const handleSwitchToInternational = () => {
    setIsInternational(true);
  };

  const handleSwitchToDomestic = () => {
    setIsInternational(false);
  };

  // 送信者番号の追加
  const handleAddNumber = async () => {
    if (!newNumber) {
      toast.error('送信者名または電話番号を入力してください');
      return;
    }
    
    try {
      // 国内/国際フラグに基づいて送信者名を追加
      await addSenderNumber({
        number: newNumber,
        description: newDescription || undefined,
        isInternational: isInternational, // 国内/国際の選択状態
        isPhoneNumber: !isInternational && /^\d+$/.test(newNumber),
        userId: hideSharing ? effectiveUserId : undefined
      });
      
      // フォームをリセット
      setNewNumber('');
      setNewDescription('');
      
      // 成功メッセージの表示
      toast.success(`${isInternational ? '国際' : '国内'}送信用の送信者名を追加しました`);
      
      // 追加した送信者名のセクションまでスクロール
      setTimeout(() => {
        if (isInternational && internationalSectionRef.current) {
          internationalSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (!isInternational && domesticSectionRef.current) {
          domesticSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // 追加後も選択状態を維持（リセットしない）
    } catch (error) {
      console.error('送信者名の追加に失敗しました', error);
      toast.error('送信者名の追加に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(undefined);
  };

  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [senderNumberToDelete, setSenderNumberToDelete] = useState<string | undefined>(undefined);

  // 編集中の送信者番号
  const [editNumber, setEditNumber] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // 送信者番号の編集を開始
  const startEditing = (senderNumber: SenderNumber) => {
    setEditingId(senderNumber.id);
    setEditNumber(senderNumber.number);
    setEditDescription(senderNumber.description || '');
  };

  // 送信者番号の編集を保存
  const saveEditing = async () => {
    if (!editingId) return;
    
    if (!editNumber.trim()) {
      toast.error('送信者名または電話番号を入力してください');
      return;
    }

    try {
      // 編集対象の送信者番号を取得
      const currentSenderNumber = senderNumbers.find(sn => sn.id === editingId);
      if (!currentSenderNumber) return;

      const updates: Partial<SenderNumber> = {
        number: editNumber,
        description: editDescription || undefined,
        // 既存のisInternationalとisPhoneNumber値を保持
        isInternational: currentSenderNumber.isInternational,
        isPhoneNumber: currentSenderNumber.isPhoneNumber,
        userId: hideSharing ? effectiveUserId : undefined
      };

      await updateSenderNumber(editingId, updates);
      setEditingId(undefined);
      toast.success('送信者名を更新しました');
    } catch (error) {
      toast.error('送信者名の更新に失敗しました');
      console.error(error);
    }
  };

  // 送信者番号の削除を確認
  const confirmDelete = (id: string) => {
    setSenderNumberToDelete(id);
    setDeleteDialogOpen(true);
  };

  // 送信者番号を削除
  const handleDeleteSenderNumber = async () => {
    if (!senderNumberToDelete) return;
    
    try {
      await deleteSenderNumber(senderNumberToDelete);
      setDeleteDialogOpen(false);
      setSenderNumberToDelete(undefined);
      toast.success('送信者番号を削除しました');
    } catch (error) {
      toast.error('送信者番号の削除に失敗しました');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      
      {/* 送信者名設定 */}
      {!isLoading && (
        <motion.div
          className="space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
              {/* 新しい送信者名の追加フォーム */}
              <div className="mb-6 grid gap-4">
                <div>
                  <Label htmlFor="newNumber">送信者名または電話番号</Label>
                  <Input
                    id="newNumber"
                    type="text"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="mt-1"
                    placeholder="SMS送信時に表示される送信者名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="newDescription">説明（オプション）</Label>
                  <Input
                    id="newDescription"
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1"
                    placeholder="この送信者名の用途など"
                  />
                </div>
                
                {!hideInternationalSettings && (
                  <div>
                    <Label className="block mb-2">送信タイプ</Label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={handleSwitchToDomestic}
                        className={`px-4 py-2 rounded-md flex items-center transition-all ${
                          !isInternational 
                            ? 'bg-primary-100 text-primary-800 border border-primary-200 shadow-sm font-medium' 
                            : 'bg-grey-100 text-grey-700 border border-grey-200 hover:bg-grey-200'
                        }`}
                      >
                        <Phone className={`h-4 w-4 mr-2 ${!isInternational ? 'text-primary-600' : 'text-grey-500'}`} />
                        国内送信用
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToInternational}
                        className={`px-4 py-2 rounded-md flex items-center transition-all ${
                          isInternational 
                            ? 'bg-primary-100 text-primary-800 border border-primary-200 shadow-sm font-medium' 
                            : 'bg-grey-100 text-grey-700 border border-grey-200 hover:bg-grey-200'
                        }`}
                      >
                        <Globe className={`h-4 w-4 mr-2 ${isInternational ? 'text-primary-600' : 'text-grey-500'}`} />
                        国際送信用
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-grey-600">
                      {isInternational 
                        ? '国際送信用の送信者名は、海外の宛先への送信に使用されます。英数字や日本語など、文字列で指定できます。' 
                        : '国内送信用の送信者名は、国内の宛先への送信に使用されます。電話番号形式で入力すると、ドコモ、au、楽天モバイル宛てに送信者番号として表示されます。'}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleAddNumber}
                    disabled={isLoading || !newNumber.trim()}
                    className="flex items-center bg-blue-600 text-white hover:bg-blue-700 px-5 py-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    追加
                  </Button>
                </div>
              </div>

              {/* 国内送信用の送信者名一覧 */}
              <div className="mb-6" ref={domesticSectionRef}>
                <h3 className="text-sm font-medium text-grey-700 mb-3 flex items-center">
                  <Phone className="h-4 w-4 mr-1.5 text-primary-500" />
                  国内送信用
                  {!isInternational && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700">現在選択中</span>}
                </h3>
                
                {domesticNumbers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">登録された国内送信用の送信者名はありません</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">送信者名</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {domesticNumbers.map(senderNumber => (
                          <tr key={senderNumber.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                              {editingId === senderNumber.id ? (
                                <Input
                                  type="text"
                                  value={editNumber}
                                  onChange={(e) => setEditNumber(e.target.value)}
                                />
                              ) : (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-blue-500 mr-2" />
                                  {senderNumber.number}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                              {editingId === senderNumber.id ? (
                                <Input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                />
                              ) : (
                                senderNumber.description || '-'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500 text-right">
                              <div className="flex space-x-2 justify-end">
                                {editingId === senderNumber.id ? (
                                  <>
                                    <Button
                                      className="p-2 hover:bg-gray-100 rounded-full"
                                      onClick={saveEditing}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      className="p-2 hover:bg-gray-100 rounded-full"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      className="p-2 hover:bg-gray-100 rounded-full"
                                      onClick={() => startEditing(senderNumber)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      className="p-2 hover:bg-red-50 rounded-full text-red-500"
                                      onClick={() => confirmDelete(senderNumber.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* 国際送信用の送信者名一覧 */}
              {!hideInternationalSettings && (
                <div ref={internationalSectionRef}>
                  <h3 className="text-sm font-medium text-grey-700 mb-3 flex items-center">
                    <Globe className="h-4 w-4 mr-1.5 text-primary-500" />
                    国際送信用
                    {isInternational && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700">現在選択中</span>}
                  </h3>
                  
                  {internationalNumbers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">登録された国際送信用の送信者名はありません</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">送信者名</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {internationalNumbers.map(senderNumber => (
                            <tr key={senderNumber.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                                {editingId === senderNumber.id ? (
                                  <Input
                                    type="text"
                                    value={editNumber}
                                    onChange={(e) => setEditNumber(e.target.value)}
                                  />
                                ) : (
                                  <div className="flex items-center">
                                    <Globe className="h-4 w-4 text-blue-500 mr-2" />
                                    {senderNumber.number}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                                {editingId === senderNumber.id ? (
                                  <Input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                  />
                                ) : (
                                  senderNumber.description || '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500 text-right">
                                <div className="flex space-x-2 justify-end">
                                  {editingId === senderNumber.id ? (
                                    <>
                                      <Button
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        onClick={saveEditing}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        onClick={handleCancelEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        onClick={() => startEditing(senderNumber)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        className="p-2 hover:bg-red-50 rounded-full text-red-500"
                                        onClick={() => confirmDelete(senderNumber.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送信者番号の削除</DialogTitle>
          </DialogHeader>
          <p className="py-4">この送信者番号を削除してもよろしいですか？この操作は元に戻せません。</p>
          <DialogFooter>
            <Button 
              className="bg-gray-100 text-gray-700 hover:bg-gray-200" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              className="bg-red-500 text-white hover:bg-red-600" 
              onClick={handleDeleteSenderNumber}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 