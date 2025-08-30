export const placeholderPosts = [
  {
    id: 1,
    author: {
      name: 'Rina Lestari',
      avatarUrl: 'https://picsum.photos/id/1011/50/50',
    },
    imageUrl: 'https://picsum.photos/id/1015/600/600',
    imageHint: 'green valley',
    caption: 'Beautiful morning hike at Gunung Gede Pangrango. The air was so fresh! 🍃 #conservation #nature',
    likes: 128,
    comments: 12,
    timestamp: '2h ago',
  },
  {
    id: 2,
    author: {
      name: 'Budi Santoso',
      avatarUrl: 'https://picsum.photos/id/1025/50/50',
    },
    imageUrl: 'https://picsum.photos/id/103/600/600',
    imageHint: 'forest path',
    caption: 'Our team just finished a tree planting event in West Java. Over 500 new saplings in the ground! 🌱',
    likes: 256,
    comments: 25,
    timestamp: '1d ago',
  },
    {
    id: 3,
    author: {
      name: 'Citra Dewi',
      avatarUrl: 'https://picsum.photos/id/1027/50/50',
    },
    imageUrl: 'https://picsum.photos/id/218/600/600',
    imageHint: 'waterfall jungle',
    caption: 'Discovered this hidden waterfall during our latest expedition. A reminder of what we\'re fighting to protect. 💧',
    likes: 312,
    comments: 34,
    timestamp: '3d ago',
  },
];

export const memberDirectory = {
  central: [
    { name: 'Dr. Arifin', role: 'Chairman', avatarUrl: 'https://picsum.photos/id/201/100/100' },
    { name: 'Siti Aminah', role: 'Secretary General', avatarUrl: 'https://picsum.photos/id/202/100/100' },
    { name: 'Iwan K.', role: 'Head of Programs', avatarUrl: 'https://picsum.photos/id/203/100/100' },
  ],
  regional: [
    { name: 'Joko Susilo', role: 'West Java Coordinator', avatarUrl: 'https://picsum.photos/id/301/100/100' },
    { name: 'Eka Putri', role: 'Central Java Coordinator', avatarUrl: 'https://picsum.photos/id/302/100/100' },
    { name: 'Made Wijaya', role: 'Bali Coordinator', avatarUrl: 'https://picsum.photos/id/303/100/100' },
  ],
  advisory: [
    { name: 'Prof. Emil Salim', role: 'Environmental Expert', avatarUrl: 'https://picsum.photos/id/401/100/100' },
    { name: 'Mari Pangestu', role: 'Economic Advisor', avatarUrl: 'https://picsum.photos/id/402/100/100' },
  ],
};

export const programs = {
  flagship: [
    {
      title: 'Mangrove Reforestation Initiative',
      description: 'Restoring coastal ecosystems by planting mangrove forests across Indonesia\'s northern coastlines.',
      imageUrl: 'https://picsum.photos/id/119/600/400',
      imageHint: 'mangrove forest',
    },
    {
      title: 'Orangutan Habitat Protection',
      description: 'Working with local communities in Borneo to protect and re-establish orangutan habitats.',
      imageUrl: 'https://picsum.photos/id/145/600/400',
      imageHint: 'orangutan animal',
    },
  ],
  ongoing: [
    {
      title: 'Urban Green-Thumb',
      description: 'Promoting urban farming and green spaces in major cities like Jakarta and Surabaya.',
      imageUrl: 'https://picsum.photos/id/155/600/400',
      imageHint: 'urban garden',
    },
    {
      title: 'River Cleanup Drive',
      description: 'Regular community-led events to clean up major rivers and waterways.',
      imageUrl: 'https://picsum.photos/id/160/600/400',
      imageHint: 'river rocks',
    },
    {
      title: 'Coral Reef Restoration',
      description: 'Diving programs focused on planting new coral and restoring damaged reefs.',
      imageUrl: 'https://picsum.photos/id/1020/600/400',
      imageHint: 'coral reef',
    },
  ],
};

export const events = [
  {
    date: { day: '15', month: 'JUL' },
    title: 'Annual General Meeting',
    location: 'Jakarta Convention Center',
    imageUrl: 'https://picsum.photos/id/1073/600/400',
    imageHint: 'conference room',
  },
  {
    date: { day: '28', month: 'JUL' },
    title: 'Beach Cleanup at Ancol',
    location: 'Ancol Beach, Jakarta',
    imageUrl: 'https://picsum.photos/id/101/600/400',
    imageHint: 'beach trash',
  },
  {
    date: { day: '10', month: 'AUG' },
    title: 'Conservation Leadership Workshop',
    location: 'Online via Zoom',
    imageUrl: 'https://picsum.photos/id/2/600/400',
    imageHint: 'person laptop',
  },
];

export const blogPosts = [
  {
    slug: 'the-importance-of-peatlands',
    title: 'The Unseen Guardians: Why Peatlands Are Crucial for Our Planet',
    author: 'Dr. Arifin',
    date: 'June 28, 2024',
    excerpt: 'Peatlands are one of the most effective carbon sinks in the world. This article explores their importance and the threats they face...',
    imageUrl: 'https://picsum.photos/id/1016/600/400',
    imageHint: 'wetland landscape',
    content: '<p>Peatlands, often overlooked, are vital ecosystems. They store more carbon than all other vegetation types in the world combined. In Indonesia, our peatlands are particularly extensive and incredibly important for global climate regulation.</p><p>However, they face significant threats from drainage for agriculture, particularly for palm oil and pulpwood plantations. When peatlands are drained, the stored carbon is released into the atmosphere as carbon dioxide, a major greenhouse gas.</p><h4>Our Strategy</h4><p>At Garda Lestari, we focus on a multi-pronged approach to peatland conservation: </p><ul><li><strong>Rewetting:</strong> We work to block drainage canals to re-wet dried peatlands, which stops carbon emissions and reduces fire risk.</li><li><strong>Reforestation:</strong> We plant native, peat-swamp adapted tree species to restore the natural forest cover.</li><li><strong>Community Engagement:</strong> We partner with local communities to develop sustainable livelihoods that do not require draining peatlands, such as paludiculture (wet agriculture).</li></ul><p>Protecting our peatlands is a critical battle in the fight against climate change. By supporting our work, you are helping to keep massive amounts of carbon locked in the ground and safeguarding precious biodiversity.</p>'
  },
  {
    slug: 'a-guide-to-responsible-wildlife-tourism',
    title: 'A Guide to Responsible Wildlife Tourism',
    author: 'Rina Lestari',
    date: 'June 15, 2024',
    excerpt: 'Love seeing animals in their natural habitat? Make sure you\'re doing it ethically. Here are our top tips for responsible wildlife tourism.',
    imageUrl: 'https://picsum.photos/id/1084/600/400',
    imageHint: 'wildlife deer',
    content: '<p>Wildlife tourism can be a powerful force for conservation, but only when done right. Here’s how to ensure your adventures help, not harm, the animals you love.</p><h4>Do Your Research</h4><p>Choose tour operators with strong ethical commitments. Look for certifications and reviews that mention conservation efforts and responsible practices.</p><h4>Keep Your Distance</h4><p>Never feed, touch, or get too close to wild animals. Using binoculars and zoom lenses allows for great viewing without stressing the wildlife.</p><h4>Leave No Trace</h4><p>This principle is paramount. Pack out everything you pack in. Stick to designated trails to avoid disturbing delicate habitats.</p>'
  },
];

export const availableBenefits = [
  {
    name: 'Conservation Workshop Discount',
    description: 'Get a 20% discount on all our paid workshops, from bird watching to sustainable farming.',
    category: 'Education',
    eligibilityCriteria: 'All active members.',
  },
  {
    name: 'Early Bird Event Access',
    description: 'Register for our popular events like beach cleanups and planting drives 24 hours before the public.',
    category: 'Community',
    eligibilityCriteria: 'All active members.',
  },
  {
    name: 'Research Grant Application',
    description: 'Opportunity to apply for small research grants for environmental studies.',
    category: 'Professional Development',
    eligibilityCriteria: 'Members with a proven academic or research background.',
  },
  {
    name: 'Partner Eco-Resort Stays',
    description: 'Enjoy special rates at our partner eco-resorts in Bali and Lombok.',
    category: 'Travel',
    eligibilityCriteria: 'Members with over 1 year of active membership.',
  },
  {
    name: 'Free Digital Magazine Subscription',
    description: 'Receive our quarterly "Lestari" digital magazine, filled with stories and research.',
    category: 'Education',
    eligibilityCriteria: 'All active members.',
  },
  {
    name: 'Mentorship Program',
    description: 'Connect with senior members and advisors for career and project guidance.',
    category: 'Professional Development',
    eligibilityCriteria: 'Young professionals and student members.',
  },
];
