document.addEventListener('DOMContentLoaded', () => {
    const createMembersBtn = document.getElementById('create-members-btn');
    const addRowBtn = document.getElementById('add-row-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');

    let members = [];

    createMembersBtn.addEventListener('click', () => {
        const numMembersInput = document.getElementById('num-members');
        const numMembers = parseInt(numMembersInput.value, 10);
        if (numMembers < 2) {
            alert('Số thành viên phải lớn hơn hoặc bằng 2.');
            return;
        }

        const currentExpenses = getExpensesFromTable();
        const oldNumMembers = members.length;

        // Giữ lại tên cũ khi thay đổi số lượng thành viên
        const newMembers = Array.from({ length: numMembers }, (_, i) => {
            return members[i] || `Thành viên ${i + 1}`;
        });
        members = newMembers;
        
        // Nếu giảm số lượng thành viên, cập nhật lại chi tiêu
        if (numMembers < oldNumMembers) {
            const removedMembers = members.slice(numMembers);
            currentExpenses.forEach(expense => {
                expense.usedBy = expense.usedBy.filter(user => !removedMembers.includes(user));
                if (removedMembers.includes(expense.paidBy)) {
                    expense.paidBy = members.length > 0 ? members[0] : '';
                }
            });
        }

        renderMemberNameInputs();
        renderExpenseTableHeaders();
        // Giữ lại các dòng đã có hoặc tạo 1 dòng mới nếu bảng trống
        renderExpenseTableRows(currentExpenses.length > 0 ? currentExpenses : [{}]); 
    });

    addRowBtn.addEventListener('click', () => {
        addExpenseRow();
    });

    calculateBtn.addEventListener('click', () => {
        const expenses = getExpensesFromTable();
        const { summary, transactions } = calculate(expenses, members);
        renderSummaryTable(summary);
        renderTransactions(transactions);
    });

    exportBtn.addEventListener('click', () => {
        const data = {
            members: members,
            expenses: getExpensesFromTable()
        };
        exportJSON(data, 'chi-tieu-nhom.json');
    });

    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            importJSON(file, (data) => {
                members = data.members;
                document.getElementById('num-members').value = members.length;
                renderMemberNameInputs(members);
                renderExpenseTableHeaders();
                renderExpenseTableRows(data.expenses);
            });
        }
    });

    function renderMemberNameInputs() {
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
            
            const oldName = name; // Ghi lại tên cũ để so sánh

            input.addEventListener('change', (e) => {
                const newName = e.target.value.trim();

                if (!newName) {
                    alert('Tên thành viên không được để trống.');
                    e.target.value = oldName;
                    return;
                }
                if (members.some((m, i) => m === newName && i !== index)) {
                    alert('Tên thành viên đã tồn tại.');
                    e.target.value = oldName;
                    return;
                }

                const currentExpenses = getExpensesFromTable();
                
                // Cập nhật tên mới vào mảng members
                members[index] = newName;

                // Cập nhật tên trong dữ liệu chi tiêu đã có
                currentExpenses.forEach(expense => {
                    if (expense.paidBy === oldName) {
                        expense.paidBy = newName;
                    }
                    const usedByMemberIndex = expense.usedBy.indexOf(oldName);
                    if (usedByMemberIndex !== -1) {
                        expense.usedBy[usedByMemberIndex] = newName;
                    }
                });

                // Vẽ lại toàn bộ bảng và header
                renderExpenseTableHeaders();
                renderExpenseTableRows(currentExpenses);

                // Tính toán lại nếu kết quả đã hiển thị
                if (document.querySelector('#summary-table tbody').innerHTML !== '') {
                    calculateBtn.click();
                }
            });

            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        });
    }

    function renderExpenseTableHeaders() {
        const headerRow = document.querySelector('#expense-table thead tr');
        // Xóa các header cũ trừ 3 cột đầu
        while (headerRow.children.length > 3) {
            headerRow.removeChild(headerRow.lastChild);
        }
        members.forEach(member => {
            const th = document.createElement('th');
            th.textContent = member;
            headerRow.appendChild(th);
        });
    }
    
    function addExpenseRow(expenseData = {}) {
        // FIX: Hợp nhất dữ liệu đầu vào với giá trị mặc định để tránh lỗi
        const expense = {
            description: '',
            amount: '',
            paidBy: members.length > 0 ? members[0] : '',
            usedBy: [],
            ...expenseData
        };

        const tbody = document.querySelector('#expense-table tbody');
        const row = tbody.insertRow();

        // Cột nội dung
        const descCell = row.insertCell();
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'description';
        descInput.value = expense.description;
        descCell.appendChild(descInput);

        // Cột số tiền
        const amountCell = row.insertCell();
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'amount';
        amountInput.value = expense.amount;
        amountCell.appendChild(amountInput);

        // Cột người trả
        const paidByCell = row.insertCell();
        const paidBySelect = document.createElement('select');
        paidBySelect.className = 'paidBy';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            if (member === expense.paidBy) {
                option.selected = true;
            }
            paidBySelect.appendChild(option);
        });
        paidByCell.appendChild(paidBySelect);

        // Các cột người dùng
        members.forEach(member => {
            const cell = row.insertCell();
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'usedBy';
            checkbox.checked = expense.usedBy.includes(member); // Lỗi xảy ra ở đây nếu usedBy không phải mảng
            cell.appendChild(checkbox);
        });
    }
    
    function renderExpenseTableRows(expenses = [{}]) {
        const tbody = document.querySelector('#expense-table tbody');
        tbody.innerHTML = '';
        expenses.forEach(expense => addExpenseRow(expense));
    }

    function getExpensesFromTable() {
        const rows = document.querySelectorAll('#expense-table tbody tr');
        const expenses = [];
        rows.forEach(row => {
            const description = row.querySelector('.description').value;
            const amount = parseFloat(row.querySelector('.amount').value);
            const paidBy = row.querySelector('.paidBy').value;
            const usedByCheckboxes = row.querySelectorAll('.usedBy');
            const usedBy = [];
            usedByCheckboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    // Đảm bảo members[index] tồn tại
                    if (members[index]) {
                        usedBy.push(members[index]);
                    }
                }
            });
            if(description && amount > 0) {
                 expenses.push({ description, amount, paidBy, usedBy });
            }
        });
        return expenses;
    }

    function renderSummaryTable(summary) {
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

    function renderTransactions(transactions) {
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

    // Khởi tạo ban đầu
    if (members.length === 0) {
        createMembersBtn.click();
    }
});
