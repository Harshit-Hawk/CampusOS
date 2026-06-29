import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  HeadingLevel,
  convertInchesToTwip,
  PageOrientation,
  LineRuleType,
  ImageRun,
} from 'docx'

// ─── Types ──────────────────────────────────────────────────────────

export interface EventReportData {
  eventName: string
  organizingDepartment: string
  activityCoordinator: string
  activityCoCoordinator: string
  dateAndTime: string
  targetAudience: string
  expectedOutcome: string
  chiefGuest: string
  judgesDetail: string
  totalParticipants: string
  resultsWinners: string
  assessmentCriteria: string
  rulesAndRegulations: string
  glimpses: string
  billsDetails: string
  itemsReceivedIssued: string
  creativeImage?: {
    base64: string
    width: number
    height: number
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

const FONT = 'Times New Roman'
const FONT_SIZE = 24 // half-points → 12pt
const HEADING_SIZE = 32 // half-points → 16pt

const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
} as const

function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text,
            bold: true,
            font: FONT,
            size: FONT_SIZE,
            color: '000000',
          }),
        ],
      }),
    ],
  })
}

function bodyCell(text: string, widthPct: number, bold = false): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text,
            bold,
            font: FONT,
            size: FONT_SIZE,
            color: '000000',
          }),
        ],
      }),
    ],
  })
}

function tableRow(sno: string, particular: string, detail: string): TableRow {
  return new TableRow({
    children: [
      bodyCell(sno, 10),
      bodyCell(particular, 35),
      bodyCell(detail || '--', 55),
    ],
  })
}

// ─── Main Builder ───────────────────────────────────────────────────

export function buildEventReportDocx(data: EventReportData): Document {
  const rows: { particular: string; detail: string }[] = [
    { particular: 'Name of Event / Activity', detail: data.eventName },
    { particular: 'Organizing Department', detail: data.organizingDepartment },
    { particular: 'Activity Coordinator', detail: data.activityCoordinator },
    { particular: 'Activity Co-Coordinator', detail: data.activityCoCoordinator },
    { particular: 'Date and Time', detail: data.dateAndTime },
    { particular: 'Target Audience / Participants', detail: data.targetAudience },
    { particular: 'Expected Outcome', detail: data.expectedOutcome },
    { particular: 'Chief Guest / Other Guest', detail: data.chiefGuest },
    { particular: 'Judges Detail', detail: data.judgesDetail },
    { particular: 'Total Number of Participants', detail: data.totalParticipants },
    { particular: 'Results / Winners Detail', detail: data.resultsWinners },
    { particular: 'Assessment Criteria', detail: data.assessmentCriteria },
    { particular: 'Rules and Regulations', detail: data.rulesAndRegulations },
    { particular: 'Copy of Glimpses (News etc.)', detail: data.glimpses },
    { particular: 'Bills Details', detail: data.billsDetails },
    { particular: 'Items Received and Issued Records', detail: data.itemsReceivedIssued },
  ]

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('S. No.', 10),
          headerCell('Particulars', 35),
          headerCell('Remarks / Details', 55),
        ],
      }),
      // Data rows
      ...rows.map((r, i) => tableRow(String(i + 1), r.particular, r.detail)),
    ],
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
            color: '000000',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: convertInchesToTwip(8.27),  // A4 width
              height: convertInchesToTwip(11.69), // A4 height
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // ── Heading ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }, // 12pt after
            children: [
              new TextRun({
                text: 'EVENT / ACTIVITY REPORT',
                bold: true,
                font: FONT,
                size: HEADING_SIZE,
                color: '000000',
              }),
            ],
          }),

          // ── Table ──
          table,

          // ── Spacer ──
          new Paragraph({ spacing: { before: 480, after: 0 }, children: [] }),

          // ── Enclosure line ──
          new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                text: 'Encl: As Above',
                bold: true,
                font: FONT,
                size: FONT_SIZE,
                color: '000000',
              }),
            ],
          }),

          // ── Spacer for signatures ──
          new Paragraph({ spacing: { before: 480, after: 0 }, children: [] }),

          // ── Signature Row ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 },
              insideHorizontal: { style: BorderStyle.NONE, size: 0 },
              insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0 },
                      bottom: { style: BorderStyle.NONE, size: 0 },
                      left: { style: BorderStyle.NONE, size: 0 },
                      right: { style: BorderStyle.NONE, size: 0 },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({
                            text: 'Activity Coordinator',
                            bold: true,
                            font: FONT,
                            size: FONT_SIZE,
                            color: '000000',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 40 },
                        children: [
                          new TextRun({
                            text: data.activityCoordinator || '________________',
                            font: FONT,
                            size: FONT_SIZE,
                            color: '000000',
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0 },
                      bottom: { style: BorderStyle.NONE, size: 0 },
                      left: { style: BorderStyle.NONE, size: 0 },
                      right: { style: BorderStyle.NONE, size: 0 },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: 'HOD/FHs',
                            bold: true,
                            font: FONT,
                            size: FONT_SIZE,
                            color: '000000',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 40 },
                        children: [
                          new TextRun({
                            text: '________________',
                            font: FONT,
                            size: FONT_SIZE,
                            color: '000000',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ── Date line ──
          new Paragraph({
            spacing: { before: 360, after: 0 },
            children: [
              new TextRun({
                text: `Date: ________________`,
                font: FONT,
                size: FONT_SIZE,
                color: '000000',
              }),
            ],
          }),
        ],
      },
      ...(data.creativeImage ? [{
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'ANNEXURE: EVENT CREATIVE',
                bold: true,
                font: FONT,
                size: HEADING_SIZE,
                color: '000000',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: Buffer.from(data.creativeImage.base64, 'base64'),
                transformation: {
                  width: Math.min(500, data.creativeImage.width),
                  height: Math.min(500, data.creativeImage.width) * (data.creativeImage.height / data.creativeImage.width),
                },
              }),
            ],
          }),
        ],
      }] : []),
    ],
  })

  return doc
}
