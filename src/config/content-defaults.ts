/**
 * Isi awal website, disalin dari tampilan website lama (screenshot dari pemilik situs).
 * Dipakai HANYA selama belum ada isi tersimpan di database. Setelah Anda menekan "Simpan" di
 * admin → Biodata & Link, isi dari admin yang dipakai dan file ini tidak berpengaruh lagi.
 * Mohon periksa ejaan di admin; transkripsi dari gambar bisa meleset.
 */
export const initialContent = {
  tagline:
    "a soulful indie singer-songwriter and consummate guitarist who brings incredible versatility and passion to every performance. His sound is a dynamic and creative fusion, drawing from a rich palette of reggae, pop, soulful blues, rock, and folk. In his music, he artfully mixes the essence of his Indonesian heritage with the vibrant energy of his talented band, creating a truly global sound",
  bio: [
    "Gomer Lapudo'oh's musical journey is a powerful story of resilience, hard work, and the unwavering pursuit of a dream. His path began on Timor Island, Indonesia, where his musical roots first took hold singing in church. He later honed his craft and professionalism in the vibrant and demanding music scene of Bali, performing regularly in pubs and hotels.",
    "After marrying an Australian woman, Gomer embraced Australia as his new home, but the transition required immense dedication. In a true testament to his passion, he worked as a construction worker to save the funds needed for his recording sessions—a fact he humbly acknowledges with thanks to his former employers in his work. This hard-won effort culminated in his debut album, 'HERE I AM,' a triumphant statement of arrival released amidst the global challenges of the COVID-19 pandemic.",
    "Now, with his second album, DJARIWALLA (Where I Belong), Gomer continues to explore the themes of home, identity, and connection, weaving his incredible life story into every note he plays. His music is the sound of a journeyman who has traveled the world and overcome obstacles to share his unique, soul-stirring voice with the world.",
  ].join("\n\n"),
  eventTitle: "Djariwalla Launching",
  eventLine: "2025 • JUNE • SYDNEY",
  eventVenue: "Lazy Bone, 294 Marrickville Rd, Marrickville NSW 2204, Australia",
} as const;
