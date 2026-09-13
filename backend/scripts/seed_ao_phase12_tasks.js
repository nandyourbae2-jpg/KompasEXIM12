const db = require('../src/database/db');

function seedPhase12Tasks() {
  console.log('Seeding Phase 12 AO Tasks and Context...');

  // Get user IDs
  const tren = db.prepare("SELECT id FROM users WHERE employee_id = 'EXIM-AO-01'").get();
  const bella = db.prepare("SELECT id FROM users WHERE employee_id = 'EXIM-AO-02'").get();
  const fenny = db.prepare("SELECT id FROM users WHERE employee_id = 'EXIM-AO-03'").get();
  const vera = db.prepare("SELECT id FROM users WHERE employee_id = 'EXIM-AO-04'").get();
  const erica = db.prepare("SELECT id FROM users WHERE employee_id = 'DSCS-01'").get();
  const vicky = db.prepare("SELECT id FROM users WHERE employee_id = 'SPV-AO-01'").get();

  if (!tren) {
    console.error('Tren not found in users table!');
    return;
  }

  const jobs = db.prepare("SELECT id, job_code, buyer, invoice_no FROM export_jobs ORDER BY id ASC LIMIT 15").all();
  if (jobs.length < 5) {
    console.error('Not enough export_jobs found!');
    return;
  }

  db.transaction(() => {
    // Clear previous ao_tasks, ao_task_audits, and ao_job_context to ensure clean state
    db.prepare('DELETE FROM ao_task_audits').run();
    db.prepare('DELETE FROM ao_tasks').run();
    db.prepare('DELETE FROM ao_job_context').run();

    // 1. Contexts & Alerts
    const insertContext = db.prepare(`
      INSERT INTO ao_job_context (job_id, operational_alerts, ds_date, fishing_gear, jml_fv, species, total_cont_fcl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertContext.run(jobs[0].id, 'Fujian tidak perlu kurir ori', '2026-09-02', 'Purse Seine', 4, 'Yellowfin Tuna', 2);
    insertContext.run(jobs[1].id, 'Prioritas stuffing kapal sandar jam 18:00', '2026-09-03', 'Longline', 2, 'Skipjack', 1);
    insertContext.run(jobs[2].id, 'Hold dokumen COO hingga pelunasan DP', '2026-09-04', 'Pole and Line', 1, 'Bigeye Tuna', 3);
    insertContext.run(jobs[3].id, 'Wajib Sertifikat Fumigasi AFAS', '2026-09-05', 'Handline', 3, 'Albacore', 2);

    // 2. Insert Tasks
    const insertTask = db.prepare(`
      INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, status, priority, due_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAudit = db.prepare(`
      INSERT INTO ao_task_audits (task_id, actor_id, action, new_value)
      VALUES (?, ?, 'CREATE', ?)
    `);

    // Helper
    const addTask = (jobId, workstream, type, desc, assigneeId, status, priority, dueDate, remarks) => {
      const res = insertTask.run(jobId, workstream, type, desc, assigneeId, status, priority, dueDate, remarks);
      insertAudit.run(res.lastInsertRowid, vicky ? vicky.id : 1, JSON.stringify({ workstream, type, status, assigneeId }));
      return res.lastInsertRowid;
    };

    // --- TREN TASKS ---
    // Overdue / Blocked
    addTask(jobs[0].id, 'BANK', 'Follow-up Pelunasan DP 30%', 'Hubungi Buyer Nichimo untuk konfirmasi swift copy DP', tren.id, 'BLOCKED', 'CRITICAL', '2026-09-07', 'Buyer minta konfirmasi BL release sebelum transfer');
    addTask(jobs[1].id, 'COURIER', 'Kirim Dokumen Original via DHL', 'Kirim B/L, Invoice, Packing List, Certificate of Origin ke Bangkok', tren.id, 'IN_PROGRESS', 'HIGH', '2026-09-08', 'AWB belum dibuat, menunggu Health Certificate');

    // Due Today (2026-09-09)
    addTask(jobs[2].id, 'DOC', 'Verifikasi Draft COO Form D', 'Periksa detail pengirim, penerima, deskripsi barang dan kriteria asal barang', tren.id, 'IN_PROGRESS', 'HIGH', '2026-09-09', 'Periksa HS Code dan origin criteria');
    addTask(jobs[3].id, 'LOGISTICS', 'Monitoring Stuffing & Seal Container', 'Pastikan container tiba di depo tepat waktu sebelum closing time', tren.id, 'PENDING', 'NORMAL', '2026-09-09', 'Kapal closing CY jam 23:00');

    // Waiting
    addTask(jobs[4].id, 'BANK', 'Konfirmasi L/C Amendment', 'Menunggu persetujuan amendment L/C nomor LC-NICH-0992 dari bank penerbit', tren.id, 'WAITING', 'NORMAL', '2026-09-12', 'Menunggu bank koresponden di Tokyo');

    // Completed
    addTask(jobs[5].id, 'CC', 'Submit PEB & Cetak NPE', 'Submit data PEB ke portal INSW dan pantau respon sistem Bea Cukai', tren.id, 'COMPLETED', 'NORMAL', '2026-09-08', 'NPE terbit tanpa pemeriksaan fisik');

    // --- BELLA TASKS ---
    if (bella) {
      addTask(jobs[6].id, 'DOC', 'Pengajuan Health Certificate BKIPM', 'Upload dokumen hasil uji laboratorium dan inspeksi fisik ikan', bella.id, 'IN_PROGRESS', 'HIGH', '2026-09-10', 'Menunggu hasil lab');
      addTask(jobs[7].id, 'COURIER', 'Dispatch Dokumen Pelayaran', 'Kirim dokumen via Fedex ke Ho Chi Minh', bella.id, 'WAITING', 'NORMAL', '2026-09-11', 'Menunggu BL original dari shipping line');
      addTask(jobs[8].id, 'BANK', 'Pelunasan Akhir Buyer Nihon', 'Follow-up sisa pembayaran invoice 20326', bella.id, 'COMPLETED', 'HIGH', '2026-09-06', 'Dana sudah masuk rekening BCA Exim');
    }

    // --- FENNY TASKS ---
    if (fenny) {
      addTask(jobs[9].id, 'LOGISTICS', 'Koordinasi Trucking Cikarang - Priok', 'Jadwalkan 2 armada trailer 40ft untuk muat barang beku', fenny.id, 'IN_PROGRESS', 'CRITICAL', '2026-09-07', 'Armada kedua terlambat tiba di pabrik');
      addTask(jobs[0].id, 'DOC', 'Legalitas COO di KADIN / IPSKA', 'Pengesahan surat keterangan asal barang di kantor dinas terkait', fenny.id, 'COMPLETED', 'NORMAL', '2026-09-05', 'Sudah dilegalisir');
    }

    // --- VERA TASKS ---
    if (vera) {
      addTask(jobs[1].id, 'BANK', 'Pengecekan B/L Draft vs L/C Clause', 'Cross-check semua klausa konsinyasi dan deskripsi barang', vera.id, 'IN_PROGRESS', 'HIGH', '2026-09-09', 'Ada typo minor di nama pelabuhan muat');
      addTask(jobs[2].id, 'CC', 'Monitoring Jalur Hijau Bea Cukai', 'Monitor status billing bea keluar dan respon PPJK', vera.id, 'WAITING', 'NORMAL', '2026-09-12', 'Billing belum terbit');
    }

    // --- ERICA (DSCS) TASKS ---
    if (erica) {
      addTask(jobs[0].id, 'DSCS', 'Validasi Catch Certificate & Fishing Gear', 'Verifikasi kesesuaian dokumen tangkap nelayan lokal dengan standar Uni Eropa', erica.id, 'IN_PROGRESS', 'HIGH', '2026-09-10', 'Verifikasi kapal penangkap di perairan Arafura');
      addTask(jobs[1].id, 'DSCS', 'Verifikasi Jml FV & Species Tuna', 'Pengecekan logbook kapal penangkap dan sertifikasi juru mudi', erica.id, 'PENDING', 'NORMAL', '2026-09-11', 'Menunggu kiriman data dari Tual');
    }

    // --- UNASSIGNED TASKS (For Supervisor Dashboard) ---
    if (jobs.length > 10) {
      addTask(jobs[10].id, 'DOC', 'Penyusunan Shipping Instruction (SI)', 'Draft SI final ke pelayaran One Line', null, 'PENDING', 'HIGH', '2026-09-10', 'Belum ditugaskan ke staf');
      addTask(jobs[11].id, 'BANK', 'Verifikasi Pembukaan L/C Baru', 'Review L/C 90 days sight dari buyer Eropa', null, 'PENDING', 'NORMAL', '2026-09-11', 'Belum ditugaskan ke staf');
      addTask(jobs[12].id, 'COURIER', 'Pengiriman Dokumen Original via Courier', 'Kirim bundle dokumen ekspor ke consignee', null, 'PENDING', 'NORMAL', '2026-09-13', 'Belum ditugaskan ke staf');
    }

    console.log('✅ Successfully seeded comprehensive Phase 12 AO tasks & contexts!');
  })();
}

seedPhase12Tasks();
