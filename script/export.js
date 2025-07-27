function exportJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data && data.members && data.expenses) {
                callback(data);
            } else {
                alert('File JSON không hợp lệ.');
            }
        } catch (error) {
            alert('Lỗi khi đọc file JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}
