import os
import pandas as pd
from sqlalchemy import create_engine

# ---------------------------------------
# MySQL connection details
# ---------------------------------------

DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
DB_HOST = os.getenv("MYSQL_HOST", "localhost")
DB_PORT = int(os.getenv("MYSQL_PORT", "3306"))
DB_NAME = os.getenv("MYSQL_DB", "trend2action")
DB_SSL_CA = os.getenv("MYSQL_SSL_CA", "ca.pem")
# ---------------------------------------x
# Create MySQL connection
# ---------------------------------------
engine = create_engine(
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}",
    connect_args={
        "ssl_ca": DB_SSL_CA,
        "ssl_verify_cert": True
    }
)

# ---------------------------------------
# Read CSV
# ---------------------------------------
csv_file = "medical_data_set_extended.csv"

df = pd.read_csv(csv_file)

print("CSV loaded successfully.")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

# ---------------------------------------
# Load into MySQL
# ---------------------------------------
df.to_sql(
    "medical_cost_data",
    con=engine,
    if_exists="replace",
    index=False
)

print("\nData successfully loaded into MySQL.")