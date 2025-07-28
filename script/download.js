import { calculate } from './logic.js';
import * as UI from './ui.js';

// Tải file dịch tiếng Anh một cách độc lập
async function getEnglishTranslations() {
    try {
        const response = await fetch('locales/en.json');
        if (!response.ok) throw new Error('Failed to fetch English translations');
        return await response.json();
    } catch (error) {
        console.error(error);
        return {}; // Trả về object rỗng nếu lỗi
    }
}

// Tạo một hàm dịch cục bộ để sử dụng cho báo cáo
function createTranslator(translations) {
    return function t(key, replacements = {}) {
        let text = translations[key] || key;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    };
}

function getReportData(appState, t) {
    const validExpenses = UI.getExpensesFromTable(appState.members).filter(e => e.description && e.amount > 0);
    const { summary, transactions } = calculate(validExpenses, appState.members);

    const expenseData = validExpenses.map(e => ({
        [t('descriptionHeader')]: e.description,
        [t('amountHeader')]: e.amount.toFixed(2),
        [t('paidByHeader')]: e.paidBy,
        [t('usersHeader')]: e.usedBy.join(', ')
    }));

    const summaryData = Object.entries(summary).map(([member, data]) => ({
        [t('memberHeader')]: member,
        [t('paidHeader')]: data.paid.toFixed(2),
        [t('usedHeader')]: data.used.toFixed(2),
        [t('balanceHeader')]: (data.used - data.paid).toFixed(2)
    }));
    
    const transactionData = transactions.map(trans => ({
        "transaction": t('transactionFormat', {
            from: trans.from,
            to: trans.to,
            amount: trans.amount.toFixed(2)
        })
    }));

    return { expenseData, summaryData, transactionData };
}

export async function downloadPDF(appState) {
    const translations = await getEnglishTranslations();
    const t = createTranslator(translations); // FIX: Tạo hàm t từ đối tượng dịch
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { expenseData, summaryData, transactionData } = getReportData(appState, t);

    // Set font to one that supports Vietnamese
    doc.setFont("Arimo-Regular");

    // Title
    doc.setFontSize(20);
    doc.text(t('appTitle'), 14, 22);
    doc.setFontSize(12);

    // Expenses Table
    doc.text(t('expenseTable'), 14, 35);
    doc.autoTable({
        startY: 40,
        head: [Object.keys(expenseData[0] || {})],
        body: expenseData.map(Object.values),
        styles: { font: "Arimo-Regular" }
    });

    // Summary Table
    let finalY = doc.autoTable.previous.finalY;
    doc.text(t('summaryTitle'), 14, finalY + 15);
    doc.autoTable({
        startY: finalY + 20,
        head: [Object.keys(summaryData[0] || {})],
        body: summaryData.map(Object.values),
        styles: { font: "Arimo-Regular" }
    });

    // Transactions
    finalY = doc.autoTable.previous.finalY;
    doc.text(t('transactionSuggestionTitle'), 14, finalY + 15);
    doc.autoTable({
        startY: finalY + 20,
        head: [[t('transactionSuggestionTitle')]],
        body: transactionData.map(Object.values),
        styles: { font: "Arimo-Regular" }
    });

    doc.save('team-sheet-report.pdf');
}

export function downloadExcel(appState, t) {
    const { expenseData, summaryData, transactionData } = getReportData(appState, t);
    const wb = XLSX.utils.book_new();

    const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, t('expenseTable'));

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, t('summaryTitle'));
    
    const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, t('transactionSuggestionTitle'));

    XLSX.writeFile(wb, 'team-sheet-report.xlsx');
}

