import MainLayout from '@/components/layout/MainLayout';
import { MemberCard } from '@/components/members/MemberCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { memberDirectory } from '@/lib/placeholder-data';

export default function MembersPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl font-bold">Member Directory</h1>
          <p className="text-muted-foreground">Meet the team behind Garda Lestari</p>
        </div>

        <Tabs defaultValue="central" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="central">Central</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="advisory">Advisory</TabsTrigger>
          </TabsList>
          <TabsContent value="central" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.central.map((member) => (
                <MemberCard key={member.name} {...member} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="regional" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.regional.map((member) => (
                <MemberCard key={member.name} {...member} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="advisory" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {memberDirectory.advisory.map((member) => (
                <MemberCard key={member.name} {...member} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
