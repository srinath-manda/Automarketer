import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'automarketer.db')

def upgrade_audio():
    """
    SQLite doesn't support ALTER COLUMN directly, so we need to:
    1. Create a new table with the updated schema
    2. Copy data
    3. Drop old table
    4. Rename new table
    """
    print(f"Updating audio_file table in {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if audio_file table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audio_file'")
        if not cursor.fetchone():
            print("audio_file table doesn't exist yet. No migration needed.")
            conn.close()
            return
        
        print("Creating new audio_file table with nullable business_id...")
        cursor.execute("""
            CREATE TABLE audio_file_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename VARCHAR(255) NOT NULL,
                original_text TEXT NOT NULL,
                created_at DATETIME,
                business_id INTEGER,
                FOREIGN KEY (business_id) REFERENCES business_profile(id)
            )
        """)
        
        # Copy existing data
        print("Copying existing data...")
        cursor.execute("""
            INSERT INTO audio_file_new (id, filename, original_text, created_at, business_id)
            SELECT id, filename, original_text, created_at, business_id
            FROM audio_file
        """)
        
        # Drop old table
        print("Dropping old table...")
        cursor.execute("DROP TABLE audio_file")
        
        # Rename new table
        print("Renaming new table...")
        cursor.execute("ALTER TABLE audio_file_new RENAME TO audio_file")
        
        conn.commit()
        print("Successfully updated audio_file table!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade_audio()
