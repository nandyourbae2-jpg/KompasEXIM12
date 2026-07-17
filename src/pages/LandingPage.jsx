import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Ship, Anchor, Map, FileText, DollarSign, LayoutDashboard, X, ChevronRight } from 'lucide-react';

const bannerQuotes = [
  "Arah yang jelas, tim yang solid. Mari selesaikan minggu ini!",
  "Setiap kontainer yang tepat waktu adalah kepercayaan yang terjaga 🚢",
  "3 tugas menanti hari ini — yuk mulai dari yang paling dekat tenggatnya!",
  "Dokumen yang rapi hari ini, klaim yang lancar besok."
];

const howToSteps = [
  { title: "Login sesuai tipe akses", desc: "Pilih tipe akses (Manager, Supervisor, atau Staff Departemen). Jika Staff, pilih departemen Anda (Import, Export, Account Officer, atau Administrasi Export). Masukkan Employee ID dan password." },
  { title: "Kelola tugas di Peta Tugas", desc: "Lihat, pindahkan, dan tambahkan tugas sesuai alur kerja departemenmu." },
  { title: "Upload & kelola dokumen shipment", desc: "Semua dokumen B/L, PIB, packing list tersimpan rapi dengan versi yang jelas." },
  { title: "Pantau pembayaran vendor real-time", desc: "Lihat status tagihan dan realisasi pembayaran kapan saja." }
];

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Banner Carousel State
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  
  // How-to Tabs State
  const [activeStep, setActiveStep] = useState(0);

  // Hover States for Features
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    if (!showBanner) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % bannerQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showBanner]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top App Bar */}
      <div style={{ height: '44px', backgroundColor: 'var(--color-surface-black)', color: 'var(--color-on-dark)', display: 'flex', alignItems: 'center', padding: '0 var(--spacing-lg)' }}>
        <span style={{ fontSize: '12px', fontWeight: '600' }}>PT Pahala Bahari Nusantara</span>
      </div>

      {/* Banner Reminder Carousel */}
      {showBanner && (
        <div style={{ backgroundColor: 'var(--color-canvas-parchment)', padding: '16px 24px', textAlign: 'center', borderBottom: '1px solid var(--color-hairline)', position: 'relative' }}>
          <div style={{ position: 'relative', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {bannerQuotes.map((quote, idx) => (
              <p 
                key={idx} 
                style={{ 
                  position: 'absolute',
                  fontSize: '15px', 
                  color: 'var(--color-ink)',
                  margin: 0,
                  opacity: bannerIndex === idx ? 1 : 0,
                  transition: 'opacity 0.8s ease-in-out',
                  pointerEvents: bannerIndex === idx ? 'auto' : 'none'
                }}
              >
                {quote}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
            {bannerQuotes.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  backgroundColor: bannerIndex === idx ? 'var(--color-ink)' : 'var(--color-ink-muted-48)',
                  transition: 'background-color 0.3s'
                }}
              />
            ))}
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-80)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div style={{ padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '56px', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '16px', color: 'var(--color-ink)' }}>
          Kompas EXIM
        </h1>
        <p style={{ fontSize: '28px', color: 'var(--color-ink-muted-80)', marginBottom: '48px', maxWidth: '600px', lineHeight: '1.3' }}>
          Satu arah, semua departemen terlihat — tak ada tugas yang tersesat.
        </p>
        
        {/* SVG Illustration Focus */}
        <div style={{ 
          width: '180px', height: '180px', 
          backgroundColor: 'var(--color-canvas)', 
          borderRadius: '50%', 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: 'var(--shadow-product)',
          marginBottom: '48px'
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
          </svg>
        </div>

        <Button variant="primary" onClick={() => navigate('/login')} style={{ fontSize: '18px', padding: '14px 32px' }}>
          Masuk ke Workspace
        </Button>
      </div>

      {/* Cara Penggunaan Section */}
      <div style={{ backgroundColor: 'var(--color-surface-tile-1)', padding: '100px 24px', color: 'var(--color-on-dark)' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', fontWeight: '600', textAlign: 'center', marginBottom: '64px' }}>
            Cara Penggunaan
          </h2>

          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
            {/* Tabs List */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {howToSteps.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '20px 24px',
                    borderRadius: 'var(--rounded-md)',
                    cursor: 'pointer',
                    backgroundColor: activeStep === idx ? 'var(--color-surface-tile-2)' : 'transparent',
                    borderLeft: activeStep === idx ? '3px solid var(--color-primary-on-dark)' : '3px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '17px', fontWeight: '600', color: activeStep === idx ? 'var(--color-body-on-dark)' : 'var(--color-ink-muted-48)' }}>
                    {idx + 1}. {step.title}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Content */}
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', minHeight: '300px', backgroundColor: 'var(--color-surface-tile-3)', borderRadius: 'var(--rounded-lg)', padding: '48px' }}>
              <div key={activeStep} style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                <div style={{ fontFamily: 'var(--font-family-display)', fontSize: '64px', fontWeight: '700', color: 'var(--color-primary-on-dark)', opacity: 0.2, marginBottom: '-20px' }}>
                  0{activeStep + 1}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-on-dark)' }}>
                  {howToSteps[activeStep].title}
                </h3>
                <p style={{ fontSize: '17px', color: 'var(--color-body-muted)', lineHeight: '1.5' }}>
                  {howToSteps[activeStep].desc}
                </p>
                <div style={{ marginTop: '32px', color: 'var(--color-primary-on-dark)', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Pelajari lebih lanjut <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fitur Unggulan */}
      <div style={{ padding: '100px 24px', maxWidth: '1024px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', textAlign: 'center', marginBottom: '64px' }}>Fitur Unggulan</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          
          {[
            { icon: <Map size={32} />, title: "Peta Tugas", desc: "Kelola dan lacak tugas secara real-time." },
            { icon: <FileText size={32} />, title: "Manajemen Dokumen", desc: "Satu tempat untuk semua dokumen shipment." },
            { icon: <DollarSign size={32} />, title: "Monitoring Pembayaran", desc: "Pantau tagihan vendor dan pembayaran." },
            { icon: <LayoutDashboard size={32} />, title: "Dashboard Manager", desc: "Visibilitas penuh untuk Manager." }
          ].map((feature, idx) => (
            <div 
              key={idx}
              onMouseEnter={() => setHoveredFeature(idx)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{ 
                padding: 'var(--spacing-lg)', 
                borderRadius: 'var(--rounded-lg)', 
                backgroundColor: 'var(--color-canvas)', 
                border: hoveredFeature === idx ? '1px solid var(--color-primary-focus)' : '1px solid var(--color-hairline)',
                textAlign: 'center',
                transition: 'border-color 0.3s ease'
              }}
            >
              <div style={{ color: 'var(--color-primary)', marginBottom: '16px', display: 'inline-block' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>{feature.desc}</p>
            </div>
          ))}

        </div>
      </div>

      {/* Struktur Departemen EXIM */}
      <div style={{ padding: '0 24px 120px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '34px', textAlign: 'center', marginBottom: '64px' }}>Struktur Departemen EXIM</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Root Node */}
          <div style={{ padding: '12px 24px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', fontWeight: '600', fontSize: '15px' }}>
            Departemen EXIM
          </div>
          
          {/* Vertical Line */}
          <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-hairline)' }}></div>
          
          {/* Children Tree */}
          <div style={{ display: 'flex', position: 'relative', width: '100%', gap: '24px' }}>
            {/* Top horizontal connecting line (covers from center of first child to center of last child) */}
            <div style={{ position: 'absolute', top: 0, left: '12.5%', right: '12.5%', height: '1px', backgroundColor: 'var(--color-hairline)' }}></div>
            
            {[
              { title: 'Import', desc: 'Menangani clearance, PIB, DND, dan koordinasi trucking.' },
              { title: 'Export', desc: 'Menangani B/L, COO, packing list, dan SO ekspor.' },
              { title: 'Administrasi Export (AE)', desc: 'Menangani quotation, koordinasi vendor, dan asuransi kargo.' },
              { title: 'Account Officer', desc: 'Menangani invoice dan rekonsiliasi tagihan vendor.' },
            ].map((dept, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-hairline)' }}></div>
                <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', padding: '16px', textAlign: 'center', width: '100%' }}>
                  <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>{dept.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>{dept.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', backgroundColor: 'var(--color-canvas-parchment)', padding: '64px', textAlign: 'center', color: 'var(--color-ink-muted-80)', fontSize: '12px' }}>
        PT Pahala Bahari Nusantara © 2026. Internal IT Support.
      </div>
      
      {/* Keyframe for fadeIn animation added via global styles or inline style tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
