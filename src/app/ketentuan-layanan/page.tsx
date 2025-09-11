
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {children}
        </div>
    </div>
)

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-16 max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="font-headline text-3xl font-bold">Ketentuan Layanan</h1>
                <p className="text-muted-foreground mt-2">Terakhir diperbarui: 25 Juli 2024</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Selamat Datang di Garda Lestari</CardTitle>
                    <CardDescription>
                        Dengan menggunakan aplikasi kami, Anda setuju untuk mematuhi ketentuan dan syarat yang ditetapkan di bawah ini. Harap baca dengan saksama.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                   <Section title="1. Akun Pengguna">
                        <p>Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda, termasuk kata sandi, dan untuk semua aktivitas yang terjadi di bawah akun Anda. Anda setuju untuk segera memberitahu kami tentang penggunaan akun Anda yang tidak sah.</p>
                   </Section>

                   <Section title="2. Konten Pengguna">
                        <p>Anda mempertahankan semua hak kepemilikan atas konten yang Anda unggah. Namun, dengan memposting konten, Anda memberikan kami lisensi non-eksklusif, bebas royalti, di seluruh dunia untuk menggunakan, mendistribusikan, dan menampilkan konten tersebut sehubungan dengan layanan aplikasi dan promosi organisasi.</p>
                   </Section>

                    <Section title="3. Perilaku yang Dilarang">
                        <p>Anda setuju untuk tidak menggunakan layanan untuk tujuan yang melanggar hukum atau dilarang oleh Ketentuan ini. Aktivitas yang dilarang termasuk, namun tidak terbatas pada:</p>
                         <ul>
                            <li>Menyebarkan ujaran kebencian, konten ilegal, atau menyesatkan.</li>
                            <li>Melakukan pelecehan, intimidasi, atau stalking terhadap pengguna lain.</li>
                            <li>Mengganggu atau mengacaukan integritas atau kinerja layanan.</li>
                            <li>Berpura-pura menjadi orang atau entitas lain.</li>
                        </ul>
                   </Section>

                    <Section title="4. Kekayaan Intelektual">
                        <p>Layanan dan konten aslinya (tidak termasuk Konten Pengguna), fitur, dan fungsionalitas adalah dan akan tetap menjadi milik eksklusif Garda Lestari dan pemberi lisensinya. Merek dagang dan logo kami tidak boleh digunakan sehubungan dengan produk atau layanan apa pun tanpa persetujuan tertulis sebelumnya dari kami.</p>
                   </Section>
                   
                   <Section title="5. Pemutusan">
                        <p>Kami dapat menghentikan atau menangguhkan akun Anda segera, tanpa pemberitahuan atau kewajiban sebelumnya, untuk alasan apa pun, termasuk tanpa batasan jika Anda melanggar Ketentuan. Setelah pemutusan, hak Anda untuk menggunakan layanan akan segera berhenti.</p>
                   </Section>

                   <Section title="6. Perubahan Ketentuan">
                         <p>Kami berhak, atas kebijakan kami sendiri, untuk mengubah atau mengganti Ketentuan ini kapan saja. Kami akan memberikan pemberitahuan tentang perubahan apa pun dengan memposting Ketentuan baru di halaman ini.</p>
                   </Section>

                   <Section title="7. Hubungi Kami">
                        <p>Jika Anda memiliki pertanyaan tentang Ketentuan ini, silakan hubungi kami di <a href="mailto:halo@gardalestari.org" className="text-primary hover:underline">halo@gardalestari.org</a>.</p>
                   </Section>

                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
