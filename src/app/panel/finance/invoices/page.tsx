'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";


export default function InvoicesPage() {
    const router = useRouter();
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="font-headline text-2xl font-bold">Faktur Penjualan (AR)</h1>
                <p className="text-muted-foreground">Kelola semua faktur penjualan dan piutang usaha Anda.</p>
                </div>
                <Button onClick={() => router.push('/panel/finance/invoices/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Buat Faktur Baru
                </Button>
            </div>

            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Fitur daftar faktur sedang dalam pengembangan.</p>
            </div>
        </div>
    )
}