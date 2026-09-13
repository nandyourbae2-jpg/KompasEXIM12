-- FASE 3: Tambahan struktur tabel untuk Handover AE ke AO
ALTER TABLE handover_events ADD COLUMN sender_id INTEGER REFERENCES users(id);
ALTER TABLE handover_events ADD COLUMN is_urgent_force INTEGER DEFAULT 0;
