export const placeholderPosts = [
  {
    id: 1,
    author: {
      name: 'Rina Lestari',
      avatarUrl: 'https://picsum.photos/id/1011/50/50',
    },
    imageUrl: 'https://picsum.photos/id/1015/600/600',
    imageHint: 'green valley',
    caption: 'Diskusi hebat di lokakarya Wirausaha Tani Muda hari ini! Begitu banyak ide inovatif untuk pertanian berkelanjutan. 🌾 #GardaLestari #AgroMaritim',
    likes: 128,
    comments: 12,
    timestamp: '2 jam lalu',
  },
  {
    id: 2,
    author: {
      name: 'Budi Santoso',
      avatarUrl: 'https://picsum.photos/id/1025/50/50',
    },
    imageUrl: 'https://picsum.photos/id/103/600/600',
    imageHint: 'mangrove saplings',
    caption: 'Tim kami baru saja menyelesaikan acara penanaman mangrove di Jakarta Utara. Lebih dari 1000 bibit baru ditanam! Mari jaga kelestarian pesisir kita. 🌱 #Kehutanan #Konservasi',
    likes: 256,
    comments: 25,
    timestamp: '1 hari lalu',
  },
    {
    id: 3,
    author: {
      name: 'Citra Dewi',
      avatarUrl: 'https://picsum.photos/id/1027/50/50',
    },
    imageUrl: 'https://picsum.photos/id/218/600/600',
    imageHint: 'coral reef underwater',
    caption: 'Menjelajahi keindahan Bunaken. Keanekaragaman hayati laut kita adalah harta yang harus kita lindungi bersama. 🐠 #Maritim #GardaLestari',
    likes: 312,
    comments: 34,
    timestamp: '3 hari lalu',
  },
];

export const memberDirectory = {
  pusat: [
    { name: 'Dr. Suryo Prakoso', position: 'Ketua Umum', avatarUrl: 'https://picsum.photos/id/201/100/100' },
    { name: 'Amelia Siregar', position: 'Sekretaris Umum', avatarUrl: 'https://picsum.photos/id/202/100/100' },
    { name: 'Bayu Wijoyo', position: 'Bendahara Umum', avatarUrl: 'https://picsum.photos/id/203/100/100' },
    { name: 'Kartika Sari', position: 'Kadiv. Agro', avatarUrl: 'https://picsum.photos/id/204/100/100' },
    { name: 'Gilang Samudra', position: 'Kadiv. Maritim', avatarUrl: 'https://picsum.photos/id/206/100/100' },
    { name: 'Wulan Kirana', position: 'Kadiv. Kehutanan', avatarUrl: 'https://picsum.photos/id/207/100/100' },
  ],
  daerah: [
    { name: 'Joko Susilo', position: 'Koordinator Jawa Barat', avatarUrl: 'https://picsum.photos/id/301/100/100' },
    { name: 'Eka Putri', position: 'Koordinator Jawa Tengah', avatarUrl: 'https://picsum.photos/id/302/100/100' },
    { name: 'Made Wijaya', position: 'Koordinator Bali', avatarUrl: 'https://picsum.photos/id/303/100/100' },
  ],
  pembina: [
    { name: 'Prof. Emil Salim', position: 'Dewan Pembina', avatarUrl: 'https://picsum.photos/id/401/100/100' },
    { name: 'Dr. Ir. Rokhmin Dahuri', position: 'Dewan Pembina', avatarUrl: 'https://picsum.photos/id/402/100/100' },
  ],
};

export const programs = {
  flagship: [
    {
      title: 'Agro-preneur Muda Mandiri',
      description: 'Program inkubasi untuk startup di bidang teknologi pertanian, dari hulu hingga hilir.',
      imageUrl: 'https://picsum.photos/id/155/600/400',
      imageHint: 'urban garden',
    },
    {
      title: 'Jaga Pesisir: Restorasi Mangrove & Terumbu Karang',
      description: 'Aksi nyata restorasi ekosistem pesisir untuk mitigasi perubahan iklim dan keberlanjutan sumber daya laut.',
      imageUrl: 'https://picsum.photos/id/119/600/400',
      imageHint: 'mangrove forest',
    },
  ],
  ongoing: [
    {
      title: 'Divisi Agro: Smart Farming 4.0',
      description: 'Pelatihan dan implementasi teknologi IoT untuk meningkatkan efisiensi pertanian di kalangan pemuda.',
      imageUrl: 'https://picsum.photos/id/121/600/400',
      imageHint: 'farmer technology',
    },
    {
      title: 'Divisi Maritim: Budidaya Rumput Laut Unggul',
      description: 'Pendampingan bagi kelompok pemuda pesisir untuk mengembangkan budidaya rumput laut yang berkelanjutan.',
      imageUrl: 'https://picsum.photos/id/1020/600/400',
      imageHint: 'seaweed farm',
    },
    {
      title: 'Divisi Kehutanan: Hutan Sosial Lestari',
      description: 'Program pendampingan untuk pemanfaatan hasil hutan non-kayu secara berkelanjutan oleh masyarakat sekitar hutan.',
      imageUrl: 'https://picsum.photos/id/160/600/400',
      imageHint: 'forest path',
    },
  ],
};

export const events = [
  {
    date: { day: '25', month: 'JUL' },
    title: 'Webinar: Inovasi Teknologi di Sektor Maritim',
    location: 'Online via Zoom',
    imageUrl: 'https://picsum.photos/id/2/600/400',
    imageHint: 'person laptop',
  },
  {
    date: { day: '05', month: 'AUG' },
    title: 'Workshop: Pertanian Organik & Pemasaran Digital',
    location: 'Bogor, Jawa Barat',
    imageUrl: 'https://picsum.photos/id/122/600/400',
    imageHint: 'organic farm',
  },
  {
    date: { day: '20', month: 'AUG' },
    title: 'Aksi Bersih Hutan & Tanam Pohon',
    location: 'Taman Nasional Gunung Gede Pangrango',
    imageUrl: 'https://picsum.photos/id/101/600/400',
    imageHint: 'people planting trees',
  },
];

export const blogPosts = [
  {
    slug: 'potensi-agro-maritim-indonesia',
    title: 'Membuka Potensi Agro-Maritim: Peran Pemuda Garda Terdepan',
    author: 'Dr. Suryo Prakoso',
    date: 'July 01, 2024',
    excerpt: 'Indonesia adalah negara agraris dan maritim. Pemuda memiliki peran kunci untuk mengelola potensi ini secara berkelanjutan...',
    imageUrl: 'https://picsum.photos/id/1016/600/400',
    imageHint: 'rice fields sunset',
    content: '<p>Sebagai negara kepulauan dengan garis pantai terpanjang kedua di dunia dan lahan pertanian yang subur, Indonesia memiliki potensi agro-maritim yang luar biasa. Sektor ini tidak hanya vital untuk ketahanan pangan tetapi juga sebagai motor penggerak ekonomi bangsa.</p><p>Garda Lestari percaya bahwa pemuda adalah kunci untuk membuka potensi ini. Dengan inovasi, teknologi, dan semangat kewirausahaan, generasi muda dapat mentransformasi praktik tradisional menjadi lebih produktif, efisien, dan berkelanjutan.</p><h4>Fokus Kami</h4><p>Kami berfokus pada tiga pilar utama: </p><ul><li><strong>Pendidikan:</strong> Membekali pemuda dengan pengetahuan terkini di bidang agroteknologi dan manajemen sumber daya laut.</li><li><strong>Kolaborasi:</strong> Membangun jembatan antara inovator muda dengan industri, pemerintah, dan akademisi.</li><li><strong>Aksi Nyata:</strong> Mengimplementasikan proyek-proyek di lapangan yang memberikan dampak langsung bagi masyarakat dan lingkungan.</li></ul><p>Mari bergabung bersama Garda Lestari untuk menjadi bagian dari generasi yang membawa perubahan positif bagi sektor agro-maritim dan kehutanan Indonesia.</p>'
  },
  {
    slug: 'menjaga-hutan-menjaga-masa-depan',
    title: 'Menjaga Hutan, Menjaga Masa Depan',
    author: 'Wulan Kirana',
    date: 'June 22, 2024',
    excerpt: 'Hutan bukan hanya sekumpulan pohon, tetapi merupakan sistem penyangga kehidupan yang kompleks. Inilah cara kami berkontribusi...',
    imageUrl: 'https://picsum.photos/id/1084/600/400',
    imageHint: 'forest sunlight',
    content: '<p>Hutan Indonesia adalah paru-paru dunia. Perannya dalam menyerap karbon, menjaga keanekaragaman hayati, dan mengatur siklus air tidak tergantikan. Namun, deforestasi masih menjadi ancaman serius.</p><h4>Pendekatan Holistik</h4><p>Di Garda Lestari, kami menerapkan pendekatan holistik dalam konservasi hutan. Kami tidak hanya menanam pohon, tetapi juga memberdayakan masyarakat di sekitar hutan. Kami percaya bahwa kelestarian hutan hanya bisa tercapai jika masyarakat yang tinggal di sekitarnya sejahtera dan terlibat aktif dalam menjaganya.</p><p>Program Hutan Sosial kami mendorong pemanfaatan hasil hutan non-kayu seperti madu, rotan, dan getah, memberikan alternatif ekonomi yang tidak merusak hutan.</p>'
  },
];

export const availableBenefits = [
  {
    name: 'Akses Pelatihan & Sertifikasi',
    description: 'Diskon khusus dan akses prioritas untuk berbagai pelatihan teknis dan manajerial di bidang agro-maritim & kehutanan.',
    category: 'Pendidikan & Pelatihan',
    eligibilityCriteria: 'Semua anggota aktif.',
  },
  {
    name: 'Jaringan & Forum Kolaborasi',
    description: 'Terhubung dengan para pakar, investor, dan sesama inovator muda dalam forum eksklusif dan kegiatan networking.',
    category: 'Jaringan & Kolaborasi',
    eligibilityCriteria: 'Semua anggota aktif.',
  },
  {
    name: 'Pendampingan Proyek Inovatif',
    description: 'Dapatkan bimbingan teknis dan manajerial dari mentor ahli untuk mengembangkan dan mengimplementasikan proyekmu.',
    category: 'Pendampingan Proyek',
    eligibilityCriteria: 'Anggota dengan proposal proyek yang lolos seleksi.',
  },
  {
    name: 'Info & Akses Pendanaan',
    description: 'Informasi terkurasi dan fasilitasi untuk mendapatkan akses ke sumber pendanaan, hibah, dan program inkubasi.',
    category: 'Akses Pendanaan',
    eligibilityCriteria: 'Anggota dengan usaha rintisan atau proposal yang matang.',
  },
  {
    name: 'Buletin Digital "Lestari"',
    description: 'Menerima buletin digital triwulanan kami yang berisi kisah, riset, dan peluang terkini.',
    category: 'Pendidikan & Pelatihan',
    eligibilityCriteria: 'Semua anggota aktif.',
  },
  {
    name: 'Program Mentorship Karir',
    description: 'Terhubung dengan anggota senior dan dewan pembina untuk bimbingan karir dan pengembangan proyek.',
    category: 'Jaringan & Kolaborasi',
    eligibilityCriteria: 'Anggota muda dan mahasiswa.',
  },
];
