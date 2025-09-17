

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  getMembers,
  updateMemberDetails,
  resetVerificationData,
  MemberWithStatus,
} from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, MoreHorizontal, Edit, ShieldCheck, PlusCircle, RotateCcw } from 'lucide-react';
import EditMemberDialog from '@/components/admin/EditMemberDialog';
import ViewVerificationDialog from '@/components/admin/ViewVerificationDialog';
import { useRouter } from 'next/navigation';
import { formatFullName } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function AdminMembersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithStatus | null>(null);
  
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState("");


  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedMembers = await getMembers(false); // Fetch all members for admin
      setMembers(fetchedMembers);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal memuat anggota',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  const handleOpenDialog = (member: MemberWithStatus, dialog: 'edit' | 'verify') => {
    setSelectedMember(member);
    if (dialog === 'edit') setIsEditDialogOpen(true);
    if (dialog === 'verify') setIsVerificationDialogOpen(true);
  };
  
  const handleSaveDetails = async (id: string, formData: FormData) => {
    setIsSavingDetails(true);
    try {
        await updateMemberDetails(id, formData);
        toast({ title: 'Detail anggota diperbarui!' });
        fetchMembers();
        setIsEditDialogOpen(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
    } finally {
        setIsSavingDetails(false);
    }
  };

  const handleOpenResetDialog = (member: MemberWithStatus) => {
    setSelectedMember(member);
    setShowResetAlert(true);
  };

  const handleResetVerification = async () => {
    if (!selectedMember || resetConfirmationInput !== 'RESET') {
        toast({variant: 'destructive', title: 'Konfirmasi salah', description: 'Anda harus mengetik "RESET" untuk melanjutkan.'});
        return;
    }
    setIsSavingDetails(true);
    try {
        await resetVerificationData(selectedMember.id);
        toast({title: 'Data Verifikasi Direset', description: `Data verifikasi untuk ${selectedMember.name} telah dihapus.`});
        fetchMembers();
        setShowResetAlert(false);
    } catch (error) {
        toast({variant: 'destructive', title: 'Gagal Mereset', description: (error as Error).message });
    } finally {
        setIsSavingDetails(false);
        setResetConfirmationInput("");
    }
  }


  const getStatusBadge = (status: MemberWithStatus['verificationStatus']) => {
    switch (status) {
      case 'permanent':
        return <Badge variant="default">Permanen</Badge>;
      case 'temporary':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'manual':
        return <Badge className="bg-blue-500 text-white">Manual</Badge>;
      case 'unverified':
      default:
        return <Badge variant="outline">Belum Terverifikasi</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Manajemen Anggota</h1>
            <p className="text-muted-foreground">Kelola jabatan, peran, dan status verifikasi anggota.</p>
          </div>
          <Button onClick={() => router.push('/panel/members/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Anggota
          </Button>
        </div>
        <Card>
           <CardHeader>
             <CardTitle>Daftar Anggota</CardTitle>
             <CardDescription>Total {members.length} anggota ditemukan.</CardDescription>
          </CardHeader>
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
                    <TableRow key={member.id} className={member.isHidden ? 'bg-muted/30 opacity-60' : ''}>
                      <TableCell className="font-medium">{formatFullName(member.name, member.titlePrefix, member.titlePostfix)}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.phoneNumber}</TableCell>
                      <TableCell>{getStatusBadge(member.verificationStatus)}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.position}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <ClientFormattedDate dateString={member.joinDate} />
                      </TableCell>
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
                             {member.verificationStatus === 'temporary' && (
                                <DropdownMenuItem onClick={() => handleOpenDialog(member, 'verify')}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Tinjau Verifikasi
                                </DropdownMenuItem>
                             )}
                             {(member.verificationStatus === 'temporary' || member.verificationStatus === 'rejected') && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleOpenResetDialog(member)}>
                                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Verifikasi
                                </DropdownMenuItem>
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
       <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin Ingin Mereset Verifikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus NIK dan foto KTP untuk anggota <span className="font-bold">{selectedMember?.name}</span>. Mereka harus melakukan verifikasi ulang. Untuk melanjutkan, ketik "RESET" di bawah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            value={resetConfirmationInput}
            onChange={(e) => setResetConfirmationInput(e.target.value)}
            placeholder='Ketik "RESET" untuk konfirmasi'
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={resetConfirmationInput !== 'RESET' || isSavingDetails}
              onClick={handleResetVerification}
            >
              {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Ya, Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


function ClientFormattedDate({ dateString }: { dateString?: string }) {
    const [formattedDate, setFormattedDate] = useState('');
    useEffect(() => {
        if (!dateString) return;
        const formatDate = async () => {
            const { id } = await import('date-fns/locale/id');
            setFormattedDate(format(new Date(dateString), 'dd MMM yyyy', { locale: id }));
        };
        formatDate();
    }, [dateString]);
    return <>{formattedDate || '-'}</>;
}
