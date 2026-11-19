import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1) Ganti dua nilai ini dengan URL dan anon key dari project Supabase Anda.
const SUPABASE_URL = "ISI_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "ISI_SUPABASE_ANON_KEY";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("ISI_") && !SUPABASE_ANON_KEY.includes("ISI_");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = (id) => document.getElementById(id);
let records = [];
let isAdmin = false;

function notify(message){ $("toast").textContent=message; $("toast").classList.remove("hidden"); setTimeout(()=>$("toast").classList.add("hidden"),2600); }
function escapeHtml(value){ return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function setConnection(){ $("connection").textContent = navigator.onLine ? "Online" : "Offline"; }
function showError(message){ $("errorBox").textContent=message; $("errorBox").classList.remove("hidden"); }
function clearError(){ $("errorBox").classList.add("hidden"); }

function render(){
  const q=$("searchInput").value.trim().toLowerCase();
  const filtered=records.filter(r=>[r.name,r.fleet_number,r.plate_number].some(v=>String(v).toLowerCase().includes(q)));
  $("totalCount").textContent=records.length; $("shownCount").textContent=filtered.length;
  $("memberList").innerHTML=filtered.map(r=>`
    <article class="member-card">
      <div class="member-icon">${escapeHtml((r.name||"M").charAt(0).toUpperCase())}</div>
      <div>
        <div class="member-name">${escapeHtml(r.name)}</div>
        <div class="details"><span class="pill"><b>LAMBUNG</b>${escapeHtml(r.fleet_number)}</span><span class="pill"><b>PLAT</b>${escapeHtml(r.plate_number)}</span></div>
      </div>
      ${isAdmin?`<div class="card-actions"><button class="edit-btn" data-edit="${r.id}">Edit</button><button class="delete-btn" data-delete="${r.id}">Hapus</button></div>`:""}
    </article>`).join("");
  $("emptyState").classList.toggle("hidden",filtered.length!==0);
  $("loading").classList.add("hidden");
}
async function loadRecords(){
  clearError(); setConnection();
  if(!supabase){ $("loading").classList.add("hidden"); showError("Aplikasi belum terhubung ke Supabase. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di file app.js, lalu unggah ulang."); return; }
  $("loading").classList.remove("hidden");
  const {data,error}=await supabase.from("members").select("id,name,fleet_number,plate_number,created_at").order("created_at",{ascending:false});
  $("loading").classList.add("hidden");
  if(error){showError("Tidak dapat mengambil data. Periksa koneksi dan pengaturan database Supabase.");return;}
  records=data||[]; render();
}
function openModal(){ $("adminModal").classList.remove("hidden"); $("loginError").classList.add("hidden"); }
function closeModal(){ $("adminModal").classList.add("hidden"); }
function setAdminUI(user){
  isAdmin=!!user;
  $("loginForm").classList.toggle("hidden",isAdmin);
  $("adminPanel").classList.toggle("hidden",!isAdmin);
  $("adminOpen").textContent=isAdmin?"Panel Admin":"Admin";
  render();
}
function resetForm(){ $("memberForm").reset(); $("recordId").value=""; $("saveBtn").textContent="+ Simpan Data"; $("cancelEdit").classList.add("hidden"); }
async function start(){
  setConnection();
  if(supabase){
    const {data:{session}}=await supabase.auth.getSession();
    if(session){
      const {data}=await supabase.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
      setAdminUI(data?session.user:null);
    }
    supabase.auth.onAuthStateChange(async (_event,session)=>{
      let adminUser=null;
      if(session){const {data}=await supabase.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();if(data)adminUser=session.user;}
      setAdminUI(adminUser); await loadRecords();
    });
  }
  await loadRecords();
}
$("adminOpen").addEventListener("click",openModal);
$("closeModal").addEventListener("click",closeModal);
$("adminModal").addEventListener("click",e=>{if(e.target===$("adminModal"))closeModal();});
$("searchInput").addEventListener("input",render);
$("refreshBtn").addEventListener("click",loadRecords);
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); $("loginError").classList.add("hidden");
  if(!supabase)return;
  const {data,error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});
  if(error){$("loginError").textContent="Email atau password salah, atau akun belum terdaftar."; $("loginError").classList.remove("hidden");return;}
  const {data:admin}=await supabase.from("admin_users").select("user_id").eq("user_id",data.user.id).maybeSingle();
  if(!admin){await supabase.auth.signOut();$("loginError").textContent="Akun ini tidak memiliki hak admin."; $("loginError").classList.remove("hidden");return;}
  setAdminUI(data.user); notify("Berhasil masuk sebagai admin."); await loadRecords();
});
$("memberForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!isAdmin||!supabase)return;
  const payload={name:$("memberName").value.trim(),fleet_number:$("fleetNumber").value.trim().toUpperCase(),plate_number:$("plateNumber").value.trim().toUpperCase()};
  if(!payload.name||!payload.fleet_number||!payload.plate_number)return;
  const id=$("recordId").value;
  const result=id?await supabase.from("members").update(payload).eq("id",id):await supabase.from("members").insert(payload);
  if(result.error){notify("Gagal menyimpan. Periksa izin admin dan koneksi.");return;}
  resetForm(); await loadRecords(); notify(id?"Data diperbarui.":"Data berhasil ditambahkan.");
});
$("memberList").addEventListener("click",async e=>{
  const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
  if(edit&&isAdmin){const r=records.find(x=>String(x.id)===edit.dataset.edit);if(!r)return;$("recordId").value=r.id;$("memberName").value=r.name;$("fleetNumber").value=r.fleet_number;$("plateNumber").value=r.plate_number;$("saveBtn").textContent="Simpan Perubahan";$("cancelEdit").classList.remove("hidden");$("adminModal").classList.remove("hidden");}
  if(del&&isAdmin&&confirm("Hapus data anggota ini?")){const {error}=await supabase.from("members").delete().eq("id",del.dataset.delete);if(error)notify("Gagal menghapus data.");else{await loadRecords();notify("Data dihapus.");}}
});
$("cancelEdit").addEventListener("click",resetForm);
$("logoutBtn").addEventListener("click",async()=>{await supabase.auth.signOut();setAdminUI(null);resetForm();closeModal();notify("Anda telah keluar.");});
window.addEventListener("online",setConnection);window.addEventListener("offline",setConnection);
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
start();
