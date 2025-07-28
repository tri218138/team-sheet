
export function downloadPDF(appState, t) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text(t('appTitle'), 14, 20);

    // Bảng chi tiêu
    doc.setFont("helvetica", "normal");
    const expenseHeaders = [
        t('descriptionHeader'),
        t('amountHeader'),
        t('paidByHeader'),
        t('usersHeader')
    ];
    const expenseBody = appState.expenses
        .filter(e => e.description && e.amount > 0)
        .map(e => [
            e.description,
            e.amount,
            e.paidBy,
            e.usedBy.join(', ')
        ]);

    doc.autoTable({
        head: [expenseHeaders],
        body: expenseBody,
        startY: 30,
        headStyles: { fillColor: [22, 160, 133] },
    });

    // Bảng tổng kết
    const finalY = doc.autoTable.previous.finalY;
    const summaryHeaders = [
        t('memberHeader'),
        t('paidHeader'),
        t('usedHeader'),
        t.balanceHeader
    ];
    const summaryBody = appState.members.map(member => {
        const paid = appState.expenses
            .filter(e => e.paidBy === member)
            .reduce((sum, e) => sum + e.amount, 0);
        const used = appState.expenses
            .filter(e => e.usedBy.includes(member))
            .reduce((sum, e) => sum + (e.amount / e.usedBy.length), 0);
        return [member, paid.toFixed(2), used.toFixed(2), (used - paid).toFixed(2)];
    });
    
    doc.autoTable({
        head: [summaryHeaders],
        body: summaryBody,
        startY: finalY + 10
    });
    
    doc.save('team-sheet.pdf');
}

export function downloadExcel(appState, t) {
    const wb = XLSX.utils.book_new();

    // Sheet chi tiêu
    const expenseData = appState.expenses
        .filter(e => e.description && e.amount > 0)
        .map(e => ({
            [t('descriptionHeader')]: e.description,
            [t('amountHeader')]: e.amount,
            [t('paidByHeader')]: e.paidBy,
            [t('usersHeader')]: e.usedBy.join(', ')
        }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, t('expenseTable'));

    // Sheet tổng kết
    const summaryData = appState.members.map(member => {
         const paid = appState.expenses
            .filter(e => e.paidBy === member)
            .reduce((sum, e) => sum + e.amount, 0);
        const used = appState.expenses
            .filter(e => e.usedBy.includes(member))
            .reduce((sum, e) => sum + (e.amount / e.usedBy.length), 0);
        return {
            [t('memberHeader')]: member,
            [t('paidHeader')]: paid.toFixed(2),
            [t('usedHeader')]: used.toFixed(2),
            [t('balanceHeader')]: (used - paid).toFixed(2)
        };
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, t('summaryTitle'));

    XLSX.writeFile(wb, 'team-sheet.xlsx');
}

