# Import the functions you built in your src/ folder
from src.extract import extract_sheet_data
from src.transform import clean_cdlh_data
from src.load import load_data_to_db

def run_pipeline():
    print("=== Starting CDLH Data Pipeline ===\n")
    
    # Replace this with the actual URL from your browser
    GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1aJ8nMKr14f_X8z0EDjBaz_HC23e_h6QpJ44G9-gCgmA/edit"
    
    # STEP 1: Extract (Pulls raw data into memory)
    raw_df = extract_sheet_data(GOOGLE_SHEET_URL)
    
    # STEP 2: Transform (Cleans and formats the data)
    clean_df = clean_cdlh_data(raw_df)
    
    # STEP 3: Load (Saves it to a local SQL database)
    load_data_to_db(clean_df, db_name="cdlh_members.db", table_name="members")
    
    print("\n=== Pipeline Execution Finished ===")

if __name__ == "__main__":
    run_pipeline()

