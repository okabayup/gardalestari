
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMembers,
  updateMemberDetails,
  resetVerificationData,
  deleteUserAccount,
  MemberWithStatus,
} from '@/app/actions/user';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Edit, ShieldCheck, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import EditMemberDialog from '@/components/admin/EditMemberDialog';
import ViewVerificationDialog from '@/components/admin/ViewVerificationDialog';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/panel/DataTable';
import { columns } from './columns';
import { Badge } from '@/components/ui/badge';
import { memberTypes, verificationStatuses } from '@/lib/definitions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminMembersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithStatus | null>(null);
  
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState<'reset' | 'delete' | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedMembers = await getMembers(false);
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

  const filteredMembers = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return members.filter(m => m.verificationStatus === 'temporary');
      case 'deletion-requests':
        return members.filter(m => m.deletionRequestedAt);
      case 'all':
      default:
        return members;
    }
  }, [members, activeTab]);

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

  const handleOpenConfirmationDialog = (member: MemberWithStatus, action: 'reset' | 'delete') => {
    setSelectedMember(member);
    setActionToConfirm(action);
    setShowConfirmationDialog(true);
  };

  const handleConfirmation = async () => {
    if (!selectedMember) return;

    if (actionToConfirm === 'reset') {
        if (confirmationInput !== 'RESET') {
            toast({variant: 'destructive', title: 'Konfirmasi salah', description: 'Anda harus mengetik "RESET" untuk melanjutkan.'});
            return;
        }
        await executeReset();
    } else if (actionToConfirm === 'delete') {
         if (confirmationInput !== 'HAPUS') {
            toast({variant: 'destructive', title: 'Konfirmasi salah', description: 'Anda harus mengetik "HAPUS" untuk melanjutkan.'});
            return;
        }
        await executeDelete();
    }
  }

  const executeReset = async () => {
      if (!selectedMember) return;
      setIsSavingDetails(true);
      try {
          await resetVerificationData(selectedMember.id);
          toast({title: 'Data Verifikasi Direset', description: `Data verifikasi untuk ${selectedMember.name} telah dihapus.`});
          fetchMembers();
          setShowConfirmationDialog(false);
      } catch (error) {
          toast({variant: 'destructive', title: 'Gagal Mereset', description: (error as Error).message });
      } finally {
          setIsSavingDetails(false);
          setConfirmationInput("");
      }
  }

   const executeDelete = async () => {
      if (!selectedMember) return;
      setIsSavingDetails(true);
      try {
          const result = await deleteUserAccount(selectedMember.id);
          if (result.success) {
            toast({title: 'Akun Dihapus', description: `Akun ${selectedMember.name} telah dihapus permanen.`});
            fetchMembers();
            setShowConfirmationDialog(false);
          } else {
            throw new Error(result.error);
          }
      } catch (error) {
          toast({variant: 'destructive', title: 'Gagal Menghapus Akun', description: (error as Error).message });
      } finally {
          setIsSavingDetails(false);
          setConfirmationInput("");
      }
  }


  const memoizedColumns = useMemo<ColumnDef<MemberWithStatus>[]>(() => [
        ...columns,
         {
          accessorKey: "isSuspended",
          header: "Status Akun",
          cell: ({ row }) => {
            const member = row.original;
            return member.isSuspended ? (
              <Badge variant="destructive">Ditangguhkan</Badge>
            ) : null;
          },
        },
        {
          accessorKey: "deletionRequestedAt",
          header: "Permintaan Hapus",
          cell: ({ row }) => {
            const member = row.original as MemberWithStatus & { deletionRequestedAt?: string | Date };
            return member.deletionRequestedAt ? (
              <Badge variant="destructive">Diminta</Badge>
            ) : null;
          },
        },
        {
          id: 'actions',
          cell: ({ row }) => {
            const member = row.original;
            return (
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
                  <DropdownMenuItem onClick={() => handleOpenDialog(member, 'verify')}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Tinjau Verifikasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-orange-600 focus:text-orange-600 focus:bg-orange-50" onClick={() => handleOpenConfirmationDialog(member, 'reset')}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset Verifikasi
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-red-50" onClick={() => handleOpenConfirmationDialog(member, 'delete')}>
                      <Trash2 className="mr-2 h-4 w-4" /> Hapus Akun Permanen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
  ], []);

  const facetedFilters = [
    { columnId: 'type', title: 'Jenis', options: memberTypes.map(mt => ({ label: mt.label, value: mt.value })) },
    { columnId: 'verificationStatus', title: 'Status', options: verificationStatuses.map(vs => ({ label: vs.label, value: vs.value })) },
  ];

  const toolbarButtons = (
      <Button onClick={() => router.push('/panel/members/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Anggota
      </Button>
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Manajemen Anggota</h1>
          <p className="text-muted-foreground">Kelola jabatan, peran, dan status verifikasi anggota.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="all">Semua Anggota</TabsTrigger>
                <TabsTrigger value="pending">Menunggu Verifikasi</TabsTrigger>
                <TabsTrigger value="deletion-requests">Permintaan Hapus</TabsTrigger>
            </TabsList>
        </Tabs>
        
        {loading ? (
           <div className="flex justify-center py-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <DataTable 
              columns={memoizedColumns} 
              data={filteredMembers} 
              placeholder="Cari anggota..."
              facetedFilters={facetedFilters}
              toolbarButtons={toolbarButtons}
            />
        )}
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
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm === 'reset' && (
                <>Tindakan ini akan menghapus NIK dan foto KTP untuk anggota <span className="font-bold">{selectedMember?.name}</span>. Mereka harus melakukan verifikasi ulang. Untuk melanjutkan, ketik "RESET" di bawah ini.</>
              )}
               {actionToConfirm === 'delete' && (
                <>Tindakan ini akan <span className="font-bold text-destructive">menghapus akun dan semua data</span> terkait anggota <span className="font-bold">{selectedMember?.name}</span> secara permanen. Ini tidak dapat dibatalkan. Untuk melanjutkan, ketik "HAPUS" di bawah ini.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder={`Ketik "${actionToConfirm === 'reset' ? 'RESET' : 'HAPUS'}" untuk konfirmasi`}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationInput('')}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={(actionToConfirm === 'reset' && confirmationInput !== 'RESET') || (actionToConfirm === 'delete' && confirmationInput !== 'HAPUS') || isSavingDetails}
              onClick={handleConfirmation}
            >
              {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
