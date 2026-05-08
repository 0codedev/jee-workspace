// ============================================================================
// JEE Dashboard v2 Lightweight Vector PDF Engine
// Generates Clean, High-DPI Vector A4 Scorecards (<200 KB) using jsPDF
// ============================================================================

import jsPDF from 'jspdf';
import { TestReport, QuestionLog, SubjectData } from '../types';

export class PdfService {
  /**
   * Generates and downloads a lightweight, razor-sharp vector PDF test scorecard
   */
  public generateReportPdf(report: TestReport, logs?: QuestionLog[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    let y = margin;

    // --- Color Palette ---
    const primaryColor = [15, 23, 42]; // Slate 900
    const accentCyan = [6, 182, 212]; // Cyan 500
    const accentPurple = [147, 51, 234]; // Purple 600
    const textColor = [30, 41, 59]; // Slate 800
    const textMuted = [100, 116, 139]; // Slate 500
    const bgLight = [248, 250, 252]; // Slate 50
    const borderLight = [226, 232, 240]; // Slate 200
    const greenColor = [16, 185, 129]; // Emerald 500
    const redColor = [239, 68, 68]; // Rose 500

    // ========================================================================
    // 1. BRANDED HEADER BANNER
    // ========================================================================
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

    // Header Glow Line
    doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.setLineWidth(0.8);
    doc.line(margin + 4, y + 27, pageWidth - margin - 4, y + 27);

    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('JEE PERFORMANCE & SCORECARD REPORT', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Official Test Analytics & Forensic Diagnostic Summary`, margin + 6, y + 15);

    // Date & Type Badges on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(56, 189, 248); // Sky 400
    const dateStr = `Date: ${new Date(report.testDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    doc.text(dateStr, pageWidth - margin - 6, y + 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    const testTypeTag = `${report.type || 'JEE Main'} ${report.subType ? `• ${report.subType}` : ''}`;
    doc.text(testTypeTag, pageWidth - margin - 6, y + 15, { align: 'right' });

    // Test Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(report.testName, margin + 6, y + 22);

    y += 33;

    // ========================================================================
    // 2. OVERALL SCORECARD SUMMARY (4 KPI BLOCKS)
    // ========================================================================
    const totalQuestions = report.total.correct + report.total.wrong + report.total.unanswered + (report.total.partial || 0);
    const attempted = report.total.correct + report.total.wrong + (report.total.partial || 0);
    const accuracy = (report.total.correct + report.total.wrong) > 0 
      ? ((report.total.correct / (report.total.correct + report.total.wrong)) * 100).toFixed(1)
      : '0.0';
    const attemptRate = totalQuestions > 0 ? ((attempted / totalQuestions) * 100).toFixed(1) : '0.0';

    const kpis = [
      { label: 'TOTAL MARKS', value: `${report.total.marks}`, sub: report.topperScore ? `Topper: ${report.topperScore}` : 'Score' },
      { label: 'ACCURACY', value: `${accuracy}%`, sub: `${report.total.correct}C / ${report.total.wrong}W` },
      { label: 'ATTEMPT RATE', value: `${attemptRate}%`, sub: `${attempted} / ${totalQuestions} Qs` },
      { label: 'AIR / RANK', value: report.total.rank ? `#${report.total.rank}` : 'Unranked', sub: 'Projected Rank' },
    ];

    const kpiWidth = (pageWidth - margin * 2 - 9) / 4;
    kpis.forEach((kpi, idx) => {
      const kpiX = margin + idx * (kpiWidth + 3);
      
      // Card Background
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(kpiX, y, kpiWidth, 18, 2, 2, 'FD');

      // Top Accent Line
      doc.setFillColor(idx === 0 ? accentCyan[0] : idx === 1 ? greenColor[0] : idx === 2 ? accentPurple[0] : primaryColor[0], 
                       idx === 0 ? accentCyan[1] : idx === 1 ? greenColor[1] : idx === 2 ? accentPurple[1] : primaryColor[1], 
                       idx === 0 ? accentCyan[2] : idx === 1 ? greenColor[2] : idx === 2 ? accentPurple[2] : primaryColor[2]);
      doc.roundedRect(kpiX, y, kpiWidth, 1.5, 0.75, 0.75, 'F');

      // KPI Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(kpi.label, kpiX + 3, y + 6);

      // KPI Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(kpi.value, kpiX + 3, y + 12.5);

      // KPI Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(kpi.sub, kpiX + 3, y + 16);
    });

    y += 23;

    // ========================================================================
    // 3. SUBJECT-WISE BREAKDOWN TABLE
    // ========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Subject Performance Matrix', margin, y);
    y += 4;

    // Table Header
    const colWidths = [38, 20, 20, 20, 20, 22, 22, 20];
    const headers = ['Subject', 'Marks', 'Correct', 'Wrong', 'Unans.', 'Accuracy', 'Attempt', 'Rank'];
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    let curX = margin + 3;
    headers.forEach((h, i) => {
      doc.text(h, curX, y + 4.8);
      curX += colWidths[i];
    });

    y += 7;

    // Table Rows: Physics, Chemistry, Maths, Total
    const subjectsData: { name: string; data: SubjectData; isTotal?: boolean }[] = [
      { name: 'Physics', data: report.physics },
      { name: 'Chemistry', data: report.chemistry },
      { name: 'Mathematics', data: report.maths },
      { name: 'Total / Composite', data: report.total, isTotal: true },
    ];

    subjectsData.forEach((row, rowIndex) => {
      const sub = row.data;
      const subTotalQ = sub.correct + sub.wrong + sub.unanswered + (sub.partial || 0);
      const subAttempted = sub.correct + sub.wrong + (sub.partial || 0);
      const subAcc = (sub.correct + sub.wrong) > 0 ? ((sub.correct / (sub.correct + sub.wrong)) * 100).toFixed(1) + '%' : '0.0%';
      const subAttRate = subTotalQ > 0 ? ((subAttempted / subTotalQ) * 100).toFixed(1) + '%' : '0.0%';

      const isEven = rowIndex % 2 === 0;
      const rowBg = row.isTotal ? [241, 245, 249] : isEven ? [255, 255, 255] : [248, 250, 252];
      
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'FD');

      doc.setFont('helvetica', row.isTotal ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(row.isTotal ? primaryColor[0] : textColor[0], row.isTotal ? primaryColor[1] : textColor[1], row.isTotal ? primaryColor[2] : textColor[2]);

      let xPos = margin + 3;
      // 1. Subject Name
      doc.text(row.name, xPos, y + 5);
      xPos += colWidths[0];

      // 2. Marks
      doc.setFont('helvetica', 'bold');
      doc.text(`${sub.marks}`, xPos, y + 5);
      xPos += colWidths[1];

      // 3. Correct
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      doc.text(`+${sub.correct}`, xPos, y + 5);
      xPos += colWidths[2];

      // 4. Wrong
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.text(`-${sub.wrong}`, xPos, y + 5);
      xPos += colWidths[3];

      // 5. Unanswered
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`${sub.unanswered}`, xPos, y + 5);
      xPos += colWidths[4];

      // 6. Accuracy
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(subAcc, xPos, y + 5);
      xPos += colWidths[5];

      // 7. Attempt Rate
      doc.text(subAttRate, xPos, y + 5);
      xPos += colWidths[6];

      // 8. Rank
      doc.text(sub.rank ? `#${sub.rank}` : '-', xPos, y + 5);

      y += 7.5;
    });

    y += 6;

    // ========================================================================
    // 4. ADVANCED METRICS GRID (SPAQ, C/W RATIO, NEGATIVE MARKS LEAKAGE)
    // ========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Cognitive & Strategy Diagnostics', margin, y);
    y += 4;

    const cwRatio = report.total.wrong > 0 ? (report.total.correct / report.total.wrong).toFixed(2) : 'Infinity';
    const spaq = attempted > 0 ? (report.total.marks / attempted).toFixed(2) : '0.0';
    const negativeImpact = report.total.correct > 0 ? `${((report.total.wrong * 1) / (report.total.correct * 4) * 100).toFixed(1)}%` : '0.0%';
    const scorePotential = report.total.correct > 0 ? `${((report.total.marks / (report.total.correct * 4)) * 100).toFixed(1)}%` : '0.0%';

    const diagMetrics = [
      { name: 'C/W Ratio', val: cwRatio, desc: 'Ratio of correct to wrong questions' },
      { name: 'SPAQ Score', val: spaq, desc: 'Score per attempted question (Max 4.0)' },
      { name: 'Negative Mark Leakage', val: negativeImpact, desc: 'Potential marks lost to negatives' },
      { name: 'Score Potential', val: scorePotential, desc: 'Yield efficiency relative to maximum' },
    ];

    const diagWidth = (pageWidth - margin * 2 - 9) / 4;
    diagMetrics.forEach((diag, idx) => {
      const diagX = margin + idx * (diagWidth + 3);

      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(diagX, y, diagWidth, 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(diag.name, diagX + 3, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(diag.val, diagX + 3, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(diag.desc, diagX + 3, y + 14.5);
    });

    y += 22;

    // ========================================================================
    // 5. QUESTION-LEVEL ERROR FORENSICS (IF QUESTION LOGS AVAILABLE)
    // ========================================================================
    if (logs && logs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Error Forensic Breakdown (${logs.length} Logged Questions)`, margin, y);
      y += 4;

      // Group errors by reason
      const reasonCounts: Record<string, number> = {};
      const wrongLogs = logs.filter(l => l.status === 'Wrong');
      wrongLogs.forEach(l => {
        const r = l.reasonForError || 'Unclassified Error';
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      });

      // Top 3 Error Root Causes Box
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Primary Mistake Drivers:', margin + 4, y + 5.5);

      const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (topReasons.length > 0) {
        topReasons.forEach(([reason, count], idx) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(redColor[0], redColor[1], redColor[2]);
          const percent = ((count / (wrongLogs.length || 1)) * 100).toFixed(0);
          doc.text(`• ${reason}: ${count} questions (${percent}% of errors)`, margin + 4, y + 10 + idx * 4);
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        doc.text('Zero wrong questions logged! Clean execution.', margin + 4, y + 10);
      }

      y += 24;
    }

    // ========================================================================
    // 6. ACTIONABLE STRATEGY & FOOTER
    // ========================================================================
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text('🎯 Recommended Action Protocol:', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(241, 245, 249);
    doc.text('1. Vaccinate all wrong questions into Error Vaccinator spaced repetition flashcards.', margin + 4, y + 10);
    doc.text('2. Use Time-Per-Mark Optimizer to cap question duration on low-accuracy topics below 140 seconds.', margin + 4, y + 14);
    doc.text('3. Reinforce formula recall using the Formula Vault active recall blitz drills.', margin + 4, y + 18);

    // Official Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Generated by JEE Dashboard v2 OS • 100% Vector Certified • ${new Date().toISOString()}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    // Save File
    const safeFilename = `JEE_Scorecard_${report.testName.replace(/[^a-zA-Z0-9]/g, '_')}_${report.testDate}.pdf`;
    doc.save(safeFilename);
  }
}

export const pdfService = new PdfService();
