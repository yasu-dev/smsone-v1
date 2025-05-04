import React, { useEffect, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Invoice, InvoiceStatus } from '../../types/invoice';
import { Clock, FileText, CheckCircle, AlertCircle, XCircle, Check } from 'lucide-react';

interface InvoiceKanbanViewProps {
  invoices: Invoice[];
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus, skipConfirmation: boolean) => Promise<void>;
  onViewInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoiceId: string) => void;
  getStatusLabel: (status: InvoiceStatus) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

interface StatusColumn {
  id: InvoiceStatus;
  title: string;
  items: Invoice[];
  icon: React.ReactNode;
  color: string;
}

const InvoiceKanbanView: React.FC<InvoiceKanbanViewProps> = ({
  invoices,
  onUpdateStatus,
  onViewInvoice,
  onDownloadInvoice,
  getStatusLabel,
  formatCurrency,
  formatDate
}) => {
  const [columns, setColumns] = useState<Record<string, StatusColumn>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // 有効なステータス遷移を定義（どのステータスからどのステータスに変更可能か）
  const validStatusTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    [InvoiceStatus.UNPAID]: [InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELED],
    [InvoiceStatus.ISSUED]: [InvoiceStatus.UNPAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELED],
    [InvoiceStatus.OVERDUE]: [InvoiceStatus.UNPAID, InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.CANCELED],
    [InvoiceStatus.PAID]: [InvoiceStatus.UNPAID, InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELED], // デモ用に全ての移動を許可
    [InvoiceStatus.CANCELED]: [InvoiceStatus.UNPAID, InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.OVERDUE], // デモ用に全ての移動を許可
  };

  // 請求書をステータスごとにグループ化してカラムに割り当てる
  useEffect(() => {
    const groupedColumns: Record<string, StatusColumn> = {
      [InvoiceStatus.UNPAID]: {
        id: InvoiceStatus.UNPAID,
        title: '未請求',
        items: [],
        icon: <Clock className="h-4 w-4 text-grey-600" />,
        color: 'bg-grey-100'
      },
      [InvoiceStatus.ISSUED]: {
        id: InvoiceStatus.ISSUED,
        title: '請求済み',
        items: [],
        icon: <FileText className="h-4 w-4 text-primary-600" />,
        color: 'bg-primary-100'
      },
      [InvoiceStatus.PAID]: {
        id: InvoiceStatus.PAID,
        title: '支払済み',
        items: [],
        icon: <CheckCircle className="h-4 w-4 text-success-600" />,
        color: 'bg-success-100'
      },
      [InvoiceStatus.OVERDUE]: {
        id: InvoiceStatus.OVERDUE,
        title: '期限超過',
        items: [],
        icon: <AlertCircle className="h-4 w-4 text-error-600" />,
        color: 'bg-error-100'
      },
      [InvoiceStatus.CANCELED]: {
        id: InvoiceStatus.CANCELED,
        title: 'キャンセル済み',
        items: [],
        icon: <XCircle className="h-4 w-4 text-grey-500" />,
        color: 'bg-grey-100'
      }
    };

    // 請求書をそれぞれのカラムに割り当てる
    invoices.forEach(invoice => {
      if (groupedColumns[invoice.status]) {
        groupedColumns[invoice.status].items.push(invoice);
      }
    });

    setColumns(groupedColumns);
  }, [invoices]);

  // 上部と下部のスクロールバーを同期させる
  const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft } = e.currentTarget;
    if (e.currentTarget === scrollContainerRef.current && topScrollContainerRef.current) {
      topScrollContainerRef.current.scrollLeft = scrollLeft;
    } else if (e.currentTarget === topScrollContainerRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft;
    }
  };

  // マウス右ボタンによるスクロール制御
  const handleMouseDown = (e: React.MouseEvent) => {
    // 右クリックの場合のみ処理する (button === 2)
    if (e.button === 2 && scrollContainerRef.current) {
      e.preventDefault();
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    if (scrollContainerRef.current) {
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const scroll = scrollLeft - (x - startX);
      scrollContainerRef.current.scrollLeft = scroll;
      
      // 上部スクロールバーも同期させる
      if (topScrollContainerRef.current) {
        topScrollContainerRef.current.scrollLeft = scroll;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // コンテキストメニューを無効化
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // ドラッグ＆ドロップ完了時の処理
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // ドロップ先がない場合は何もしない
    if (!destination) return;

    // 同じカラム内での移動の場合は何もしない
    if (source.droppableId === destination.droppableId) return;

    // ドラッグされた請求書を取得
    const sourceColumn = columns[source.droppableId];
    const draggedInvoice = sourceColumn.items.find(item => item.id === draggableId);
    
    if (!draggedInvoice) return;

    // 新しいステータスに更新
    const newStatus = destination.droppableId as InvoiceStatus;
    const currentStatus = source.droppableId as InvoiceStatus;
    
    // ステータス遷移が有効か確認
    const allowedTransitions = validStatusTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      // 無効なステータス遷移
      alert(`「${getStatusLabel(currentStatus)}」から「${getStatusLabel(newStatus)}」への変更はできません`);
      return;
    }
    
    // 確認ダイアログを表示
    const confirmMessage = `請求書のステータスを「${getStatusLabel(sourceColumn.id as InvoiceStatus)}」から「${getStatusLabel(newStatus)}」に変更してもよろしいですか？`;
    
    if (window.confirm(confirmMessage)) {
      // ステータス更新のAPI呼び出し（確認後）
      onUpdateStatus(draggedInvoice.id, newStatus, true);
    }
  };

  // カードがドラッグ可能かどうかを判定する関数
  const isDragDisabledForStatus = (status: InvoiceStatus): boolean => {
    // 支払済みとキャンセル済みからは他のステータスに変更できないため、ドラッグ不可
    return validStatusTransitions[status].length === 0;
  };

  return (
    <div className="relative overflow-hidden">
      <div className="mb-2 px-4 text-sm text-grey-500">
        ※ カードをドラッグ＆ドロップすることでステータスを変更できます
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* 上部スクロールバー */}
        <div 
          ref={topScrollContainerRef}
          className="flex space-x-4 overflow-x-auto mb-2 pb-1" 
          onScroll={syncScroll}
        >
          {Object.values(columns).map(column => (
            <div key={column.id} className="flex-shrink-0 w-72">
              <div className={`rounded-t-md ${column.color} px-3 py-2 flex items-center justify-between`}>
                <div className="flex items-center">
                  {column.icon}
                  <h3 className="font-medium text-sm ml-2">{column.title}</h3>
                </div>
                <span className="bg-white text-grey-700 text-xs px-2 py-1 rounded-full">
                  {column.items.length}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* カンバンコンテンツ - メインのスクロール部分 */}
        <div 
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4" 
          style={{ 
            minHeight: '500px',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          onScroll={syncScroll}
        >
          {Object.values(columns).map(column => (
            <div key={column.id} className="flex-shrink-0 w-72">
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-grey-50 rounded-b-md p-2 min-h-[calc(100vh-300px)]"
                  >
                    {column.items.map((invoice, index) => (
                      <Draggable 
                        key={invoice.id} 
                        draggableId={invoice.id} 
                        index={index}
                        isDragDisabled={isDragDisabledForStatus(column.id as InvoiceStatus)}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-md shadow p-3 mb-2 ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                            onClick={() => onViewInvoice(invoice)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{invoice.customerName}</h4>
                            </div>
                            <p className="text-xs text-grey-500 mb-2">{invoice.invoiceNumber}</p>
                            <div className="flex justify-between text-xs text-grey-700 mb-1">
                              <span>金額:</span>
                              <span className="font-medium">{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-grey-700 mb-1">
                              <span>発行日:</span>
                              <span>{formatDate(invoice.issueDate)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-grey-700 mb-3">
                              <span>期限:</span>
                              <span>{formatDate(invoice.dueDate)}</span>
                            </div>
                            
                            {/* ステータス毎の操作ボタン */}
                            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-grey-100">
                              {column.id === InvoiceStatus.UNPAID && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 確認ダイアログを1回だけ表示する
                                    if (window.confirm('この請求書を「請求済み」に変更してもよろしいですか？')) {
                                      onUpdateStatus(invoice.id, InvoiceStatus.ISSUED, true);
                                    }
                                  }}
                                  className="btn-xs btn-primary flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  請求する
                                </button>
                              )}
                              {column.id === InvoiceStatus.ISSUED && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 確認ダイアログを1回だけ表示する
                                    if (window.confirm('この請求書を「支払済み」に変更してもよろしいですか？')) {
                                      onUpdateStatus(invoice.id, InvoiceStatus.PAID, true);
                                    }
                                  }}
                                  className="btn-xs btn-success flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  支払済
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {column.items.length === 0 && (
                      <div className="text-center py-4 text-grey-400 text-sm">
                        請求書がありません
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default InvoiceKanbanView; 