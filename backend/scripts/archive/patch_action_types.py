import sqlite3

conn = sqlite3.connect('kompas-exim.db')
c = conn.cursor()

c.execute("SELECT id, label, code FROM ae_checklist_items")
items = c.fetchall()

for row in items:
    id, label, code = row
    label_upper = label.upper()
    
    action_type = "OTHER"
    if "RECEIVE" in label_upper or "TERIMA" in label_upper or "DATA FORWARDER" in label_upper or "DATA LOADING" in label_upper:
        action_type = "RECEIVE"
    elif "CHECK" in label_upper or "APPROVAL" in label_upper or "CFM" in label_upper:
        action_type = "CHECK"
    elif "EMAIL" in label_upper or "TO PIC" in label_upper or "TO PAK" in label_upper:
        action_type = "EMAIL"
    elif "FORMAT" in label_upper or "PI" in label_upper or "DO INTERNAL" in label_upper or "DO LINER" in label_upper or "SCHEDULE" in label_upper:
        action_type = "FORMAT"
    elif "REVISE" in label_upper or "TAKE OUT" in label_upper:
        action_type = "REVISE"
    elif "PRINT" in label_upper:
        action_type = "PRINT"
    elif "SCAN" in label_upper:
        action_type = "SCAN"
    elif "TRANSFER" in label_upper or "HANDED OVER" in label_upper:
        action_type = "TRANSFER"
    
    # Just a few common sense mappings based on the user's hints. 
    # If the label has no direct keyword, it will be "OTHER".
    
    c.execute("UPDATE ae_checklist_items SET action_type = ? WHERE id = ?", (action_type, id))

conn.commit()
conn.close()
print("Updated action_types")
