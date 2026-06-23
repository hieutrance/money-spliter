def calculate_balances(users, expenses):
    # Lấy thêm thông tin qr_url (nếu có, nếu không thì để trống)
    balances = {user['id']: {
        'name': user['name'], 
        'balance': 0.0,
        'qr_url': user.get('qr_url', '') # <--- Dòng mới
    } for user in users}
    
    # ... (Phần logic tính toán cộng trừ bên dưới giữ nguyên) ...
    for exp in expenses:
        amount = float(exp['amount'])
        payer_id = exp['payer_id']
        participants = exp['participants']
        
        balances[payer_id]['balance'] += amount
        if len(participants) > 0:
            split_amount = amount / len(participants)
            for p_id in participants:
                balances[p_id]['balance'] -= split_amount
                
    return balances

def suggest_settlements(balances):
    debtors = []   
    creditors = [] 
    
    for user_id, data in balances.items():
        if data['balance'] < -1.0: 
            debtors.append({'name': data['name'], 'amount': abs(data['balance'])})
        elif data['balance'] > 1.0:
            # Truyền thêm qr_url vào danh sách chủ nợ
            creditors.append({'name': data['name'], 'amount': data['balance'], 'qr_url': data['qr_url']})
            
    debtors.sort(key=lambda x: x['amount'], reverse=True)
    creditors.sort(key=lambda x: x['amount'], reverse=True)
    
    transactions = []
    i, j = 0, 0
    
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        
        settle_amount = min(debtor['amount'], creditor['amount'])
        
        transactions.append({
            'from': debtor['name'],
            'to': creditor['name'],
            'to_qr': creditor['qr_url'], # <--- Truyền link QR ra Frontend
            'amount': round(settle_amount)
        })
        
        debtor['amount'] -= settle_amount
        creditor['amount'] -= settle_amount
        
        if debtor['amount'] < 1.0: i += 1
        if creditor['amount'] < 1.0: j += 1
            
    return transactions