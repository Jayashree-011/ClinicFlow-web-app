import {
  HeartPulse, BrainCircuit, Stethoscope,
  FlaskConical, Users, Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLink  { label: string; id: string }
export interface Service  { icon: LucideIcon; title: string; desc: string; tag: string }
export interface Step     { n: string; title: string; desc: string }
export interface Review   { name: string; role: string; stars: number; text: string }
export interface Faq      { q: string; a: string }
export interface Stat     { n: string; l: string }

export const NAV_LINKS: NavLink[] = [
  { label: "Home",     id: "hero"         },
  { label: "Services", id: "services"     },
  { label: "Doctors",  id: "doctors"      },
  { label: "About",    id: "how-it-works" },
];

export const SERVICES: Service[] = [
  { icon: HeartPulse,   title: "Cardiology",      tag: "Heart",   desc: "Comprehensive heart health diagnostics and ongoing monitoring for every patient."  },
  { icon: BrainCircuit, title: "Neurology",        tag: "Brain",   desc: "Advanced neurological assessments and treatment planning for complex conditions."  },
  { icon: Stethoscope,  title: "General Medicine", tag: "Primary", desc: "Preventive care and evidence-based treatment for everyday health concerns."       },
  { icon: FlaskConical, title: "Diagnostics",      tag: "Lab",     desc: "In-house lab tests with same-day results so decisions never wait on paperwork."   },
  { icon: Users,        title: "Paediatrics",      tag: "Kids",    desc: "Child-focused care delivered in a friendly, reassuring environment."              },
  { icon: Shield,       title: "Patient Safety",   tag: "Secure",  desc: "End-to-end encrypted records, HIPAA-compliant and auditable at every step."       },
];

export const STEPS: Step[] = [
  { n: "01", title: "Create your account",  desc: "Sign up in under 60 seconds — no paperwork, no waiting rooms."      },
  { n: "02", title: "Find your specialist", desc: "Browse verified doctors by specialty, availability, and rating."    },
  { n: "03", title: "Book instantly",       desc: "Pick a slot that fits your schedule — same day or in advance."      },
  { n: "04", title: "Get care & follow up", desc: "Attend your appointment and track everything in one dashboard."     },
];

export const REVIEWS: Review[] = [
  { name: "Priya S.",    role: "Patient",        stars: 5, text: "Booking was effortless and the interface is genuinely beautiful. My cardiologist appointment was confirmed in seconds."  },
  { name: "Rahul M.",    role: "Patient",        stars: 5, text: "Finally a hospital system that doesn't feel like it was built in 2005. Clean, fast, and the doctors are excellent."     },
  { name: "Dr. Asha K.", role: "Specialist",     stars: 5, text: "As a doctor, managing my schedule has never been easier. ClinicFlow has saved me hours every single week."              },
  { name: "Suresh T.",   role: "Patient",        stars: 5, text: "The vitals dashboard keeps me on top of my health between visits. A product I genuinely recommend to everyone."         },
  { name: "Meera R.",    role: "Clinic Manager", stars: 5, text: "Our entire clinic runs through ClinicFlow now. Billing, records, scheduling — all in one place."                        },
  { name: "Anand V.",    role: "Patient",        stars: 5, text: "Support was incredibly responsive. Switched from another system with zero downtime during migration."                   },
];

export const FAQS: Faq[] = [
  { q: "Is ClinicFlow free to use for patients?",        a: "Yes — patients can create accounts, search for doctors, and book appointments completely free of charge."                      },
  { q: "How secure is my medical data?",                 a: "We use end-to-end encryption and are fully HIPAA-compliant. Your data is never sold or shared with third parties."             },
  { q: "Can I reschedule or cancel an appointment?",     a: "Absolutely. You can reschedule or cancel up to 2 hours before your appointment slot directly from your dashboard."             },
  { q: "Which specialties are available on ClinicFlow?", a: "We currently cover 18+ specialties including Cardiology, Neurology, General Medicine, Paediatrics, Orthopaedics, and more."   },
  { q: "How do clinics join the platform?",              a: "Clinics apply through our onboarding portal. Our team verifies credentials and sets up your account within 48 hours."          },
  { q: "Is there a mobile app?",                         a: "Yes — ClinicFlow is available on iOS and Android. All features sync instantly across devices."                                 },
];

export const STATS: Stat[] = [
  { n: "12k+",  l: "Patients managed"  },
  { n: "340+",  l: "Clinics worldwide" },
  { n: "18+",   l: "Specialties"       },
  { n: "99.8%", l: "Satisfaction rate" },
];

export const CTA_CHECKS: string[] = [
  "Free for patients, always",
  "18+ specialties available",
  "HIPAA-compliant & encrypted",
  "Mobile app on iOS & Android",
  "Same-day diagnostics results",
  "Dedicated onboarding support",
];