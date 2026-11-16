"use strict";

/* =============================================================
   MODUL 10 — COMPONENT-BASED UI (Custom Elements)
   Bagian B — Kegiatan Praktikum : komponen.js
   Mata Kuliah: Pemrograman Berbasis Web (PROG31W)

   Berisi definisi custom element. Ditautkan SEBELUM script.js di
   index.html agar komponen sudah terdaftar saat script.js berjalan.

   Komponen:
     <kartu-artikel>   (B.3 - B.6: atribut, observedAttributes,
                         attributeChangedCallback, lifecycle, Like/Hapus)
     <tombol-tema>     (B.7 Praktikum Mandiri: dark mode + localStorage)
     <kartu-komentar>  (B.7 Praktikum Mandiri: atribut nama & pesan + Hapus)
   Catatan: Modul 10 tanpa Shadow DOM (enkapsulasi dibahas Modul 12).
   ============================================================= */


/* ---------- B.3 - B.6 — Komponen <kartu-artikel> (bentuk lengkap) ---------- */
class KartuArtikel extends HTMLElement {
    #like = 0; // state jumlah like milik tiap kartu (B.6)

    // B.4 — hanya atribut ini yang memicu attributeChangedCallback
    // B.7 Opsional: batas-like untuk membatasi jumlah like
    static get observedAttributes() {
        return ["judul", "isi", "batas-like"];
    }

    // Lifecycle: dipanggil saat elemen masuk ke dokumen (B.5)
    connectedCallback() {
        this.render();
    }

    // Lifecycle: dipanggil saat elemen dilepas dari dokumen (B.6)
    disconnectedCallback() {
        console.log("kartu-artikel dilepas dari halaman");
    }

    // B.4 — render ulang saat atribut yang diamati berubah.
    // Guard isConnected: callback bisa terpanggil sebelum elemen masuk dokumen.
    attributeChangedCallback() {
        if (this.isConnected) this.render();
    }

    render() {
        // Kerangka HTML ditulis TETAP (aman dari XSS); data diisi via textContent.
        this.innerHTML = `
      <article class="kartu">
        <h3></h3>
        <p></p>
        <div class="aksi-kartu">
          <button type="button" class="btn-like"></button>
          <button type="button" class="btn-hapus" data-aksi="hapus">Hapus</button>
        </div>
      </article>`;

        // Pengisian data yang AMAN: textContent, bukan innerHTML (A.5)
        this.querySelector("h3").textContent = this.getAttribute("judul") ?? "";
        this.querySelector("p").textContent = this.getAttribute("isi") ?? "";

        // B.7 Opsional: ambil batas like dari atribut
        const batasLike = parseInt(this.getAttribute("batas-like"), 10);

        // Tombol Like: state di field #like, tetap bertahan antar render()
        const tombolLike = this.querySelector(".btn-like");
        tombolLike.textContent = `Like (${this.#like})`;

        // Cek apakah batas sudah tercapai saat render
        if (!isNaN(batasLike) && this.#like >= batasLike) {
            tombolLike.disabled = true;
            tombolLike.textContent = `Like Maksimal (${this.#like})`;
        }

        tombolLike.addEventListener("click", () => {
            // B.7 Opsional: cek batas like sebelum menambah
            if (!isNaN(batasLike) && this.#like >= batasLike) {
                tombolLike.disabled = true;
                tombolLike.textContent = `Like Maksimal (${this.#like})`;
                return;
            }

            this.#like++;
            tombolLike.textContent = `Like (${this.#like})`;

            // Nonaktifkan jika sudah mencapai batas
            if (!isNaN(batasLike) && this.#like >= batasLike) {
                tombolLike.disabled = true;
                tombolLike.textContent = `Like Maksimal (${this.#like})`;
            }
        });

        // Tombol Hapus: kartu melepas dirinya sendiri dari dokumen
        this.querySelector(".btn-hapus").addEventListener("click", () => this.remove());
    }
}
customElements.define("kartu-artikel", KartuArtikel);


// ---------- B.7 Praktikum Mandiri — Komponen <tombol-tema> ----------//
class TombolTema extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        // 1. Cek preferensi awal dari localStorage
        const temaTersimpan = localStorage.getItem("tema");
        if (temaTersimpan === "dark") {
            document.body.classList.add("dark-mode");
        }

        // 2. Buat tombol di dalam komponen
        this.innerHTML = `<button type="button" class="btn-toggle-tema"></button>`;
        const btn = this.querySelector(".btn-toggle-tema");

        // Tampilkan label tombol sesuai status awal
        btn.textContent = document.body.classList.contains("dark-mode") ? "Mode Terang" : "Mode Gelap";

        // 3. Event listener saat tombol diklik
        btn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const aktifDark = document.body.classList.contains("dark-mode");

            // Update tampilan tombol dan simpan ke localStorage
            btn.textContent = aktifDark ? "Mode Terang" : "Mode Gelap";
            localStorage.setItem("tema", aktifDark ? "dark" : "light");
        });
    }
}
customElements.define("tombol-tema", TombolTema);


// ---------- B.7 Praktikum Mandiri — Komponen <kartu-komentar> ---------- //
class KartuKomentar extends HTMLElement {
    static get observedAttributes() {
        return ["nama", "pesan"];
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        console.log("kartu-komentar dilepas dari halaman");
    }

    attributeChangedCallback() {
        if (this.isConnected) this.render();
    }

    render() {
        // Kerangka HTML statis (aman dari XSS)
        this.innerHTML = `
      <div class="item-komentar">
        <div class="konten-komentar">
          <strong class="nama-pengirim"></strong>
          <span class="teks-pesan"></span>
        </div>
        <div class="wadah-tombol-komentar">
          <button type="button" class="btn-edit-komentar">Edit</button>
          <button type="button" class="btn-hapus-komentar">Hapus</button>
        </div>
      </div>
    `;

        // Pengisian teks dinamis secara AMAN menggunakan textContent
        this.querySelector(".nama-pengirim").textContent = this.getAttribute("nama") ?? "Anonim";
        this.querySelector(".teks-pesan").textContent = this.getAttribute("pesan") ?? "";

        // Event tombol Hapus di dalam komponen
        this.querySelector(".btn-hapus-komentar").addEventListener("click", () => {
            // Dispatch custom event agar script.js bisa menangani penghapusan dari storage
            this.dispatchEvent(new CustomEvent("hapus-komentar", {
                bubbles: true,
                detail: { id: this.dataset.id }
            }));
            this.remove();
        });

        // Event tombol Edit di dalam komponen
        this.querySelector(".btn-edit-komentar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("edit-komentar", {
                bubbles: true,
                detail: {
                    id: this.dataset.id,
                    nama: this.getAttribute("nama"),
                    pesan: this.getAttribute("pesan"),
                    elemen: this
                }
            }));
        });
    }
}
customElements.define("kartu-komentar", KartuKomentar);
