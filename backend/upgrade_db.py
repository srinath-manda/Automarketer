import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'automarketer.db')

def upgrade():
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Checking for 'offers' column in 'product' table...")
        # Check if column exists
        cursor.execute("PRAGMA table_info(product)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'offers' not in columns:
            print("Adding 'offers' column...")
            cursor.execute("ALTER TABLE product ADD COLUMN offers TEXT")
            conn.commit()
            print("Successfully added 'offers' column.")
        else:
            print("'offers' column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade()
