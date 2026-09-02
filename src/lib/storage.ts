export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BackupData {
  version?: number;
  exportedAt?: string;
  cards?: Record<string, any> | any[];
  stats?: Record<string, any>;
  [key: string]: any;
}

/**
 * Validates and parses a backup JSON string.
 * Checks for valid JSON syntax and verifies that key structures (cards or stats) exist.
 *
 * @param jsonStr The JSON string from the uploaded backup file
 * @returns ValidationResult containing parsed data or an error message
 */
export function validateAndParseBackup(jsonStr: string): ValidationResult<BackupData> {
  if (!jsonStr || typeof jsonStr !== 'string') {
    return { success: false, error: 'Dữ liệu đầu vào không hợp lệ hoặc rỗng.' };
  }

  try {
    const data = JSON.parse(jsonStr);

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        success: false,
        error: 'Cấu trúc bản sao lưu không đúng định dạng đối tượng JSON.',
      };
    }

    // Must have at least cards or stats (or both)
    if (!('cards' in data) && !('stats' in data)) {
      return {
        success: false,
        error: 'Tệp sao lưu thiếu thông tin bắt buộc (cards hoặc stats).',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi phân tích JSON: ${err?.message || 'Định dạng JSON không hợp lệ'}`,
    };
  }
}

/**
 * Exports data object to a downloadable JSON file in the browser.
 *
 * @param data Data object to export
 * @param filename File name for the download (default: 'jp_study_backup.json')
 */
export function exportBackupData(data: any, filename: string = 'jp_study_backup.json'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
