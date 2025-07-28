import { calculate } from './logic.js';
import { exportJSON, importJSON } from './export.js';
import { loadState, saveState } from './data.js';
import * as UI from './ui.js';
import { initI18n, t } from './i18n.js';
import { downloadPDF, downloadExcel } from './download.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { setLanguage, getLanguage, translatePage } = await initI18n();
    let appState = loadState();

    // ----- DOM Elements -----
    const createMembersBtn = document.getElementById('create-members-btn');
    const numMembersInput = document.getElementById('num-members');
    const addRowBtn = document.getElementById('add-row-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');
    const expenseTableBody = document.querySelector('#expense-table tbody');
    const langSwitcher = document.getElementById('lang-switcher');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // ----- Event Handlers -----
    createMembersBtn.addEventListener('click', handleMemberCountChange);
    addRowBtn.addEventListener('click', handleAddRow);
    calculateBtn.addEventListener('click', handleCalculate);
    exportBtn.addEventListener('click', handleExport);
    importInput.addEventListener('change', handleImport);
    expenseTableBody.addEventListener('click', handleDeleteRow);
    langSwitcher.addEventListener('click', handleLangSwitch);
    downloadPdfBtn.addEventListener('click', () => downloadPDF(appState));
    downloadExcelBtn.addEventListener('click', () => downloadExcel(appState, t));
    clearAllBtn.addEventListener('click', handleClearAll);

    // ----- Handler Functions -----
    function handleMemberCountChange() {
        const newSize = parseInt(numMembersInput.value, 10);
        if (newSize < 1) {
            alert(t('alert_invalid_members'));
            return;
        }
        const oldSize = appState.members.length;
        if (newSize === oldSize) return;

        const newMembers = Array.from({ length: newSize }, (_, i) => appState.members[i] || t('default_member_name', { number: i + 1 }));
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
        if (!newName.trim()) {
            alert(t('alert_empty_name'));
            renderUI(); // Re-render to reset invalid input
            return;
        }
        if (appState.members.some((m, i) => m === newName && i !== index)) {
            alert(t('alert_duplicate_name'));
            renderUI();
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
            alert(t('alert_no_valid_expense'));
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
                if (!data.members || !data.expenses) {
                    alert(t('alert_invalid_json'));
                    return;
                }
                Object.assign(appState, data);
                numMembersInput.value = appState.members.length;
                updateAndRender();
            }, error => {
                alert(t('alert_json_read_error', { error: error.message }));
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

    function handleClearAll() {
        if (confirm(t('alert_clear_all_confirm'))) {
            localStorage.removeItem('teamSheetData'); // Xóa khỏi LocalStorage
            localStorage.removeItem('i18next_lng'); // Tùy chọn: reset ngôn ngữ
            location.reload();
        }
    }

    async function handleLangSwitch(event) {
        const newLang = event.target.dataset.lang;
        if (newLang && newLang !== getLanguage()) {
            setLanguage(newLang);
            location.reload(); // Reload to apply new language fully
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
        updateLangSwitcher();
    }

    function updateLangSwitcher() {
        const currentLang = getLanguage();
        langSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    // ----- Initial Load -----
    numMembersInput.value = appState.members.length;
    renderUI();
});
