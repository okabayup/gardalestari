
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  position: string;
  type: 'pusat' | 'daerah' | 'pembina';
  region?: string;
  avatarUrl?: string;
}

const membersCollection = collection(db, 'members');

// Function to seed data if collection is empty
// This is for demonstration. In a real app, you'd manage members via an admin panel.
async function seedMembersData() {
  const snapshot = await getDocs(membersCollection);
  if (snapshot.empty) {
    console.log("Members collection is empty. Seeding data...");
    const { addDoc } = await import('firebase/firestore');
    const placeholderMembers = [
      // Pusat
      { name: 'Dr. Suryo Prakoso', position: 'Ketua Umum', type: 'pusat', avatarUrl: 'https://picsum.photos/id/201/100/100' },
      { name: 'Amelia Siregar', position: 'Sekretaris Umum', type: 'pusat', avatarUrl: 'https://picsum.photos/id/202/100/100' },
      { name: 'Bayu Wijoyo', position: 'Bendahara Umum', type: 'pusat', avatarUrl: 'https://picsum.photos/id/203/100/100' },
      { name: 'Kartika Sari', position: 'Kadiv. Agro', type: 'pusat', avatarUrl: 'https://picsum.photos/id/204/100/100' },
      { name: 'Gilang Samudra', position: 'Kadiv. Maritim', type: 'pusat', avatarUrl: 'https://picsum.photos/id/206/100/100' },
      { name: 'Wulan Kirana', position: 'Kadiv. Kehutanan', type: 'pusat', avatarUrl: 'https://picsum.photos/id/207/100/100' },
      // Daerah
      { name: 'Joko Susilo', position: 'Koordinator', type: 'daerah', region: 'Jawa Barat', avatarUrl: 'https://picsum.photos/id/301/100/100' },
      { name: 'Eka Putri', position: 'Koordinator', type: 'daerah', region: 'Jawa Tengah', avatarUrl: 'https://picsum.photos/id/302/100/100' },
      { name: 'Made Wijaya', position: 'Koordinator', type: 'daerah', region: 'Bali', avatarUrl: 'https://picsum.photos/id/303/100/100' },
      { name: 'Dewi Anggraini', position: 'Anggota', type: 'daerah', region: 'Jawa Barat', avatarUrl: 'https://picsum.photos/id/304/100/100' },
      { name: 'Bambang Irawan', position: 'Anggota', type: 'daerah', region: 'Bali', avatarUrl: 'https://picsum.photos/id/305/100/100' },
       // Pembina
      { name: 'Prof. Emil Salim', position: 'Dewan Pembina', type: 'pembina', avatarUrl: 'https://picsum.photos/id/401/100/100' },
      { name: 'Dr. Ir. Rokhmin Dahuri', position: 'Dewan Pembina', type: 'pembina', avatarUrl: 'https://picsum.photos/id/402/100/100' },
    ];
    for (const member of placeholderMembers) {
      await addDoc(membersCollection, member);
    }
  }
}

// Get all members
export async function getMembers(): Promise<Member[]> {
  // await seedMembersData(); // Uncomment to seed data on first load
  const snapshot = await getDocs(membersCollection);
  const members: Member[] = [];
  snapshot.forEach(doc => {
    members.push({ id: doc.id, ...doc.data() } as Member);
  });
  return members;
}
