import type { EncounterStatus, ProblemStatus, VitalThreshold, EncounterTemplate } from './types';

export const VISIT_TYPES = [
  'Routine Check-up', 'Follow-up', 'Urgent Care', 'Consultation',
  'Telemedicine', 'Procedure', 'Emergency',
];

export const STATUS_META: Record<EncounterStatus, { label: string; color: string; bg: string; dot: string }> = {
  IN_PROGRESS: { label: 'In Progress',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',       dot: 'bg-amber-400'   },
  COMPLETED:   { label: 'Completed',    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',         dot: 'bg-blue-400'    },
  SIGNED:      { label: 'Signed',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-500' },
  CANCELLED:   { label: 'Cancelled',    color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',         dot: 'bg-rose-400'    },
};

export const COMMON_ICD10 = [
  { code: 'I10',     desc: 'Essential hypertension' },
  { code: 'E11.9',   desc: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9',   desc: 'Acute upper respiratory infection, unspecified' },
  { code: 'J44.1',   desc: 'COPD with acute exacerbation' },
  { code: 'N39.0',   desc: 'Urinary tract infection, site not specified' },
  { code: 'K21.0',   desc: 'GERD with esophagitis' },
  { code: 'M54.5',   desc: 'Low back pain' },
  { code: 'F32.9',   desc: 'Major depressive disorder, single episode, unspecified' },
  { code: 'J18.9',   desc: 'Pneumonia, unspecified organism' },
  { code: 'A09',     desc: 'Gastroenteritis and colitis of infectious origin' },
  { code: 'E78.5',   desc: 'Hyperlipidemia, unspecified' },
  { code: 'I25.10',  desc: 'Atherosclerotic heart disease, native coronary artery' },
  { code: 'I50.9',   desc: 'Heart failure, unspecified' },
  { code: 'N18.9',   desc: 'Chronic kidney disease, unspecified' },
  { code: 'J45.909', desc: 'Unspecified asthma, uncomplicated' },
  { code: 'R05.9',   desc: 'Cough, unspecified' },
  { code: 'R51.9',   desc: 'Headache, unspecified' },
  { code: 'R73.09',  desc: 'Other abnormal glucose' },
  { code: 'E55.9',   desc: 'Vitamin D deficiency, unspecified' },
  { code: 'M79.3',   desc: 'Panniculitis, unspecified' },
  { code: 'Z79.4',   desc: 'Long-term (current) use of insulin' },
  { code: 'I48.91',  desc: 'Unspecified atrial fibrillation' },
  { code: 'K92.1',   desc: 'Melena' },
  { code: 'R10.9',   desc: 'Unspecified abdominal pain' },
  { code: 'R55',     desc: 'Syncope and collapse' },
];

export const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'htn-followup', name: 'Hypertension Follow-up',
    visitType: 'Follow-up',
    chiefComplaint: 'Hypertension follow-up — blood pressure monitoring',
    soap: {
      subjective: 'Patient presents for hypertension follow-up. Reports medication compliance. Denies headache, dizziness, chest pain, or shortness of breath.',
      objective: 'Vitals pending. General: well-appearing, in no acute distress.',
      assessment: 'Essential hypertension (ICD: I10) — [controlled / uncontrolled].',
      plan: '1. Continue antihypertensive therapy\n2. Lifestyle modification counselling\n3. Labs: BMP if on ACE inhibitor/ARB\n4. Return in 4–8 weeks',
    },
  },
  {
    id: 'dm-followup', name: 'Diabetes Follow-up',
    visitType: 'Follow-up',
    chiefComplaint: 'Type 2 diabetes mellitus follow-up — glycaemic control review',
    soap: {
      subjective: 'Patient presents for diabetes review. Reports [adherent / non-adherent] with medications and diet. Denies hypoglycaemic episodes, polyuria, or polydipsia.',
      objective: 'Vitals pending. Foot examination: [normal / abnormal].',
      assessment: 'Type 2 DM (ICD: E11.9) — [controlled / uncontrolled]. HbA1c: [value].',
      plan: '1. Continue / adjust diabetes medications\n2. Review blood glucose log\n3. Labs: HbA1c, fasting lipids, urine microalbumin\n4. Ophthalmology referral if overdue\n5. Return in 3 months',
    },
  },
  {
    id: 'routine-checkup', name: 'Annual Health Check',
    visitType: 'Routine Check-up',
    chiefComplaint: 'Annual health examination — no acute complaints',
    soap: {
      subjective: 'Patient presents for annual review. No acute complaints. Chronic conditions and medications reviewed.',
      objective: 'Vitals pending. Comprehensive physical examination performed.',
      assessment: 'Annual health examination completed. All chronic conditions [stable / reviewed].',
      plan: '1. Vaccinations updated as indicated\n2. Cancer screening per guidelines\n3. Labs: CBC, CMP, lipid panel\n4. Return in 12 months',
    },
  },
  {
    id: 'uri', name: 'Upper Respiratory Infection',
    visitType: 'Urgent Care',
    chiefComplaint: 'Upper respiratory tract infection — cough, congestion, sore throat',
    soap: {
      subjective: 'Patient presents with [X] days of cough, nasal congestion, and sore throat. Denies fever >38.5 °C, difficulty breathing, or ear pain.',
      objective: 'Vitals pending. HEENT: [findings]. Lungs: clear to auscultation bilaterally.',
      assessment: 'Viral upper respiratory infection (ICD: J06.9). No features of bacterial pharyngitis.',
      plan: '1. Supportive care: rest, hydration, analgesics\n2. Saline nasal rinse\n3. Return if worsening or fever persists >5 days',
    },
  },
  {
    id: 'chest-pain', name: 'Chest Pain Assessment',
    visitType: 'Urgent Care',
    chiefComplaint: 'Chest pain — onset, character and severity to be documented',
    soap: {
      subjective: 'Patient presents with chest pain. Onset: [time]. Quality: [sharp / dull / pressure]. Radiation: [arm / jaw / back / none]. Severity: [/10]. Associated: [SOB / diaphoresis / nausea].',
      objective: 'Vitals: [CRITICAL — HR, BP, SpO₂ immediately]. Cardiac: [regular / irregular]. Lungs: [clear / crackles].',
      assessment: 'Chest pain — differential: [ACS / pleurisy / GERD / musculoskeletal / PE]. Risk stratification required.',
      plan: '1. 12-lead ECG immediately\n2. Troponin ×2, BNP if indicated\n3. CXR\n4. Aspirin 300 mg if ACS suspected\n5. Cardiology consult if high risk',
    },
  },
];

export const VITAL_THRESHOLDS: Record<string, VitalThreshold> = {
  systolic:    { min: 90,   max: 140,  criticalMin: 80,   criticalMax: 180,  unit: 'mmHg' },
  diastolic:   { min: 60,   max: 90,   criticalMin: 50,   criticalMax: 120,  unit: 'mmHg' },
  heartRate:   { min: 60,   max: 100,  criticalMin: 40,   criticalMax: 140,  unit: 'bpm'  },
  temperature: { min: 36.1, max: 37.5, criticalMin: 35.0, criticalMax: 39.5, unit: '°C'   },
  spo2:        { min: 95,   max: 100,  criticalMin: 88,                       unit: '%'    },
  rr:          { min: 12,   max: 20,   criticalMin: 8,    criticalMax: 30,   unit: '/min' },
};

export const PROBLEM_STATUS_META: Record<ProblemStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  ACTIVE:   { label: 'Active',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-400',   border: 'border-amber-200'  },
  INACTIVE: { label: 'Inactive', color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400',   border: 'border-slate-200'  },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

export const EMPTY_ADD_FORM = { code: '', icdCode: '', description: '', onsetDate: '' };
