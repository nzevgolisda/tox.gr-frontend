const partials = [
  'html/partials/overlays.html',
  'html/partials/navigation.html',
  'html/partials/main.html'
];

async function loadPartials() {
  const mount = document.getElementById('app-mount');
  if (!mount) throw new Error('App mount point is missing.');
  const fragments = await Promise.all(partials.map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
    return response.text();
  }));
  mount.innerHTML = fragments.join('\n');
  document.dispatchEvent(new CustomEvent('app-ready'));
}

loadPartials().catch(error => {
  console.error('HTML partial loading failed:', error);
  const mount = document.getElementById('app-mount');
  if (mount) mount.innerHTML = '<p class="feed-empty-sub">Αδυναμία φόρτωσης της εφαρμογής.</p>';
});
