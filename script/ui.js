export function renderMemberNameInputs(members, onNameChange) {
    const container = document.getElementById('members-names');
    container.innerHTML = '';
    members.forEach((name, index) => {
        const div = document.createElement('div');
        div.className = 'member-name-input';
        const label = document.createElement('label');
        label.textContent = `Tên thành viên ${index + 1}:`;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = name;
        input.addEventListener('change', (e) => onNameChange(index, e.target.value));
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
}

export function renderExpenseTableHeaders(members) {
    const groupHeader = document.getElementById('users-header-group');
    const memberHeaderRow = document.getElementById('member-header-row');

    // Xóa các tên thành viên cũ
    memberHeaderRow.innerHTML = '';

    // Cập nhật colspan cho header nhóm
    groupHeader.setAttribute('colspan', members.length > 0 ? members.length : 1);

    // Thêm các tên thành viên mới
    members.forEach(member => {
        const th = document.createElement('th');
        th.textContent = member;
        memberHeaderRow.appendChild(th);
    });
}

export function renderExpenseTableRows(expenses, members, onRowChange) {
    const tbody = document.querySelector('#expense-table tbody');
    tbody.innerHTML = '';
    if (expenses.length === 0) {
        addExpenseRow({}, members, onRowChange); // Add a blank row if no expenses
    } else {
        expenses.forEach(expense => addExpenseRow(expense, members, onRowChange));
    }
}

function addExpenseRow(expenseData, members, onRowChange) {
    const expense = {
        description: '',
        amount: '',
        paidBy: members.length > 0 ? members[0] : '',
        usedBy: [],
        ...expenseData
    };

    const tbody = document.querySelector('#expense-table tbody');
    const row = tbody.insertRow();
    row.addEventListener('input', onRowChange);

    const descCell = row.insertCell();
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'description';
    descInput.value = expense.description;
    descCell.appendChild(descInput);

    const amountCell = row.insertCell();
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'amount';
    amountInput.value = expense.amount;
    amountCell.appendChild(amountInput);

    const paidByCell = row.insertCell();
    const paidBySelect = document.createElement('select');
    paidBySelect.className = 'paidBy';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        if (member === expense.paidBy) option.selected = true;
        paidBySelect.appendChild(option);
    });
    paidByCell.appendChild(paidBySelect);

    members.forEach(member => {
        const cell = row.insertCell();
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'usedBy';
        checkbox.checked = expense.usedBy.includes(member);
        cell.appendChild(checkbox);
    });

    // Thêm nút xóa
    const deleteCell = row.insertCell();
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Xóa';
    deleteBtn.className = 'delete-btn';
    deleteCell.appendChild(deleteBtn);
}

export function addBlankExpenseRow(members, onRowChange) {
    addExpenseRow({}, members, onRowChange);
}


export function renderSummaryTable(summary) {
    const tbody = document.querySelector('#summary-table tbody');
    tbody.innerHTML = '';
    for (const member in summary) {
        const row = tbody.insertRow();
        row.insertCell().textContent = member;
        row.insertCell().textContent = summary[member].paid.toFixed(2);
        row.insertCell().textContent = summary[member].used.toFixed(2);
        const balance = summary[member].used - summary[member].paid;
        row.insertCell().textContent = balance.toFixed(2);
    }
}

export function renderTransactions(transactions) {
    const container = document.getElementById('transactions');
    container.innerHTML = '';
    if (transactions.length === 0) {
        container.innerHTML = '<p>Không có giao dịch nào cần thực hiện.</p>';
        return;
    }
    transactions.forEach(t => {
        const p = document.createElement('p');
        p.textContent = `${t.from} chuyển cho ${t.to}: ${t.amount.toFixed(2)}`;
        container.appendChild(p);
    });
}

export function getExpensesFromTable(members) {
    const rows = document.querySelectorAll('#expense-table tbody tr');
    const expenses = [];
    rows.forEach(row => {
        const description = row.querySelector('.description').value.trim();
        const amount = parseFloat(row.querySelector('.amount').value);
        const paidBy = row.querySelector('.paidBy').value;
        const usedByCheckboxes = row.querySelectorAll('.usedBy');
        const usedBy = [];
        usedByCheckboxes.forEach((checkbox, index) => {
            if (checkbox.checked && members[index]) {
                usedBy.push(members[index]);
            }
        });

        if (description || amount > 0) {
            expenses.push({ description, amount: amount || 0, paidBy, usedBy });
        }
    });
    return expenses;
}

export function validateAllExpenseRows() {
    const rows = document.querySelectorAll('#expense-table tbody tr');
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const description = row.querySelector('.description').value.trim();
        const amountValue = row.querySelector('.amount').value.trim();
        const amount = parseFloat(amountValue);
        const usedByCheckboxes = row.querySelectorAll('.usedBy');
        let usedByCount = 0;
        usedByCheckboxes.forEach(checkbox => {
            if (checkbox.checked) usedByCount++;
        });

        if (!description && !amountValue) continue;

        if (!description) {
            alert(`Lỗi ở Dòng ${i + 1}: Vui lòng nhập nội dung chi tiêu.`);
            return false;
        }
        if (!amountValue || isNaN(amount) || amount <= 0) {
            alert(`Lỗi ở Dòng ${i + 1}: Vui lòng nhập số tiền hợp lệ (lớn hơn 0).`);
            return false;
        }
        if (usedByCount === 0) {
            alert(`Lỗi ở Dòng ${i + 1}: Cần có ít nhất một người dùng cho chi phí này.`);
            return false;
        }
    }
    return true;
}
