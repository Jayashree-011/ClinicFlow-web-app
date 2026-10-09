import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Menu, X,
  Activity, Users, Calendar, Shield,
  Star, HeartPulse, Stethoscope,
  FlaskConical, BrainCircuit, Plus, Minus,
  Phone, Mail, MapPin, Facebook, Instagram, MessageCircle,
  LucideIcon,
} from "lucide-react";

// ─── Blue palette ──────────────────────────────────────────────────────────────
const B = {
  // Blues
  b900:  "#0c1a3a",
  b800:  "#1a2f6b",
  b700:  "#1e3a8a",
  b600:  "#1d4ed8",
  b500:  "#3b82f6",
  b400:  "#60a5fa",
  b300:  "#93c5fd",
  b200:  "#bfdbfe",
  b100:  "#dbeafe",
  b50:   "#eff6ff",
  // Slates
  s800:  "#1e293b",
  s700:  "#334155",
  s600:  "#475569",
  s400:  "#94a3b8",
  s300:  "#cbd5e1",
  s200:  "#e2e8f0",
  s100:  "#f1f5f9",
  // Whites & glass
  white:       "#ffffff",
  glass:       "rgba(255,255,255,0.18)",
  glassBorder: "rgba(255,255,255,0.3)",
  glassDark:   "rgba(255,255,255,0.08)",
} as const;

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface NavLink  { label: string; id: string }
interface Service  { icon: LucideIcon; title: string; desc: string; tag: string }
interface Step     { n: string; title: string; desc: string }
interface Review   { name: string; role: string; stars: number; text: string }
interface Faq      { q: string; a: string }
interface Stat     { n: string; l: string }

// ─── Static data ──────────────────────────────────────────────────────────────
const NAV_LINKS: NavLink[] = [
  { label: "Home",     id: "hero"         },
  { label: "Services", id: "services"     },
  { label: "FAQ",      id: "faq"          },
  { label: "About",    id: "how-it-works" },
];

const SERVICES: Service[] = [
  { icon: HeartPulse,   title: "Cardiology",      tag: "Heart",   desc: "Comprehensive heart health diagnostics and ongoing monitoring for every patient."  },
  { icon: BrainCircuit, title: "Neurology",        tag: "Brain",   desc: "Advanced neurological assessments and treatment planning for complex conditions."  },
  { icon: Stethoscope,  title: "General Medicine", tag: "Primary", desc: "Preventive care and evidence-based treatment for everyday health concerns."       },
  { icon: FlaskConical, title: "Diagnostics",      tag: "Lab",     desc: "In-house lab tests with same-day results so decisions never wait on paperwork."   },
  { icon: Users,        title: "Paediatrics",      tag: "Kids",    desc: "Child-focused care delivered in a friendly, reassuring environment."              },
  { icon: Shield,       title: "Patient Safety",   tag: "Secure",  desc: "End-to-end encrypted records, HIPAA-compliant and auditable at every step."       },
];

const STEPS: Step[] = [
  { n: "01", title: "Create your account",  desc: "Sign up in under 60 seconds — no paperwork, no waiting rooms."      },
  { n: "02", title: "Find your specialist", desc: "Browse verified doctors by specialty, availability, and rating."    },
  { n: "03", title: "Book instantly",       desc: "Pick a slot that fits your schedule — same day or in advance."      },
  { n: "04", title: "Get care & follow up", desc: "Attend your appointment and track everything in one dashboard."     },
];

const REVIEWS: Review[] = [
  { name: "Priya S.",    role: "Patient",        stars: 5, text: "Booking was effortless and the interface is genuinely beautiful. My cardiologist appointment was confirmed in seconds."  },
  { name: "Rahul M.",    role: "Patient",        stars: 5, text: "Finally a hospital system that doesn't feel like it was built in 2005. Clean, fast, and the doctors are excellent."     },
  { name: "Dr. Asha K.", role: "Specialist",     stars: 5, text: "As a doctor, managing my schedule has never been easier. ClinicFlow has saved me hours every single week."              },
  { name: "Suresh T.",   role: "Patient",        stars: 5, text: "The vitals dashboard keeps me on top of my health between visits. A product I genuinely recommend to everyone."         },
  { name: "Meera R.",    role: "Clinic Manager", stars: 5, text: "Our entire clinic runs through ClinicFlow now. Billing, records, scheduling — all in one place."                        },
  { name: "Anand V.",    role: "Patient",        stars: 5, text: "Support was incredibly responsive. Switched from another system with zero downtime during migration."                   },
];

const FAQS: Faq[] = [
  { q: "Is ClinicFlow free to use for patients?",        a: "Yes — patients can create accounts, search for doctors, and book appointments completely free of charge."                      },
  { q: "How secure is my medical data?",                 a: "We use end-to-end encryption and are fully HIPAA-compliant. Your data is never sold or shared with third parties."             },
  { q: "Can I reschedule or cancel an appointment?",     a: "Absolutely. You can reschedule or cancel up to 2 hours before your appointment slot directly from your dashboard."             },
  { q: "Which specialties are available on ClinicFlow?", a: "We currently cover 18+ specialties including Cardiology, Neurology, General Medicine, Paediatrics, Orthopaedics, and more."   },
  { q: "How do clinics join the platform?",              a: "Clinics apply through our onboarding portal. Our team verifies credentials and sets up your account within 48 hours."          },
  { q: "Is there a mobile app?",                         a: "Yes — ClinicFlow is available on iOS and Android. All features sync instantly across devices."                                 },
];

const STATS: Stat[] = [
  { n: "12k+",  l: "Patients managed"  },
  { n: "340+",  l: "Clinics worldwide" },
  { n: "18+",   l: "Specialties"       },
  { n: "99.8%", l: "Satisfaction rate" },
];

const CTA_CHECKS: string[] = [
  "Free for patients, always",
  "18+ specialties available",
  "HIPAA-compliant & encrypted",
  "Mobile app on iOS & Android",
  "Same-day diagnostics results",
  "Dedicated onboarding support",
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function Welcome(): JSX.Element {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);

  useEffect(() => {
    const fn = (): void => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const toggleFaq = (i: number): void =>
    setOpenFaq((prev) => (prev === i ? null : i));

  return (
    // ── ROOT — full-page blue gradient, no backgroundColor override ──
    <div
      style={s.root}
      className="bg-gradient-to-b from-blue-600 via-slate-300 to-blue-300"
    >
      {/* Subtle dot-grid overlay */}
      <div style={s.grid} />

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navWrap}>

          {/* Brand */}
          <button style={s.logoBtn} onClick={() => scrollTo("hero")}>
            <div style={s.logoMark}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 1v16M1 9h16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>
            <span style={s.brandName}>
              Clinic<span style={s.brandAccent}>Flow</span>
            </span>
          </button>

          {/* Centre links */}
          <div style={s.navCenter}>
            {NAV_LINKS.map((link) => (
              <button key={link.label} style={s.navLink} onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div style={s.navRight}>
            <button style={s.btnLogin}  onClick={() => navigate("/login")}>Login</button>
            <button style={s.btnSignup} onClick={() => navigate("/register")}>Sign up</button>
          </div>

          {/* Hamburger */}
          <button style={s.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div style={s.drawer}>
            {NAV_LINKS.map((link) => (
              <button key={link.label} style={s.drawerLink} onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
            <div style={s.drawerRow}>
              <button style={s.btnLogin}  onClick={() => navigate("/login")}>Login</button>
              <button style={s.btnSignup} onClick={() => navigate("/register")}>Sign up</button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section id="hero" style={s.hero}>
        {/* Left */}
        <div style={s.heroLeft}>
          <div style={s.badge}>
            <span style={s.badgeDot} />
            Healthcare Management Platform
          </div>

          <h1 style={s.heroTitle}>
            Medicine, managed<br />
            <span style={s.heroAccent}>with precision.</span>
          </h1>

          <p style={s.heroSub}>
            A unified system for patient records, appointment scheduling,
            and clinical billing — built for modern healthcare teams.
          </p>

          <div style={s.heroBtns}>
            <button style={s.btnPrimary} onClick={() => navigate("/register")}>
              Get started free <ArrowRight size={16} />
            </button>
            <button style={s.btnGlass} onClick={() => scrollTo("how-it-works")}>
              See how it works
            </button>
          </div>

          <div style={s.statsRow}>
            {STATS.map((st, i) => (
              <div key={st.n} style={s.statWrap}>
                <div style={s.statItem}>
                  <span style={s.statNum}>{st.n}</span>
                  <span style={s.statLabel}>{st.l}</span>
                </div>
                {i < STATS.length - 1 && <div style={s.statDiv} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right — doctor image */}
        <div style={s.heroRight}>
          <div style={s.docImgWrap}>
            <img
              src="./hero-doctor.png"
              alt="Doctor"
              style={s.docImg}
            />
          </div>
        </div>
      </section>

      {/* ══════════ OUR SERVICES ══════════ */}
      <section id="services" style={s.sec}>
        <div style={s.inner}>
          <p style={s.eye}>Our Services</p>
          <h2 style={s.secTitle}>Everything your clinic needs,<br />all in one place.</h2>
          <div style={s.serviceGrid}>
            {SERVICES.map((sv) => {
              const Icon = sv.icon as LucideIcon;
              return (
                <div key={sv.title} style={s.sCard}>
                  <div style={s.sTop}>
                    <div style={s.sIcon}>
                      <Icon size={20} strokeWidth={1.75} color={B.b600} />
                    </div>
                    <span style={s.sTag}>{sv.tag}</span>
                  </div>
                  <h3 style={s.sTitle}>{sv.title}</h3>
                  <p style={s.sDesc}>{sv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" style={{ ...s.sec, ...s.secDark }}>
        <div style={s.inner}>
          <p style={{ ...s.eye, color: B.b300 }}>How It Works</p>
          <h2 style={{ ...s.secTitle, color: B.white }}>Up and running in four steps.</h2>
          <div style={s.stepsGrid}>
            {STEPS.map((st) => (
              <div key={st.n} style={s.stepCard}>
                <span style={s.stepN}>{st.n}</span>
                <h3 style={s.stepTitle}>{st.title}</h3>
                <p style={s.stepDesc}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BLOCKS ══════════ */}
      <section id="blocks" style={s.sec}>
        <div style={s.inner}>
          <p style={s.eye}>Why ClinicFlow</p>
          <h2 style={s.secTitle}>Built different. Built better.</h2>
          <div style={s.blocksGrid}>

            <div style={{ ...s.block, ...s.blockBlue }}>
              <Activity size={30} strokeWidth={1.5} color={B.white} />
              <h3 style={{ ...s.blkTitle, color: B.white }}>Real-time vitals dashboard</h3>
              <p style={{ ...s.blkDesc, color: B.b200 }}>
                Monitor live patient data — heart rate, SpO₂, blood pressure — without leaving the app.
              </p>
            </div>

            <div style={s.block}>
              <Calendar size={30} strokeWidth={1.5} color={B.b600} />
              <h3 style={s.blkTitle}>Smart scheduling engine</h3>
              <p style={s.blkDesc}>
                AI-assisted slot suggestions reduce no-shows by 40% and keep your calendar full.
              </p>
            </div>

            <div style={s.block}>
              <Shield size={30} strokeWidth={1.5} color={B.b600} />
              <h3 style={s.blkTitle}>HIPAA-grade security</h3>
              <p style={s.blkDesc}>
                End-to-end encryption, role-based access, and automated audit trails — always on.
              </p>
            </div>

            <div style={{ ...s.block, ...s.blockNavy }}>
              <Users size={30} strokeWidth={1.5} color={B.b300} />
              <h3 style={{ ...s.blkTitle, color: B.white }}>Multi-clinic support</h3>
              <p style={{ ...s.blkDesc, color: B.b300 }}>
                Manage multiple branches, departments, and specialties from a single admin panel.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════ REVIEWS ══════════ */}
      <section id="reviews" style={{ ...s.sec, ...s.secDark }}>
        <div style={s.inner}>
          <p style={{ ...s.eye, color: B.b300 }}>Reviews</p>
          <h2 style={{ ...s.secTitle, color: B.white }}>Loved by patients and clinicians alike.</h2>
          <div style={s.reviewsGrid}>
            {REVIEWS.map((r) => (
              <div key={r.name} style={s.rCard}>
                <div style={s.rStars}>
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={13} fill={B.b400} color={B.b400} />
                  ))}
                </div>
                <p style={s.rText}>"{r.text}"</p>
                <div style={s.rFooter}>
                  <div style={s.rAvatar}>
                    <span style={s.rAvatarTxt}>{r.name[0]}</span>
                  </div>
                  <div>
                    <p style={s.rName}>{r.name}</p>
                    <p style={s.rRole}>{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" style={s.sec}>
        <div style={{ ...s.inner, maxWidth: 740 }}>
          <p style={s.eye}>FAQ</p>
          <h2 style={s.secTitle}>Common questions,<br />clear answers.</h2>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} style={s.faqItem}>
                <button style={s.faqQ} onClick={() => toggleFaq(i)}>
                  <span>{faq.q}</span>
                  {openFaq === i
                    ? <Minus size={16} color={B.b600} />
                    : <Plus  size={16} color={B.s600} />
                  }
                </button>
                {openFaq === i && <p style={s.faqA}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section id="cta" style={s.ctaBanner}>
        <div style={s.ctaInner}>
          <div style={s.ctaLeft}>
            <p style={s.ctaEye}>Get started today</p>
            <h2 style={s.ctaTitle}>Ready to modernise<br />your clinic?</h2>
            <p style={s.ctaSub}>
              Join 340+ clinics already on ClinicFlow. Set up in under 10 minutes — no credit card required.
            </p>
            <div style={s.ctaBtns}>
              <button style={s.btnPrimary} onClick={() => navigate("/register")}>
                Start for free <ArrowRight size={16} />
              </button>
              <button style={s.ctaBtnOutline} onClick={() => navigate("/login")}>
                Staff login
              </button>
            </div>
          </div>
          <div style={s.ctaRight}>
            {CTA_CHECKS.map((line) => (
              <div key={line} style={s.ctaCheck}>
                <div style={s.ctaCheckDot} />
                <span style={s.ctaCheckTxt}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={s.footer}>
        <div style={s.footerInner}>

          <div style={s.fCol}>
            <div style={s.footerBrand}>
              <div style={s.footerLogoMark}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1v16M1 9h16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={s.footerBrandName}>
                Clinic<span style={s.footerBrandAccent}>Flow</span>
              </span>
            </div>
            <p style={s.fTagline}>Modern solutions for modern healthcare.</p>
            <div style={s.socials}>
              {([Facebook, Instagram, MessageCircle] as LucideIcon[]).map((Icon, i) => (
                <a key={i} style={s.social} aria-label="social">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div style={s.fCol}>
            <p style={s.fHead}>Platform</p>
            {["Home","Services","Doctors","How it works","Pricing"].map(l => (
              <p key={l} style={s.fLink}>{l}</p>
            ))}
          </div>

          <div style={s.fCol}>
            <p style={s.fHead}>Company</p>
            {["About us","Careers","Blog","Press","Privacy policy"].map(l => (
              <p key={l} style={s.fLink}>{l}</p>
            ))}
          </div>

          <div style={s.fCol}>
            <p style={s.fHead}>Contact</p>
            <p style={s.fContact}><Mail size={13} color={B.b400} />&nbsp;clinicflow@example.com</p>
            <p style={s.fContact}><Phone size={13} color={B.b400} />&nbsp;+91 98765 43210</p>
            <p style={s.fContact}><MapPin size={13} color={B.b400} />&nbsp;Kolkata, West Bengal</p>
          </div>

        </div>

        <div style={s.footerBottom}>
          <span style={s.fCopy}>© 2026 ClinicFlow. All rights reserved.</span>
          <div style={s.fBLinks}>
            {["Terms","Privacy","Cookies"].map(l => (
              <span key={l} style={s.fBLink}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {

  root: {
  minHeight: "100vh",
  fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
  color: "#0a0a0a",
  position: "relative",
  overflowX: "hidden",
},

  // Dot-grid overlay
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)",
      "linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)",
    ].join(","),
    backgroundSize: "52px 52px",
    pointerEvents: "none", zIndex: 0,
  },

  // ── NAVBAR ──
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    backgroundColor: "rgba(30,58,138,0.85)",       // b700 translucent
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(147,197,253,0.2)", // b300 tint
    transition: "box-shadow 0.25s, border-color 0.25s",
  },
  navScrolled: {
    boxShadow: "0 4px 32px rgba(12,26,58,0.4)",
    borderBottom: "1px solid rgba(147,197,253,0.35)",
  },
  navWrap: {
    maxWidth: 1160, margin: "0 auto", padding: "0 32px",
    height: 66, display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 16,
  },
  logoBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 0, display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
  },
  logoMark: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: B.b500,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandName: { fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: B.white },
  brandAccent: { color: B.b300 },
  navCenter: {
    display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center",
  },
  navLink: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 500,
    color: "rgba(219,234,254,0.8)",   // b100 muted
    padding: "8px 16px", borderRadius: 8, letterSpacing: "-0.01em",
    transition: "color 0.15s",
  },
  navRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  btnLogin: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 500,
    color: "rgba(219,234,254,0.85)",
    padding: "8px 16px", borderRadius: 8,
  },
  btnSignup: {
    backgroundColor: B.b500, border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 700, color: B.white,
    padding: "9px 22px", borderRadius: 9, letterSpacing: "-0.01em",
    boxShadow: "0 2px 12px rgba(59,130,246,0.5)",
  },
  hamburger: {
    display: "none", background: "none", border: "none",
    cursor: "pointer", color: B.b100, padding: 6, marginLeft: 4,
  },
  drawer: {
    padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: 0,
    borderTop: "1px solid rgba(147,197,253,0.15)",
    backgroundColor: B.b800,
  },
  drawerLink: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 15, fontWeight: 500, color: B.b200,
    padding: "12px 8px", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  drawerRow: { display: "flex", gap: 10, marginTop: 16 },

  // ── HERO ──
  hero: {
    position: "relative", zIndex: 1,
    maxWidth: 1160, margin: "0 auto",
    padding: "96px 32px 80px",
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 72, alignItems: "center",
  },
  heroLeft: { display: "flex", flexDirection: "column", gap: 28 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.4)",
    color: B.b900,
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", padding: "6px 16px",
    borderRadius: 100, width: "fit-content",
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: "50%",
    backgroundColor: B.b700, display: "inline-block",
  },
  heroTitle: {
    fontSize: 54, fontWeight: 800, lineHeight: 1.07,
    letterSpacing: "-0.04em", margin: 0,
    color: B.b900,
  },
  heroAccent: { color: B.b700 },
  heroSub: {
    fontSize: 16, lineHeight: 1.75, color: B.b800,
    margin: 0, fontWeight: 400, maxWidth: 480,
  },
  heroBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 8,
    backgroundColor: B.b700, color: B.white,
    border: "none", borderRadius: 10,
    padding: "13px 26px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", letterSpacing: "-0.01em",
    boxShadow: "0 4px 20px rgba(29,78,216,0.4)",
  },
  btnGlass: {
    backgroundColor: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(8px)",
    border: "1.5px solid rgba(255,255,255,0.5)",
    borderRadius: 10, padding: "12px 24px",
    fontSize: 15, fontWeight: 600, cursor: "pointer",
    color: B.b900,
  },
  statsRow: { display: "flex", alignItems: "center", flexWrap: "wrap" },
  statWrap: { display: "flex", alignItems: "center" },
  statItem: { display: "flex", flexDirection: "column", gap: 2, padding: "0 24px 0 0" },
  statNum: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: B.b900 },
  statLabel: { fontSize: 11, color: B.b800 },
  statDiv: { width: 1, height: 36, backgroundColor: "rgba(30,58,138,0.2)", marginRight: 24 },

  // Doctor image
  heroRight: { position: "relative" },
  docImgWrap: {
    borderRadius: 24, overflow: "hidden",
    boxShadow: "0 24px 80px rgba(12,26,58,0.25), 0 4px 24px rgba(59,130,246,0.2)",
    height: 520,
  },
  docImg: {
    width: "100%", height: "100%",
    objectFit: "cover", objectPosition: "center top", display: "block",
  },

  // ── SHARED SECTION ──
  sec: {
    position: "relative", zIndex: 1, padding: "96px 0",
    backgroundColor: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(12px)",
  },
  secDark: {
    backgroundColor: "rgba(30,58,138,0.88)",
    backdropFilter: "blur(12px)",
  },
  inner: { maxWidth: 1160, margin: "0 auto", padding: "0 32px" },
  eye: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: B.b600, marginBottom: 14,
  },
  secTitle: {
    fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em",
    color: B.b900, margin: "0 0 52px", lineHeight: 1.15,
  },

  // Services
  serviceGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 },
  sCard: {
    padding: "28px 24px", borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(147,197,253,0.4)",
    backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column", gap: 12,
    boxShadow: "0 2px 16px rgba(59,130,246,0.07)",
  },
  sTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sIcon: {
    width: 44, height: 44, borderRadius: 11,
    backgroundColor: B.b100,
    border: `1px solid ${B.b200}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  sTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", color: B.b700,
    backgroundColor: B.b100, padding: "4px 10px", borderRadius: 100,
    border: `1px solid ${B.b200}`,
  },
  sTitle: { fontSize: 16, fontWeight: 700, color: B.b900, margin: 0, letterSpacing: "-0.01em" },
  sDesc: { fontSize: 13, color: B.s700, lineHeight: 1.65, margin: 0 },

  // Steps
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },
  stepCard: {
    padding: "28px 22px", borderRadius: 16,
    backgroundColor: B.glass,
    border: "1px solid rgba(147,197,253,0.25)",
    backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column", gap: 12,
  },
  stepN: { fontSize: 36, fontWeight: 900, color: "rgba(147,197,253,0.5)", letterSpacing: "-0.04em", lineHeight: 1 },
  stepTitle: { fontSize: 15, fontWeight: 700, color: B.white, margin: 0 },
  stepDesc: { fontSize: 13, color: B.b200, lineHeight: 1.65, margin: 0 },

  // Blocks
  blocksGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 },
  block: {
    padding: "36px 32px", borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(147,197,253,0.35)",
    backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "0 2px 16px rgba(59,130,246,0.07)",
  },
  blockBlue: {
    backgroundColor: B.b600,
    border: `1px solid ${B.b500}`,
    boxShadow: "0 8px 32px rgba(29,78,216,0.35)",
  },
  blockNavy: {
    backgroundColor: B.b800,
    border: "1px solid rgba(147,197,253,0.15)",
  },
  blkTitle: { fontSize: 18, fontWeight: 700, color: B.b900, margin: 0, letterSpacing: "-0.015em" },
  blkDesc: { fontSize: 14, color: B.s700, lineHeight: 1.7, margin: 0 },

  // Reviews
  reviewsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 },
  rCard: {
    padding: "26px 24px", borderRadius: 16,
    backgroundColor: B.glass,
    border: "1px solid rgba(147,197,253,0.2)",
    backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column", gap: 14,
  },
  rStars: { display: "flex", gap: 3 },
  rText: { fontSize: 13, color: B.b200, lineHeight: 1.7, margin: 0, fontStyle: "italic", flexGrow: 1 },
  rFooter: { display: "flex", alignItems: "center", gap: 10, marginTop: "auto" },
  rAvatar: {
    width: 34, height: 34, borderRadius: "50%",
    backgroundColor: B.b600,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  rAvatarTxt: { fontSize: 12, fontWeight: 800, color: B.white },
  rName: { fontSize: 13, fontWeight: 700, margin: 0, color: B.white },
  rRole: { fontSize: 11, color: B.b300, margin: 0 },

  // FAQ
  faqItem: { borderBottom: "1px solid rgba(147,197,253,0.25)" },
  faqQ: {
    width: "100%", background: "none", border: "none", cursor: "pointer",
    padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 15, fontWeight: 600, color: B.b900,
    textAlign: "left", gap: 16, letterSpacing: "-0.01em",
  },
  faqA: {
    fontSize: 14, color: B.s600, lineHeight: 1.75,
    margin: "0 0 20px", paddingRight: 32,
  },

  // CTA Banner
  ctaBanner: {
    position: "relative", zIndex: 1,
    backgroundColor: B.b900, padding: "88px 0",
  },
  ctaInner: {
    maxWidth: 1160, margin: "0 auto", padding: "0 32px",
    display: "grid", gridTemplateColumns: "1.15fr 0.85fr",
    gap: 72, alignItems: "center",
  },
  ctaLeft: { display: "flex", flexDirection: "column", gap: 24 },
  ctaEye: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: B.b400, margin: 0,
  },
  ctaTitle: { fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", color: B.white, margin: 0, lineHeight: 1.1 },
  ctaSub: { fontSize: 15, color: B.b300, lineHeight: 1.75, margin: 0 },
  ctaBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
  ctaBtnOutline: {
    backgroundColor: "transparent",
    border: "1.5px solid rgba(147,197,253,0.3)",
    borderRadius: 10, padding: "12px 24px",
    fontSize: 15, fontWeight: 500, cursor: "pointer", color: B.white,
  },
  ctaRight: { display: "flex", flexDirection: "column", gap: 16 },
  ctaCheck: { display: "flex", alignItems: "center", gap: 12 },
  ctaCheckDot: {
    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
    backgroundColor: "rgba(59,130,246,0.2)",
    border: `1.5px solid ${B.b500}`,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "10px",
  },
  ctaCheckTxt: { fontSize: 14, color: B.b200 },

  // Footer
  footer: {
    backgroundColor: B.b900, color: B.white,
    padding: "64px 0 0", position: "relative", zIndex: 1,
    borderTop: `1px solid rgba(147,197,253,0.1)`,
  },
  footerInner: {
    maxWidth: 1160, margin: "0 auto", padding: "0 32px 52px",
    display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40,
  },
  fCol: { display: "flex", flexDirection: "column", gap: 10 },
  footerBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  footerLogoMark: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: B.b600,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  footerBrandName: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: B.white },
  footerBrandAccent: { color: B.b400 },
  fTagline: { fontSize: 13, color: B.b400, margin: 0, lineHeight: 1.6 },
  socials: { display: "flex", gap: 8, marginTop: 4 },
  social: {
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid rgba(147,197,253,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: B.b400, cursor: "pointer",
  },
  fHead: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: B.b400, margin: "0 0 6px",
  },
  fLink: { fontSize: 13, color: B.b300, cursor: "pointer", margin: 0 },
  fContact: { fontSize: 13, color: B.b300, margin: 0, display: "flex", alignItems: "center", gap: 8 },
  footerBottom: {
    maxWidth: 1160, margin: "0 auto", padding: "20px 32px",
    borderTop: "1px solid rgba(147,197,253,0.08)",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 12,
  },
  fCopy: { fontSize: 12, color: B.b400 },
  fBLinks: { display: "flex", gap: 20 },
  fBLink: { fontSize: 12, color: B.b400, cursor: "pointer" },
};