import { calculate } from './logic.js';
import { exportJSON, importJSON } from './export.js';
import { loadState, saveState } from './data.js';
import * as UI from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const appState = loadState();

    // ----- DOM Elements -----
    const createMembersBtn = document.getElementById('create-members-btn');
    const numMembersInput = document.getElementById('num-members');
    const addRowBtn = document.getElementById('add-row-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');
    const expenseTableBody = document.querySelector('#expense-table tbody');

    // ----- Event Handlers -----
    createMembersBtn.addEventListener('click', handleMemberCountChange);
    addRowBtn.addEventListener('click', handleAddRow);
    calculateBtn.addEventListener('click', handleCalculate);
    exportBtn.addEventListener('click', handleExport);
    importInput.addEventListener('change', handleImport);
    expenseTableBody.addEventListener('click', handleDeleteRow);

    // ----- Handler Functions -----
    function handleMemberCountChange() {
        const newSize = parseInt(numMembersInput.value, 10);
        if (newSize < 1) {
            alert("Số thành viên phải lớn hơn 0.");
            return;
        }
        const oldSize = appState.members.length;
        if (newSize === oldSize) return;

        const newMembers = Array.from({ length: newSize }, (_, i) => appState.members[i] || `Thành viên ${i + 1}`);
        appState.members = newMembers;

        if (newSize < oldSize) {
            const removed = appState.members.slice(newSize);
            appState.expenses.forEach(exp => {
                exp.usedBy = exp.usedBy.filter(u => !removed.includes(u));
                if (removed.includes(exp.paidBy)) {
                    exp.paidBy = appState.members[0] || '';
                }
            });
        }
        updateAndRender();
    }

    function handleNameChange(index, newName) {
        const oldName = appState.members[index];
        if (!newName.trim() || appState.members.some((m, i) => m === newName && i !== index)) {
            alert("Tên thành viên không hợp lệ hoặc đã tồn tại.");
            renderUI(); // Re-render to reset invalid input
            return;
        }
        appState.members[index] = newName.trim();
        appState.expenses.forEach(exp => {
            if (exp.paidBy === oldName) exp.paidBy = newName;
            const idx = exp.usedBy.indexOf(oldName);
            if (idx > -1) exp.usedBy[idx] = newName;
        });
        updateAndRender();
    }
    
    function handleTableRowChange() {
        appState.expenses = UI.getExpensesFromTable(appState.members);
        saveState(appState);
    }
    
    function handleAddRow() {
        UI.addBlankExpenseRow(appState.members, handleTableRowChange);
    }

    function handleCalculate() {
        if (!UI.validateAllExpenseRows()) return;
        
        const validExpenses = UI.getExpensesFromTable(appState.members).filter(e => e.description && e.amount > 0);
        if (validExpenses.length === 0) {
            alert("Vui lòng nhập ít nhất một chi tiêu hợp lệ.");
            return;
        }
        
        const { summary, transactions } = calculate(validExpenses, appState.members);
        UI.renderSummaryTable(summary);
        UI.renderTransactions(transactions);
    }

    function handleExport() {
        exportJSON(appState, 'chi-tieu-nhom.json');
    }

    function handleImport(event) {
        const file = event.target.files[0];
        if (file) {
            importJSON(file, data => {
                Object.assign(appState, data);
                numMembersInput.value = appState.members.length;
                updateAndRender();
            });
        }
    }

    function handleDeleteRow(event) {
        if (event.target.classList.contains('delete-btn')) {
            const row = event.target.closest('tr');
            const rowIndex = Array.from(expenseTableBody.children).indexOf(row);
            
            // Xóa khỏi trạng thái
            appState.expenses.splice(rowIndex, 1);
            
            // Cập nhật và vẽ lại
            updateAndRender();
        }
    }

    // ----- Render & Update -----
    function updateAndRender() {
        saveState(appState);
        renderUI();
    }

    function renderUI() {
        UI.renderMemberNameInputs(appState.members, handleNameChange);
        UI.renderExpenseTableHeaders(appState.members);
        UI.renderExpenseTableRows(appState.expenses, appState.members, handleTableRowChange);
    }

    // ----- Initial Load -----
    numMembersInput.value = appState.members.length;
    renderUI();
});
