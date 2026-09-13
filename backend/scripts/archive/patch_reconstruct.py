import re

file_path = "backend/src/services/logSchedule/SourceSyncEngine.js"
with open(file_path, "r") as f:
    content = f.read()

method_injection = """
  /**
   * Reconstruct a parsed row object from a source_record database row.
   * Useful when we need to run _updateExportJobSourceFields using stored source_record data.
   */
  static _reconstructRowFromSourceRecord(record) {
    return {
      raw_customer_code: record.raw_customer_code,
      raw_type: record.raw_type,
      raw_invoice_no: record.raw_invoice_no,
      raw_pi: record.raw_pi,
      raw_buyer: record.raw_buyer,
      raw_description_goods: record.raw_description_goods,
      raw_destination: record.raw_destination,
      raw_fwd_trucking: record.raw_fwd_trucking,
      raw_liner: record.raw_liner,
      raw_no_bc: record.raw_no_bc,
      raw_container_qty: record.raw_container_qty,
      raw_warehouse: record.raw_warehouse,
      raw_req_trucking: record.raw_req_trucking,
      raw_in_date: record.raw_in_date,
      raw_in_time: record.raw_in_time,
      raw_data_loading: record.raw_data_loading,
      raw_closing_bki: record.raw_closing_bki,
      raw_closing_docs: record.raw_closing_docs,
      raw_closing_docs_time: record.raw_closing_docs_time,
      raw_closing_cy: record.raw_closing_cy,
      raw_closing_cy_time: record.raw_closing_cy_time,
      raw_initial_etd: record.raw_initial_etd,
      raw_etd: record.raw_etd,
      raw_eta: record.raw_eta,
      raw_vessel: record.raw_vessel,
      raw_fasilitas_kite: record.raw_fasilitas_kite,
      raw_respon: record.raw_respon,
      raw_stacking_terminal: record.raw_stacking_terminal,
      raw_source_pic: record.raw_source_pic,
      raw_column_p: record.raw_column_p,
      norm_destination: record.norm_destination,
      norm_destination_country: record.norm_destination_country,
      norm_product_type: record.norm_product_type,
      norm_respon: record.norm_respon
    };
  }
"""

if "_reconstructRowFromSourceRecord" not in content:
    # Insert right before the last closing brace in the file
    content = re.sub(r'}\s*module\.exports = SourceSyncEngine;', method_injection + r'\n}\n\nmodule.exports = SourceSyncEngine;', content)
    with open(file_path, "w") as f:
        f.write(content)
    print("Method injected")
else:
    print("Method already exists")
