import { useState, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CSVImportResult, CSVImportError } from '@/types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';

const expectedColumns = [
  'Volunteer_ID', 'First Name', 'Last Name', 'Email', 'Phone', 'City',
  'Postal_Prefix', 'Full_Postal_Code', 'Region', 'Street Address', 'Postal Code',
  'Riding', 'Preferred Contact', 'Languages', 'Availability Days', 'Availability_Times',
  'Hours Per Week', 'Role Interest', 'Skills_Notes', 'Experience Level',
  'Vehicle_YN', 'Status', 'Team_Lead', 'Date_Signed_Up', 'Notes', 'Risk_Flags', 'Consent_YN',
  'Last_Contacted_Date', 'Last_Active_Date', 'Total_Hours', 'Total_Shifts', 'Total_Doors_or_Dials'
];

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      parseCSVPreview(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSVPreview(selectedFile);
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // First 5 rows + header
      const parsed = lines.map(line =>
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
      setPreviewData(parsed);

      // Auto-map columns
      const headers = parsed[0] || [];
      const mapping: Record<string, string> = {};
      headers.forEach((header, index) => {
        const normalized = header.toLowerCase().replace(/[_\s]+/g, ' ').trim();
        const match = expectedColumns.find(col => {
          const normalizedCol = col.toLowerCase().replace(/[_\s]+/g, ' ').trim();
          return normalizedCol === normalized || normalizedCol.includes(normalized) || normalized.includes(normalizedCol);
        });
        if (match) {
          mapping[index.toString()] = match;
        }
      });
      setColumnMapping(mapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    setStep('processing');
    setProgress(10);

    const dataRows = previewData.slice(1);
    const totalRows = dataRows.length;
    let successful = 0;
    let failed = 0;
    let duplicates = 0;
    const errors: CSVImportError[] = [];

    // Import Supabase lazily to avoid circular dependencies issues if any
    const { supabase } = await import('@/lib/supabase');
    const { RidingService } = await import('@/lib/ridingService');

    // Helper to get value by mapped column name
    const getValue = (row: string[], colName: string) => {
      const indexStr = Object.keys(columnMapping).find(key => columnMapping[key] === colName);
      if (!indexStr) return '';
      const idx = parseInt(indexStr);
      return row[idx] || '';
    };

    // Helper for flexible mapping
    const getMappedValue = (row: string[], possibleHeaders: string[]) => {
      // 1. Try exact match first
      let headerIndexStr = Object.keys(columnMapping).find(key => {
        const mapVal = columnMapping[key].toLowerCase().trim();
        return possibleHeaders.some(h => mapVal === h.toLowerCase().trim());
      });

      // 2. If no exact match, try lenient match (only if strictly necessary, but for Notes vs Skills_Notes strict is safer)
      // We will skip loose matching for now to prevent the reported issue.

      if (!headerIndexStr) return '';
      return row[parseInt(headerIndexStr)] || '';
    }

    /* 
      We iterate through each row and prepare the object for insertion.
      We handle the specific fields mentioned in the CSV sample:
      - First_Name, Last_Name, Email, Phone, City, Postal_Prefix, Full_Postal_Code, Region, Street Address, Postal Code, Riding
    */

    for (let i = 0; i < totalRows; i++) {
      const row = dataRows[i];
      const currentRowNum = i + 2; // +2 because 0-indexed + header row

      // Progress update
      setProgress(10 + ((i / totalRows) * 80));

      try {
        const email = getMappedValue(row, ['Email']);
        if (!email || !email.includes('@')) {
          // Skip rows without valid email, but don't error hard if it's just an empty row at end
          if (row.join('').trim() === '') continue;

          failed++;
          errors.push({ row: currentRowNum, field: 'email', value: email, message: 'Invalid or missing email' });
          continue;
        }

        // Check for duplicate locally first? Supabase will throw error on UNIQUE constraint, which is safer.
        // But we can check if we want to count accurately.

        const postalCode = getMappedValue(row, ['Full_Postal_Code', 'Postal Code', 'Postal_Code']);
        const streetAddress = getMappedValue(row, ['Street Address', 'Street_Address', 'Address']);
        const city = getMappedValue(row, ['City']);

        let ridingName = getMappedValue(row, ['Riding']);
        let ridingId = null;
        let ridingConfirmed = false;

        // Simple Logic for Riding ID if we had a Ridings table populated
        // For now we will insert the TEXT of the riding if mapped, or try to lookup

        if (!ridingName || ridingName === '' || ridingName.includes('Needs Review')) {
          // Try auto-lookup
          if (streetAddress && city) {
            const lookup = await RidingService.lookupByAddress(`${streetAddress}, ${city}`);
            if (lookup.confidence !== 'none') ridingName = lookup.riding;
          } else if (postalCode) {
            const lookup = await RidingService.lookupByPostalCode(postalCode);
            if (lookup.confidence !== 'none') ridingName = lookup.riding;
          }
        }

        // Date parsing
        const dateStr = getMappedValue(row, ['Date_Signed_Up', 'Date Signed Up']);
        let dateSignedUp = new Date().toISOString();
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) dateSignedUp = parsed.toISOString();
        }

        // Construct Volunteer Object
        const volunteerData = {
          external_id: getMappedValue(row, ['Volunteer_ID', 'ID']),
          first_name: getMappedValue(row, ['First_Name', 'First Name']),
          last_name: getMappedValue(row, ['Last_Name', 'Last Name']),
          email: email,
          phone: getMappedValue(row, ['Phone']),
          city: city,
          postal_prefix: getMappedValue(row, ['Postal_Prefix']),
          postal_code: postalCode,
          street_address: streetAddress,
          region: getMappedValue(row, ['Region']),
          riding: ridingName,
          riding_confirmed: !!ridingName && !ridingName.includes('Needs Review'),
          preferred_contact: (getMappedValue(row, ['Preferred_Contact', 'Preferred Contact']).toLowerCase()) || 'email',
          languages: getMappedValue(row, ['Languages']) ? getMappedValue(row, ['Languages']).split(',').map(s => s.trim()) : [],
          status: getMappedValue(row, ['Status']).toLowerCase() || 'active',
          team_lead_name: getMappedValue(row, ['Team_Lead', 'Team Lead']),
          date_signed_up: dateSignedUp,
          notes: getMappedValue(row, ['Notes']),
          consent_given: ['y', 'yes', 'true', '1'].includes(getMappedValue(row, ['Consent_YN', 'Consent']).toLowerCase()),
          has_vehicle: ['y', 'yes', 'true', '1'].includes(getMappedValue(row, ['Vehicle_YN', 'Vehicle']).toLowerCase()),
          risk_flags: getMappedValue(row, ['Risk_Flags']) ? getMappedValue(row, ['Risk_Flags']).split(',').map(s => s.trim()) : [],
          availability_times: getMappedValue(row, ['Availability_Times']) ? getMappedValue(row, ['Availability_Times']).split(',').map(s => s.trim()) : [],
          availability_days: getMappedValue(row, ['Availability_Days', 'Availability Days']) ? getMappedValue(row, ['Availability_Days', 'Availability Days']).split(',').map(s => s.trim()) : [],
          role_interest: getMappedValue(row, ['Role_Interest', 'Role Interest']) ? getMappedValue(row, ['Role_Interest', 'Role Interest']).split(',').map(s => s.trim()) : [],
          skills_notes: getMappedValue(row, ['Skills_Notes', 'Skills Notes']),
          experience_level: getMappedValue(row, ['Experience_Level', 'Experience Level']).toLowerCase() || 'new',
          hours_per_week: parseInt(getMappedValue(row, ['Hours_Per_Week', 'Hours Per Week'])) || 0,
          total_hours: parseInt(getMappedValue(row, ['Total_Hours', 'Total Hours'])) || 0,
          total_shifts: parseInt(getMappedValue(row, ['Total_Shifts', 'Total Shifts'])) || 0,
          total_doors_or_dials: parseInt(getMappedValue(row, ['Total_Doors_or_Dials', 'Total Doors'])) || 0,
          last_contacted_date: getMappedValue(row, ['Last_Contacted_Date', 'Last Contacted']) ? new Date(getMappedValue(row, ['Last_Contacted_Date', 'Last Contacted'])).toISOString() : null,
          last_active_date: getMappedValue(row, ['Last_Active_Date', 'Last Active']) ? new Date(getMappedValue(row, ['Last_Active_Date', 'Last Active'])).toISOString() : null,
        };

        const { error } = await supabase
          .from('volunteers')
          .insert(volunteerData);

        if (error) {
          if (error.code === '23505') { // Unique violation
            duplicates++;
          } else {
            console.error('Insert error:', error);
            failed++;
            errors.push({ row: currentRowNum, field: 'database', value: '', message: error.message });
          }
        } else {
          successful++;
        }

      } catch (err) {
        console.error('Row processing error', err);
        failed++;
        errors.push({ row: currentRowNum, field: 'unknown', value: '', message: 'Unknown error' });
      }
    }

    setProgress(100);
    setResult({
      total_rows: totalRows,
      successful,
      failed,
      duplicates,
      errors
    });
    setStep('complete');
    if (successful > 0 && onSuccess) {
      onSuccess();
    }
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setProgress(0);
    setResult(null);
    setPreviewData([]);
    setColumnMapping({});
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Volunteers from CSV</h2>
            <p className="text-sm text-muted-foreground">
              {step === 'upload' && 'Upload your CSV file to import volunteers'}
              {step === 'mapping' && 'Map CSV columns to volunteer fields'}
              {step === 'preview' && 'Review data before importing'}
              {step === 'processing' && 'Processing your import...'}
              {step === 'complete' && 'Import complete'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Upload className={cn(
                  "h-12 w-12 mx-auto mb-4 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drag and drop your CSV file
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse from your computer
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2">Expected CSV Format</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your CSV should include the following columns (order doesn't matter):
                </p>
                <div className="flex flex-wrap gap-2">
                  {expectedColumns.map((col) => (
                    <span key={col} className="px-2 py-1 bg-card text-xs text-foreground rounded-md border border-border">
                      {col}
                    </span>
                  ))}
                </div>
                <Button variant="link" className="text-primary p-0 h-auto mt-3 text-sm gap-1">
                  <Download className="h-3 w-3" />
                  Download sample CSV template
                </Button>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-6">
              {file && (
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl border border-success/20">
                  <FileText className="h-8 w-8 text-success" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {previewData.length - 1} rows detected
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetModal}>
                    Change
                  </Button>
                </div>
              )}

              <div>
                <h4 className="font-medium text-foreground mb-3">Column Mapping</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewData[0]?.map((header, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-40 text-sm font-medium text-foreground truncate">{header}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <select
                        value={columnMapping[index.toString()] || ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [index.toString()]: e.target.value
                        }))}
                        className="flex-1 h-9 px-3 rounded-lg border border-input bg-card text-sm"
                      >
                        <option value="">-- Skip this column --</option>
                        {expectedColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      {columnMapping[index.toString()] && (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-3">Preview (First 5 Rows)</h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {previewData[0]?.map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                            {columnMapping[i.toString()] || <span className="italic text-muted-foreground/50">skipped</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-foreground truncate max-w-[150px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetModal}>Back</Button>
                <Button onClick={processImport} className="bg-gradient-primary gap-2">
                  <Upload className="h-4 w-4" />
                  Import {previewData.length - 1} Volunteers
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: '1s' }}
                />
                <Upload className="absolute inset-0 m-auto h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Processing Import...</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Validating data and checking for duplicates
              </p>
              <Progress value={progress} className="max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && result && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Import Complete!</h3>
                <p className="text-muted-foreground">
                  Successfully imported {result.successful} of {result.total_rows} volunteers
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.total_rows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="bg-success/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-success">{result.successful}</p>
                  <p className="text-xs text-success">Imported</p>
                </div>
                <div className="bg-warning/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-warning">{result.duplicates}</p>
                  <p className="text-xs text-warning">Duplicates</p>
                </div>
                <div className="bg-destructive/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                  <p className="text-xs text-destructive">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                  <h4 className="font-medium text-destructive flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({result.errors.length})
                  </h4>
                  <div className="space-y-2">
                    {result.errors.map((error, i) => (
                      <div key={i} className="text-sm flex items-start gap-2">
                        <span className="text-destructive font-medium">Row {error.row}:</span>
                        <span className="text-muted-foreground">{error.field} - {error.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.duplicates > 0 && (
                <div className="bg-warning/5 rounded-xl p-4 border border-warning/20">
                  <h4 className="font-medium text-warning flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Duplicates Skipped
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.duplicates} records were identified as duplicates based on email address and were not imported.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button onClick={resetModal} className="bg-gradient-primary gap-2">
                  <Upload className="h-4 w-4" />
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}