import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt') {
    return await file.text();
  }

  if (extension === 'pdf') {
    return await parsePDF(file);
  }

  if (extension === 'docx') {
    return await parseDOCX(file);
  }

  if (extension === 'pptx') {
    return await parsePPTX(file);
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOCX, PPTX, or TXT file.');
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

async function parseDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function parsePPTX(file: File): Promise<string> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  let fullText = '';
  
  // Find all slide XML files
  const slideFiles = Object.keys(loadedZip.files).filter(name => 
    name.match(/^ppt\/slides\/slide\d+\.xml$/)
  );
  
  // Sort slides numerically so they appear in correct order
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0]);
    const numB = parseInt(b.match(/\d+/)![0]);
    return numA - numB;
  });

  for (const filename of slideFiles) {
    const content = await loadedZip.files[filename].async('string');
    // Simple regex to extract text within <a:t>...</a:t> tags
    const matches = content.match(/<a:t.*?>(.*?)<\/a:t>/g);
    if (matches) {
      const slideText = matches.map(tag => tag.replace(/<a:t.*?>/g, '').replace(/<\/a:t>/g, '')).join(' ');
      fullText += slideText + '\n\n';
    }
  }
  
  return fullText.trim();
}
