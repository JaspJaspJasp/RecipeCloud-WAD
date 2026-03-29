import sqlite3
import pandas as pd
from sqlalchemy import create_engine

print("1. Extracting data from SQLite...")
# Connect to your local SQLite file
sqlite_conn = sqlite3.connect("cdlh_members.db")
# Load the entire table back into a Pandas DataFrame
df = pd.read_sql_query("SELECT * FROM members", sqlite_conn)
sqlite_conn.close()

print("2. Connecting to MySQL Server...")
# The Connection String format: mysql+pymysql://username:password@localhost:3306/database_name
# IMPORTANT: Replace 'YOUR_PASSWORD' with your actual MySQL root password
mysql_engine = create_engine("mysql+pymysql://root:J$ng20032003@localhost:3306/cdlhtest")

print("3. Pushing data to MySQL Workbench...")
# Pandas does the heavy lifting again, translating the DataFrame into MySQL dialect
df.to_sql("members", con=mysql_engine, if_exists="replace", index=False)

print("Data successfully piped to MySQL!")