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
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';

const expectedColumns = [
  'First Name', 'Last Name', 'Email', 'Phone', 'City', 'Postal Code', 
  'Street Address', 'Preferred Contact', 'Languages', 'Availability Days',
  'Hours Per Week', 'Role Interest', 'Experience Level', 'Has Vehicle', 'Notes'
];

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
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
        const match = expectedColumns.find(col => 
          col.toLowerCase().includes(normalized) || normalized.includes(col.toLowerCase())
        );
        if (match) {
          mapping[index.toString()] = match;
        }
      });
      setColumnMapping(mapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const processImport = () => {
    setStep('processing');
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        
        // Simulate result
        setResult({
          total_rows: 45,
          successful: 42,
          failed: 1,
          duplicates: 2,
          errors: [
            { row: 23, field: 'email', value: 'invalid-email', message: 'Invalid email format' }
          ]
        });
        setStep('complete');
      }
      setProgress(prog);
    }, 200);
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