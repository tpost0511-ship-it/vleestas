const routes = {
  home: '/',
  challenges: '/challenges',
  shop: '/shop',
  roulette: '/roulette',
  ranking: '/ranking',
  reviews: '/reviews',
  settings: '/settings'
};

const tabsByPath = Object.fromEntries(
  Object.entries(routes).map(([tab, path]) => [path, tab])
);

export function pathForTab(tab) {
  return routes[tab] || routes.home;
}

export function tabForPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return tabsByPath[path] || 'home';
}

export function isTabPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return Object.prototype.hasOwnProperty.call(tabsByPath, path) || path === '/index.html';
}
