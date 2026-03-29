import pandas as pd

def clean_cdlh_data(df):
    print("Starting data transformation...")
    
    # NEW: Pre-clean the raw headers to remove invisible trailing spaces
    # This ensures the rename_map matches perfectly even if Google Sheets added spaces
    df.columns = df.columns.str.strip()
    
    rename_map = {
        "Timestamp": "signup_timestamp",
        "Email address": "personal_email",
        "Name (As per Matriculation)": "full_name",
        "Preferred Name (if any)": "preferred_name",
        "Matriculation Number": "matric_no",
        "Student Email (eg. abc.2022@law.smu.edu.sg)": "smu_email",
        "Gender": "gender",
        "Telegram Handle": "telegram_handle",
        "Contact Number": "phone",
        "School": "school",
        "Year of Study": "year_of_study",
        "Citizenship": "citizenship",
        "I am currently certified in": "current_cert",
        "If your response to the previous question was Yes, please indicate the date of expiry of your certification": "cert_expiry_date",
        "Name of Company that issued the certificate": "cert_company",
        "Is your certificate endorsed by the SRFAC (Singapore Resuscitation and First Aid Council)?": "is_srfac_endorsed",
        "Picture of certificate": "cert_picture_url",
        "Please upload the screenshot of your ONTRAC II application": "ontrac_screenshot_url",
        "Dietary Requirements/Food Allergies": "dietary_reqs",
        "Medical Conditions/Allergies": "medical_conditions",
        "Next-of-Kin's Name": "nok_name",
        "Relationship to Next-of-Kin": "nok_relationship",
        "Next-of-Kin's Contact Number": "nok_phone"
    }
    
    # Apply the mapping
    df = df.rename(columns=rename_map)
    
    # SAFETY CHECK: If any column still has spaces or weird characters, 
    # force them into a MySQL-friendly format (lowercase_with_underscores)
    df.columns = [col.lower().replace(' ', '_').replace('(', '').replace(')', '').replace('@', '').replace('.', '') for col in df.columns]
    
    # Clean Emails
    for col in ['personal_email', 'smu_email']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.lower()
            
    # Clean Phone Numbers
    for col in ['phone', 'nok_phone']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace(r'\D', '', regex=True)
            mask = df[col].str.len() == 8
            df.loc[mask, col] = '+65 ' + df[col]
            
    # Deduplication
    if 'matric_no' in df.columns:
        df = df.drop_duplicates(subset=['matric_no'], keep='last')
            
    print("Transformation complete!")
    return df