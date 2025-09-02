

import {
  Activity,
  ArrowUpRight,
  BookUser,
  Megaphone,
  Newspaper,
  Users,
} from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anggota Terverifikasi
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+235</div>
            <p className="text-xs text-muted-foreground">
              +10.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Program Aktif
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">
              +1 sejak minggu lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berita Diterbitkan</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+57</div>
            <p className="text-xs text-muted-foreground">
              +12 sejak bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Anggota</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 sejak minggu lalu
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Pendaftaran Terbaru</CardTitle>
              <CardDescription>
                Daftar anggota baru yang perlu ditinjau.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/panel/members">
                Lihat Semua
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src="/avatars/01.png" alt="Avatar" />
                        <AvatarFallback>SP</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">
                            Siti Purnamasari
                            </p>
                            <p className="text-sm text-muted-foreground">
                            siti.p@email.com
                            </p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge className="text-xs" variant="outline">
                      Menunggu
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                    2023-06-23
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Tinjau</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Konten Menunggu Persetujuan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="flex items-center gap-4">
              <Newspaper className="h-6 w-6" />
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Inovasi Pertanian di Lahan Gambut
                </p>
                <p className="text-sm text-muted-foreground">
                  Oleh Budi Santoso
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto">Tinjau</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
