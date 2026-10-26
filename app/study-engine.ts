export type Point={text:string;page:number|null;index:number};
export function keyPoints(content:string,limit=8):Point[]{
 let page:number|null=null;const items:Point[]=[];
 for(const block of content.split(/(\[Halaman \d+[^\]]*\])/)){const m=block.match(/^\[Halaman (\d+)/);if(m){page=Number(m[1]);continue;}for(const text of block.split(/(?<=[.!?])\s+|\n+/).map(t=>t.trim()).filter(t=>t.length>30&&!/^DATA DUMMY/i.test(t))){items.push({text,page,index:items.length});}}
 const freq:Record<string,number>={};const stop=new Set('yang dengan untuk dalam pada dari atau dan ini oleh sebagai adalah akan dapat harus'.split(' '));for(const i of items)for(const w of i.text.toLowerCase().match(/[a-z]{4,}/g)||[])if(!stop.has(w))freq[w]=(freq[w]||0)+1;
 const ranked=items.map(i=>({...i,score:(i.text.toLowerCase().match(/[a-z]{4,}/g)||[]).reduce((a,w)=>a+(freq[w]||0),0)/Math.sqrt(i.text.length)})).sort((a,b)=>b.score-a.score);const unique:typeof ranked=[];for(const i of ranked)if(!unique.some(p=>p.text===i.text))unique.push(i);return unique.slice(0,limit).sort((a,b)=>a.index-b.index);
}
export function flashcards(points:Point[]){return points.map((p,i)=>{const target=p.text.match(/\b\d+(?:[.,]\d+)?\s*(?:hari kerja|hari|jam|bulan|tahun|persen|%)?/i)?.[0]||p.text.split(/\s+/).filter(w=>w.length>6).sort((a,b)=>b.length-a.length)[0];return {question:target?p.text.replace(target,'________'):('Sebutkan pokok informasi '+(i+1)),answer:target||p.text,source:p.text,page:p.page};});}
