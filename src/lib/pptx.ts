import PptxGenJS from 'pptxgenjs';

export interface SlideContent {
  title: string;
  bullets: string[];
  speakerNote?: string;
}

export async function buildPptx(slides: SlideContent[]) {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  
  slides.forEach(({ title, bullets, speakerNote }) => {
    const slide = pptx.addSlide();
    
    // Add title
    slide.addText(title, { 
      x: 0.5, 
      y: 0.5, 
      w: '90%',
      h: 1,
      fontSize: 32, 
      bold: true,
      color: '7c6dfa'
    });
    
    // Add bullets
    slide.addText(
      bullets.map(b => ({ text: b })), 
      { 
        x: 0.5, 
        y: 1.8, 
        w: '90%', 
        h: 4, 
        fontSize: 20, 
        bullet: true, 
        color: '333333',
        lineSpacing: 36
      }
    );
    
    // Add speaker notes
    if (speakerNote) {
      slide.addNotes(speakerNote);
    }
  });
  
  await pptx.writeFile({ fileName: "StudyAI-Presentation.pptx" });
}
