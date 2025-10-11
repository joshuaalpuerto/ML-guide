"use client";
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onUploaded: (result: { filename: string; size: number; profile?: any }) => void;
}

export default function FileUpload({ onUploaded }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB).');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Upload failed');
      }
      onUploaded({ filename: file.name, size: file.size, profile: json.profile });
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setUploading(false);
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
            disabled={uploading}
            className="mt-2"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Select File'}
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
        {error && <div className="text-sm text-red-600 dark:text-red-400 text-center">{error}</div>}
      </CardContent>
    </Card>
  );
}
