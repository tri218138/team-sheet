function calculate(expenses, members) {
    const summary = {};
    members.forEach(member => {
        summary[member] = { paid: 0, used: 0 };
    });

    expenses.forEach(expense => {
        if (!expense.amount || expense.usedBy.length === 0) return;

        summary[expense.paidBy].paid += expense.amount;
        
        const share = expense.amount / expense.usedBy.length;
        expense.usedBy.forEach(member => {
            summary[member].used += share;
        });
    });

    const balances = {};
    members.forEach(member => {
        balances[member] = summary[member].used - summary[member].paid;
    });

    const transactions = optimizeTransactions(balances);

    return { summary, transactions };
}

function optimizeTransactions(balances) {
    const debtors = [];
    const creditors = [];

    for (const person in balances) {
        if (balances[person] > 0) {
            debtors.push({ person, amount: balances[person] });
        } else if (balances[person] < 0) {
            creditors.push({ person, amount: -balances[person] });
        }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);

        if(amount > 0.01) { // Thêm một ngưỡng nhỏ để tránh các giao dịch không đáng kể
            transactions.push({ from: debtor.person, to: creditor.person, amount });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) {
            i++;
        }
        if (creditor.amount < 0.01) {
            j++;
        }
    }

    return transactions;
}
