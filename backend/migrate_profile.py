"""
Database migration script to add new user profile columns
Run this script once to update the database schema
"""
import sqlite3
import os

# Path to database
DB_PATH = os.path.join(os.path.dirname(__file__), 'automarketer.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(user)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    # New columns to add
    new_columns = [
        ('full_name', 'VARCHAR(120)'),
        ('mobile', 'VARCHAR(20)'),
        ('bio', 'TEXT'),
        ('company', 'VARCHAR(100)'),
        ('location', 'VARCHAR(100)'),
        ('created_at', 'DATETIME'),
        ('updated_at', 'DATETIME')
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            try:
                cursor.execute(f'ALTER TABLE user ADD COLUMN {col_name} {col_type}')
                print(f'✅ Added column: {col_name}')
            except Exception as e:
                print(f'⚠️ Column {col_name} might already exist: {e}')
        else:
            print(f'ℹ️ Column {col_name} already exists')
    
    conn.commit()
    conn.close()
    print('\n✅ Database migration complete!')

if __name__ == '__main__':
    migrate()
