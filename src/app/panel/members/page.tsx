
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  getMembers,
  updateMemberDetails,
  MemberWithStatus,
  MemberType,
  VerificationStatus,
} from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Edit, ShieldCheck } from 'lucide-react';
import EditMemberDialog from '@/components/admin/EditMemberDialog';
import ViewVerificationDialog from '@/components/admin/ViewVerificationDialog';

export default function AdminMembersPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithStatus | null>(null);

  useEffect(() => {
    fetchMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const fetchedMembers = await getMembers();
      setMembers(fetchedMembers);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal memuat anggota',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member: MemberWithStatus, dialog: 'edit' | 'verify') => {
    setSelectedMember(member);
    if (dialog === 'edit') setIsEditDialogOpen(true);
    if (dialog === 'verify') setIsVerificationDialogOpen(true);
  };
  
  const handleSaveDetails = async (id: string, details: { position: string; type?: MemberType; region?: string, verificationStatus?: VerificationStatus }) => {
    setIsSavingDetails(true);
    try {
        await updateMemberDetails(id, details);
        toast({ title: 'Detail anggota diperbarui!' });
        fetchMembers();
        setIsEditDialogOpen(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
        setIsSavingDetails(false);
    }
  };


  const getStatusBadge = (status: MemberWithStatus['verificationStatus']) => {
    switch (status) {
      case 'permanent':
        return <Badge variant="default">Permanen</Badge>;
      case 'temporary':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'unverified':
      default:
        return <Badge variant="outline">Belum Terverifikasi</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Anggota</h1>
          <p className="text-muted-foreground">Kelola jabatan, peran, dan status verifikasi anggota.</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">No. Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal Daftar</TableHead>
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.phoneNumber}</TableCell>
                      <TableCell>{getStatusBadge(member.verificationStatus)}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.position}</TableCell>
                      <TableCell className="hidden sm:table-cell">{member.joinDate || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleOpenDialog(member, 'edit')}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Detail & Status
                             </DropdownMenuItem>
                             {member.ktpImageUrl && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenDialog(member, 'verify')}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Tinjau Verifikasi
                                </DropdownMenuItem>
                                </>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Belum ada anggota.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedMember && (
        <>
            <EditMemberDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                member={selectedMember}
                onSave={handleSaveDetails}
                isSaving={isSavingDetails}
            />
             <ViewVerificationDialog
                isOpen={isVerificationDialogOpen}
                onClose={() => setIsVerificationDialogOpen(false)}
                member={selectedMember}
            />
        </>
      )}
    </>
  );
}

    