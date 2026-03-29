import sqlite3
import pandas as pd

def load_data_to_db(df, db_name="cdlh_members.db", table_name="members"):
    print(f"Connecting to database: {db_name}...")
    # This creates the database file if it doesn't exist, or connects to it if it does
    conn = sqlite3.connect(db_name)
    
    print(f"Loading {len(df)} rows into the '{table_name}' table...")
    # Pandas does the heavy lifting: translating the DataFrame into SQL and inserting it
    # if_exists='replace' means it overwrites the old table with fresh data every time it runs
    # index=False prevents Pandas from adding an unnecessary row-number column
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    
    print("Data successfully loaded! Closing connection.")
    # Always close the door behind you
    conn.close()

if __name__ == "__main__":
    # 1. Create some fake "cleaned" data just to test the Load function
    test_data = {
        "Name": ["Jasper Sng", "John Doe"],
        "Matriculation_No": ["01234567", "07654321"],
        "Role": ["EMT", "First Aider"]
    }
    cleaned_df = pd.DataFrame(test_data)
    
    # 2. Test the loading function
    print("--- Testing Load Phase ---")
    load_data_to_db(cleaned_df)