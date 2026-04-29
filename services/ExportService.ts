import { TestReport, QuestionLog } from '../types';
import { logger } from './Logger';

class ExportService {
  public exportTestReportsToCsv(reports: TestReport[]): void {
    if (!reports || reports.length === 0) return;
    const headers = ['ID', 'Date', 'Test Name', 'Type', 'SubType', 'Physics Marks', 'Chemistry Marks', 'Maths Marks', 'Total Marks', 'Topper Score'];
    const rows = reports.map(r => [
      r.id,
      r.testDate,
      `"${r.testName.replace(/"/g, '""')}"`,
      r.type || '',
      r.subType || '',
      r.physics.marks,
      r.chemistry.marks,
      r.maths.marks,
      r.total.marks,
      r.topperScore || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    this.downloadFile(csvContent, `jee_reports_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  public exportQuestionLogsToCsv(logs: QuestionLog[]): void {
    if (!logs || logs.length === 0) return;
    const headers = ['Test ID', 'Subject', 'Topic', 'Question No', 'Status', 'Reason for Error', 'Time Spent (s)'];
    const rows = logs.map(l => [
      l.testId,
      l.subject,
      `"${l.topic.replace(/"/g, '""')}"`,
      l.questionNumber,
      l.status,
      `"${(l.reasonForError || '').replace(/"/g, '""')}"`,
      l.timeSpent || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    this.downloadFile(csvContent, `jee_question_logs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Failed to download export file', e, 'ExportService');
    }
  }
}

export const exportService = new ExportService();
