"use strict";
/* ==========================================================================
   MODUL 10 — COMPONENT-BASED UI (Custom Elements)
   Bagian B — Kegiatan Praktikum : script.js
   Mata Kuliah: Pemrograman Berbasis Web (PROG31W)

   Program KUMULATIF (melanjutkan Modul 3-9), DENGAN perubahan Modul 10:
     - Kartu artikel dirender sebagai <kartu-artikel> dari data API (B.5).
     - Dark mode dibungkus oleh komponen <tombol-tema> di komponen.js (B.7).
     - Komentar dirender sebagai <kartu-komentar> (B.7 Praktikum Mandiri).
     - Delegasi Like/Hapus artikel pada container DINONAKTIFKAN;
       perilaku Like/Hapus kini berada DI DALAM komponen (komponen.js, B.6).
   Komponen didefinisikan di komponen.js (ditautkan sebelum file ini).
   ========================================================================== */

const BASE = "https://jsonplaceholder.typicode.com";

/*MODUL 9 · B.6 — FUNGSI pesanDariStatus()*/
function pesanDariStatus(status) {
    if (status === 404) return "Data tidak ditemukan di server.";
    if (status === 400) return "Data yang dikirim tidak valid.";
    if (status >= 500) return "Server sedang bermasalah, coba lagi nanti.";
    return "Terjadi kesalahan tidak terduga (status: " + status + ").";
}

/*MODUL 9 · B.2 — FUNGSI kirimKomentarKeServer() (POST)*/
async function kirimKomentarKeServer(nama, pesan) {
    const response = await fetch(BASE + "/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nama, body: pesan, postId: 1 }),
    });
    if (!response.ok) {
        throw new Error(pesanDariStatus(response.status));
    }
    return await response.json();
}


/*MODUL 9 · B.5 — FUNGSI hapusKomentarDariServer() (DELETE)*/
async function hapusKomentarDariServer(idKomentar) {
    const response = await fetch(BASE + "/comments/" + idKomentar, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(pesanDariStatus(response.status));
    }
    return true;
}


/*MODUL 9 · B.7 TUGAS MANDIRI 1 — FUNGSI editKomentarKeServer() (PATCH)*/
async function editKomentarKeServer(idKomentar, namaBaru, pesanBaru) {
    const response = await fetch(BASE + "/comments/" + idKomentar, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: namaBaru, body: pesanBaru }),
    });
    if (!response.ok) {
        throw new Error(pesanDariStatus(response.status));
    }
    return await response.json();
}


/*MODUL 9 · B.7 TUGAS MANDIRI 3 — HELPER LOADING TOMBOL*/
function nonaktifkanTombol(tombol, teksSementara) {
    if (!tombol) return;
    tombol.disabled = true;
    tombol.dataset.teksAsli = tombol.textContent;
    tombol.textContent = teksSementara || "Memproses...";
    tombol.classList.add("btn-loading");
}

function aktifkanKembaliTombol(tombol, teksKustom) {
    if (!tombol) return;
    tombol.disabled = false;
    tombol.textContent = teksKustom || tombol.dataset.teksAsli || "Tombol";
    tombol.classList.remove("btn-loading");
}


/*VARIABEL MODE EDIT KOMENTAR (Tugas Mandiri 1)*/
let modeEditKomentar = false;
let idKomentarDiedit = null;
let elemenKomentarDiedit = null;

/*MODUL 3 · B.4 & MODUL 7 · B.7 — ELEMEN ASIDE (TAMPIL/SEMBUNYI & PERSISTENSI)*/
const tombolKontak = document.querySelector("#btn-kontak");
const sectionKontak = document.querySelector("#kontak");

function muatPreferensiAside() {
    try {
        const statusAside = localStorage.getItem("asideTampil");
        if (statusAside !== null && sectionKontak && tombolKontak) {
            const isTampil = statusAside === "true";
            if (isTampil) {
                sectionKontak.classList.remove("tersembunyi");
                tombolKontak.setAttribute("aria-expanded", "true");
                tombolKontak.textContent = "Sembunyikan Kontak";
            } else {
                sectionKontak.classList.add("tersembunyi");
                tombolKontak.setAttribute("aria-expanded", "false");
                tombolKontak.textContent = "Tampilkan Kontak";
            }
        }
    } catch (e) {
        console.error("Gagal memuat preferensi aside dari localStorage:", e);
    }
}
muatPreferensiAside();

if (tombolKontak && sectionKontak) {
    tombolKontak.addEventListener("click", () => {
        const kontakTersembunyi = sectionKontak.classList.toggle("tersembunyi");
        const isTampil = !kontakTersembunyi;
        tombolKontak.setAttribute("aria-expanded", String(isTampil));
        tombolKontak.textContent = kontakTersembunyi ? "Tampilkan Kontak" : "Sembunyikan Kontak";

        try {
            localStorage.setItem("asideTampil", String(isTampil));
        } catch (e) {
            console.error("Gagal menyimpan status aside ke localStorage:", e);
        }
    });
}


/*MODUL 10 · B.5 — RENDER <kartu-artikel> DARI API
Menggantikan renderPengalaman() manual dengan custom element <kartu-artikel>.*/

const containerPengalaman = document.querySelector(".daftar-artikel");

/*Modul 9 · B.5: URL endpoint artikel.*/
const modeUjiError = new URLSearchParams(window.location.search).get("uji") === "error";
const URL_ARTIKEL = BASE + (modeUjiError ? "/postsxyz" : "/posts") + "?_limit=5";

/* Modul 9 · B.7: Tampilkan/sembunyikan indikator loading spinner*/
function tampilkanLoading(idElemen) {
    const el = document.querySelector("#" + idElemen);
    if (el) el.classList.remove("tersembunyi");
}

function sembunyikanLoading(idElemen) {
    const el = document.querySelector("#" + idElemen);
    if (el) el.classList.add("tersembunyi");
}

function tampilkanErrorFetch(pesan) {
    const el = document.querySelector("#pesan-error-fetch");
    if (el) {
        el.textContent = pesan;
        el.classList.remove("tersembunyi");
    }
}

function sembunyikanErrorFetch() {
    const el = document.querySelector("#pesan-error-fetch");
    if (el) {
        el.textContent = "";
        el.classList.add("tersembunyi");
    }
}

/*Modul 10 · B.5: Mengambil data artikel dari API dan merender sebagai <kartu-artikel>
Menggantikan renderPengalaman() manual dengan custom element.*/
async function muatArtikelDariAPI() {
    if (!containerPengalaman) return;
    tampilkanLoading("loading");
    sembunyikanErrorFetch();

    try {
        const response = await fetch(URL_ARTIKEL);
        if (!response.ok) {
            throw new Error("HTTP Error — Status: " + response.status);
        }

        const daftarPost = await response.json();

        // Modul 10: Render setiap post sebagai <kartu-artikel> (bukan createElement manual)
        daftarPost.forEach((post) => {
            const kartu = document.createElement("kartu-artikel");
            kartu.setAttribute("judul", post.title);
            kartu.setAttribute("isi", post.body);
            kartu.setAttribute("batas-like", "10"); // B.7 Opsional: batas like 10
            containerPengalaman.appendChild(kartu);
        });

    } catch (error) {
        tampilkanErrorFetch("Gagal memuat artikel dari API. Silakan coba lagi nanti. (" + error.message + ")");
        console.error("Gagal mengambil data artikel dari API:", error);
    } finally {
        sembunyikanLoading("loading");
    }
}


if (containerPengalaman) {
    muatArtikelDariAPI();

    // Form Tambah Pengalaman (Modul 4) — kini membuat <kartu-artikel>
    const tombolTambah = document.querySelector("#btn-tambah");
    const formPengalaman = document.querySelector("#form-pengalaman");

    if (tombolTambah && formPengalaman) {
        tombolTambah.addEventListener("click", () => {
            const formTersembunyi = formPengalaman.classList.toggle("tersembunyi");
            tombolTambah.setAttribute("aria-expanded", String(!formTersembunyi));
            tombolTambah.textContent = formTersembunyi ? "Tambah Pengalaman" : "Tutup Form";
        });

        formPengalaman.addEventListener("submit", (e) => {
            e.preventDefault();

            const dataForm = new FormData(formPengalaman);
            const judul = String(dataForm.get("judul") ?? "").trim();
            const deskripsi = String(dataForm.get("deskripsi") ?? "").trim();

            if (!judul || !deskripsi) {
                const kolomKosong = Array.from(formPengalaman.querySelectorAll("input, textarea"))
                    .find((kolom) => !kolom.value.trim());
                if (kolomKosong) {
                    kolomKosong.setCustomValidity("Bagian ini wajib diisi.");
                    kolomKosong.reportValidity();
                    kolomKosong.addEventListener("input", () => {
                        kolomKosong.setCustomValidity("");
                    }, { once: true });
                }
                return;
            }

            // Modul 10: Buat <kartu-artikel> alih-alih createElement("article") manual
            const kartu = document.createElement("kartu-artikel");
            kartu.setAttribute("judul", judul);
            kartu.setAttribute("isi", deskripsi);
            containerPengalaman.appendChild(kartu);

            formPengalaman.reset();
            formPengalaman.classList.add("tersembunyi");
            tombolTambah.setAttribute("aria-expanded", "false");
            tombolTambah.textContent = "Tambah Pengalaman";
        });
    }
}


/*MODUL 10 · B.7 PRAKTIKUM MANDIRI — KOMENTAR DENGAN <kartu-komentar>
Menggantikan buatElemenKomentar() manual dengan custom element.*/

const formKomentar = document.querySelector("#form-komentar");
const inputNama = document.querySelector("#input-nama");
const inputPesan = document.querySelector("#input-pesan");
const daftarKomentar = document.querySelector("#daftar-komentar");
const pesanErrorKomentar = document.querySelector("#pesan-error-komentar");
const btnKirimKomentar = document.querySelector("#btn-kirim-komentar");
const btnBatalEdit = document.querySelector("#btn-batal-edit");
const btnHapusSemuaKomentar = document.querySelector("#btn-hapus-semua-komentar");

function tampilkanErrorKomentar(teks) {
    if (pesanErrorKomentar) {
        pesanErrorKomentar.textContent = teks;
        pesanErrorKomentar.classList.remove("tersembunyi");
    }
}

function sembunyikanErrorKomentar() {
    if (pesanErrorKomentar) {
        pesanErrorKomentar.textContent = "";
        pesanErrorKomentar.classList.add("tersembunyi");
    }
}

/**
 * Modul 7 · B.5: Helper mengambil data komentar dari localStorage
 */
function getDaftarKomentar() {
    try {
        return JSON.parse(localStorage.getItem("komentar")) || [];
    } catch (e) {
        console.error("Data komentar di localStorage rusak, mereset:", e);
        return [];
    }
}

function simpanKomentar(nama, pesan, id) {
    try {
        const daftar = getDaftarKomentar();
        daftar.push({ id, nama, pesan });
        localStorage.setItem("komentar", JSON.stringify(daftar));
    } catch (e) {
        console.error("Gagal menyimpan komentar ke localStorage:", e);
    }
}

function perbaruiKomentarDiStorage(id, namaBaru, pesanBaru) {
    try {
        const daftar = getDaftarKomentar();
        const index = daftar.findIndex((k) => String(k.id) === String(id));
        if (index !== -1) {
            daftar[index].nama = namaBaru;
            daftar[index].pesan = pesanBaru;
            localStorage.setItem("komentar", JSON.stringify(daftar));
        }
    } catch (e) {
        console.error("Gagal memperbarui komentar di localStorage:", e);
    }
}

function hapusKomentarDariStorage(id) {
    try {
        const daftar = getDaftarKomentar();
        const index = daftar.findIndex((k) => String(k.id) === String(id));
        if (index !== -1) {
            daftar.splice(index, 1);
            localStorage.setItem("komentar", JSON.stringify(daftar));
        }
    } catch (e) {
        console.error("Gagal menghapus komentar dari localStorage:", e);
    }
}

/*Membatalkan mode edit dan mereset form*/
function batalkanModeEdit() {
    modeEditKomentar = false;
    idKomentarDiedit = null;
    elemenKomentarDiedit = null;
    if (btnKirimKomentar) {
        btnKirimKomentar.textContent = "Kirim Komentar";
    }
    if (btnBatalEdit) {
        btnBatalEdit.classList.add("tersembunyi");
    }
    if (formKomentar) {
        formKomentar.reset();
    }
    hapusDraftKomentar();
    sembunyikanErrorKomentar();
}

if (btnBatalEdit) {
    btnBatalEdit.addEventListener("click", batalkanModeEdit);
}

/*Modul 10 · B.7: Membuat <kartu-komentar> alih-alih <li> manual.
Data diisi lewat atribut nama & pesan, lalu textContent di komponen.*/
function buatElemenKomentar(nama, pesan, id) {
    const kartuKomentar = document.createElement("kartu-komentar");
    kartuKomentar.setAttribute("nama", nama);
    kartuKomentar.setAttribute("pesan", pesan);

    if (id !== undefined && id !== null) {
        kartuKomentar.dataset.id = id;
    }

    return kartuKomentar;
}

/*Memuat seluruh komentar tersimpan dari localStorage*/
function muatKomentar() {
    if (!daftarKomentar) return;
    daftarKomentar.innerHTML = "";
    const daftar = getDaftarKomentar();
    daftar.forEach((k) => {
        const el = buatElemenKomentar(k.nama, k.pesan, k.id);
        daftarKomentar.appendChild(el);
    });
}


/*MODUL 9 · B.7 — KOMENTAR AWAL DARI API /posts/1/comments */
async function muatKomentarDariAPI() {
    tampilkanLoading("loading-komentar");

    try {
        const response = await fetch(BASE + "/posts/1/comments");
        if (!response.ok) {
            throw new Error("HTTP Error — Status: " + response.status);
        }

        const daftarKomentarAPI = await response.json();

        if (daftarKomentar) {
            daftarKomentarAPI.forEach((komentar) => {
                const el = buatElemenKomentar(komentar.name, komentar.body, komentar.id);
                el.classList.add("komentar-api");
                daftarKomentar.appendChild(el);
            });
        }

        console.log("Berhasil memuat " + daftarKomentarAPI.length + " komentar dari API.");

    } catch (error) {
        if (daftarKomentar) {
            const elError = document.createElement("kartu-komentar");
            elError.setAttribute("nama", "Sistem");
            elError.setAttribute("pesan", "Gagal memuat komentar dari API. (" + error.message + ")");
            elError.classList.add("komentar-error");
            daftarKomentar.appendChild(elError);
        }
        console.error("Gagal mengambil komentar dari API:", error);
    } finally {
        sembunyikanLoading("loading-komentar");
    }
}

// Render komentar tersimpan (localStorage) terlebih dahulu, lalu muat dari API
muatKomentar();
muatKomentarDariAPI();


/*EVENT DELEGATION UNTUK <kartu-komentar> (hapus & edit via custom event)*/
if (daftarKomentar) {
    // Tangani event hapus-komentar yang di-dispatch dari dalam komponen
    daftarKomentar.addEventListener("hapus-komentar", async (e) => {
        const id = e.detail.id;

        if (modeEditKomentar && String(idKomentarDiedit) === String(id)) {
            batalkanModeEdit();
        }

        if (id) {
            try {
                await hapusKomentarDariServer(id);
                hapusKomentarDariStorage(id);
                console.log("Komentar ID " + id + " berhasil dihapus.");
            } catch (error) {
                console.error("Gagal menghapus komentar dari server:", error);
                // Komentar sudah dihapus dari DOM oleh komponen, hapus juga dari storage
                hapusKomentarDariStorage(id);
            }
        }
        sembunyikanErrorKomentar();
    });

    // Tangani event edit-komentar yang di-dispatch dari dalam komponen
    daftarKomentar.addEventListener("edit-komentar", (e) => {
        const detail = e.detail;
        modeEditKomentar = true;
        idKomentarDiedit = detail.id;
        elemenKomentarDiedit = detail.elemen;

        if (inputNama) inputNama.value = detail.nama || "";
        if (inputPesan) inputPesan.value = detail.pesan || "";

        if (btnKirimKomentar) {
            btnKirimKomentar.textContent = "Perbarui Komentar";
        }
        if (btnBatalEdit) {
            btnBatalEdit.classList.remove("tersembunyi");
        }

        if (inputNama) inputNama.focus();
    });
}


//MODUL 9 · B.6 — PROFIL PENULIS DINAMIS DARI ENDPOINT /users/1
async function muatProfilPenulis() {
    const namaEl = document.querySelector("#nama-penulis");
    const emailEl = document.querySelector("#email-penulis");
    if (!namaEl || !emailEl) return;

    try {
        const response = await fetch(BASE + "/users/1");
        if (!response.ok) {
            throw new Error("HTTP Error — Status: " + response.status);
        }
        const user = await response.json();
        namaEl.textContent = user.name;
        emailEl.textContent = user.email;
    } catch (error) {
        console.error("Gagal memuat profil penulis dari API:", error);
        namaEl.textContent = "Gagal memuat (offline)";
        emailEl.textContent = "Gagal memuat (offline)";
    }
}
muatProfilPenulis();


/*DRAFT KOMENTAR DENGAN SESSIONSTORAGE*/

function simpanDraftKomentar() {
    try {
        const draft = {
            nama: inputNama ? inputNama.value : "",
            pesan: inputPesan ? inputPesan.value : ""
        };
        sessionStorage.setItem("draftKomentar", JSON.stringify(draft));
    } catch (e) {
        console.error("Gagal menyimpan draft komentar ke sessionStorage:", e);
    }
}

function muatDraftKomentar() {
    try {
        const raw = sessionStorage.getItem("draftKomentar");
        if (raw) {
            const draft = JSON.parse(raw);
            if (inputNama && draft.nama) inputNama.value = draft.nama;
            if (inputPesan && draft.pesan) inputPesan.value = draft.pesan;
        }
    } catch (e) {
        console.error("Gagal memuat draft komentar dari sessionStorage:", e);
    }
}

function hapusDraftKomentar() {
    try {
        sessionStorage.removeItem("draftKomentar");
    } catch (e) {
        console.error("Gagal menghapus draft komentar:", e);
    }
}

if (inputNama) {
    inputNama.addEventListener("input", simpanDraftKomentar);
}
if (inputPesan) {
    inputPesan.addEventListener("input", simpanDraftKomentar);
}
muatDraftKomentar();


/*HANDLER SUBMIT FORM KOMENTAR (POST baru & PATCH edit)*/
if (formKomentar && daftarKomentar) {
    formKomentar.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nama = inputNama ? inputNama.value.trim() : "";
        const pesan = inputPesan ? inputPesan.value.trim() : "";

        if (nama === "" || pesan === "") {
            tampilkanErrorKomentar("Nama dan pesan komentar wajib diisi!");
            return;
        }

        if (nama.length < 3) {
            tampilkanErrorKomentar("Nama harus terdiri dari minimal 3 karakter!");
            if (inputNama) inputNama.focus();
            return;
        }

        if (pesan.length < 5) {
            tampilkanErrorKomentar("Pesan komentar harus terdiri dari minimal 5 karakter!");
            if (inputPesan) inputPesan.focus();
            return;
        }
        sembunyikanErrorKomentar();

        // KASUS 1: MODE EDIT KOMENTAR (PATCH)
        if (modeEditKomentar && idKomentarDiedit) {
            nonaktifkanTombol(btnKirimKomentar, "Menyimpan...");
            try {
                await editKomentarKeServer(idKomentarDiedit, nama, pesan);

                // Perbarui atribut pada <kartu-komentar> — attributeChangedCallback akan re-render
                if (elemenKomentarDiedit) {
                    elemenKomentarDiedit.setAttribute("nama", nama);
                    elemenKomentarDiedit.setAttribute("pesan", pesan);
                }

                perbaruiKomentarDiStorage(idKomentarDiedit, nama, pesan);
                console.log("Komentar ID " + idKomentarDiedit + " berhasil diperbarui via PATCH.");
                batalkanModeEdit();

            } catch (error) {
                tampilkanErrorKomentar("Gagal memperbarui komentar: " + error.message);
                console.error("Gagal edit komentar via PATCH:", error);
            } finally {
                aktifkanKembaliTombol(btnKirimKomentar, modeEditKomentar ? "Perbarui Komentar" : "Kirim Komentar");
            }
            return;
        }

        // KASUS 2: MODE TAMBAH KOMENTAR BARU (POST)
        nonaktifkanTombol(btnKirimKomentar, "Mengirim...");
        try {
            const hasil = await kirimKomentarKeServer(nama, pesan);
            const idServer = hasil && hasil.id ? hasil.id : Date.now();

            // Modul 10: Render sebagai <kartu-komentar> alih-alih <li> manual
            const itemKomentar = buatElemenKomentar(nama, pesan, idServer);
            daftarKomentar.appendChild(itemKomentar);

            simpanKomentar(nama, pesan, idServer);

            formKomentar.reset();
            hapusDraftKomentar();
            console.log("Komentar berhasil tersimpan di server dengan ID:", idServer);

        } catch (error) {
            tampilkanErrorKomentar("Gagal mengirim komentar: " + error.message);
            console.error("Gagal mengirim komentar via POST:", error);
        } finally {
            aktifkanKembaliTombol(btnKirimKomentar, "Kirim Komentar");
        }
    });

    // Tombol Hapus Semua Komentar
    if (btnHapusSemuaKomentar) {
        btnHapusSemuaKomentar.addEventListener("click", () => {
            const konfirmasi = confirm("Hapus semua komentar?");
            if (konfirmasi) {
                daftarKomentar.innerHTML = "";
                try {
                    localStorage.removeItem("komentar");
                } catch (e) {
                    console.error("Gagal menghapus komentar dari storage:", e);
                }
                batalkanModeEdit();
            }
        });
    }
}


// KEYBOARD SHORTCUT DARK MODE ("d")
// Memanggil toggle pada <tombol-tema> yang ada di halaman.
document.addEventListener("keydown", (e) => {
    const tagAktif = document.activeElement ? document.activeElement.tagName.toUpperCase() : "";
    if (tagAktif === "INPUT" || tagAktif === "TEXTAREA") {
        return;
    }

    if (e.key.toLowerCase() === "d") {
        // Klik tombol di dalam komponen <tombol-tema>
        const btnTema = document.querySelector("tombol-tema .btn-toggle-tema");
        if (btnTema) btnTema.click();
    }
});


/*VALIDASI FORM CUSTOM VALIDITY*/
if (inputNama) {
    inputNama.addEventListener("input", () => {
        if (inputNama.validity.valueMissing) {
            inputNama.setCustomValidity("Nama wajib diisi");
        } else if (inputNama.validity.tooShort) {
            inputNama.setCustomValidity("Nama minimal 3 karakter");
        } else {
            inputNama.setCustomValidity("");
        }
    });
}

if (inputPesan) {
    inputPesan.addEventListener("input", () => {
        if (inputPesan.validity.valueMissing) {
            inputPesan.setCustomValidity("Komentar wajib diisi");
        } else if (inputPesan.validity.tooShort) {
            inputPesan.setCustomValidity("Komentar minimal 5 karakter");
        } else {
            inputPesan.setCustomValidity("");
        }
    });
}


/*MODUL 7 · TOMBOL RESET SELURUH DATA TERSIMPAN*/
const tombolReset = document.querySelector("#btn-reset");
if (tombolReset) {
    tombolReset.addEventListener("click", () => {
        const konfirmasi = confirm("Hapus semua data tersimpan (tema, like, komentar)?");
        if (konfirmasi) {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                console.error("Gagal menghapus storage:", e);
            }
            location.reload();
        }
    });
}

/*TOMBOL KEMBALI KE ATAS*/
const btnKembaliKeAtas = document.querySelector("#btn-kembali-ke-atas");
if (btnKembaliKeAtas) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            btnKembaliKeAtas.classList.remove("tersembunyi");
        } else {
            btnKembaliKeAtas.classList.add("tersembunyi");
        }
    });

    btnKembaliKeAtas.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}
