const db = require('better-sqlite3')('backend/kompas-exim.db');
db.pragma('foreign_keys = ON');
const id = 1;
const statements = [
    'DELETE FROM ae_ao_handover_documents WHERE handover_id IN (SELECT id FROM ae_ao_handovers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
    'DELETE FROM ae_ao_handovers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_document_activity_audit WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_job_activity_results WHERE job_document_activity_id IN (SELECT id FROM ae_job_document_activities WHERE job_document_version_id IN (SELECT id FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))))',
    'DELETE FROM ae_job_document_activities WHERE job_document_version_id IN (SELECT id FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)))',
    'DELETE FROM ae_job_document_versions WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
    'DELETE FROM ae_job_documents WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_job_checklist_items WHERE job_checklist_id IN (SELECT id FROM ae_job_checklists WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?))',
    'DELETE FROM ae_job_checklists WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM job_checklist_items WHERE export_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_supervisor_milestones WHERE export_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_job_operational_data WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_job_blockers WHERE job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM match_review_cases WHERE resolved_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM source_identity_events WHERE export_job_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM containers WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM invoices WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM debit_notes WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_document_checklists WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_followup_records WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM ae_discrepancies WHERE shipment_id IN (SELECT id FROM export_jobs WHERE first_import_id = ?)',
    'DELETE FROM match_review_cases WHERE source_import_id = ?',
    'DELETE FROM source_identity_events WHERE source_import_id = ?',
    'DELETE FROM export_jobs WHERE first_import_id = ? OR last_import_id = ?',
    'DELETE FROM source_record_changes WHERE source_import_id = ?',
    'DELETE FROM source_records WHERE source_import_id = ?',
    'DELETE FROM source_imports WHERE id = ?'
];

db.transaction(() => {
    for (let sql of statements) {
        console.log("Executing:", sql);
        try {
            if (sql.includes('OR last_import_id')) {
                db.prepare(sql).run(id, id);
            } else {
                db.prepare(sql).run(id);
            }
        } catch (e) {
            console.error("FAILED AT:", sql);
            console.error(e);
            throw e;
        }
    }
})();
console.log("Success");
