import MainLayout from '@/components/layout/MainLayout';
import { MemberCard } from '@/components/members/MemberCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { memberDirectory } from '@/lib/placeholder-data';

export default function MembersPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl font-bold">Direktori Anggota</h1>
          <p className="text-muted-foreground">Kenali tim di balik Garda Lestari</p>
        </div>

        <Tabs defaultValue="pusat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pusat">Pengurus Pusat</TabsTrigger>
            <TabsTrigger value="daerah">Pengurus Daerah</TabsTrigger>
            <TabsTrigger value="pembina">Dewan Pembina</TabsTrigger>
          </TabsList>
          <TabsContent value="pusat" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.pusat.map((member) => (
                <MemberCard key={member.name} name={member.name} position={member.position} avatarUrl={member.avatarUrl} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="daerah" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.daerah.map((member) => (
                <MemberCard key={member.name} name={member.name} position={member.position} avatarUrl={member.avatarUrl} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="pembina" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.pembina.map((member) => (
                <MemberCard key={member.name} name={member.name} position={member.position} avatarUrl={member.avatarUrl} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
