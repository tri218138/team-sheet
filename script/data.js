const APP_STORAGE_KEY = 'teamSheetData';

// Trạng thái mặc định của ứng dụng
const defaultState = {
    members: ['Thành viên 1', 'Thành viên 2', 'Thành viên 3'],
    expenses: [{ description: '', amount: '', paidBy: 'Thành viên 1', usedBy: [] }]
};

// Hàm tải trạng thái từ LocalStorage
export function loadState() {
    try {
        const serializedState = localStorage.getItem(APP_STORAGE_KEY);
        if (serializedState === null) {
            return defaultState; // Trả về trạng thái mặc định nếu không có gì trong storage
        }
        const storedState = JSON.parse(serializedState);
        // Đảm bảo dữ liệu tải lên có cấu trúc hợp lệ
        return {
            members: storedState.members || defaultState.members,
            expenses: storedState.expenses || defaultState.expenses
        };
    } catch (err) {
        console.error("Lỗi khi tải trạng thái từ LocalStorage:", err);
        return defaultState; // Trả về trạng thái mặc định nếu có lỗi
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
