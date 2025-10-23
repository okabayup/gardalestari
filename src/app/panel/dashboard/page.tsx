
import {
  Activity,
  ArrowUpRight,
  BookUser,
  Megaphone,
  Newspaper,
  Users,
  Map,
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
import { getMembers, MemberWithStatus } from "@/app/actions/user"
import { getPrograms } from "@/app/actions/programs"
import { getBeritaPosts } from "@/app/actions/berita"
import { getEvents } from "@/app/actions/events"
import { getMapData } from "@/app/actions/map-data"

export default async function Dashboard() {
    // Fetch all data in parallel
    const [members, programs, news, events, mapData] = await Promise.all([
        getMembers(),
        getPrograms(),
        getBeritaPosts(undefined, true), // include drafts for total count
        getEvents(),
        getMapData()
    ]);

    const verifiedMembers = members.filter(m => m.verificationStatus === 'permanent' || m.verificationStatus === 'manual').length;
    const pendingVerification = members.filter(m => m.verificationStatus === 'temporary');

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anggota Terverifikasi
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedMembers.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{programs.length.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konten</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{news.length.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acara</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length.toLocaleString()}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Peta</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mapData.length.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Verifikasi Menunggu</CardTitle>
              <CardDescription>
                Anggota yang telah mengirimkan data dan menunggu persetujuan.
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
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVerification.length > 0 ? pendingVerification.slice(0, 5).map(member => (
                    <TableRow key={member.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarImage src={member.avatarUrl} alt="Avatar" />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">
                                    {member.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                    {member.phoneNumber}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                            <Badge className="text-xs" variant="outline">
                            Menunggu
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button asChild size="sm" variant="outline">
                             <Link href="/panel/members">Tinjau</Link>
                           </Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">Tidak ada verifikasi yang menunggu.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
             <CardDescription>
                Menampilkan log aktivitas terbaru dari pengguna (fitur mendatang).
              </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="flex items-center gap-4">
              <Activity className="h-6 w-6" />
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Pengembangan Fitur
                </p>
                <p className="text-sm text-muted-foreground">
                  Log aktivitas akan ditampilkan di sini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
