
export type Level = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export const levelRequirements: Record<Level, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 2000,
  Platinum: 5000,
};

export interface Mission {
  id: string;
  description: string;
  points: number;
}

export const missions: Mission[] = [
  {
    id: 'verify_profile',
    description: 'Selesaikan verifikasi profil (KTP & Selfie)',
    points: 100,
  },
  {
    id: 'first_post',
    description: 'Buat postingan pertama Anda',
    points: 50,
  },
  {
    id: 'five_posts',
    description: 'Unggah total 5 postingan',
    points: 150,
  },
  {
    id: 'get_10_likes',
    description: 'Dapatkan 10 suka pada satu postingan',
    points: 75,
  },
  {
    id: 'get_100_likes',
    description: 'Akumulasi total 100 suka di semua postingan',
    points: 200,
  },
  {
    id: 'give_20_likes',
    description: 'Berikan 20 suka pada postingan orang lain',
    points: 50,
  },
  {
    id: 'add_comment',
    description: 'Tambahkan komentar pertama Anda',
    points: 20,
  },
];

    
