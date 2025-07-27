import { t } from './i18n.js';

const APP_STORAGE_KEY = 'teamSheetData';

// Trạng thái mặc định của ứng dụng
const getDefaultState = () => ({
    members: [t('default_member_name', {number: 1}), t('default_member_name', {number: 2}), t('default_member_name', {number: 3})],
    expenses: [{ description: '', amount: '', paidBy: t('default_member_name', {number: 1}), usedBy: [] }]
});

// Hàm tải trạng thái từ LocalStorage
export function loadState() {
    try {
        const serializedState = localStorage.getItem(APP_STORAGE_KEY);
        if (serializedState === null) {
            return getDefaultState(); // Trả về trạng thái mặc định nếu không có gì trong storage
        }
        const storedState = JSON.parse(serializedState);
        // Đảm bảo dữ liệu tải lên có cấu trúc hợp lệ
        return {
            members: storedState.members || getDefaultState().members,
            expenses: storedState.expenses || getDefaultState().expenses
        };
    } catch (err) {
        console.error("Lỗi khi tải trạng thái từ LocalStorage:", err);
        return getDefaultState(); // Trả về trạng thái mặc định nếu có lỗi
    }
}

// Hàm lưu trạng thái vào LocalStorage
export function saveState(state) {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(APP_STORAGE_KEY, serializedState);
    } catch (err) {
        console.error("Lỗi khi lưu trạng thái vào LocalStorage:", err);
    }
}
