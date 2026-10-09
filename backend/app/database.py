import os
import sqlite3
import pandas as pd
from pathlib import Path

# Identify base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "returns_recovery.db"

CSV_FILES = [
    "products.csv",
    "returns.csv",
    "inventory.csv",
    "vendor_terms.csv",
    "refurbishment.csv",
    "liquidation.csv"
]

def get_db_connection():
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Loads CSV files into SQLite database tables on application startup."""
    if not DATA_DIR.exists():
        os.makedirs(DATA_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    
    for csv_file in CSV_FILES:
        file_path = DATA_DIR / csv_file
        table_name = csv_file.replace(".csv", "")
        
        if file_path.exists():
            df = pd.read_csv(file_path)
            # Write dataframe to SQLite table
            df.to_sql(table_name, conn, if_exists="replace", index=False)
            print(f"[DB INIT] Synchronized {csv_file} -> Table '{table_name}' ({len(df)} records)")
        else:
            print(f"[DB WARNING] CSV file not found: {file_path}")

    conn.close()

if __name__ == "__main__":
    init_db()