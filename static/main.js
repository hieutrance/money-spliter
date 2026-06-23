document.addEventListener("DOMContentLoaded", () => {
    // Các DOM Elements
    const form = document.getElementById('expense-form');
    const payerSelect = document.getElementById('payer');
    const participantsList = document.getElementById('participants-list');
    const slider = document.getElementById('expenses-slider');
    const settlementBox = document.getElementById('settlement-results');

    // 1. Khởi tạo ứng dụng: Tải dữ liệu từ Backend
    async function init() {
        await loadUsers();
        await loadExpenses();
        await loadSettlements();
    }

    // 2. Tải danh sách người dùng vào Select Box và Checkboxes
    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            const users = await response.json();

            payerSelect.innerHTML = '<option value="">-- Chọn người trả --</option>';
            participantsList.innerHTML = '';

            users.forEach(user => {
                // Thêm vào dropdown người trả tiền
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                payerSelect.appendChild(option);

                // Thêm vào danh sách checkbox người tham gia
                const label = document.createElement('label');
                label.className = 'custom-checkbox';
                label.innerHTML = `
                    <input type="checkbox" value="${user.id}" checked>
                    <span class="checkmark"></span>
                    ${user.name}
                `;
                participantsList.appendChild(label);
            });
        } catch (error) {
            console.error("Lỗi khi tải người dùng:", error);
        }
    }

    // 3. Tải danh sách hóa đơn lên Slider ngang
    async function loadExpenses() {
        try {
            const response = await fetch('/api/expenses');
            const expenses = await response.json();

            slider.innerHTML = ''; // Xóa dữ liệu mẫu cũ

            if (expenses.length === 0) {
                slider.innerHTML = '<p style="padding: 20px;">Chưa có hóa đơn nào.</p>';
                return;
            }

            expenses.forEach(exp => {
                const card = document.createElement('div');
                card.className = 'expense-card';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${exp.description}</h3>
                        <button class="btn-delete" onclick="deleteExpense('${exp.id}')" title="Xóa hóa đơn này">❌</button>
                    </div>
                    <p class="amount">${exp.amount.toLocaleString('vi-VN')} đ</p>
                    <p class="payer">Người trả: <strong>${exp.payer_name || exp.payer_id}</strong></p>
                    <p class="participants-list">Tham gia: ${exp.participant_names}</p>
                `;
                slider.appendChild(card);
            });
        } catch (error) {
            console.error("Lỗi khi tải hóa đơn:", error);
        }
    }

    // Hàm xóa hóa đơn (gắn vào window để gọi được từ thẻ HTML tĩnh)
    window.deleteExpense = async function(expenseId) {
        if (!confirm("Bạn có chắc chắn muốn xóa khoản chi này không?")) return;
        
        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Tải lại danh sách hóa đơn và Tính toán lại nợ ngay lập tức
                await loadExpenses();
                await loadSettlements();
            }
        } catch (error) {
            console.error("Lỗi khi xóa hóa đơn:", error);
        }
    };

    // Hàm mở popup QR
    window.showQR = function(toName, amount, qrUrl) {
        if (!qrUrl || qrUrl === 'undefined' || qrUrl === '') {
            alert(`${toName} chưa cập nhật ảnh mã QR trên hệ thống!`);
            return;
        }

        document.getElementById('modal-transfer-info').innerHTML = `Số tiền: <strong style="color: var(--primary-pink); font-size: 1.2rem;">${amount.toLocaleString('vi-VN')} đ</strong>`;
        document.getElementById('modal-qr-img').src = qrUrl;
        document.getElementById('qr-modal').style.display = 'block';
    };

    // Hàm đóng popup QR
    window.closeModal = function() {
        document.getElementById('qr-modal').style.display = 'none';
    };

    // Đóng popup khi click ra ngoài vùng ảnh
    window.onclick = function(event) {
        const modal = document.getElementById('qr-modal');
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // 4. Tải kết quả tính toán chia tiền
    async function loadSettlements() {
        try {
            const response = await fetch('/api/settle');
            const data = await response.json();

            if (data.suggested_transactions.length === 0) {
                settlementBox.innerHTML = '<p class="empty-state">Mọi người đã hòa tiền, không ai nợ ai!</p>';
                return;
            }

            let html = '<ul style="list-style: none; padding: 0;">';
            data.suggested_transactions.forEach(txn => {
                html += `
                    <li style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong>${txn.from}</strong> trả cho <strong>${txn.to}</strong>:<br>
                            <span style="color: var(--primary-pink); font-weight: bold; font-size: 1.1rem;">
                                ${txn.amount.toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                        <button class="btn-transfer" onclick="showQR('${txn.to}', ${txn.amount}, '${txn.to_qr}')">
                            Mã QR
                        </button>
                    </li>`;
            });
            html += '</ul>';
            settlementBox.innerHTML = html;

        } catch (error) {
            console.error("Lỗi khi tải kết quả tính toán:", error);
        }
    }

    // 5. Xử lý khi nhấn nút "Thêm Hóa Đơn"
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn trang tự động reload

        // Lấy danh sách những người tham gia được check
        const checkboxes = participantsList.querySelectorAll('input[type="checkbox"]:checked');
        const participants = Array.from(checkboxes).map(cb => cb.value);

        if (participants.length === 0) {
            alert("Vui lòng chọn ít nhất 1 người tham gia để chia tiền!");
            return;
        }

        const newExpense = {
            description: document.getElementById('description').value,
            amount: document.getElementById('amount').value,
            payer_id: payerSelect.value,
            participants: participants
        };

        try {
            // Gửi dữ liệu lên API
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });

            if (response.ok) {
                // Xóa trắng form
                document.getElementById('description').value = '';
                document.getElementById('amount').value = '';
                payerSelect.value = '';
                
                // Cập nhật lại giao diện ngay lập tức
                await loadExpenses();
                await loadSettlements();
            }
        } catch (error) {
            console.error("Lỗi khi thêm hóa đơn:", error);
        }
    });

    // Chạy khởi tạo khi tải trang
    init();
});