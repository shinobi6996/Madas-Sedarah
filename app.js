import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "ISI_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "ISI_SUPABASE_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = id => document.getElementById(id);

let records = [];
let isAdmin = false;

function notify(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");
  setTimeout(() => $("toast").classList.add("hidden"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  }[c]));
}

function render() {
  const q = $("searchInput").value.toLowerCase().trim();

  const filtered = records.filter(r =>
    [r.nama, r.nomor_lambung, r.plat_nomor]
      .some(v => String(v).toLowerCase().includes(q))
  );

  $("totalCount").textContent = records.length;
  $("shownCount").textContent = filtered.length;

  $("memberList").innerHTML = filtered.map(r => `
    <article class="member-card">
      <div class="member-icon">
        ${escapeHtml(r.nama.charAt(0).toUpperCase())}
      </div>
      <div>
        <div class="member-name">${escapeHtml(r.nama)}</div>
        <div class="details">
          <span class="pill"><b>LAMBUNG</b>${escapeHtml(r.nomor_lambung)}</span>
          <span class="pill"><b>PLAT</b>${escapeHtml(r.plat_nomor)}</span>
        </div>
      </div>
      ${isAdmin ? `
        <div class="card-actions">
          <button class="edit-btn" data-edit="${r.id}">Edit</button>
          <button class="delete-btn" data-delete="${r.id}">Hapus</button>
        </div>` : ""}
    </article>
  `).join("");

  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("loading").classList.add("hidden");
}

async function loadRecords() {
  $("connection").textContent = navigator.onLine ? "Online" : "Offline";
  $("errorBox").classList.add("hidden");

  const { data, error } = await supabase
    .from("anggota_madas")
    .select("*")
    .order("created_at", { ascending: false });

  $("loading").classList.add("hidden");

  if (error) {
    $("errorBox").textContent = "Gagal mengambil data anggota.";
    $("errorBox").classList.remove("hidden");
    return;
  }

  records = data || [];
  render();
}

function setAdminUI(user) {
  isAdmin = !!user;

  $("loginForm").classList.toggle("hidden", isAdmin);
  $("adminPanel").classList.toggle("hidden", !isAdmin);

  $("adminOpen").textContent = isAdmin ? "Panel Admin" : "Admin";

  render();
}

async function checkAdmin(session) {
  if (!session) {
    setAdminUI(null);
    return false;
  }

  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (data) {
    setAdminUI(session.user);
    return true;
  }

  await supabase.auth.signOut();
  setAdminUI(null);
  return false;
}

async function start() {
  const { data } = await supabase.auth.getSession();

  await checkAdmin(data.session);
  await loadRecords();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    setAdminUI(null);

    if (session) {
      setTimeout(async () => {
        await checkAdmin(session);
        await loadRecords();
      }, 0);
    } else {
      await loadRecords();
    }
  });
}

function openModal() {
  $("adminModal").classList.remove("hidden");
}

function closeModal() {
  $("adminModal").classList.add("hidden");
}

function resetForm() {
  $("memberForm").reset();
  $("recordId").value = "";
  $("saveBtn").textContent = "+ Simpan Data";
  $("cancelEdit").classList.add("hidden");
}

$("adminOpen").onclick = openModal;
$("closeModal").onclick = closeModal;

$("adminModal").addEventListener("click", e => {
  if (e.target === $("adminModal")) closeModal();
});

$("searchInput").addEventListener("input", render);
$("refreshBtn").addEventListener("click", loadRecords);

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: $("email").value,
    password: $("password").value
  });

  if (error) {
    $("loginError").textContent = "Email atau password salah.";
    $("loginError").classList.remove("hidden");
    return;
  }

  const success = await checkAdmin(data.session);

  if (!success) {
    $("loginError").textContent = "Akun tidak memiliki hak Admin.";
    $("loginError").classList.remove("hidden");
    return;
  }

  $("loginError").classList.add("hidden");
  notify("Berhasil masuk sebagai Admin.");
  await loadRecords();
});

$("memberForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!isAdmin) return;

  const payload = {
    nama: $("memberName").value.trim(),
    nomor_lambung: $("fleetNumber").value.trim().toUpperCase(),
    plat_nomor: $("plateNumber").value.trim().toUpperCase()
  };

  const id = $("recordId").value;

  const result = id
    ? await supabase.from("anggota_madas").update(payload).eq("id", id)
    : await supabase.from("anggota_madas").insert(payload);

  if (result.error) {
    notify("Gagal menyimpan data.");
    return;
  }

  resetForm();
  await loadRecords();
  notify("Data anggota berhasil disimpan.");
});

$("memberList").addEventListener("click", async e => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");

  if (edit && isAdmin) {
    const r = records.find(x => String(x.id) === edit.dataset.edit);

    if (!r) return;

    $("recordId").value = r.id;
    $("memberName").value = r.nama;
    $("fleetNumber").value = r.nomor_lambung;
    $("plateNumber").value = r.plat_nomor;

    $("saveBtn").textContent = "Simpan Perubahan";
    $("cancelEdit").classList.remove("hidden");

    openModal();
  }

  if (del && isAdmin && confirm("Hapus data anggota ini?")) {
    const { error } = await supabase
      .from("anggota_madas")
      .delete()
      .eq("id", del.dataset.delete);

    if (error) {
      notify("Gagal menghapus data.");
    } else {
      await loadRecords();
      notify("Data berhasil dihapus.");
    }
  }
});

$("cancelEdit").onclick = resetForm;

$("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  setAdminUI(null);
  resetForm();
  closeModal();
  notify("Berhasil keluar.");
};

window.addEventListener("online", () => {
  $("connection").textContent = "Online";
  loadRecords();
});

window.addEventListener("offline", () => {
  $("connection").textContent = "Offline";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

start();
