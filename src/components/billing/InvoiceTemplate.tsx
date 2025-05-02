import React, { useState, useRef } from 'react';
import { Box, TextField, Typography, Button, Grid } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

// TypeScript型エラー回避のためのヘルパーコンポーネント
const GridItem: React.FC<any> = (props) => {
  // @ts-ignore
  return <Grid item {...props} />;
};

interface InvoiceTemplateProps {
  initialData?: {
    companyName: string;
    companyAddress: string;
    clientName: string;
    clientAddress: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  onSave: (data: any) => void;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    companyAddress: initialData?.companyAddress || '',
    clientName: initialData?.clientName || '',
    clientAddress: initialData?.clientAddress || '',
    invoiceNumber: initialData?.invoiceNumber || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    items: initialData?.items || [{ description: '', quantity: 0, unitPrice: 0 }],
  });
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 0, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // 請求書をPDFとしてダウンロードする関数
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsDownloading(true);
    try {
      // テンプレートをキャンバスに変換
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // 高解像度設定
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // A4サイズのPDFを作成
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // キャンバスの寸法を計算
      const imgWidth = 210; // A4の幅 (mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      
      // PDFに画像として追加
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // PDFダウンロード
      pdf.save(`請求書_${formData.invoiceNumber}.pdf`);
      toast.success('請求書のPDFがダウンロードされました');
    } catch (error) {
      console.error('PDF生成エラー:', error);
      toast.error('PDFの生成に失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  // 小計を計算
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };
  
  // 消費税を計算（10%）
  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.1);
  };
  
  // 合計を計算
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" gutterBottom>
          請求書テンプレート
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          sx={{ ml: 2 }}
        >
          {isDownloading ? 'ダウンロード中...' : 'PDFダウンロード'}
        </Button>
      </div>

      <Box component="form" onSubmit={handleSubmit}>
        <div ref={invoiceRef} className="p-6 bg-white">
          <Grid container spacing={3}>
            <GridItem xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                請求元情報
              </Typography>
              <TextField
                fullWidth
                label="会社名"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="住所"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
            </GridItem>

            <GridItem xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                請求先情報
              </Typography>
              <TextField
                fullWidth
                label="顧客名"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="住所"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
            </GridItem>

            <GridItem xs={12} md={6}>
              <TextField
                fullWidth
                label="請求書番号"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                margin="normal"
              />
            </GridItem>

            <GridItem xs={12} md={6}>
              <TextField
                fullWidth
                label="発行日"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </GridItem>
            
            <GridItem xs={12} md={6}>
              <TextField
                fullWidth
                label="支払期限"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </GridItem>

            <GridItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                明細
              </Typography>
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <GridItem xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="説明"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </GridItem>
                  <GridItem xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="数量"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    />
                  </GridItem>
                  <GridItem xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="単価"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    />
                  </GridItem>
                  <GridItem xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="小計"
                      value={item.quantity * item.unitPrice}
                      disabled
                    />
                  </GridItem>
                  <GridItem xs={12} md={1}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => removeItem(index)}
                      sx={{ mt: 1 }}
                    >
                      削除
                    </Button>
                  </GridItem>
                </Grid>
              ))}
              
              <Button variant="outlined" onClick={addItem} sx={{ mt: 2 }}>
                明細を追加
              </Button>
              
              <Grid container spacing={2} sx={{ mt: 4, mb: 2 }}>
                <GridItem xs={12} md={8}></GridItem>
                <GridItem xs={12} md={4}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    小計: {formatCurrency(calculateSubtotal())}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    消費税（10%）: {formatCurrency(calculateTax())}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    合計: {formatCurrency(calculateTotal())}
                  </Typography>
                </GridItem>
              </Grid>
              
              <Box sx={{ mt: 4, p: 3, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  お支払い方法
                </Typography>
                <Typography variant="body2">
                  銀行振込: 〇〇銀行 △△支店 普通 1234567 トパーズ（ゴウドウガイシャ）
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  支払期限: {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('ja-JP') : ''}まで
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ※振込手数料はお客様負担にてお願いいたします。
                </Typography>
              </Box>
            </GridItem>
          </Grid>
        </div>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" color="primary">
            保存
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceTemplate; 