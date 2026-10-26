'use client';
import {splitText} from './langchain-engine';
export type ReadMode='ocr'|'langchain';
export type ReadOptions={forceOCR?:boolean;mode?:ReadMode};
export type Extracted={title:string;content:string;pages:number;ocrPages:number;confidence:number|null;filename:string;method:string;chunks:number;pageTexts:{page:number;text:string;method:string}[]};
export async function extractDocument(file:File,report:(s:string)=>void,options:ReadOptions|boolean={}):Promise<Extracted>{
 const opts:ReadOptions=typeof options==='boolean'?{forceOCR:options}:(options||{});
 const mode:ReadMode=opts.mode==='langchain'?'langchain':'ocr';
 const forceOCR=!!opts.forceOCR;
 if(file.size>15*1024*1024)throw Error('Batas 15 MB per berkas.');
 const ext=file.name.split('.').pop()?.toLowerCase();if(!['txt','docx','pdf','md','csv'].includes(ext||''))throw Error('Format tidak didukung. Pilih TXT, DOCX, atau PDF.');
 const base={title:file.name.replace(/\.[^.]+$/,'').slice(0,160),filename:file.name,pages:1,ocrPages:0,confidence:null as number|null,method:mode==='langchain'?'LangChain':'Teks',chunks:0,pageTexts:[] as Extracted['pageTexts']};
 if(ext!=='pdf'){report(mode==='langchain'?'Memuat dokumen (pipeline LangChain)…':'Membaca teks…');let content='';if(ext==='docx'){const mammoth=await import('mammoth');content=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}else content=await file.text();if(!content.trim())throw Error('Dokumen tidak mengandung teks yang dapat dibaca.');if(content.length>300000)throw Error('Teks melebihi batas 300.000 karakter.');base.chunks=splitText(content).length;return {...base,content,method:mode==='langchain'?'LangChain':ext==='docx'?'DOCX':ext==='md'||ext==='csv'?ext.toUpperCase():'Teks',pageTexts:[{page:1,text:content,method:mode==='langchain'?'LangChain':ext==='docx'?'DOCX':'Teks'}]};}
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/engines/pdf/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:await file.arrayBuffer(),cMapUrl:'/engines/pdf/cmaps/',cMapPacked:true,standardFontDataUrl:'/engines/pdf/standard_fonts/',wasmUrl:'/engines/pdf/wasm/'});
 let pdf:any;let worker:any;let confidence=0;
 try{pdf=await task.promise;if(pdf.numPages>50)throw Error('Batas 50 halaman per PDF. Pecah dokumen menjadi bagian yang lebih kecil.');base.pages=pdf.numPages;
 for(let n=1;n<=pdf.numPages;n++){
 report(`Membaca halaman ${n}/${pdf.numPages}…`);const page=await pdf.getPage(n);const data=await page.getTextContent();let text=data.items.map((i:any)=>i.str+(i.hasEOL?'\n':' ')).join('').trim();let method='Teks PDF';
 const sparse=text.replace(/\s/g,'').length<60;
 if(mode==='langchain'){
 // Pipeline LangChain membaca lapisan teks digital saja — tanpa OCR.
 if(sparse){text=`(Halaman ${n} tanpa lapisan teks. Aktifkan mode OCR pada Pengaturan AI untuk memindai halaman ini.)`;method='LangChain · tanpa teks';}
 else method='LangChain';
 }else if(forceOCR||sparse){
 if(!worker){report('Memuat OCR Indonesia + Inggris…');const tesseract=await import('tesseract.js');worker=await tesseract.createWorker(['ind','eng'],1,{workerPath:'/engines/ocr/worker.min.js',corePath:'/engines/ocr',langPath:'/engines/ocr/lang',workerBlobURL:false,errorHandler:()=>{},logger:(m:any)=>{if(m.status==='recognizing text')report(`OCR halaman ${n}/${pdf.numPages} · ${Math.round(m.progress*100)}%`);}});}
 const raw=page.getViewport({scale:1});const scale=Math.min(2,2400/Math.max(raw.width,raw.height));const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d'),viewport}).promise;
 const result=await worker.recognize(canvas);text=result.data.text.trim();confidence+=result.data.confidence;base.ocrPages++;method='OCR';canvas.width=0;canvas.height=0;
 }
 base.pageTexts.push({page:n,text,method});page.cleanup();
 if(base.pageTexts.reduce((s,p)=>s+p.text.length,0)>300000)throw Error('Teks melebihi batas 300.000 karakter.');
 }
 const content=base.pageTexts.map(p=>`[Halaman ${p.page} · ${p.method}]\n${p.text}`).join('\n\n');
 if(!base.pageTexts.some(p=>p.text.trim()&&p.method!=='LangChain · tanpa teks'))throw Error(mode==='langchain'?'Tidak ada lapisan teks yang terbaca. Aktifkan mode OCR pada Pengaturan AI untuk dokumen hasil pindai.':'Teks tidak terbaca. Coba pindai yang lebih jelas.');
 base.chunks=splitText(content).length;base.method=mode==='langchain'?'LangChain':base.ocrPages?'OCR':'PDF digital';
 return {...base,content,confidence:base.ocrPages?Math.round(confidence/base.ocrPages):null};
 }catch(e:any){if(e.name==='PasswordException')throw Error('PDF dilindungi kata sandi. Buka proteksinya secara lokal sebelum mengunggah.');throw e;}finally{await worker?.terminate();await task.destroy();}
}
