
'use client';

import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {children}
        </div>
    </div>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-16 max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="font-headline text-3xl font-bold">Kebijakan Privasi</h1>
                <p className="text-muted-foreground mt-2">Terakhir diperbarui: 24 Juli 2024</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendahuluan</CardTitle>
                    <CardDescription>
                        Garda Lestari ("kami") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan menjaga informasi Anda saat Anda menggunakan aplikasi seluler kami.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                   <Section title="1. Informasi yang Kami Kumpulkan">
                        <p>Kami dapat mengumpulkan informasi tentang Anda dalam berbagai cara, termasuk:</p>
                        <ul>
                            <li><strong>Data Pribadi yang Diberikan Pengguna:</strong> Informasi identifikasi pribadi, seperti nama, NIK, nomor telepon, dan data demografis lainnya yang Anda berikan secara sukarela saat mendaftar atau melakukan verifikasi.</li>
                            <li><strong>Data Konten:</strong> Postingan, komentar, foto, video, dan konten lain yang Anda buat dan bagikan di platform.</li>
                            <li><strong>Data Turunan:</strong> Informasi yang dikumpulkan server kami secara otomatis, seperti alamat IP Anda, jenis perangkat, dan aktivitas dalam aplikasi.</li>
                        </ul>
                   </Section>

                   <Section title="2. Penggunaan Informasi Anda">
                        <p>Memiliki informasi yang akurat tentang Anda memungkinkan kami untuk memberikan Anda pengalaman yang lancar, efisien, dan disesuaikan. Secara khusus, kami dapat menggunakan informasi yang dikumpulkan tentang Anda melalui Aplikasi untuk:</p>
                        <ul>
                            <li>Membuat dan mengelola akun Anda.</li>
                            <li>Memfasilitasi proses verifikasi keanggotaan.</li>
                            <li>Menampilkan konten buatan pengguna kepada pengguna lain.</li>
                            <li>Meningkatkan efisiensi dan pengoperasian Aplikasi.</li>
                            <li>Mengirimkan notifikasi terkait akun atau Aplikasi kepada Anda.</li>
                        </ul>
                   </Section>

                    <Section title="3. Pengungkapan Informasi Anda">
                        <p>Kami tidak akan membagikan informasi pribadi Anda dengan pihak ketiga mana pun kecuali dalam situasi berikut:</p>
                         <ul>
                            <li><strong>Dengan Persetujuan Anda:</strong> Kami dapat membagikan informasi Anda dengan pihak ketiga jika Anda telah memberikan kami persetujuan untuk melakukannya.</li>
                            <li><strong>Untuk Kepatuhan Hukum:</strong> Jika kami yakin pelepasan informasi tentang Anda diperlukan untuk menanggapi proses hukum, untuk menyelidiki atau memperbaiki potensi pelanggaran kebijakan kami, atau untuk melindungi hak, properti, dan keselamatan orang lain.</li>
                        </ul>
                   </Section>

                    <Section title="4. Keamanan Informasi Anda">
                        <p>Kami menggunakan tindakan keamanan administratif, teknis, dan fisik untuk membantu melindungi informasi pribadi Anda. Meskipun kami telah mengambil langkah-langkah yang wajar untuk mengamankan informasi pribadi yang Anda berikan kepada kami, perlu diketahui bahwa terlepas dari upaya kami, tidak ada tindakan keamanan yang sempurna atau tidak dapat ditembus, dan tidak ada metode transmisi data yang dapat dijamin terhadap intersepsi atau jenis penyalahgunaan lainnya.</p>
                   </Section>
                   
                   <Section title="5. Hak Anda">
                        <p>Anda memiliki hak untuk meninjau, memperbarui, atau menghapus informasi pribadi Anda. Jika Anda ingin menghapus akun dan data terkait, silakan kunjungi halaman <a href="/hapus-data" className="text-primary hover:underline">Penghapusan Data</a> kami untuk prosedur lebih lanjut.</p>
                   </Section>

                   <Section title="6. Hubungi Kami">
                        <p>Jika Anda memiliki pertanyaan atau komentar tentang Kebijakan Privasi ini, silakan hubungi kami di:</p>
                        <p>Email: <a href="mailto:halo@gardalestari.org" className="text-primary hover:underline">halo@gardalestari.org</a></p>
                   </Section>

                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
