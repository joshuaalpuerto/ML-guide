"use client";
import { useState } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import FileUpload from '@/components/upload/FileUpload';

export default function Home() {
  const [cvUploaded, setCvUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl h-[75vh] border rounded-lg shadow-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
        {!cvUploaded ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Upload Your CV</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Before we start the conversation, please upload your CV. We will extract your skills & experience to personalize company research and role recommendations.
              </p>
            </div>
            <FileUpload
              onUploaded={(info) => {
                setUploadedFileName(info.filename);
                setCvUploaded(true);
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Your file is processed securely and not shared externally.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {uploadedFileName && (
              <div className="px-4 py-2 text-xs bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                CV Loaded: {uploadedFileName}. You can now chat with the AI Career Coach.
              </div>
            )}
            <div className="flex-1">
              <ChatInterface />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
