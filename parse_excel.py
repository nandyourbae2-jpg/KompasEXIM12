import pandas as pd
import sys

def parse_file(filepath):
    print(f"==== Parsing {filepath} ====")
    try:
        xl = pd.ExcelFile(filepath)
        for sheet in xl.sheet_names:
            print(f"--- Sheet: {sheet} ---")
            df = xl.parse(sheet)
            print(df.head(20).to_markdown())
            print("\n")
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")

parse_file('/Users/macbookair/Downloads/AE_Form Checklist Document Export (UPDATED).xlsx')
parse_file('/Users/macbookair/Downloads/CHECKLIST AE 2026 (UNTUK CI JORI).xlsx')
