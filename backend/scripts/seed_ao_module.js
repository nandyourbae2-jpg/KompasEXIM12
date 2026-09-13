const bcrypt = require('bcrypt');
const db = require('../src/database/db');

async function seedAoModule() {
  const hash = await bcrypt.hash('password123', 10);
  const now = new Date().toISOString();

  try {
    db.transaction(() => {
      // ─── Users ───
      const users = [
        ['SPV-AO-01', 'Supervisor AO Ratna', 'Account Officer', 'Supervisor'],
        ['EXIM-AO-01', 'Staff AO Budi', 'Account Officer', 'Staff Dept'],
        ['EXIM-AO-02', 'Staff AO Dewi', 'Account Officer', 'Staff Dept'],
      ];
      for (const [eid, nama, dept, level] of users) {
        const exists = db.prepare('SELECT id FROM users WHERE employee_id = ?').get(eid);
        if (!exists) {
          db.prepare('INSERT INTO users (employee_id, nama, departemen, level_otoritas, password_hash) VALUES (?, ?, ?, ?, ?)').run(eid, nama, dept, level, hash);
          console.log(`✅ User ${eid} created`);
        } else {
          console.log(`⏩ User ${eid} sudah ada`);
        }
      }

      // ─── Fasilitas Kredit ───
      const fk1Exists = db.prepare("SELECT id FROM fasilitas_kredit WHERE nama_fasilitas = 'Fasilitas Trade Finance BCA'").get();
      let fk1Id, fk2Id;
      if (!fk1Exists) {
        fk1Id = db.prepare(`INSERT INTO fasilitas_kredit (nama_fasilitas, bank, jenis_fasilitas, limit_fasilitas, mata_uang, tanggal_mulai, tanggal_expired, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
          'Fasilitas Trade Finance BCA', 'BCA', 'Trade Finance', 5000000000, 'IDR', '2026-01-01', '2027-01-01', 'Aktif'
        ).lastInsertRowid;
        console.log('✅ Fasilitas Trade Finance BCA created');
      } else {
        fk1Id = fk1Exists.id;
        console.log('⏩ Fasilitas BCA sudah ada');
      }

      const fk2Exists = db.prepare("SELECT id FROM fasilitas_kredit WHERE nama_fasilitas = 'Fasilitas Working Capital Mandiri'").get();
      if (!fk2Exists) {
        fk2Id = db.prepare(`INSERT INTO fasilitas_kredit (nama_fasilitas, bank, jenis_fasilitas, limit_fasilitas, mata_uang, tanggal_mulai, tanggal_expired, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
          'Fasilitas Working Capital Mandiri', 'Mandiri', 'Working Capital', 3000000000, 'IDR', '2026-01-01', '2027-06-30', 'Aktif'
        ).lastInsertRowid;
        console.log('✅ Fasilitas Working Capital Mandiri created');
      } else {
        fk2Id = fk2Exists.id;
        console.log('⏩ Fasilitas Mandiri sudah ada');
      }

      // ─── Get existing PIB Requests for linking ───
      const pibReqs = db.prepare("SELECT id, request_number, import_project_id, kasbon_diminta FROM pib_requests WHERE status IN ('Approved','Realized') LIMIT 2").all();
      const aoUser = db.prepare("SELECT id FROM users WHERE employee_id = 'EXIM-AO-01'").get();

      // ─── Kasbon Requests from PIB ───
      if (pibReqs.length > 0 && aoUser) {
        for (let i = 0; i < pibReqs.length; i++) {
          const pib = pibReqs[i];
          const existing = db.prepare('SELECT id FROM kasbon_request WHERE pib_request_id = ?').get(pib.id);
          if (!existing) {
            const ksbNum = `KSB-${String(i + 1).padStart(4, '0')}-26`;
            db.prepare(`INSERT INTO kasbon_request (kasbon_number, sumber, pib_request_id, import_project_id, fasilitas_kredit_id, jumlah_diminta, keterangan, status, diajukan_oleh_id, disetujui_oleh_id, tanggal_pencairan) VALUES (?, 'pib_request', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
              ksbNum, pib.id, pib.import_project_id, fk1Id, pib.kasbon_diminta,
              `Kasbon untuk PIB ${pib.request_number}`,
              i === 0 ? 'Dicairkan' : 'Diajukan',
              aoUser.id, i === 0 ? aoUser.id : null, i === 0 ? '2026-07-10' : null
            );
            console.log(`✅ Kasbon ${ksbNum} created (linked to PIB ${pib.request_number})`);
          }
        }
      }

      // ─── LC Sample ───
      const lcExists = db.prepare("SELECT id FROM lc_management WHERE lc_number = 'LC-0001-26'").get();
      if (!lcExists) {
        const project = db.prepare('SELECT id, supplier FROM import_projects LIMIT 1').get();
        if (project && aoUser) {
          db.prepare(`INSERT INTO lc_management (lc_number, import_project_id, bank_penerbit, nomor_lc_bank, jenis_lc, beneficiary, nilai_lc, mata_uang, tanggal_pengajuan, tanggal_terbit, tanggal_expired, status, dibuat_oleh_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            'LC-0001-26', project.id, 'BCA', 'BCA-LC-2026-088', 'Sight LC',
            project.supplier || 'PT Supplier Internasional', 150000, 'USD',
            '2026-06-15', '2026-06-20', '2026-12-20', 'Issued', aoUser.id
          );
          console.log('✅ LC-0001-26 created');
        }
      }

      // ─── BG Sample ───
      const bgExists = db.prepare("SELECT id FROM bank_guarantee WHERE bg_number = 'BG-0001-26'").get();
      if (!bgExists && aoUser) {
        const project = db.prepare('SELECT id FROM import_projects LIMIT 1').get();
        db.prepare(`INSERT INTO bank_guarantee (bg_number, import_project_id, bank_penerbit, tujuan_bg, penerima_bg, nilai_bg, mata_uang, tanggal_terbit, tanggal_expired, status, biaya_provisi, dibuat_oleh_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          'BG-0001-26', project?.id || null, 'Mandiri', 'Customs Bond', 'Direktorat Jenderal Bea & Cukai',
          500000000, 'IDR', '2026-07-01', '2027-01-01', 'Aktif', 2500000, aoUser.id
        );
        console.log('✅ BG-0001-26 created');
      }

      console.log('\n🎉 Seeding AO Module selesai!');
    })();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

seedAoModule();
