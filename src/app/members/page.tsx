
'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { MemberCard } from '@/components/members/MemberCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { getMembers, Member } from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';


const TABS = ['Semua', 'Pengurus Pusat', 'Pengurus Daerah', 'Dewan Pembina', 'Dewan Pengawas', 'Dewan Penasehat', 'Anggota Istimewa'];

export default function MembersPage() {
  const { toast } = useToast();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua Wilayah');
  
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const members = await getMembers();
        setAllMembers(members);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Gagal memuat anggota",
          description: "Tidak dapat mengambil data anggota dari server."
        })
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [toast]);

  const allRegions = useMemo(() => {
    return [
      'Semua Wilayah',
      ...Array.from(new Set(allMembers.filter(m => m.type === 'daerah' && m.region).map(m => m.region as string)))
    ];
  }, [allMembers]);

  const filteredMembers = useMemo(() => {
    let members = allMembers;

    // Filter berdasarkan tab
    if (activeTab === 'Pengurus Pusat') {
      members = members.filter((member) => member.type === 'pusat');
    } else if (activeTab === 'Pengurus Daerah') {
      members = members.filter((member) => member.type === 'daerah');
    } else if (activeTab === 'Dewan Pembina') {
        members = members.filter((member) => member.type === 'pembina');
    } else if (activeTab === 'Dewan Pengawas') {
        members = members.filter((member) => member.type === 'pengawas');
    } else if (activeTab === 'Dewan Penasehat') {
        members = members.filter((member) => member.type === 'penasehat');
    } else if (activeTab === 'Anggota Istimewa') {
      members = members.filter((member) => member.isSpecialMember);
    }

    // Filter berdasarkan pencarian nama
    if (searchTerm) {
      members = members.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan wilayah (hanya jika tab adalah 'Semua' atau 'Pengurus Daerah')
    if ((activeTab === 'Semua' || activeTab === 'Pengurus Daerah') && selectedRegion !== 'Semua Wilayah') {
        members = members.filter((member) => member.region === selectedRegion);
    }

    return members;
  }, [allMembers, activeTab, searchTerm, selectedRegion]);
  
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'Pengurus Daerah' && tab !== 'Semua') {
      setSelectedRegion('Semua Wilayah');
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center mb-4">
          <h1 className="font-headline text-3xl font-bold">Direktori Anggota</h1>
          <p className="text-muted-foreground">Kenali tim di balik Garda Lestari</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari nama anggota..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             {(activeTab === 'Semua' || activeTab === 'Pengurus Daerah') && (
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter berdasarkan wilayah" />
                    </SelectTrigger>
                    <SelectContent>
                        {allRegions.map((region) => (
                            <SelectItem key={region} value={region}>
                                {region}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>


        {/* Tabs with Horizontal Scroll */}
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2">
              {TABS.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  onClick={() => handleTabClick(tab)}
                  className="shrink-0"
                >
                  {tab}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Member Grid */}
        {loading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                <MemberCard
                    key={member.id}
                    name={member.name}
                    position={member.position}
                    avatarUrl={member.avatarUrl}
                />
                ))
            ) : (
                <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">Anggota tidak ditemukan.</p>
                </div>
            )}
            </div>
        )}
      </div>
    </MainLayout>
  );
}
