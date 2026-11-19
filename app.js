import { createClient } from “https://esm.sh/@supabase/supabase-js@2”;

// ======================================
// 1. KONFIGURASI SUPABASE
// ======================================

const SUPABASE_URL = “https://bznistwsamrkgzdelfro.supabase.co”;
const SUPABASE_ANON_KEY = “sb_publishable_duzGvBK2ZVHTFXfbXHz3Cw_z-T8p0A1”;

const configured =
SUPABASE_URL.startsWith(“https://”) &&
!SUPABASE_URL.includes(“ISI_”) &&
!SUPABASE_ANON_KEY.includes(“ISI_”);

const supabase = configured
? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
: null;

// ======================================
// 2. VARIABEL APLIKASI
// ======================================

const $ = (id) => document.getElementById(id);

let records = [];
let isAdmin = false;

// ======================================
// 3. NOTIFIKASI DAN TAMPILAN
// ======================================

function notify(message) {
$(“toast”).textContent = message;
$(“toast”).classList.remove(“hidden”);

setTimeout(() => {
$(“toast”).classList.add(“hidden”);
}, 2600);
}

function escapeHtml(value) {
return String(value ?? “”).replace(/[&<>”’]/g, (c) => ({
“&”: “&”,
“<”: “<”,
“>”: “>”,
‘”’: “"”,
“’”: “'”
})[c]);
}

function setConnection() {
$(“connection”).textContent = navigator.onLine
? “Online”
: “Offline”;
}

function showError(message) {
$(“errorBox”).textContent = message;
$(“errorBox”).classList.remove(“hidden”);
}

function clearError() {
$(“errorBox”).classList.add(“hidden”);
}

// ======================================
// 4. MENAMPILKAN DATA ANGGOTA
// ======================================

function render() {
const q = $(“searchInput”).value.trim().toLowerCase();

const filtered = records.filter((r) => [
r.nama,
r.nomor_lambung,
r.plat_nomor,
r.jenis_mobil,
r.warna_mobil
].some((v) => String(v ?? “”).toLowerCase().includes(q)));

$(“totalCount”).textContent = records.length;
$(“shownCount”).textContent = filtered.length;

$(“memberList”).innerHTML = filtered.map((r) => `
${escapeHtml((r.nama || “M”).charAt(0).toUpperCase())}
  <div>
    <div class="member-name">
      ${escapeHtml(r.nama)}
    </div>
    <div class="details">
      <span class="pill">
        <b>LAMBUNG</b>
        ${escapeHtml(r.nomor_lambung)}
      </span>
      <span class="pill">
        <b>PLAT</b>
        ${escapeHtml(r.plat_nomor)}
      </span>
      <span class="pill">
        <b>JENIS MOBIL</b>
        ${escapeHtml(r.jenis_mobil || "-")}
      </span>
      <span class="pill">
        <b>WARNA MOBIL</b>
        ${escapeHtml(r.warna_mobil || "-")}
      </span>
    </div>
  </div>
  ${isAdmin ? `
    <div class="card-actions">
      <button class="edit-btn" data-edit="${r.id}">
        Edit
      </button>
      <button class="delete-btn" data-delete="${r.id}">
        Hapus
      </button>
    </div>
  ` : ""}
</article>

`).join(””);

$(“emptyState”).classList.toggle(
“hidden”,
filtered.length !== 0
);

$(“loading”).classList.add(“hidden”);
}

// ======================================
// 5. MENGAMBIL DATA DARI SUPABASE
// ======================================

async function loadRecords() {
clearError();
setConnection();

if (!supabase) {
$(“loading”).classList.add(“hidden”);

showError(
  "Aplikasi belum terhubung ke Supabase. " +
  "Periksa URL dan Publishable Key di app.js."
);
return;

}

$(“loading”).classList.remove(“hidden”);

const { data, error } = await supabase
.from(“anggota_madas”)
.select(id, nama, nomor_lambung, plat_nomor, jenis_mobil, warna_mobil, created_at)
.order(“created_at”, { ascending: false });

$(“loading”).classList.add(“hidden”);

if (error) {
console.error(“Supabase load error:”, error);

showError(
  "Gagal mengambil data anggota: " + error.message
);
return;

}

records = data || [];
render();
}

// ======================================
// 6. LOGIN DAN HAK AKSES ADMIN
// ======================================

function openModal() {
$(“adminModal”).classList.remove(“hidden”);
$(“loginError”).classList.add(“hidden”);
}

function closeModal() {
$(“adminModal”).classList.add(“hidden”);
}

function setAdminUI(user) {
isAdmin = !!user;

$(“loginForm”).classList.toggle(“hidden”, isAdmin);
$(“adminPanel”).classList.toggle(“hidden”, !isAdmin);

$(“adminOpen”).textContent = isAdmin
? “Panel Admin”
: “Admin”;

render();
}

async function checkAdmin(user) {
if (!user || !supabase) {
setAdminUI(null);
return false;
}

const { data, error } = await supabase
.from(“admin_users”)
.select(“user_id”)
.eq(“user_id”, user.id)
.maybeSingle();

if (error || !data) {
setAdminUI(null);
return false;
}

setAdminUI(user);
return true;
}

// ======================================
// 7. FORM TAMBAH DAN EDIT DATA
// ======================================

function resetForm() {
$(“memberForm”).reset();
$(“recordId”).value = “”;

$(“saveBtn”).textContent = “+ Simpan Data”;
$(“cancelEdit”).classList.add(“hidden”);
}

// ======================================
// 8. MEMULAI APLIKASI
// ======================================

async function start() {
setConnection();

if (!supabase) {
await loadRecords();
return;
}

const { data, error } = await supabase.auth.getSession();

if (!error && data.session) {
await checkAdmin(data.session.user);
}

await loadRecords();

supabase.auth.onAuthStateChange((_event, session) => {
setTimeout(async () => {
if (session) {
await checkAdmin(session.user);
} else {
setAdminUI(null);
}

  await loadRecords();
}, 0);

});
}

// ======================================
// 9. TOMBOL ADMIN
// ======================================

$(“adminOpen”).addEventListener(“click”, openModal);

$(“closeModal”).addEventListener(“click”, closeModal);

$(“adminModal”).addEventListener(“click”, (e) => {
if (e.target === $(“adminModal”)) {
closeModal();
}
});

// ======================================
// 10. PENCARIAN DAN REFRESH
// ======================================

$(“searchInput”).addEventListener(“input”, render);

$(“refreshBtn”).addEventListener(“click”, loadRecords);

// ======================================
// 11. LOGIN ADMIN
// ======================================

$(“loginForm”).addEventListener(“submit”, async (e) => {
e.preventDefault();

$(“loginError”).classList.add(“hidden”);

if (!supabase) {
$(“loginError”).textContent =
“Koneksi Supabase belum diatur.”;

$("loginError").classList.remove("hidden");
return;

}

const { data, error } = await supabase.auth.signInWithPassword({
email: $(“email”).value.trim(),
password: $(“password”).value
});

if (error) {
$(“loginError”).textContent =
“Email atau password salah.”;

$("loginError").classList.remove("hidden");
return;

}

const admin = await checkAdmin(data.user);

if (!admin) {
await supabase.auth.signOut();

$("loginError").textContent =
  "Akun ini tidak memiliki hak akses admin.";
$("loginError").classList.remove("hidden");
return;

}

$(“loginForm”).reset();

notify(“Berhasil masuk sebagai admin.”);
await loadRecords();
});

// ======================================
// 12. TAMBAH DAN EDIT ANGGOTA
// ======================================

$(“memberForm”).addEventListener(“submit”, async (e) => {
e.preventDefault();

if (!isAdmin || !supabase) {
notify(“Anda tidak memiliki hak admin.”);
return;
}

const payload = {
nama: $(“memberName”).value.trim(),

nomor_lambung: $("fleetNumber")
  .value.trim().toUpperCase(),
plat_nomor: $("plateNumber")
  .value.trim().toUpperCase(),
jenis_mobil: $("jenisMobil")
  .value.trim(),
warna_mobil: $("warnaMobil")
  .value.trim()

};

if (
!payload.nama ||
!payload.nomor_lambung ||
!payload.plat_nomor
) {
notify(“Nama, nomor lambung, dan plat wajib diisi.”);
return;
}

const id = $(“recordId”).value;

const result = id
? await supabase
.from(“anggota_madas”)
.update(payload)
.eq(“id”, id)
: await supabase
.from(“anggota_madas”)
.insert(payload);

if (result.error) {
console.error(“Supabase save error:”, result.error);
notify(“Gagal menyimpan: “ + result.error.message);
return;
}

resetForm();

await loadRecords();

notify(
id
? “Data anggota berhasil diperbarui.”
: “Data anggota berhasil ditambahkan.”
);
});

// ======================================
// 13. EDIT DAN HAPUS ANGGOTA
// ======================================

$(“memberList”).addEventListener(“click”, async (e) => {
const edit = e.target.closest(”[data-edit]”);
const del = e.target.closest(”[data-delete]”);

if (edit && isAdmin) {
const r = records.find(
(x) => String(x.id) === edit.dataset.edit
);

if (!r) return;
$("recordId").value = r.id;
$("memberName").value = r.nama;
$("fleetNumber").value = r.nomor_lambung;
$("plateNumber").value = r.plat_nomor;
$("jenisMobil").value = r.jenis_mobil || "";
$("warnaMobil").value = r.warna_mobil || "";
$("saveBtn").textContent = "Simpan Perubahan";
$("cancelEdit").classList.remove("hidden");
openModal();

}

if (
del &&
isAdmin &&
confirm(“Apakah Anda yakin ingin menghapus data ini?”)
) {
const { error } = await supabase
.from(“anggota_madas”)
.delete()
.eq(“id”, del.dataset.delete);

if (error) {
  notify("Gagal menghapus data anggota.");
} else {
  await loadRecords();
  notify("Data anggota berhasil dihapus.");
}

}
});

// ======================================
// 14. BATAL EDIT
// ======================================

$(“cancelEdit”).addEventListener(“click”, resetForm);

// ======================================
// 15. LOGOUT ADMIN
// ======================================

$(“logoutBtn”).addEventListener(“click”, async () => {
if (!supabase) return;

const { error } = await supabase.auth.signOut();

if (error) {
notify(“Gagal keluar dari akun admin.”);
return;
}

setAdminUI(null);
resetForm();
closeModal();

notify(“Anda telah keluar dari akun admin.”);
});

// ======================================
// 16. STATUS INTERNET
// ======================================

window.addEventListener(“online”, () => {
setConnection();
loadRecords();
});

window.addEventListener(“offline”, setConnection);

// ======================================
// 17. SERVICE WORKER PWA
// ======================================

if (“serviceWorker” in navigator) {
window.addEventListener(“load”, () => {
navigator.serviceWorker
.register(”./sw.js”)
.catch((error) => {
console.error(“Service Worker:”, error);
});
});
}

// ======================================
// 18. JALANKAN APLIKASI
// ======================================

start();
