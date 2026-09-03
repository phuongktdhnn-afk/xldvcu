require('dotenv').config();
const express=require('express');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const multer=require('multer');
const ExcelJS=require('exceljs');
const fs=require('fs');
const path=require('path');
const {Pool}=require('pg');

const app=express();
const PORT=Number(process.env.PORT||4000);
const JWT_SECRET=process.env.JWT_SECRET||'change-this-in-production';
const pool=new Pool({connectionString:process.env.DATABASE_URL||'postgres://xldv:xldv_secret_change_me@localhost:5432/xldv'});
const upload=multer({dest:'/tmp/xldv-upload',limits:{fileSize:10*1024*1024}});
app.use(cors()); app.use(express.json({limit:'2mb'}));

const clients=new Set();
function broadcast(type,payload={}){const msg=`event: ${type}\ndata: ${JSON.stringify({at:new Date().toISOString(),...payload})}\n\n`; for(const res of clients){try{res.write(msg)}catch{clients.delete(res)}}}
function tokenFor(u){return jwt.sign({sub:String(u.id),username:u.username,role:u.role,school:u.school||null},JWT_SECRET,{expiresIn:'8h'});}
function auth(req,res,next){const h=req.headers.authorization||''; const raw=h.startsWith('Bearer ')?h.slice(7):(req.query.token||''); if(!raw) return res.status(401).json({error:'Chưa đăng nhập'}); try{req.user=jwt.verify(raw,JWT_SECRET);next()}catch{return res.status(401).json({error:'Phiên đăng nhập hết hạn'})}}
function allow(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:'Không có quyền'})}
function schoolScope(req,params,where){ if(req.user.role==='CSGD'){params.push(req.user.school); where.push(`school=$${params.length}`)} }
async function audit(req,action,entity,entityId,metadata={}){await pool.query('insert into audit_log(actor_id,actor_username,role,school,action,entity,entity_id,metadata,ip) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[req.user?.sub||null,req.user?.username||'system',req.user?.role||'SYSTEM',req.user?.school||null,action,entity,entityId,metadata,req.ip]);}
function levelFromPA2(score){const n=Number(score); if(!Number.isFinite(n))return null; return n>=6.5?'B1.1':n>=4.75?'A2.2':'A2.1'}
function levelFromPA3(score){const n=Number(score); if(!Number.isFinite(n))return null; return n>=83?'B1.1':n>=63?'A2.2':'A2.1'}
const rank={'A2.1':1,'A2.2':2,'B1.1':3,'B1.2':4};
function reconcile(r){
  const methods=[];
  if(r.pa1_valid && r.pa1_level) methods.push({method:'PA1',level:r.pa1_level,score:r.pa1_score});
  if(r.pa2_level) methods.push({method:'PA2',level:r.pa2_level,score:r.pa2_score});
  if(r.pa3_level) methods.push({method:'PA3',level:r.pa3_level,score:r.pa3_score});
  if(!methods.length) return {best:null,method:null,status:'Chưa xác định',alerts:['Chưa có kết quả PA1/PA2/PA3']};
  methods.sort((a,b)=>(rank[b.level]||0)-(rank[a.level]||0));
  const best=methods[0];
  const alerts=[];
  const distinct=[...new Set(methods.map(x=>x.level))];
  if(distinct.length>1) alerts.push('Kết quả các phương án khác mức');
  if(methods.filter(x=>x.method==='PA3').length && Number(r.pa3_score)>100) alerts.push('Điểm PA3 ngoài khoảng 0–100');
  return {best:best.level,method:best.method,status:'Đã xác định',alerts};
}

async function init(){
 await pool.query(`create table if not exists app_user(id serial primary key,username text unique not null,password_hash text not null,role text not null check(role in ('ADMIN','BGH','CSGD')),school text,active boolean default true,created_at timestamptz default now());
 create table if not exists student_xldv(id bigserial primary key,mssv text unique not null,full_name text,school text,cohort text,major text,pa1_score numeric,pa1_level text,pa1_valid boolean default false,pa1_source text,pa2_score numeric,pa2_level text,pa3_score numeric,pa3_level text,best_level text,method text,status text,alerts jsonb default '[]',registration_pa1 text,note text,pa3_source text,updated_at timestamptz default now());
 create table if not exists audit_log(id bigserial primary key,created_at timestamptz default now(),actor_id text,actor_username text,role text,school text,action text not null,entity text,entity_id text,metadata jsonb,ip inet);
 create index if not exists idx_student_school on student_xldv(school); create index if not exists idx_student_mssv on student_xldv(mssv); create index if not exists idx_audit_created on audit_log(created_at desc);`);
 const users=[['admin','admin123','ADMIN',null],['bgh','bgh123','BGH',null],['dhspkt','dhspkt123','CSGD','ĐHSPKT'],['dhsp','dhsp123','CSGD','ĐHSP'],['dhkt','dhkt123','CSGD','ĐHKT'],['dhbk','dhbk123','CSGD','ĐHBK'],['dhcntt','dhcntt123','CSGD','ĐH CNTT']];
 for(const [u,p,r,s] of users){const hash=await bcrypt.hash(p,10); await pool.query('insert into app_user(username,password_hash,role,school) values($1,$2,$3,$4) on conflict(username) do nothing',[u,hash,r,s]);}
 const c=await pool.query('select count(*)::int n from student_xldv');
 if(c.rows[0].n===0 && process.env.SEED_EXCEL) await importWorkbook(process.env.SEED_EXCEL,'system');
}
async function importWorkbook(filePath,actor){
 const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(filePath);
 const ws=wb.getWorksheet('NHAP_DANH_SACH'); if(!ws) throw new Error('Thiếu sheet NHAP_DANH_SACH');
 const h=[]; ws.getRow(1).eachCell((c,i)=>h[i]=String(c.value??'').trim()); const base=[];
 ws.eachRow((row,n)=>{if(n===1)return; const o={}; row.eachCell((c,i)=>{o[h[i]]=c.value}); base.push(o)});
 const kq=wb.getWorksheet('KQ_PA1'); const results=new Map();
 if(kq){const hh=[]; kq.getRow(1).eachCell((c,i)=>hh[i]=String(c.value??'').trim()); kq.eachRow((row,n)=>{if(n===1)return;const o={};row.eachCell((c,i)=>{o[hh[i]]=c.value});const id=String(o['MSSV']??'').trim();if(id) results.set(id,o);});}
 const client=await pool.connect(); try{await client.query('begin'); await client.query('delete from student_xldv');
 for(const r of base){const mssv=String(r['MSSV']??'').trim(); if(!mssv)continue; const pa2=Number(r['Điểm THPT']); const kr=results.get(mssv); const pa3=kr?Number(kr['Điểm PA1']):NaN; const recon=reconcile({pa1_valid:false,pa1_level:null,pa1_score:null,pa2_score:pa2,pa2_level:levelFromPA2(pa2),pa3_score:pa3,pa3_level:levelFromPA3(pa3)});
  await client.query(`insert into student_xldv(mssv,full_name,school,cohort,major,pa2_score,pa2_level,pa3_score,pa3_level,best_level,method,status,alerts,registration_pa1,note,pa3_source) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,[mssv,r['Họ và tên'],r['CSGDĐHTV'],r['Khóa'],r['Ngành'],Number.isFinite(pa2)?pa2:null,levelFromPA2(pa2),Number.isFinite(pa3)?pa3:null,levelFromPA3(pa3),recon.best,recon.method,recon.status,recon.alerts,r['Đăng ký PA1'],r['Ghi chú'],'KQ_PA1 (nguồn legacy)']); }
 await client.query('commit'); return base.length;
 }catch(e){await client.query('rollback');throw e}finally{client.release()}
}

app.post('/api/login',async(req,res)=>{const {username,password}=req.body||{}; const q=await pool.query('select * from app_user where username=$1 and active=true',[username]); if(!q.rowCount||!await bcrypt.compare(password||'',q.rows[0].password_hash)) return res.status(401).json({error:'Sai tài khoản hoặc mật khẩu'}); const u=q.rows[0]; const t=tokenFor(u); await audit({user:{sub:u.id,username:u.username,role:u.role,school:u.school},ip:req.ip},'LOGIN','user',String(u.id)); res.json({token:t,user:{username:u.username,role:u.role,school:u.school}})});
app.post('/api/logout',auth,async(req,res)=>{await audit(req,'LOGOUT','user',req.user.sub);res.json({ok:true})});
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/events',auth,(req,res)=>{res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.flushHeaders();res.write(`event: ready\ndata: ${JSON.stringify({at:new Date().toISOString()})}\n\n`);clients.add(res);req.on('close',()=>clients.delete(res))});

function filters(req){const {school,cohort,major,level,method,status,alert,search}=req.query; const where=[];const p=[]; const add=(sql,v)=>{p.push(v);where.push(sql.replace('?',`$${p.length}`))}; if(req.user.role==='CSGD')add('school=?',req.user.school); else if(school) add('school=?',school); if(cohort)add('cohort=?',cohort);if(major)add('major=?',major);if(level)add('best_level=?',level);if(method)add('method=?',method);if(status)add('status=?',status);if(alert==='1')where.push("jsonb_array_length(alerts)>0");if(search){p.push('%'+search+'%');where.push(`(mssv ilike $${p.length} or full_name ilike $${p.length} or major ilike $${p.length})`)} return {where:where.length?'where '+where.join(' and '):'',p}}
app.get('/api/dashboard',auth,async(req,res)=>{const f=filters(req);const q=await pool.query(`select count(*)::int total,count(*) filter(where best_level is not null)::int determined,count(*) filter(where best_level is null)::int missing,count(*) filter(where jsonb_array_length(alerts)>0)::int alerts from student_xldv ${f.where}`,f.p);const lv=await pool.query(`select coalesce(best_level,'Chưa xác định') label,count(*)::int value from student_xldv ${f.where} group by 1 order by 1`,f.p);const me=await pool.query(`select coalesce(method,'Chưa xác định') label,count(*)::int value from student_xldv ${f.where} group by 1 order by 1`,f.p);res.json({kpi:q.rows[0],levels:lv.rows,methods:me.rows,serverTime:new Date().toISOString()}); await audit(req,'VIEW_DASHBOARD','dashboard','summary')});
app.get('/api/students',auth,async(req,res)=>{const f=filters(req);const q=await pool.query(`select * from student_xldv ${f.where} order by school,mssv limit 5000`,f.p);res.json(q.rows); await audit(req,'VIEW_STUDENTS','student','list',{count:q.rowCount})});
app.get('/api/audit',auth,allow('ADMIN','BGH'),async(req,res)=>{const q=await pool.query('select created_at,actor_username,role,school,action,entity,entity_id,metadata,ip from audit_log order by created_at desc limit 1000');res.json(q.rows);await audit(req,'VIEW_AUDIT','audit','list')});
app.post('/api/import/excel',auth,allow('ADMIN'),upload.single('file'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'Chưa chọn file Excel'});try{const n=await importWorkbook(req.file.path,req.user.username);await audit(req,'IMPORT_EXCEL','student','bulk',{rows:n,file:req.file.originalname});broadcast('data-updated',{action:'IMPORT_EXCEL',rows:n,file:req.file.originalname});res.json({ok:true,rows:n});}catch(e){res.status(400).json({error:String(e.message||e)})}finally{try{fs.unlinkSync(req.file.path)}catch{}}});
app.get('/api/export',auth,async(req,res)=>{const f=filters(req);const q=await pool.query(`select mssv,full_name,school,cohort,major,pa1_score,pa1_level,pa2_score,pa2_level,pa3_score,pa3_level,best_level,method,status,alerts,registration_pa1,note,updated_at from student_xldv ${f.where} order by school,mssv`,f.p);const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('BAO_CAO_XLDV');const cols=[['MSSV','mssv'],['Họ và tên','full_name'],['CSGDĐHTV','school'],['Khóa','cohort'],['Ngành','major'],['PA1 - điểm','pa1_score'],['PA1 - mức','pa1_level'],['PA2 - điểm THPT','pa2_score'],['PA2 - mức','pa2_level'],['PA3 - điểm','pa3_score'],['PA3 - mức','pa3_level'],['Mức cao nhất','best_level'],['Phương án sử dụng','method'],['Trạng thái','status'],['Cảnh báo','alerts'],['Đăng ký PA1','registration_pa1'],['Ghi chú','note'],['Cập nhật','updated_at']];ws.addRow(cols.map(x=>x[0]));q.rows.forEach(r=>ws.addRow(cols.map(x=>Array.isArray(r[x[1]])?r[x[1]].join('; '):r[x[1]])));ws.getRow(1).font={bold:true};ws.columns.forEach(c=>c.width=20);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition','attachment; filename="bao_cao_xldv_2026.xlsx"');await wb.xlsx.write(res);res.end();await audit(req,'EXPORT_EXCEL','student','filtered',{count:q.rowCount})});

app.get('/api/health',async(_,res)=>{try{await pool.query('select 1');res.json({ok:true,time:new Date().toISOString()})}catch(e){res.status(503).json({ok:false,error:e.message})}});
app.use(express.static(path.join(__dirname,'public'))); app.use((req,res)=>res.sendFile(path.join(__dirname,'public/index.html')));

init().then(()=>app.listen(PORT,()=>console.log(`XLDV 2026 running on http://localhost:${PORT}`))).catch(e=>{console.error(e);process.exit(1)});
