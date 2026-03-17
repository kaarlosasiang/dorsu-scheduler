import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Constants ────────────────────────────────────────────────────────────────

// A4 portrait (mm)
const PAGE_W = 210;
const PAGE_H = 297;

// Margins from Word document spec
const MARGIN_TOP    = 5;   // 4.20 cm — matches Word top margin visually
const MARGIN_LEFT   = 20;   // 2.00 cm
const MARGIN_RIGHT  = 15;   // 1.50 cm
const MARGIN_BOTTOM = 31.7; // 3.17 cm

// Usable content width
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT; // 175 mm

// Column widths (sum = 175 mm)
//  0:COURSE NO | 1:SECTION | 2:COURSE DESC | 3:LEC | 4:LAB | 5:TOTAL
//  6:DAYS | 7:TIME | 8:ROOM | 9:NO.STU | 10:FACULTY
const COL_WIDTHS = [16, 17, 31, 10, 10, 13, 10, 21, 14, 15, 18];

// DOrSU brand blue
const BRAND_BLUE: [number, number, number] = [31, 73, 125];
// Header accent colour (#8090B0)
const HEADER_BLUE: [number, number, number] = [128, 144, 176];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportSchedule {
  _id?: string;
  subject: {
    _id?: string;
    subjectCode: string;
    subjectName: string;
    units: number;
    lectureUnits: number;
    labUnits: number;
  } | string;
  faculty: {
    _id?: string;
    name: { first: string; middle?: string; last: string; ext?: string };
  } | string;
  classroom: {
    _id?: string;
    roomNumber: string;
    building?: string;
    capacity?: number;
  } | string;
  department?: {
    _id?: string;
    name: string;
    code: string;
  } | string;
  timeSlot: {
    day: string;
    days?: string[];
    startTime: string;
    endTime: string;
  };
  scheduleType: "lecture" | "laboratory";
  semester: string;
  academicYear: string;
  yearLevel?: string;
  section?: string;
  status?: string;
}

export interface ExportOptions {
  programName: string;
  institute?: string;
  semester: string;
  academicYear: string;
  schedules: ExportSchedule[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "Th",
  friday: "F",
  saturday: "SAT",
  sunday: "SUN",
};

const YEAR_LABEL: Record<string, string> = {
  "1st Year": "FIRST YEAR",
  "2nd Year": "SECOND YEAR",
  "3rd Year": "THIRD YEAR",
  "4th Year": "FOURTH YEAR",
  "5th Year": "FIFTH YEAR",
};

function formatDays(timeSlot: ExportSchedule["timeSlot"]): string {
  const src = timeSlot.days && timeSlot.days.length > 0 ? timeSlot.days : [timeSlot.day];
  return src.map((d) => DAY_ABBR[d.toLowerCase()] ?? d.toUpperCase()).join("");
}

function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m}${suffix}`;
}

function formatTimeRange(ts: ExportSchedule["timeSlot"]): string {
  return `${to12h(ts.startTime)}-\n${to12h(ts.endTime)}`;
}

function getFacultyLastName(faculty: ExportSchedule["faculty"]): string {
  if (typeof faculty === "string") return "";
  return faculty.name?.last?.toUpperCase() ?? "";
}

function getSubject(subject: ExportSchedule["subject"]) {
  if (typeof subject === "string") return null;
  return subject;
}

function getClassroom(classroom: ExportSchedule["classroom"]) {
  if (typeof classroom === "string") return null;
  return classroom;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Page header renderer ─────────────────────────────────────────────────────
// Portrait-A4, margins: L=20 R=15 T=34.5 B=31.7 mm
// Layout (horizontal):
//   LEFT  (university name + motto) : MARGIN_LEFT → logo start − gap
//   CENTER (logo)                   : centered on PAGE_W/2
//   RIGHT  (document code box)      : rightBoxX → PAGE_W − MARGIN_RIGHT

function drawPageHeader(
  doc: jsPDF,
  logoBase64: string | null,
  programName: string,
  institute: string,
  semester: string,
  academicYear: string,
  pageNum: number,
  totalPages: number
): number {
  const LOGO_SIZE  = 30;  // diameter/height in mm
  const BOX_W      = 52;  // document code box width in mm
  const BOX_H      = 20;  // document code box height in mm

  const logoX = PAGE_W / 2 - LOGO_SIZE / 2;
  const logoY = MARGIN_TOP;
  const boxX  = PAGE_W - MARGIN_RIGHT - BOX_W;
  const boxCX = boxX + BOX_W / 2;

  // === LEFT: University name ================================================
  const lineRightX = logoX - 2;

  // Pre-calculate motto wrapping so we know the full left-block height
  // before we position the doc code box
  const motto = '"A University of excellence, innovation, and inclusion"';
  const mottoMaxW = logoX - MARGIN_LEFT - 3;
  doc.setFont("times", "italic");
  doc.setFontSize(7.5);
  const mottoLines = doc.splitTextToSize(motto, mottoMaxW);
  const mottoLineH = 3.5; // approximate line height for 7.5pt Times

  // Left block: top line → bottom line
  //   top line  at logoY
  //   title 1   at logoY + 7   (19pt ≈ 8mm)
  //   title 2   at logoY + 15  (+8)
  //   motto     at logoY + 21  (+6)
  //   bot line  at logoY + 21 + (lines-1)*3.5 + 4
  const mottoStartY  = logoY + 21;
  const bottomLineY  = mottoStartY + (mottoLines.length - 1) * mottoLineH + 4;
  const blockHeight  = bottomLineY - logoY;

  // Vertically center the doc code box within the left block
  const boxY = logoY + (blockHeight - BOX_H) / 2;

  // Top decorative line — aligns with the top margin
  doc.setDrawColor(...HEADER_BLUE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, logoY, lineRightX, logoY);

  // Text starts just below the top line
  let y = logoY + 7;
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...HEADER_BLUE);
  doc.text("DAVAO ORIENTAL", MARGIN_LEFT, y);
  y += 8;
  doc.text("STATE UNIVERSITY", MARGIN_LEFT, y);
  y += 6;
  doc.setFont("times", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(mottoLines, MARGIN_LEFT, y);
  doc.setDrawColor(...HEADER_BLUE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, bottomLineY, lineRightX, bottomLineY);

  // === CENTER: Logo =========================================================
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, logoY - 3, LOGO_SIZE, LOGO_SIZE);
    } catch { /* skip */ }
  }

  // === RIGHT: Document code box ============================================
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(boxX, boxY, BOX_W, BOX_H);

  // Row 1 — label "Document Code No." — blue fill
  const r1H = 4.5;
  doc.setFillColor(...HEADER_BLUE);
  doc.rect(boxX, boxY, BOX_W, r1H, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text("Document Code No.", boxCX, boxY + 3.2, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.line(boxX, boxY + r1H, boxX + BOX_W, boxY + r1H);

  // Row 2 — code value
  const r2Y = boxY + r1H;
  const r2H = 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FM-DOrSU-ODI-01", boxCX, r2Y + 4, { align: "center" });
  doc.line(boxX, r2Y + r2H, boxX + BOX_W, r2Y + r2H);

  // Rows 3-4 — sub-column labels then values
  const subLabels = ["Issue Status", "Rev No.", "Effective Date", "Page No."];
  const subValues = ["01", "00", "07.22.2022", `${pageNum} of ${totalPages}`];
  const subCW = BOX_W / 4;
  const r3Y  = r2Y + r2H;
  const r3H  = 4;
  const r4Y  = r3Y + r3H;

  // Vertical dividers between sub-columns
  for (let i = 1; i < 4; i++) {
    doc.setLineWidth(0.3);
    doc.line(boxX + subCW * i, r3Y, boxX + subCW * i, boxY + BOX_H);
  }

  // Sub-column header labels — blue fill
  doc.setFillColor(...HEADER_BLUE);
  doc.rect(boxX, r3Y, BOX_W, r3H, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  subLabels.forEach((lbl, i) => {
    doc.text(lbl, boxX + subCW * i + subCW / 2, r3Y + 3, { align: "center" });
  });
  doc.setTextColor(0, 0, 0);

  // Divider between label and value
  doc.setLineWidth(0.3);
  doc.line(boxX, r4Y, boxX + BOX_W, r4Y);

  // Sub-column values
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  subValues.forEach((val, i) => {
    doc.text(val, boxX + subCW * i + subCW / 2, r4Y + 3.5, { align: "center" });
  });

  // === COURSE OFFERING title ================================================
  const titleY = logoY + LOGO_SIZE + 10;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("COURSE OFFERING", PAGE_W / 2, titleY, { align: "center" });

  // === Program info line ====================================================
  const infoY = titleY + 9;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const semMatch = semester.match(/^(\d+)/);
  const semNum   = semMatch ? semMatch[1] : "";
  const suffixMap: Record<string, string> = { "1": "ST", "2": "ND", "3": "RD" };
  const semSuffix = suffixMap[semNum] ?? "TH";
  const semLabel  = semNum ? `${semNum}${semSuffix} Semester` : semester;
  const syLabel   = `SY ${academicYear}`;

  let cx = MARGIN_LEFT;

  // "PROGRAM: "
  doc.setFont("times", "normal");
  const lblProg = "PROGRAM: ";
  doc.text(lblProg, cx, infoY);
  cx += doc.getTextWidth(lblProg);

  // Program name — bold + underline
  doc.setFont("times", "bold");
  doc.text(programName, cx, infoY);
  const pnW = doc.getTextWidth(programName);
  doc.setLineWidth(0.3);
  doc.line(cx, infoY + 0.6, cx + pnW, infoY + 0.6);
  cx += pnW + 5;

  // "INSTITUTE: "
  doc.setFont("times", "normal");
  const lblInst = "INSTITUTE: ";
  doc.text(lblInst, cx, infoY);
  cx += doc.getTextWidth(lblInst);

  // Institute name — bold + underline
  doc.setFont("times", "bold");
  doc.text(institute, cx, infoY);
  const instW = doc.getTextWidth(institute);
  doc.line(cx, infoY + 0.6, cx + instW, infoY + 0.6);
  cx += instW + 5;

  // Semester label — bold + underline (e.g. "2ND Semester")
  doc.setFont("times", "bold");
  doc.text(semLabel, cx, infoY);
  const semLabelW = doc.getTextWidth(semLabel);
  doc.setLineWidth(0.3);
  doc.line(cx, infoY + 0.6, cx + semLabelW, infoY + 0.6);
  cx += semLabelW;

  // "; SY " connector — bold, no underline
  const connector = "; SY ";
  doc.text(connector, cx, infoY);
  cx += doc.getTextWidth(connector);

  // Academic year — bold + underline (e.g. "2025-2026")
  doc.text(academicYear, cx, infoY);
  const ayW = doc.getTextWidth(academicYear);
  doc.line(cx, infoY + 0.6, cx + ayW, infoY + 0.6);

  return infoY + 8;
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export async function exportCourseOffering(options: ExportOptions): Promise<void> {
  const { programName, institute = "Baganga Campus", semester, academicYear, schedules } = options;

  // Pre-load logo
  const logoBase64 = await loadImageAsBase64("/dorsu-icon.png");

  // ── Group schedules ────────────────────────────────────────────────────────
  // Group by yearLevel + section
  const sectionMap = new Map<string, ExportSchedule[]>();

  for (const sched of schedules) {
    const key = `${sched.yearLevel ?? "Unknown"}|||${sched.section ?? ""}`;
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key)!.push(sched);
  }

  // Sort sections by year level order
  const yearOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Unknown"];
  const sortedSections = [...sectionMap.entries()].sort(([a], [b]) => {
    const [aYr] = a.split("|||");
    const [bYr] = b.split("|||");
    return yearOrder.indexOf(aYr) - yearOrder.indexOf(bYr);
  });

  // ── Build rows per section ─────────────────────────────────────────────────
  type TableRow = Array<{ content: string; rowSpan?: number; colSpan?: number; styles?: Record<string, unknown> }>;

  interface SectionData {
    yearLevel: string;
    section: string;
    bodyRows: TableRow[];
    totalLec: number;
    totalLab: number;
    totalUnits: number;
  }

  const allSections: SectionData[] = sortedSections.map(([key, scheds]) => {
    const [yearLevel, section] = key.split("|||");

    // Group by subject ID within this section
    const subjectMap = new Map<string, ExportSchedule[]>();
    for (const s of scheds) {
      const subj = getSubject(s.subject);
      const subjectKey = subj?._id ?? subj?.subjectCode ?? String(s.subject);
      if (!subjectMap.has(subjectKey)) subjectMap.set(subjectKey, []);
      subjectMap.get(subjectKey)!.push(s);
    }

    // Sort subject groups: lecture before lab, then by subjectCode
    const sortedSubjectGroups = [...subjectMap.values()].map((group) => {
      group.sort((a, b) => {
        if (a.scheduleType === b.scheduleType) return 0;
        return a.scheduleType === "lecture" ? -1 : 1;
      });
      return group;
    });

    // Sort by subject code
    sortedSubjectGroups.sort((a, b) => {
      const aSubj = getSubject(a[0].subject);
      const bSubj = getSubject(b[0].subject);
      return (aSubj?.subjectCode ?? "").localeCompare(bSubj?.subjectCode ?? "");
    });

    let totalLec = 0;
    let totalLab = 0;

    const bodyRows: TableRow[] = [];

    for (const group of sortedSubjectGroups) {
      const firstSched = group[0];
      const subj = getSubject(firstSched.subject);
      const rowCount = group.length;

      const lecUnits = subj?.lectureUnits ?? 0;
      const labUnits = subj?.labUnits ?? 0;
      const totalSubjUnits = lecUnits + labUnits;
      totalLec += lecUnits;
      totalLab += labUnits;

      group.forEach((sched, idx) => {
        const classroom = getClassroom(sched.classroom);
        const days = formatDays(sched.timeSlot);
        const timeRange = formatTimeRange(sched.timeSlot);
        const room = classroom?.roomNumber ?? "";
        const faculty = getFacultyLastName(sched.faculty);

        if (idx === 0) {
          // First row: include subject info with rowSpan
          const row: TableRow = [
            {
              content: subj?.subjectCode ?? "",
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: section,
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: subj?.subjectName ?? "",
              rowSpan: rowCount,
              styles: { valign: "middle" },
            },
            {
              content: lecUnits > 0 ? String(lecUnits) : "",
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: labUnits > 0 ? String(labUnits) : "0",
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: String(totalSubjUnits),
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            { content: days, styles: { halign: "center", valign: "middle" } },
            { content: timeRange, styles: { halign: "center", valign: "middle" } },
            { content: room, styles: { halign: "center", valign: "middle" } },
            {
              content: String(classroom?.capacity ?? ""),
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: faculty,
              rowSpan: rowCount,
              styles: { halign: "center", valign: "middle" },
            },
          ];
          bodyRows.push(row);
        } else {
          // Subsequent rows: day/time/room only (rowSpanned cols are skipped)
          const row: TableRow = [
            { content: days, styles: { halign: "center", valign: "middle" } },
            { content: timeRange, styles: { halign: "center", valign: "middle" } },
            { content: room, styles: { halign: "center", valign: "middle" } },
          ];
          bodyRows.push(row);
        }
      });
    }

    const totalUnits = totalLec + totalLab;
    return { yearLevel, section, bodyRows, totalLec, totalLab, totalUnits };
  });

  // ── Create PDF ─────────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Build columnStyles map
  const columnStyles: Record<number, { cellWidth: number }> = {};
  COL_WIDTHS.forEach((w, i) => { columnStyles[i] = { cellWidth: w }; });

  for (let si = 0; si < allSections.length; si++) {
    const sectionData = allSections[si];

    if (si > 0) doc.addPage();

    // Draw header — returns Y where table should start
    const startY = drawPageHeader(
      doc,
      logoBase64,
      programName,
      institute,
      semester,
      academicYear,
      si + 1,
      allSections.length
    );

    const sectionLabel = YEAR_LABEL[sectionData.yearLevel] ?? sectionData.yearLevel.toUpperCase();
    const sectionTitle = sectionData.section
      ? `${sectionLabel} - ${sectionData.section}`
      : sectionLabel;

    const totalsRow: TableRow = [
      {
        content: "TOTAL NUMBER OF UNITS",
        colSpan: 3,
        styles: { fontStyle: "bold", halign: "left", valign: "middle" },
      },
      {
        content: String(sectionData.totalLec),
        styles: { fontStyle: "bold", halign: "center", valign: "middle" },
      },
      {
        content: String(sectionData.totalLab),
        styles: { fontStyle: "bold", halign: "center", valign: "middle" },
      },
      {
        content: String(sectionData.totalUnits),
        styles: { fontStyle: "bold", halign: "center", valign: "middle" },
      },
      { content: "", colSpan: 5, styles: {} },
    ];

    // Draw section title as plain text above the table (no borders)
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(sectionTitle, PAGE_W / 2, startY + 4, { align: "center" });
    const tableStartY = startY + 9;

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM },
      tableWidth: CONTENT_W,
      columnStyles,
      head: [
        // Row B — column labels
        [
          { content: "COURSE\nNO.",         rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "SECTION",              rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "COURSE\nDESCRIPTION", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "UNITS",                colSpan: 3, styles: { halign: "center" } },
          { content: "DAYS",                 rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "TIME",                 rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "ROOM",                 rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "NO. OF\nSTUDENTS",      rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "FACULTY",              rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        ],
        // Row C — UNITS sub-headers
        [
          { content: "LEC",   styles: { halign: "center" } },
          { content: "LAB",   styles: { halign: "center" } },
          { content: "TOTAL", styles: { halign: "center" } },
        ],
      ],
      body: [...sectionData.bodyRows, totalsRow],
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "normal",
        font: "times",
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        minCellHeight: 5,
      },
      bodyStyles: {
        font: "times",
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        minCellHeight: 6,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.15,
    });

    // Approval / signature lines if there is space
    const finalY: number = (doc as any).lastAutoTable?.finalY ?? PAGE_H - MARGIN_BOTTOM - 20;
    if (finalY + 20 < PAGE_H - MARGIN_BOTTOM) {
      drawApprovalSection(doc, finalY + 8);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = programName.replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`Course_Offering_${safeName}_${semester.replace(/\s+/g, "_")}_${academicYear}.pdf`);
}

// ─── Faculty Workload Convenience Export ─────────────────────────────────────

export interface FacultyWorkloadExportOptions {
  facultyName: string;
  programName?: string;
  institute?: string;
  semester: string;
  academicYear: string;
  schedules: ExportSchedule[];
}

export async function exportFacultyWorkload(opts: FacultyWorkloadExportOptions): Promise<void> {
  return exportCourseOffering({
    programName: opts.programName ?? opts.facultyName,
    institute: opts.institute ?? "Baganga Campus",
    semester: opts.semester,
    academicYear: opts.academicYear,
    schedules: opts.schedules,
  });
}

function drawApprovalSection(doc: jsPDF, y: number): void {
  const colW = CONTENT_W / 3;
  const roles = [
    { label: "Prepared by:", role: "Program Head" },
    { label: "Noted by:", role: "Dean/Director" },
    { label: "Approved by:", role: "VPAA" },
  ];
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  roles.forEach((item, i) => {
    const x = MARGIN_LEFT + colW * i;
    doc.text(item.label, x, y);
    doc.text("______________________________", x, y + 9);
    doc.text(item.role, x, y + 12.5);
  });
}
