const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../../backend/kompas-exim.db');
const db = new sqlite3.Database(dbPath);

const templates = [
    { nama: 'PBN (LOIN)', company: 'PBN', product: 'LOIN' },
    { nama: 'PBN (GENOA ONLY)', company: 'PBN', product: 'GENOA ONLY' },
    { nama: 'PBN (FLAKES)', company: 'PBN', product: 'FLAKES' },
    { nama: 'PBN (WR)', company: 'PBN', product: 'WR' },
    { nama: 'PBN (FM)', company: 'PBN', product: 'FM' },
    { nama: 'PBN (POUCH)', company: 'PBN', product: 'POUCH' },
    { nama: 'PBN (FO)', company: 'PBN', product: 'FO' },
    { nama: 'PBN (FE)', company: 'PBN', product: 'FE' },
    { nama: 'PSB', company: 'PSB', product: null },
    { nama: 'PSFI', company: 'PSFI', product: null },
    { nama: 'SAMICO', company: 'SAMICO', product: null }
];

const checklistDefinition = [
    {
        nama_group: 'DOCUMENT PREPARATION',
        kondisi_final_data: null,
        items: [
            { nama: 'Schedule Internal', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'DO Internal', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'DO Liner', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'Data Forwarder', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'Data Loading', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'PI', activities: { 'RCVD': false, 'Server Filing': false, 'Checked': true } }, // --- for RCVD & Server Filing
            { nama: 'Shipping Instruction (if any)', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } },
            { nama: 'L/C (if any)', activities: { 'RCVD': true, 'Server Filing': true, 'Checked': true } }
        ]
    },
    {
        nama_group: 'SOFT COPY DOCUMENT',
        kondisi_final_data: null,
        items: [
            { nama: 'SI', activities: { 'Format Standard': true, 'Email to Internal': true, 'Format KITE': true, 'Email to PIC PEB KITE': true, 'Revise (from/to)': true, 'Take Out': true } },
            { nama: 'Invoice', activities: { 'Format Standard': true, 'Email to Internal': true, 'Format KITE': true, 'Email to PIC PEB KITE': true, 'Revise (from/to)': true, 'Take Out': true } },
            { nama: 'Packing List', activities: { 'Format Standard': true, 'Email to Internal': true, 'Format KITE': true, 'Email to PIC PEB KITE': true, 'Revise (from/to)': true, 'Take Out': true } },
            { nama: 'LOI', activities: { 'Format Standard': true, 'Email to Internal': true, 'Format KITE': true, 'Email to PIC PEB KITE': true, 'Revise (from/to)': true, 'Take Out': true } },
            { nama: 'Data Loading', activities: { 'Format Standard': true, 'Email to Internal': true, 'Format KITE': true, 'Email to PIC PEB KITE': true, 'Revise (from/to)': true, 'Take Out': true } },
            { nama: 'PEB', activities: { 'Confirm Draft': true, 'NPE & PEB Received': true } } // Special activities for PEB
        ]
    },
    {
        nama_group: 'FINAL DATA',
        kondisi_final_data: 'CNF/CIF All In',
        items: [
            { nama: 'SI', activities: { 'Send to Forwarder': true } },
            { nama: 'PL', activities: { 'Send to Forwarder': true } },
            { nama: 'LOI', activities: { 'Send to Forwarder': true } },
            { nama: 'PEB', activities: { 'Send to Forwarder': true } },
            { nama: 'LOI Reefer', activities: { 'Send to Forwarder': true } },
            { nama: 'Final Data by Web', activities: { 'Send to Forwarder': true } },
            { nama: 'PEB Detail by Web', activities: { 'Send to Forwarder': true } },
            { nama: 'VGM by Web', activities: { 'Send to Forwarder': true } }
        ]
    },
    {
        nama_group: 'FINAL DATA',
        kondisi_final_data: 'CNF/CIF Direct Liner',
        items: [
            { nama: 'SI', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'PL', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'LOI', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'PEB', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'LOI Reefer', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'Final Data by Web', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'PEB Detail by Web', activities: { 'Send to Forwarder/Liner': true } },
            { nama: 'VGM by Web', activities: { 'Send to Forwarder/Liner': true } }
        ]
    },
    {
        nama_group: 'FINAL DATA',
        kondisi_final_data: 'FOB Buyer Nomination',
        items: [
            { nama: 'SI', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'PL', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'LOI', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'PEB', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'LOI Reefer', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'Final Data by Web', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'PEB Detail by Web', activities: { 'Send to Forwarder/Liner Buyer': true } },
            { nama: 'VGM by Web', activities: { 'Send to Forwarder/Liner Buyer': true } }
        ]
    },
    {
        nama_group: 'DRAFT DOCUMENT',
        kondisi_final_data: null,
        items: [
            { nama: 'Invoice', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } },
            { nama: 'Packing List', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } },
            { nama: 'BL', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } },
            { nama: 'COO', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } },
            { nama: 'PEB', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } },
            { nama: 'SBU', activities: { 'Print for AO Checking': true, 'Handed Over AE->AO': true, 'Approval from AO/Buyer': true, 'CFM to Liner/FWD': true, 'Transfer to IPSKA': true, 'Recipient Action': true } }
        ]
    },
    {
        nama_group: 'ORIGINAL DOCUMENT',
        kondisi_final_data: null,
        items: [
            { nama: 'Invoice', activities: { 'TTD Finance': true, 'Scan Copy': true, 'Hard Copy': true, 'Handed Over to AO': true } },
            { nama: 'Packing List', activities: { 'TTD Finance': true, 'Scan Copy': true, 'Hard Copy': true, 'Handed Over to AO': true } },
            { nama: 'BL', activities: { 'TTD Finance': true, 'Scan Copy': true, 'Hard Copy': true, 'Handed Over to AO': true } },
            { nama: 'COO', activities: { 'TTD Finance': true, 'Scan Copy': true, 'Hard Copy': true, 'Handed Over to AO': true } }
        ]
    }
];

async function seed() {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run('DELETE FROM checklist_item_activity_rules');
        db.run('DELETE FROM checklist_activities');
        db.run('DELETE FROM checklist_items');
        db.run('DELETE FROM checklist_groups');
        db.run('DELETE FROM checklist_templates');

        templates.forEach(t => {
            db.run('INSERT INTO checklist_templates (nama_template, company, product) VALUES (?, ?, ?)', [t.nama, t.company, t.product], function(err) {
                if (err) throw err;
                const templateId = this.lastID;
                
                let groupUrutan = 1;
                checklistDefinition.forEach(g => {
                    db.run('INSERT INTO checklist_groups (template_id, nama_group, urutan, kondisi_final_data) VALUES (?, ?, ?, ?)', [templateId, g.nama_group, groupUrutan++, g.kondisi_final_data], function(err) {
                        if (err) throw err;
                        const groupId = this.lastID;
                        
                        let itemUrutan = 1;
                        g.items.forEach(item => {
                            db.run('INSERT INTO checklist_items (group_id, nama_item, urutan) VALUES (?, ?, ?)', [groupId, item.nama, itemUrutan++], function(err) {
                                if (err) throw err;
                                const itemId = this.lastID;
                                
                                let actUrutan = 1;
                                for (const [actName, isApplicable] of Object.entries(item.activities)) {
                                    db.run('INSERT INTO checklist_activities (group_id, nama_aktivitas, urutan) VALUES (?, ?, ?)', [groupId, actName, actUrutan++], function(err) {
                                        if (err) throw err;
                                        const actId = this.lastID;
                                        
                                        db.run('INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, ?)', [itemId, actId, isApplicable ? 1 : 0]);
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
        
        db.run('COMMIT', (err) => {
            if (err) throw err;
            console.log('Seeding completed successfully!');
            db.close();
        });
    });
}

seed();
