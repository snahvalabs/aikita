import {getLocalUser, type LocalUser} from '../../local-auth';
import {initialLibrary,initialUserState} from '../../data';
import {retrieve,visibleState} from '../../retrieval';
import {langchainRetrieve} from '../../langchain-engine';
import {getDb} from '../../../db';
import {putObject,removeDocumentBlobs} from '../../../lib/local-bucket';
import {generateAnswer,probeLLM,resolveLLMConfig} from '../../../lib/local-llm';
import {getAppSettings,saveAppSettings,maskSettingsFor} from '../../../lib/settings';
import {createAccount,listAccounts,updateAccount,resetPassword,removeAccount,countActiveAdmins,findAccount} from '../../../lib/accounts';

// ---------------------------------------------------------------------------
// Rute API utama AIKITA.
//   * Pustaka (setup, dokumen, log) BERSAMA untuk seluruh akun — satu baris
//     database dengan id 'global'.
//   * Ruang kerja per akun (peran, percakapan, dokumen Studio) — baris dengan
//     id userId.
//   * Pengaturan Ollama/LLM dan mode baca (OCR / LangChain) tersimpan di tabel
//     `settings`; akun login tersimpan di tabel `accounts`.
// ---------------------------------------------------------------------------

const db=()=>getDb();
const GLOBAL_ID='global';
const json=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

const ADMIN_ACTIONS=new Set(['stageDummy','initialize','status','settings','accountCreate','accountUpdate','accountReset','accountDelete']);

async function loadLibrary():Promise<any>{
  const row=await db().prepare('SELECT data FROM workspaces WHERE id = ?').bind(GLOBAL_ID).first();
  if(row){
    const s=JSON.parse(String(row.data));
    s.setup??={ready:false,staged:[],activatedAt:null};s.setup.staged??=[];s.docs??=[];s.audit??=[];
    return s;
  }
  // Migrasi: baris lama menyimpan pustaka bersama di dalam state per pengguna.
  const legacy=await db().prepare('SELECT data FROM workspaces WHERE id <> ? LIMIT 1').bind(GLOBAL_ID).first();
  const lib=legacy?(()=>{const s=JSON.parse(String(legacy.data));return {setup:s.setup??{ready:false,staged:[],activatedAt:null},docs:s.docs??[],audit:s.audit??[]};})():initialLibrary();
  lib.setup.staged??=[];
  await db().prepare('INSERT OR IGNORE INTO workspaces (id,data) VALUES (?,?)').bind(GLOBAL_ID,JSON.stringify(lib)).run();
  return lib;
}

async function loadUserState(user:LocalUser):Promise<any>{
  const row=await db().prepare('SELECT data FROM workspaces WHERE id = ?').bind(user.userId).first();
  if(row){
    const s=JSON.parse(String(row.data));
    s.personal??=[];s.chats??=[];
    // Baris lama menyimpan juga pustaka gabungan; kini pustaka berada di baris
    // 'global', jadi kunci lama dibuang agar tidak menimpa data bersama.
    delete s.docs;delete s.setup;delete s.audit;delete s.users;
    s.mode=user.role==='Admin'?(s.mode==='Anggota'?'Anggota':'Admin'):'Anggota';
    return s;
  }
  const fresh=initialUserState(user.role);
  await db().prepare('INSERT OR IGNORE INTO workspaces (id,data) VALUES (?,?)').bind(user.userId,JSON.stringify(fresh)).run();
  return fresh;
}

// Susun state yang dikirim ke klien: pustaka bersama + ruang kerja per akun.
function stateOf(lib:any,ws:any){return {mode:ws.mode,personal:ws.personal,chats:ws.chats,setup:lib.setup,docs:lib.docs,audit:lib.audit};}

async function saveLibrary(lib:any){await db().prepare('UPDATE workspaces SET data = ? WHERE id = ?').bind(JSON.stringify(lib),GLOBAL_ID).run();}
async function saveUserState(userId:string,ws:any){await db().prepare('UPDATE workspaces SET data = ? WHERE id = ?').bind(JSON.stringify(ws),userId).run();}

// Sisa admin yang tersedia untuk masuk: akun tabel `accounts` (kecuali target)
// ditambah akun bawaan .env — kecuali nama akun bawaan itu sudah terdaftar di
// tabel accounts (terbayangi), sehingga akun bawaan tidak dapat dipakai.
async function remainingAdmins(exceptId?:string){
  const builtin=process.env.AIKITA_USER||'admin';
  const shadowed=!!(await findAccount(builtin));
  return (await countActiveAdmins(exceptId))+(shadowed?0:1);
}

export async function GET(){
  const user=await getLocalUser();
  if(!user)return json({error:'Silakan login dahulu.'},401);
  try{
    const [lib,ws]=await Promise.all([loadLibrary(),loadUserState(user)]);
    const [settings,accounts]=await Promise.all([getAppSettings(),listAccounts()]);
    const admin=user.role==='Admin'&&ws.mode==='Admin';
    return json(visibleState({...stateOf(lib,ws),settings:maskSettingsFor(settings,admin),accounts:admin?accounts:[]}));
  }catch(e){console.error(e);return json({error:'Penyimpanan belum tersedia. Coba kembali.'},503);}
}

export async function POST(req:Request){
  const user=await getLocalUser();
  if(!user)return json({error:'Silakan login dahulu.'},401);
  try{
    const raw=await req.text();if(raw.length>1500000)return json({error:'Permintaan melebihi batas ukuran.'},413);
    const body=JSON.parse(raw);const action=String(body?.action||'');const payload=body?.payload??{};
    const lib=await loadLibrary();const ws=await loadUserState(user);
    const isAdminAccount=user.role==='Admin';
    const admin=isAdminAccount&&ws.mode==='Admin';
    let settings=await getAppSettings();
    if(ADMIN_ACTIONS.has(action)&&!admin)return json({error:'Aksi ini hanya tersedia pada mode admin.'},403);
    if(action==='mode'&&!isAdminAccount)return json({error:'Hanya akun admin yang dapat mengganti peran tampilan.'},403);
    // Uji koneksi Ollama/LLM dijalankan dari server agar bebas masalah CORS.
    if(action==='testLLM'){
      if(!admin)return json({error:'Aksi ini hanya tersedia pada mode admin.'},403);
      const cfg=await resolveLLMConfig(settings);
      return json({probe:await probeLLM(cfg)});
    }
    let libDirty=false,userDirty=false,auditText:string|null=null;
    const audit=(text:string)=>{auditText=text;libDirty=true;};

    if(action==='mode'){if(!['Admin','Anggota'].includes(payload.mode))throw Error('Peran tidak valid');ws.mode=payload.mode;userDirty=true;audit('Peran demo diganti');}
    else if(action==='stageDummy'){lib.setup.staged=lib.docs.filter((d:any)=>d.id.startsWith('d')).map((d:any)=>d.id);libDirty=true;audit('Dokumen contoh disiapkan');}
    else if(action==='initialize'){
      const ids=lib.setup.staged||[];if(!ids.length)throw Error('Proses setidaknya satu dokumen awal.');
      lib.docs=lib.docs.map((d:any)=>ids.includes(d.id)?{...d,status:'Aktif'}:!lib.setup.ready?{...d,status:'Arsip'}:d);
      lib.setup={ready:true,staged:[],activatedAt:new Date().toISOString(),count:ids.length};
      libDirty=true;audit('Referensi awal diaktifkan');
    }
    else if(action==='personal'){
      if(!lib.setup.ready)return json({error:'Admin harus menyiapkan referensi awal dahulu.'},409);
      if(typeof payload.title!=='string'||!payload.title.trim()||typeof payload.content!=='string'||!payload.content.trim()||payload.content.length>300000)throw Error('Dokumen pribadi tidak valid atau terlalu panjang.');
      const doc={id:crypto.randomUUID(),title:payload.title.slice(0,160),content:payload.content,role:ws.mode,date:new Date().toISOString(),pages:Number(payload.pages)||1,ocrPages:Number(payload.ocrPages)||0,confidence:payload.confidence??null,method:payload.method||'Teks',chunks:Number(payload.chunks)||0};
      ws.personal=[doc,...ws.personal].slice(0,12);userDirty=true;audit('Dokumen Studio disimpan');
    }
    else if(action==='deletePersonal'){ws.personal=ws.personal.filter((d:any)=>d.id!==payload.id||d.role!==ws.mode);userDirty=true;audit('Dokumen Studio dihapus');}
    else if(action==='document'){
      if(!admin&&!lib.setup.ready)return json({error:'Tunggu penyiapan referensi awal oleh admin.'},409);
      if(typeof payload.title!=='string'||!payload.title.trim()||payload.title.length>160||typeof payload.content!=='string'||!payload.content.trim()||payload.content.length>300000)throw Error('Judul maksimal 160 karakter dan isi maksimal 300.000 karakter.');
      if(!admin&&payload.access!=='Internal')return json({error:'Anggota hanya dapat mengajukan dokumen internal.'},403);
      if(!['Internal','Terbatas (demo)'].includes(payload.access))throw Error('Klasifikasi tidak valid');
      const title=payload.title.trim();const previous=lib.docs.find((d:any)=>d.title===title);
      if(previous&&!admin)return json({error:'Pembaruan dokumen yang sudah ada dilakukan admin. Gunakan judul usulan baru untuk ditinjau.'},403);
      if(payload.stage&&!admin)return json({error:'Penyiapan folder hanya untuk admin.'},403);
      const doc={title,content:payload.content,access:payload.access,category:'Unggahan',pages:Number(payload.pages)||1,ocrPages:Number(payload.ocrPages)||0,confidence:payload.confidence??null,method:payload.method||'Teks',chunks:Number(payload.chunks)||0,status:admin&&!payload.stage?'Aktif':'Menunggu',id:previous?.id||crypto.randomUUID(),version:previous?previous.version+1:1,date:new Date().toISOString().slice(0,10),uploader:user.displayName,uploaderId:user.userId};
      if(JSON.stringify(lib).length+new TextEncoder().encode(doc.content).length>1500000)throw Error('Kapasitas teks pustaka hampir penuh. Hapus dokumen lama atau gunakan berkas yang lebih kecil.');
      await putObject(user.userId+'/'+doc.id+'/'+doc.version,doc.content);
      lib.docs=previous?lib.docs.map((d:any)=>d.id===doc.id?doc:d):[doc,...lib.docs];
      if(payload.stage)lib.setup.staged=Array.from(new Set([...(lib.setup.staged||[]),doc.id]));
      libDirty=true;audit(previous?'Dokumen diperbarui':'Dokumen diunggah ke pustaka');
    }
    else if(action==='status'){if(!['Aktif','Arsip'].includes(payload.status))throw Error('Status tidak valid');if(!lib.docs.some((d:any)=>d.id===payload.id))throw Error('Dokumen tidak ditemukan');lib.docs=lib.docs.map((d:any)=>d.id===payload.id?{...d,status:payload.status}:d);libDirty=true;audit('Status dokumen diubah');}
    else if(action==='deleteDocument'){
      const doc=lib.docs.find((d:any)=>d.id===payload.id);
      if(!doc)throw Error('Dokumen tidak ditemukan.');
      const ownPending=doc.uploaderId===user.userId&&doc.status==='Menunggu';
      if(!admin&&!ownPending)return json({error:'Hanya admin yang dapat menghapus dokumen dari pustaka.'},403);
      lib.docs=lib.docs.filter((d:any)=>d.id!==doc.id);
      lib.setup.staged=(lib.setup.staged||[]).filter((id:string)=>id!==doc.id);
      await removeDocumentBlobs(doc.id);
      audit('Dokumen dihapus dari pustaka: '+doc.title);
    }
    else if(action==='accountCreate'){
      const acc=await createAccount({username:payload.username,password:payload.password,role:payload.role});
      audit('Akun pengguna didaftarkan: '+acc.username);
    }
    else if(action==='accountUpdate'){
      if(!payload.id)throw Error('Akun tidak dipilih.');
      const target=(await listAccounts()).find(a=>a.id===payload.id);
      if(!target)throw Error('Akun tidak ditemukan.');
      if(payload.id===user.accountId&&(payload.status==='Nonaktif'||payload.role==='Anggota'))
        throw Error('Anda tidak dapat menonaktifkan atau menurunkan peran akun yang sedang masuk.');
      const demoting=target.role==='Admin'&&(payload.role==='Anggota'||payload.status==='Nonaktif');
      if(demoting&&await remainingAdmins(target.id)===0)
        throw Error('Tidak dapat menonaktifkan admin terakhir. Nonaktifkan akun lain terlebih dahulu.');
      const updated=await updateAccount(payload.id,{status:payload.status,role:payload.role});
      audit('Akun diperbarui: '+updated.username+' ('+updated.role+', '+updated.status+')');
    }
    else if(action==='accountReset'){
      if(!payload.id)throw Error('Akun tidak dipilih.');
      await resetPassword(payload.id,payload.password);
      audit('Kata sandi akun diatur ulang');
    }
    else if(action==='accountDelete'){
      if(!payload.id)throw Error('Akun tidak dipilih.');
      if(payload.id===user.accountId)throw Error('Akun yang sedang masuk tidak dapat dihapus.');
      const target=(await listAccounts()).find(a=>a.id===payload.id);
      if(!target)throw Error('Akun tidak ditemukan.');
      if(target.role==='Admin'&&target.status==='Aktif'&&await remainingAdmins(target.id)===0)
        throw Error('Tidak dapat menghapus admin terakhir. Nonaktifkan atau buat admin lain terlebih dahulu.');
      await removeAccount(payload.id);
      audit('Akun dihapus: '+target.username);
    }
    else if(action==='settings'){
      settings=await saveAppSettings(payload);
      audit('Pengaturan AI diperbarui · mode baca '+(settings.ingestion.mode==='langchain'?'LangChain':'OCR')+', LLM '+(settings.llm.enabled?'aktif':'nonaktif'));
    }
    else if(action==='chat'){
      if(!lib.setup.ready)return json({error:'Admin harus memproses dan mengaktifkan referensi awal sebelum asisten digunakan.'},409);
      if(typeof payload.q!=='string'||!payload.q.trim()||payload.q.length>4000)throw Error('Pertanyaan harus diisi, maksimal 4.000 karakter.');
      const allowed=lib.docs.filter((d:any)=>d.status==='Aktif'&&(admin||d.access==='Internal'));
      const mode=settings.ingestion.mode;
      // Penelusuran mengikuti mode baca global: potongan OCR atau potongan LangChain.
      const sources=mode==='langchain'?langchainRetrieve(payload.q,allowed):retrieve(payload.q,allowed);
      const format=/tabel/i.test(payload.q)?'Tabel':['Teks','Tabel','Gambar'].includes(payload.format)?payload.format:'Teks';
      // Jawaban disusun LLM lokal bila aktif dan tersedia; jika tidak, jatuh ke kutipan kata kunci.
      let text='';let model:string|null=null;
      if(sources.length&&settings.llm.enabled){
        const reply=await generateAnswer(payload.q,sources,await resolveLLMConfig(settings));
        if(reply){text=reply.text;model=reply.model;}
      }
      if(!text)text=sources.length
        ?'Berikut kutipan relevan dari dokumen aktif yang dapat Anda akses. Seluruh dokumen bawaan adalah contoh fiktif, bukan ketentuan resmi.'
        :'Informasi belum ditemukan dalam dokumen aktif yang dapat Anda akses. Coba kata kunci yang lebih spesifik atau ajukan dokumen referensi baru.';
      const item={id:crypto.randomUUID(),q:payload.q,text,sources,format,model,mode};
      const previous=ws.chats.find((c:any)=>c.id===payload.id&&c.role===ws.mode);
      const id=previous?.id||crypto.randomUUID();
      const chat={id,title:previous?.title||payload.q,messages:[...(previous?.messages||[]),item].slice(-20),date:new Date().toISOString(),role:ws.mode};
      ws.chats=[chat,...ws.chats.filter((c:any)=>c.id!==id)].slice(0,40);
      userDirty=true;audit('Penelusuran dokumen dan percakapan disimpan');
    }
    else if(action==='deleteChat'){ws.chats=ws.chats.filter((c:any)=>c.id!==payload.id||c.role!==ws.mode);userDirty=true;audit('Percakapan dihapus');}
    else throw Error('Aksi tidak dikenal');

    if(auditText){lib.audit=[{text:auditText,date:new Date().toISOString()},...(lib.audit||[])].slice(0,100);libDirty=true;}
    if(libDirty&&JSON.stringify(lib).length>1800000)throw Error('Kapasitas pustaka penuh. Hapus dokumen dari daftar pustaka untuk membebaskan memori.');
    if(userDirty&&JSON.stringify(ws).length>900000)throw Error('Kapasitas ruang kerja penuh. Hapus percakapan atau dokumen Studio yang tidak dibutuhkan.');
    if(libDirty)await saveLibrary(lib);
    if(userDirty)await saveUserState(user.userId,ws);
    const accounts=admin?await listAccounts():[];
    return json(visibleState({...stateOf(lib,ws),settings:maskSettingsFor(settings,admin),accounts}));
  }catch(e){return json({error:e instanceof Error?e.message:'Gagal menyimpan'},400);}
}
