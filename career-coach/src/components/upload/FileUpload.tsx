"use client";
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApiFetcher } from '@/libs/hooks/useApiFetcher';
import { UserCVParsed } from '@/types/user-data';

interface FileUploadProps {
  onUploaded: (result: { filename: string; size: number; profile?: UserCVParsed }) => void;
  onUploadInitiated?: (file: File) => void;
  onUploadError?: (errorMessage: string) => void;
}

export default function FileUpload({ onUploaded, onUploadInitiated, onUploadError }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [{ loading, error: apiError, response }, makeRequest] = useApiFetcher<any, any>();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    setValidationError(null);
    if (file.type !== 'application/pdf') {
      setValidationError('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File too large (max 5MB).');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    onUploadInitiated?.(file);
    const result = await makeRequest('/api/upload', { method: 'POST', body: form });
    if (result) {
      if (!result.success) {
        onUploadError?.(result.message || 'Upload failed');
        return;
      }
      onUploaded({ filename: file.name, size: file.size, profile: result.profile });
    } else if (apiError) {
      onUploadError?.(apiError.message || 'Upload failed');
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  return (
    <Card className="w-full max-w-md border-dashed border-2 bg-white/80 dark:bg-gray-800/70 backdrop-blur">
      <CardContent className="p-6 flex flex-col items-center gap-4">
        <div
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`w-full h-40 flex flex-col justify-center items-center rounded-md transition border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
        >
          <p className="text-sm text-center text-gray-600 dark:text-gray-300 px-4">
            Drag & drop your CV (PDF) here or
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            className="mt-2"
            onClick={() => inputRef.current?.click()}
          >
            {loading ? 'Uploading…' : 'Select File'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onChange}
            className="hidden"
          />
        </div>
        <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc ml-4 self-start space-y-1">
          <li>PDF only</li>
          <li>Max size 5MB</li>
          <li>Used to tailor company & role recommendations</li>
        </ul>
        {(validationError || apiError) && (
          <div className="text-sm text-red-600 dark:text-red-400 text-center">
            {validationError || apiError?.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
