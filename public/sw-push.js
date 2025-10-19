
// Listener untuk event push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.notification.title || 'Notifikasi Baru';
  const options = {
    body: data.notification.body || 'Anda memiliki pesan baru.',
    icon: data.notification.icon || '/logo-bg-hijau.png',
    badge: '/logo-bg-hijau.png',
    data: {
      url: data.fcmOptions.link || self.location.origin, // Gunakan link dari notifikasi atau default
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Tutup notifikasi

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Jika ada window yang sudah terbuka dengan URL yang sama, fokus ke sana
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
