'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileText, Sheet, Download, Loader2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/lib/i18n';
import { getCustomers, getAllTransactions } from '@/lib/firestore-service';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  productName: string | null;
  date: string;
  description: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
}

interface CustomerSummary {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  totalCredit: number;
  totalPaid: number;
  netDue: number;
  transactionCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ExportData() {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const lang = language || 'bn';

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fetchAllData = async (): Promise<{ customers: CustomerSummary[]; transactions: Transaction[] }> => {
    if (!user) throw new Error('Not authenticated');

    // Fetch all customers with aggregates
    const customers: CustomerSummary[] = await getCustomers(user.id);

    // Fetch all transactions with customer info
    const transactions: Transaction[] = await getAllTransactions(user.id);

    return { customers, transactions };
  };

  const formatBDT = (amount: number) => `${amount.toLocaleString()} BDT`;

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const { customers, transactions } = await fetchAllData();

      const { default: jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');

      const doc = new jsPDF();
      const autoTable = autoTableModule.default || (autoTableModule as unknown as (doc: unknown, options: unknown) => void);

      // ===== TITLE =====
      doc.setFontSize(18);
      doc.text('Baki Khata - Full Report', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Generated: ${dateStr}`, 14, 30);
      doc.text(`Total Customers: ${customers.length}  |  Total Transactions: ${transactions.length}`, 14, 36);

      // ===== SHEET 1: Customer Summary =====
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text('Customer Summary (Grahak Talika)', 14, 48);

      const totalAllCredit = customers.reduce((s, c) => s + c.totalCredit, 0);
      const totalAllPaid = customers.reduce((s, c) => s + c.totalPaid, 0);
      const totalAllDue = customers.reduce((s, c) => s + c.netDue, 0);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Total Baki: ${formatBDT(totalAllCredit)}  |  Total Ferot: ${formatBDT(totalAllPaid)}  |  Total Powana: ${formatBDT(totalAllDue)}`, 14, 55);

      const customerTableData = customers.map((c) => [
        c.name,
        c.code,
        c.phone || '-',
        formatBDT(c.totalCredit),
        formatBDT(c.totalPaid),
        formatBDT(c.netDue),
        String(c.transactionCount),
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['Name', 'Code', 'Phone', 'Total Baki', 'Total Ferot', 'Current Due', 'Txn Count']],
        body: customerTableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [249, 115, 22],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'center' },
        },
        // Highlight customers with due > 0
        didParseCell: (data: { section: string; row: { index: number }; column: { index: number }; cell: { styles: { fillColor: number[]; textColor: number[] } } }) => {
          if (data.section === 'body' && data.column.index === 5) {
            const due = customers[data.row.index]?.netDue || 0;
            if (due > 0) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (due <= 0) {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
      });

      // ===== SHEET 2: All Transactions =====
      const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY || 160;

      // Check if we need a new page
      if (finalY > 200) {
        doc.addPage();
      }

      const txStartY = finalY > 200 ? 20 : finalY + 15;

      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text('All Transactions (Sob Lenden)', 14, txStartY);

      const credits = transactions.filter((t) => t.type === 'CREDIT');
      const payments = transactions.filter((t) => t.type === 'PAYMENT');
      const totalCreditAmt = credits.reduce((s, t) => s + t.amount, 0);
      const totalPaymentAmt = payments.reduce((s, t) => s + t.amount, 0);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Total Credit: ${formatBDT(totalCreditAmt)}  |  Total Payment: ${formatBDT(totalPaymentAmt)}  |  Net: ${formatBDT(totalCreditAmt - totalPaymentAmt)}`, 14, txStartY + 7);

      const txTableData = transactions.map((tx) => [
        tx.date,
        tx.customer.name,
        tx.customer.code,
        tx.type === 'CREDIT' ? 'Baki (Credit)' : 'Ferot (Payment)',
        formatBDT(tx.amount),
        tx.productName || '-',
        tx.description || '-',
      ]);

      autoTable(doc, {
        startY: txStartY + 12,
        head: [['Date', 'Customer', 'Code', 'Type', 'Amount', 'Product', 'Description']],
        body: txTableData,
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          4: { halign: 'right' },
        },
        didParseCell: (data: { section: string; row: { index: number }; column: { index: number }; cell: { styles: { textColor: number[]; fontStyle: string } } }) => {
          if (data.section === 'body' && data.column.index === 4) {
            const type = transactions[data.row.index]?.type;
            if (type === 'CREDIT') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save('baki-khata-full-report.pdf');
      toast.success(t(lang, 'exportSuccess'));
    } catch {
      toast.error(t(lang, 'error'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const { customers, transactions } = await fetchAllData();

      const XLSX = await import('xlsx');

      // ===== Sheet 1: Customer Summary =====
      const totalAllCredit = customers.reduce((s, c) => s + c.totalCredit, 0);
      const totalAllPaid = customers.reduce((s, c) => s + c.totalPaid, 0);
      const totalAllDue = customers.reduce((s, c) => s + c.netDue, 0);

      const summaryData = customers.map((c) => ({
        'নাম (Name)': c.name,
        'কোড (Code)': c.code,
        'ফোন (Phone)': c.phone || '',
        'মোট বাকি (Total Credit)': c.totalCredit,
        'বাকি ফেরত (Total Paid)': c.totalPaid,
        'বর্তমান পাওনা (Current Due)': c.netDue,
        'মোট লেনদেন (Transactions)': c.transactionCount,
      }));

      // Add totals row
      summaryData.push({
        'নাম (Name)': '=== TOTAL ===',
        'কোড (Code)': '',
        'ফোন (Phone)': '',
        'মোট বাকি (Total Credit)': totalAllCredit,
        'বাকি ফেরত (Total Paid)': totalAllPaid,
        'বর্তমান পাওনা (Current Due)': totalAllDue,
        'মোট লেনদেন (Transactions)': transactions.length,
      });

      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      ws1['!cols'] = [
        { wch: 25 },
        { wch: 14 },
        { wch: 16 },
        { wch: 20 },
        { wch: 20 },
        { wch: 24 },
        { wch: 18 },
      ];

      // ===== Sheet 2: All Transactions =====
      const txData = transactions.map((tx) => ({
        'তারিখ (Date)': tx.date,
        'গ্রাহক (Customer)': tx.customer.name,
        'কোড (Code)': tx.customer.code,
        'ধরন (Type)': tx.type === 'CREDIT' ? 'বাকি (Credit)' : 'বাকি ফেরত (Payment)',
        'পরিমাণ (Amount)': tx.amount,
        'পণ্য (Product)': tx.productName || '',
        'বিবরণ (Description)': tx.description || '',
      }));

      const ws2 = XLSX.utils.json_to_sheet(txData);
      ws2['!cols'] = [
        { wch: 14 },
        { wch: 25 },
        { wch: 14 },
        { wch: 22 },
        { wch: 14 },
        { wch: 20 },
        { wch: 30 },
      ];

      // ===== Sheet 3: Due Summary (only customers with due > 0) =====
      const dueCustomers = customers.filter((c) => c.netDue > 0);
      const dueData = dueCustomers.map((c) => ({
        'নাম (Name)': c.name,
        'কোড (Code)': c.code,
        'ফোন (Phone)': c.phone || '',
        'বর্তমান পাওনা (Current Due)': c.netDue,
      }));

      const ws3 = XLSX.utils.json_to_sheet(dueData);
      ws3['!cols'] = [
        { wch: 25 },
        { wch: 14 },
        { wch: 16 },
        { wch: 24 },
      ];

      // Create workbook with all sheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'গ্রাহক সামারি');
      XLSX.utils.book_append_sheet(wb, ws2, 'সকল লেনদেন');
      XLSX.utils.book_append_sheet(wb, ws3, 'পাওনাদার তালিকা');

      XLSX.writeFile(wb, 'baki-khata-full-report.xlsx');

      toast.success(t(lang, 'exportSuccess'));
    } catch {
      toast.error(t(lang, 'error'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Page Title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, 'exportData')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'bn'
            ? 'আপনার সকল লেনদেন ও গ্রাহক তথ্য PDF বা Excel ফাইলে ডাউনলোড করুন'
            : 'Download all transactions and customer data in PDF or Excel format'}
        </p>
      </motion.div>

      {/* Export Info */}
      <motion.div variants={itemVariants}>
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <Database className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                {lang === 'bn' ? 'এক্সপোর্টে যা যা থাকবে:' : 'What will be included:'}
              </p>
              <ul className="text-amber-700 dark:text-amber-400 space-y-0.5 list-disc list-inside">
                <li>{lang === 'bn' ? 'গ্রাহক তালিকা - মোট বাকি, বাকি ফেরত, বর্তমান পাওনা' : 'Customer list - Total credit, payments, current due'}</li>
                <li>{lang === 'bn' ? 'সকল লেনদেন - বাকি ও বাকি ফেরত সহ' : 'All transactions - credits and payments'}</li>
                <li>{lang === 'bn' ? 'পাওনাদার তালিকা - যাদের কাছে বর্তমানে পাওনা আছে' : 'Defaulter list - customers with current dues'}</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* PDF Export Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-14 rounded-xl bg-red-100 dark:bg-red-950/50 shrink-0">
                  <FileText className="size-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">PDF {lang === 'bn' ? 'এক্সপোর্ট' : 'Export'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'bn'
                      ? 'গ্রাহক সামারি ও সকল লেনদেনের সুন্দর PDF রিপোর্ট। মোট বাকি, বাকি ফেরত, বর্তমান পাওনা সহ।'
                      : 'Beautiful PDF report with customer summary and all transactions including credits, payments, and current dues.'}
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t(lang, 'loading')}
                        </>
                      ) : (
                        <>
                          <Download className="size-4" />
                          {t(lang, 'exportPDF')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Excel Export Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-14 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 shrink-0">
                  <Sheet className="size-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">Excel {lang === 'bn' ? 'এক্সপোর্ট' : 'Export'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'bn'
                      ? '৩টি শীট সহ Excel ফাইল - গ্রাহক সামারি, সকল লেনদেন ও পাওনাদার তালিকা।'
                      : 'Excel file with 3 sheets - Customer summary, all transactions & defaulter list.'}
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={handleExportExcel}
                      disabled={isExportingExcel}
                      variant="outline"
                      className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    >
                      {isExportingExcel ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t(lang, 'loading')}
                        </>
                      ) : (
                        <>
                          <Download className="size-4" />
                          {t(lang, 'exportExcel')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Database className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    {lang === 'bn' ? 'ডাটা নিরাপত্তা' : 'Data Security'}
                  </p>
                  <p>
                    {lang === 'bn'
                      ? 'আপনার ডাটা সম্পূর্ণ নিরাপদ। এক্সপোর্ট করা ফাইল শুধুমাত্র আপনার ডিভাইসে সেভ হয়।'
                      : 'Your data is completely secure. Exported files are saved only to your device.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
