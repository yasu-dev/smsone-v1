import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { InvoiceDetails } from './UserBillingDetails';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingBottom: 15
  },
  clientInfo: {
    width: '45%'
  },
  clientName: {
    fontSize: 12,
    marginBottom: 5
  },
  clientAddress: {
    fontSize: 9,
    lineHeight: 1.4
  },
  companyInfo: {
    width: '45%',
    alignItems: 'flex-end'
  },
  companyName: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'right'
  },
  invoiceData: {
    marginBottom: 5,
    fontSize: 10,
    textAlign: 'right'
  },
  sealArea: {
    width: 40,
    height: 40,
    border: '1px solid #e2e8f0',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end'
  },
  amountBox: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 4,
    padding: 10,
    marginVertical: 15,
    backgroundColor: '#f0f9ff'
  },
  amountLabel: {
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'right',
    marginBottom: 3
  },
  amountValue: {
    fontSize: 18,
    color: '#1e40af',
    textAlign: 'right'
  },
  amountTax: {
    fontSize: 10,
    color: '#4b5563',
    marginLeft: 4
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center'
  },
  periodLabel: {
    width: 80
  },
  periodValue: {
    flex: 1
  },
  table: {
    width: '100%',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    minHeight: 30
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    textAlign: 'center',
    color: '#334155',
    fontSize: 9
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9
  },
  tableCellRight: {
    flex: 1,
    padding: 6,
    textAlign: 'right',
    fontSize: 9
  },
  tableSubtotalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  tableTotalRow: {
    flexDirection: 'row',
    minHeight: 28,
    alignItems: 'center',
    backgroundColor: '#edf2f7'
  },
  tableTotalCell: {
    flex: 3,
    padding: 6,
    textAlign: 'right',
    fontSize: 10
  },
  tableTotalValue: {
    flex: 1,
    padding: 6,
    textAlign: 'right',
    fontSize: 10
  },
  bankInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
    borderLeftStyle: 'solid'
  },
  bankInfoTitle: {
    fontSize: 11,
    marginBottom: 6,
    color: '#334155'
  },
  bankInfoRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  bankInfoLabel: {
    width: 70,
    fontSize: 9,
    color: '#475569'
  },
  bankInfoValue: {
    fontSize: 9
  },
  notes: {
    marginTop: 20
  },
  notesTitle: {
    fontSize: 11,
    marginBottom: 5,
    color: '#334155'
  },
  notesText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    paddingTop: 10
  }
});

interface InvoicePDFProps {
  invoiceDetails: InvoiceDetails;
  total: number;
  subtotal: number;
  tax: number;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceDetails, total, subtotal, tax }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{invoiceDetails.title}</Text>

        <View style={styles.header}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{invoiceDetails.clientInfo.name} 御中</Text>
            <Text style={styles.clientAddress}>{invoiceDetails.clientInfo.address}</Text>
            <Text style={styles.clientAddress}>TEL: {invoiceDetails.clientInfo.tel}</Text>
            <Text style={styles.clientAddress}>Email: {invoiceDetails.clientInfo.email}</Text>
          </View>

          <View style={styles.companyInfo}>
            <Text style={styles.invoiceData}>請求書番号：{invoiceDetails.invoiceNumber}</Text>
            <Text style={styles.invoiceData}>発行日：{invoiceDetails.billingDate}</Text>
            <Text style={styles.companyName}>{invoiceDetails.companyInfo.name}</Text>
            <Text style={styles.clientAddress}>{invoiceDetails.companyInfo.address}</Text>
            <Text style={styles.clientAddress}>TEL: {invoiceDetails.companyInfo.tel}</Text>
            <Text style={styles.clientAddress}>Email: {invoiceDetails.companyInfo.email}</Text>
            <View style={styles.sealArea}>
              <Text>印</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>ご請求金額</Text>
          <Text style={styles.amountValue}>
            ¥{total.toLocaleString()}
            <Text style={styles.amountTax}>（税込）</Text>
          </Text>
        </View>

        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>対象期間：</Text>
          <Text style={styles.periodValue}>{invoiceDetails.billingPeriod.startDate} ～ {invoiceDetails.billingPeriod.endDate}</Text>
        </View>
        
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>お支払期限：</Text>
          <Text style={styles.periodValue}>{invoiceDetails.dueDate}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableHeaderCell}>項目</Text>
            <Text style={styles.tableHeaderCell}>数量</Text>
            <Text style={styles.tableHeaderCell}>単価</Text>
            <Text style={styles.tableHeaderCell}>金額</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>月額基本料金</Text>
            <Text style={styles.tableCellRight}>1</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.monthlyFee.toLocaleString()}円</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.monthlyFee.toLocaleString()}円</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>国内SMS送信料金</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.domesticUsage.toLocaleString()}</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.domesticPrice?.toLocaleString() || 0}円</Text>
            <Text style={styles.tableCellRight}>
              {(invoiceDetails.domesticUsage * (invoiceDetails.domesticPrice || 0)).toLocaleString()}円
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>海外SMS送信料金</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.internationalUsage.toLocaleString()}</Text>
            <Text style={styles.tableCellRight}>{invoiceDetails.internationalPrice?.toLocaleString() || 0}円</Text>
            <Text style={styles.tableCellRight}>
              {(invoiceDetails.internationalUsage * (invoiceDetails.internationalPrice || 0)).toLocaleString()}円
            </Text>
          </View>

          {invoiceDetails.customItems.map((item, index) => (
            <View key={`item-${index}`} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={styles.tableCellRight}>{item.quantity.toLocaleString()}</Text>
              <Text style={styles.tableCellRight}>{item.unitPrice.toLocaleString()}円</Text>
              <Text style={styles.tableCellRight}>{(item.quantity * item.unitPrice).toLocaleString()}円</Text>
            </View>
          ))}

          <View style={styles.tableSubtotalRow}>
            <Text style={styles.tableTotalCell}>小計</Text>
            <Text style={styles.tableTotalValue}>{subtotal.toLocaleString()}円</Text>
          </View>

          <View style={styles.tableSubtotalRow}>
            <Text style={styles.tableTotalCell}>消費税（10%）</Text>
            <Text style={styles.tableTotalValue}>{tax.toLocaleString()}円</Text>
          </View>

          <View style={styles.tableTotalRow}>
            <Text style={styles.tableTotalCell}>合計</Text>
            <Text style={styles.tableTotalValue}>{total.toLocaleString()}円</Text>
          </View>
        </View>

        <View style={styles.bankInfo}>
          <Text style={styles.bankInfoTitle}>お振込先</Text>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankInfoLabel}>銀行名：</Text>
            <Text style={styles.bankInfoValue}>{invoiceDetails.bankInfo.bankName}</Text>
          </View>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankInfoLabel}>支店名：</Text>
            <Text style={styles.bankInfoValue}>{invoiceDetails.bankInfo.branchName}</Text>
          </View>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankInfoLabel}>口座種別：</Text>
            <Text style={styles.bankInfoValue}>{invoiceDetails.bankInfo.accountType}</Text>
          </View>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankInfoLabel}>口座番号：</Text>
            <Text style={styles.bankInfoValue}>{invoiceDetails.bankInfo.accountNumber}</Text>
          </View>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankInfoLabel}>口座名義：</Text>
            <Text style={styles.bankInfoValue}>{invoiceDetails.bankInfo.accountName}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={styles.notesTitle}>備考</Text>
          <Text style={styles.notesText}>{invoiceDetails.notes}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>本請求書はTopaz合同会社のSMSOneプラットフォームで生成されました。</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF; 