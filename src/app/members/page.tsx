
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
import { getMembers, MemberWithStatus } from '@/app/actions/members';
import { useToast } from '@/hooks/use-toast';
import { formatFullName } from '@/lib/utils';


const TABS = ['Semua', 'DPP', 'DPD', 'DPC', 'Dewan Kehormatan', 'Anggota Istimewa'];

export default function MembersPage() {
  const { toast } = useToast();
  const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
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
    if (activeTab === 'DPP') {
      members = members.filter((member) => member.type === 'pusat');
    } else if (activeTab === 'DPD') {
      members = members.filter((member) => member.type === 'daerah');
    } else if (activeTab === 'DPC') {
      members = members.filter((member) => member.type === 'cabang');
    } else if (activeTab === 'Dewan Kehormatan') {
        members = members.filter((member) => ['pembina', 'pengawas', 'penasehat'].includes(member.type || ''));
    } else if (activeTab === 'Anggota Istimewa') {
      members = members.filter((member) => member.isSpecialMember);
    }

    // Filter berdasarkan pencarian nama
    if (searchTerm) {
      members = members.filter((member) =>
        formatFullName(member.name, member.titlePrefix, member.titlePostfix).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan wilayah (hanya jika tab adalah 'Semua' atau 'DPD')
    if ((activeTab === 'Semua' || activeTab === 'DPD') && selectedRegion !== 'Semua Wilayah') {
        members = members.filter((member) => member.region === selectedRegion);
    }

    return members;
  }, [allMembers, activeTab, searchTerm, selectedRegion]);
  
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'DPD' && tab !== 'Semua') {
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
             {(activeTab === 'Semua' || activeTab === 'DPD') && (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
            {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                <MemberCard
                    key={member.id}
                    name={member.name}
                    titlePrefix={member.titlePrefix}
                    titlePostfix={member.titlePostfix}
                    position={member.position || 'Anggota'}
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
