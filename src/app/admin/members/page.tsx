
'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, UserCheck, UserX, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';
import { getMembers, updateMemberStatus, MemberWithStatus, updateMemberDetails, MemberType } from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EditMemberDialog from '@/components/admin/EditMemberDialog';

const statusConfig = {
  permanent: { label: 'Tetap', className: 'bg-green-100 text-green-800 border-green-200' },
  temporary: { label: 'Sementara', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  unverified: { label: 'Belum Verifikasi', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 border-red-200' },
};

const typeConfig: Record<MemberType, string> = {
  pusat: 'Pengurus Pusat',
  daerah: 'Pengurus Daerah',
  cabang: 'Pengurus Cabang',
  pembina: 'Dewan Pembina'
}


export default function AdminMembersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<MemberWithStatus | null>(null);


  const fetchMembers = async () => {
    setLoading(true);
    try {
      const fetchedMembers = await getMembers();
      // Sort members: temporary first, then by name
      fetchedMembers.sort((a, b) => {
        if (a.verificationStatus === 'temporary' && b.verificationStatus !== 'temporary') return -1;
        if (a.verificationStatus !== 'temporary' && b.verificationStatus === 'temporary') return 1;
        return a.name.localeCompare(b.name);
      });
      setMembers(fetchedMembers);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal memuat anggota",
        description: "Terjadi kesalahan saat mengambil data dari server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'permanent' | 'rejected') => {
    setUpdatingId(id);
    try {
      await updateMemberStatus(id, status);
      toast({
        title: "Status Anggota Diperbarui",
        description: `Status telah berhasil diubah menjadi ${status === 'permanent' ? 'Anggota Tetap' : 'Ditolak'}.`,
      });
      await fetchMembers(); // Refresh the list
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Status",
        description: (error as Error).message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditDetails = async (id: string, details: { position: string, type?: MemberType, region?: string }) => {
    setUpdatingId(id);
    try {
      await updateMemberDetails(id, details);
      toast({
        title: 'Detail Anggota Diperbarui',
        description: 'Informasi jabatan dan jenis keanggotaan telah disimpan.'
      });
      await fetchMembers(); // Refresh the list
      setEditingMember(null); // Close dialog
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Detail",
        description: (error as Error).message,
      });
    } finally {
      setUpdatingId(null);
    }
  }


  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Anggota</h1>
            <p className="text-muted-foreground">Verifikasi, kelola status, jenis, dan jabatan keanggotaan.</p>
          </div>
           <Button variant="outline" onClick={() => router.back()}>
            Kembali ke Dasbor
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Jabatan</TableHead>
                  <TableHead className="hidden md:table-cell">Jenis / Wilayah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id} className={cn(member.verificationStatus === 'temporary' && 'bg-yellow-50/50 dark:bg-yellow-900/20')}>
                      <TableCell className="font-medium">
                        <div>{member.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{member.type ? (typeConfig[member.type] || 'Anggota') : 'Anggota'}</div>
                      </TableCell>
                       <TableCell className="hidden sm:table-cell">{member.position}</TableCell>
                       <TableCell className="hidden md:table-cell">
                        <div>{member.type ? (typeConfig[member.type] || 'Anggota') : 'Anggota'}</div>
                        {member.type === 'daerah' && <div className="text-xs text-muted-foreground">{member.region}</div>}
                       </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusConfig[member.verificationStatus]?.className)}>
                          {statusConfig[member.verificationStatus]?.label || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={updatingId === member.id}
                            >
                              {updatingId === member.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit Jabatan/Jenis</span>
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             {(member.verificationStatus === 'temporary' || member.verificationStatus === 'rejected') && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(member.id, 'permanent')}>
                                  <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Setujui (Anggota Tetap)</span>
                                </DropdownMenuItem>
                            )}
                             {(member.verificationStatus === 'temporary' || member.verificationStatus === 'permanent') && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(member.id, 'rejected')}>
                                    <UserX className="mr-2 h-4 w-4 text-red-500" />
                                    <span>Tolak Verifikasi</span>
                                  </DropdownMenuItem>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Belum ada anggota yang mendaftar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       {editingMember && (
        <EditMemberDialog
          member={editingMember}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleEditDetails}
          isSaving={!!updatingId}
        />
      )}
    </MainLayout>
  );
}
