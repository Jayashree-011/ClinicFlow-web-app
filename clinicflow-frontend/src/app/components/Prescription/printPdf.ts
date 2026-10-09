import type { Prescription } from './types';

// ─── Browser-native PDF (A5 landscape, auto-print) ───────────────────────────

export function printPrescriptionPDF(rx: Prescription, patientName: string): void {
  const issuedStr = rx.issuedAt
    ? new Date(rx.issuedAt).toLocaleString()
    : new Date().toLocaleString();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Prescription Rx#${rx.rxId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
    .page { width: 210mm; min-height: 148mm; padding: 24px 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0ea5e9; padding-bottom: 14px; margin-bottom: 18px; }
    .clinic-name { font-size: 22px; font-weight: 800; color: #0ea5e9; letter-spacing: -0.5px; }
    .clinic-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .rx-meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
    .rx-meta strong { color: #1e293b; font-size: 13px; }
    .section-title { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; margin-top: 16px; }
    .patient-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; }
    .patient-name { font-size: 16px; font-weight: 700; color: #0369a1; }
    .patient-id { font-size: 11px; color: #0284c7; margin-top: 2px; }
    .rx-symbol { font-size: 42px; font-weight: 900; color: #0ea5e9; line-height: 1; margin: 14px 0 6px; }
    .med-name { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px; padding: 9px 12px; }
    .cell-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .cell-value { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 3px; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 7px; padding: 10px 14px; margin-top: 10px; }
    .notes-label { font-size: 9px; font-weight: 700; color: #92400e; text-transform: uppercase; }
    .notes-text { font-size: 12px; color: #78350f; margin-top: 3px; }
    .footer { margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-line { border-top: 1px solid #94a3b8; width: 140px; margin-top: 36px; padding-top: 4px; font-size: 9px; color: #94a3b8; text-align: center; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700;
      background: ${rx.status === 'ISSUED' ? '#d1fae5' : rx.status === 'DISPENSED' ? '#dbeafe' : '#fef3c7'};
      color: ${rx.status === 'ISSUED' ? '#065f46' : rx.status === 'DISPENSED' ? '#1d4ed8' : '#92400e'}; }
    @media print {
      @page { size: A5 landscape; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="clinic-name">ClinicFlow</div>
        <div class="clinic-sub">Healthcare Management System · Official Prescription</div>
      </div>
      <div class="rx-meta">
        <strong>Rx #${rx.rxId}</strong><br/>
        ${issuedStr}<br/>
        <span class="status-badge">${rx.status}</span>
      </div>
    </div>

    <div class="section-title">Patient Information</div>
    <div class="patient-box">
      <div class="patient-name">${patientName || 'Unknown Patient'}</div>
      <div class="patient-id">Patient ID: #${rx.patientId}${rx.encounterId ? ' · Encounter: #' + rx.encounterId : ''}${rx.doctorId ? ' · Doctor ID: #' + rx.doctorId : ''}</div>
    </div>

    <div class="rx-symbol">℞</div>
    <div class="med-name">${rx.medicationName || '—'}${rx.medId ? ' <span style="font-size:13px;font-weight:500;color:#64748b;">(Med ID: ' + rx.medId + ')</span>' : ''}</div>

    <div class="grid">
      <div class="cell"><div class="cell-label">Dosage</div><div class="cell-value">${rx.dosage || '—'}</div></div>
      <div class="cell"><div class="cell-label">Frequency</div><div class="cell-value">${rx.frequency || '—'}</div></div>
      <div class="cell"><div class="cell-label">Route</div><div class="cell-value">${rx.route || '—'}</div></div>
      <div class="cell"><div class="cell-label">Duration</div><div class="cell-value">${rx.durationDays ? rx.durationDays + ' days' : '—'}</div></div>
      <div class="cell"><div class="cell-label">Quantity</div><div class="cell-value">${rx.quantity ?? '—'}</div></div>
      <div class="cell"><div class="cell-label">Repeats</div><div class="cell-value">${rx.repeats ?? '—'}</div></div>
    </div>

    ${rx.notes ? `<div class="notes-box"><div class="notes-label">Clinical Notes</div><div class="notes-text">${rx.notes}</div></div>` : ''}

    <div class="footer">
      <div style="font-size:10px;color:#94a3b8;">
        This prescription is computer-generated and valid as issued.<br/>
        ClinicFlow · Prescription Management System
      </div>
      <div class="sig-line">Authorised Signature</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=650');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
