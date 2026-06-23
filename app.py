from flask import Flask, jsonify, request, render_template
from database import delete_expense, get_all_users, get_all_expenses, add_expense
from logic import calculate_balances, suggest_settlements

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/users', methods=['GET'])
def api_get_users():
    users = get_all_users()
    return jsonify(users)

@app.route('/api/expenses', methods=['GET'])
def api_get_expenses():
    expenses = get_all_expenses()
    # Tạo một từ điển map ID thành Tên để tra cứu nhanh
    users_dict = {u['id']: u['name'] for u in get_all_users()}
    
    for exp in expenses:
        exp['payer_name'] = users_dict.get(exp['payer_id'], "Ẩn danh")
        
        # Chuyển đổi danh sách ID người tham gia thành danh sách Tên
        participant_names = [users_dict.get(p_id, "Ẩn danh") for p_id in exp.get('participants', [])]
        exp['participant_names'] = ", ".join(participant_names)
        
    return jsonify(expenses)

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def api_delete_expense(expense_id):
    delete_expense(expense_id)
    return jsonify({"status": "success", "message": "Đã xóa khoản chi"}), 200

@app.route('/api/expenses', methods=['POST'])
def api_add_expense():
    data = request.json
    description = data.get('description')
    amount = data.get('amount')
    payer_id = data.get('payer_id')
    participants = data.get('participants', [])
    
    add_expense(description, amount, payer_id, participants)
    return jsonify({"status": "success", "message": "Đã thêm khoản chi"}), 201

# API tính toán ai nợ ai
@app.route('/api/settle', methods=['GET'])
def get_settlement_plan():
    users = get_all_users()
    expenses = get_all_expenses()
    
    balances = calculate_balances(users, expenses)
    transactions = suggest_settlements(balances)
    
    return jsonify({
        'status': 'success',
        'balances': balances,
        'suggested_transactions': transactions
    })

if __name__ == '__main__':
    app.run(debug=True)