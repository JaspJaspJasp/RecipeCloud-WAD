import gspread
import pandas as pd

def extract_sheet_data(sheet_url):
    print("Authenticating with Google Service Account...")
    # looks for credentials.json
    gc = gspread.service_account(filename='credentials.json')

    print("Connecting to the CDLH Google Sheet...")
    # open the sheet by url
    sheet = gc.open_by_url(sheet_url)
    
    # first tab in google sheets
    worksheet = sheet.get_worksheet(0)
    
    print("Extracting records...")
    # Pull all data into a list of dictionaries
    records = worksheet.get_all_records()
    
    # convert data into dataframe
    df = pd.DataFrame(records)
    
    print(f"Successfully extracted {len(df)} rows of data.")
    return df

if __name__ == "__main__":
    GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1aJ8nMKr14f_X8z0EDjBaz_HC23e_h6QpJ44G9-gCgmA/edit"
    raw_data = extract_sheet_data(GOOGLE_SHEET_URL)
    
    # Print the first 5 rows to verify it worked
    print("\n--- Raw Data Preview ---")
    print(raw_data.head())