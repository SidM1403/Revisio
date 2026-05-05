"use client";

import { useState, useCallback } from 'react';
import { parseFile } from '@/lib/parsers';
import { useNotesStore } from '@/store/notesStore';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setNotes = useNotesStore((state) => state.setNotes);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesSelection = (files: File[]) => {
    if (files.length > 5) {
      setError('Please select up to 5 files at a time.');
      return;
    }
    setError(null);
    setSelectedFiles(files);
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);
    setIsProcessing(true);
    
    try {
      const texts = await Promise.all(selectedFiles.map(file => parseFile(file)));
      const combinedText = texts.filter(t => t && t.trim() !== '').join('\n\n--- NEXT FILE ---\n\n');
      
      if (!combinedText || combinedText.trim() === '') {
        throw new Error('No text could be extracted from the files.');
      }
      
      const combinedNames = selectedFiles.map(f => f.name).join(', ');
      setNotes(combinedText, combinedNames);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to parse files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== indexToRemove));
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelection(Array.from(e.dataTransfer.files));
    }
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelection(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {selectedFiles.length === 0 ? (
        <div 
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative group flex flex-col items-center justify-center w-full h-64 border border-white/20 rounded-3xl transition-all duration-300 ease-in-out backdrop-blur-xl shadow-2xl ${
            isDragging 
              ? 'border-[#a6c1ee] bg-[#a6c1ee]/20 shadow-[0_0_40px_rgba(166,193,238,0.3)]' 
              : 'bg-black/40 hover:border-[#fbc2eb]/50 hover:bg-black/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <svg className={`w-12 h-12 mb-4 text-white/70 transition-transform duration-300 ${isDragging ? 'scale-110 text-[#a6c1ee]' : 'group-hover:scale-110 group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-white/90 font-medium drop-shadow-sm">
              <span className="font-bold text-[#fbc2eb]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-white/60 font-mono tracking-wide uppercase font-semibold">PDF, DOCX, PPTX, or TXT (Max 5)</p>
          </div>
          
          <input 
            id="dropzone-file" 
            type="file" 
            className="hidden" 
            accept=".pdf,.docx,.pptx,.txt"
            onChange={onChange}
            disabled={isProcessing}
            multiple
          />
          
          <label htmlFor="dropzone-file" className="absolute inset-0 cursor-pointer rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col space-y-4 p-6 bg-black/40 border border-white/20 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white/90">Selected Files ({selectedFiles.length}/5)</h3>
            <button 
              onClick={() => setSelectedFiles([])}
              className="text-xs text-white/50 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-gradient-to-br from-[#fbc2eb]/20 to-[#a6c1ee]/20 rounded-lg text-[#a6c1ee]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-white/90 truncate">{file.name}</span>
                    <span className="text-xs text-white/50 uppercase font-mono tracking-wider">{file.name.split('.').pop()} • {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                {!isProcessing && (
                  <button onClick={() => removeFile(index)} className="p-1 text-white/30 hover:text-[#fa6d8c] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={processFiles}
            disabled={isProcessing}
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#fbc2eb] via-[#a6c1ee] to-[#7042f4] text-black shadow-[0_0_20px_rgba(166,193,238,0.3)] hover:scale-[1.02]'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extracting Magic...</span>
              </>
            ) : (
              <>
                <span className="font-bold tracking-wide">Generate Notes</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-[#fa6d8c] bg-[#fa6d8c]/10 border border-[#fa6d8c]/20 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
