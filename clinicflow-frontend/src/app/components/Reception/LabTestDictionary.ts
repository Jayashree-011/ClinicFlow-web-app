// ── Types ─────────────────────────────────────────────────────────────────────

export type LabOrderStatus = "ORDERED" | "COLLECTED" | "PROCESSING" | "COMPLETED";

/** Matches backend LabResult.Flag enum exactly (uppercase) */
export type ResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL";

export interface TestMeta {
  code:      string;
  name:      string;
  panel:     string;
  units:     string;
  range:     string;    // human-readable for display:  "4.5 – 11.0"
  rangeJson: string;    // JSON for backend validateAndSetFlag: '{"min":4.5,"max":11.0}'
}

/** Mirrors backend LabOrderDTO */
export interface LabOrder {
  labOrderId?:  number;
  encounterId:  number;
  patientId:    number;
  orderedBy:    number;
  testsJson:    string;   // JSON-encoded string[], e.g. '["LAB-CBC","LAB-HGB"]'
  sampleId?:    string;
  collectedAt?: string;   // LocalDateTime: "yyyy-MM-ddTHH:mm:ss" (no Z)
  status:       LabOrderStatus;
  resultUri?:   string;
}

/** Mirrors backend LabResultDTO */
export interface LabResult {
  resultId?:          number;
  labOrderId?:        number;
  testCode:           string;
  resultValue:        string;
  units:              string;
  referenceRangeJson: string;  // JSON: '{"min":4.5,"max":11.0,"criticalMin":2.0}'
  flag:               ResultFlag;
  reportedAt?:        string;  // LocalDateTime: "yyyy-MM-ddTHH:mm:ss" (no Z)
  reportedBy?:        number;
}

// ── Test Dictionary ───────────────────────────────────────────────────────────

export const CLINIC_TEST_DICTIONARY: TestMeta[] = [
  // Hematology
  { code: "LAB-CBC",  name: "Complete Blood Count",              panel: "Hematology",          units: "10³/µL", range: "4.5 – 11.0",   rangeJson: '{"min":4.5,"max":11.0,"criticalMin":2.0,"criticalMax":20.0}' },
  { code: "LAB-HGB",  name: "Hemoglobin",                        panel: "Hematology",          units: "g/dL",   range: "12.0 – 17.5",  rangeJson: '{"min":12.0,"max":17.5,"criticalMin":7.0,"criticalMax":20.0}' },
  { code: "LAB-HCT",  name: "Hematocrit",                        panel: "Hematology",          units: "%",      range: "36 – 52",      rangeJson: '{"min":36,"max":52,"criticalMin":20,"criticalMax":60}' },
  { code: "LAB-PLT",  name: "Platelet Count",                    panel: "Hematology",          units: "10³/µL", range: "150 – 400",    rangeJson: '{"min":150,"max":400,"criticalMin":50,"criticalMax":1000}' },
  { code: "LAB-WBC",  name: "White Blood Cell Count",            panel: "Hematology",          units: "10³/µL", range: "4.5 – 11.0",   rangeJson: '{"min":4.5,"max":11.0,"criticalMin":2.0,"criticalMax":30.0}' },
  { code: "LAB-ESR",  name: "Erythrocyte Sedimentation Rate",    panel: "Hematology",          units: "mm/hr",  range: "0 – 20",       rangeJson: '{"min":0,"max":20,"criticalMax":100}' },
  // Biochemistry
  { code: "LAB-GLU",  name: "Fasting Blood Sugar",               panel: "Biochemistry",        units: "mg/dL",  range: "70 – 100",     rangeJson: '{"min":70,"max":100,"criticalMin":40,"criticalMax":500}' },
  { code: "LAB-CRE",  name: "Serum Creatinine",                  panel: "Biochemistry",        units: "mg/dL",  range: "0.6 – 1.2",    rangeJson: '{"min":0.6,"max":1.2,"criticalMax":10.0}' },
  { code: "LAB-BUN",  name: "Blood Urea Nitrogen",               panel: "Biochemistry",        units: "mg/dL",  range: "7 – 20",       rangeJson: '{"min":7,"max":20,"criticalMax":100}' },
  { code: "LAB-CHOL", name: "Total Cholesterol",                 panel: "Biochemistry",        units: "mg/dL",  range: "125 – 200",    rangeJson: '{"min":125,"max":200,"criticalMax":400}' },
  { code: "LAB-TRIG", name: "Triglycerides",                     panel: "Biochemistry",        units: "mg/dL",  range: "< 150",        rangeJson: '{"max":150,"criticalMax":500}' },
  { code: "LAB-ALT",  name: "Alanine Aminotransferase (ALT)",    panel: "Biochemistry",        units: "U/L",    range: "7 – 56",       rangeJson: '{"min":7,"max":56,"criticalMax":1000}' },
  { code: "LAB-AST",  name: "Aspartate Aminotransferase (AST)",  panel: "Biochemistry",        units: "U/L",    range: "10 – 40",      rangeJson: '{"min":10,"max":40,"criticalMax":1000}' },
  { code: "LAB-ALB",  name: "Serum Albumin",                     panel: "Biochemistry",        units: "g/dL",   range: "3.5 – 5.0",    rangeJson: '{"min":3.5,"max":5.0,"criticalMin":2.0}' },
  { code: "LAB-NA",   name: "Sodium",                            panel: "Biochemistry",        units: "mEq/L",  range: "136 – 145",    rangeJson: '{"min":136,"max":145,"criticalMin":120,"criticalMax":160}' },
  { code: "LAB-K",    name: "Potassium",                         panel: "Biochemistry",        units: "mEq/L",  range: "3.5 – 5.1",    rangeJson: '{"min":3.5,"max":5.1,"criticalMin":2.5,"criticalMax":6.5}' },
  // Hormones & Vitamins
  { code: "LAB-TSH",  name: "Thyroid Stimulating Hormone",       panel: "Hormones & Vitamins", units: "µIU/mL", range: "0.4 – 4.5",    rangeJson: '{"min":0.4,"max":4.5,"criticalMin":0.1,"criticalMax":10.0}' },
  { code: "LAB-FT4",  name: "Free Thyroxine (FT4)",              panel: "Hormones & Vitamins", units: "ng/dL",  range: "0.8 – 1.8",    rangeJson: '{"min":0.8,"max":1.8}' },
  { code: "LAB-VITD", name: "Vitamin D (25-Hydroxy)",            panel: "Hormones & Vitamins", units: "ng/mL",  range: "30.0 – 100.0", rangeJson: '{"min":30.0,"max":100.0,"criticalMin":10.0}' },
  { code: "LAB-B12",  name: "Vitamin B12",                       panel: "Hormones & Vitamins", units: "pg/mL",  range: "200 – 900",    rangeJson: '{"min":200,"max":900}' },
  { code: "LAB-CRP",  name: "C-Reactive Protein (CRP)",          panel: "Hormones & Vitamins", units: "mg/L",   range: "< 5.0",        rangeJson: '{"max":5.0,"criticalMax":100}' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUS_ORDER: LabOrderStatus[] = ["ORDERED", "COLLECTED", "PROCESSING", "COMPLETED"];

export const getTestMeta = (code: string): TestMeta | undefined =>
  CLINIC_TEST_DICTIONARY.find(t => t.code === code);

export const getTestsByPanel = (): Record<string, TestMeta[]> =>
  CLINIC_TEST_DICTIONARY.reduce<Record<string, TestMeta[]>>((acc, t) => {
    (acc[t.panel] ??= []).push(t);
    return acc;
  }, {});

export const parseTestCodes = (testsJson: string): string[] => {
  try { return JSON.parse(testsJson) as string[]; }
  catch { return []; }
};

/** Returns "yyyy-MM-ddTHH:mm:ss" — compatible with Java LocalDateTime */
export const localDateTimeNow = (): string =>
  new Date().toISOString().slice(0, 19);

export const generateSampleId = (orderId: number): string =>
  `SMP-${String(orderId).padStart(4, "0")}`;

export const blankResult = (code: string, labOrderId?: number): LabResult => {
  const m = getTestMeta(code);
  return {
    testCode:           code,
    resultValue:        "",
    units:              m?.units ?? "",
    referenceRangeJson: m?.rangeJson ?? "{}",
    flag:               "NORMAL",
    ...(labOrderId !== undefined ? { labOrderId } : {}),
  };
};

export const buildBlankForms = (codes: string[], labOrderId?: number): LabResult[] =>
  codes.map(c => blankResult(c, labOrderId));

export const buildEditForms = (
  codes:       string[],
  existing:    LabResult[],
  labOrderId?: number,
): LabResult[] =>
  codes.map(code => existing.find(r => r.testCode === code) ?? blankResult(code, labOrderId));
