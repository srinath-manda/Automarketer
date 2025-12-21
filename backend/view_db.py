import sqlite3
import pandas as pd

import os

def view_db():
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'automarketer.db')
    print(f"Opening database at: {db_path}")
    conn = sqlite3.connect(db_path)

    print("\n=== Users ===")
    try:
        df_users = pd.read_sql_query("SELECT * FROM user", conn)
        print(df_users)
    except Exception as e:
        print(f"Error reading user table: {e}")
    
    print("\n=== Business Profiles ===")
    try:
        df_bus = pd.read_sql_query("SELECT * FROM business_profile", conn)
        print(df_bus)
    except Exception as e:
        print(f"Error reading business_profile: {e}")

    print("\n=== Generated Content ===")
    try:
        df_content = pd.read_sql_query("SELECT * FROM generated_content", conn)
        print(df_content)
    except Exception as e:
        print(f"Error reading generated_content: {e}")

    print("\n=== Products ===")
    try:
        df_prod = pd.read_sql_query("SELECT * FROM product", conn)
        print(df_prod)
    except Exception as e:
        print(f"Error reading product: {e}")
        
    conn.close()

if __name__ == "__main__":
    view_db()
