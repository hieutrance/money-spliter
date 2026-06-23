import os
import firebase_admin
from firebase_admin import credentials, firestore

current_directory = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_directory, "serviceAccountKey.json")

cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

db = firestore.client()


def init_group_members():

    members = [
        {"id": "user_1", "name": "Khánh"},
        {"id": "user_2", "name": "Trâm"},
        {"id": "user_3", "name": "Ngân"},
        {"id": "user_4", "name": "Ngọc"},
        {"id": "user_5", "name": "Vấn"},
        {"id": "user_6", "name": "Phát"},
        {"id": "user_7", "name": "T Anh"},
        {"id": "user_8", "name": "Hiếu"}
    ]
    
    for member in members:
        # Lưu vào collection 'users' với ID tài liệu tự định nghĩa để dễ quản lý
        db.collection('users').document(member['id']).set({
            'name': member['name']
        })
    print("Đã khởi tạo xong dữ liệu của 8 thành viên!")

def get_all_users():
    users_ref = db.collection('users').stream()
    users_list = []
    for doc in users_ref:
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        users_list.append(user_data)
    return users_list

def add_expense(description, amount, payer_id, participants):

    expense_data = {
        'description': description,
        'amount': float(amount),
        'payer_id': payer_id,
        'participants': participants,
        'created_at': firestore.SERVER_TIMESTAMP # Lưu thời gian tạo tự động
    }
    
    db.collection('expenses').add(expense_data)
    return True

def get_all_expenses():
    expenses_ref = db.collection('expenses').order_by('created_at', direction=firestore.Query.DESCENDING).stream()
    expenses_list = []
    for doc in expenses_ref:
        expense_data = doc.to_dict()
        expense_data['id'] = doc.id
        expenses_list.append(expense_data)
    return expenses_list

def delete_expense(expense_id):
    """Xóa một khoản chi khỏi database dựa trên ID"""
    db.collection('expenses').document(expense_id).delete()
    return True

init_group_members()