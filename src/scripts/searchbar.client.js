document.addEventListener('astro:page-load', () => {
  const searchInput = document.getElementById('search-input');
  const resultsList = document.getElementById('results-list');
  const filterToggle = document.getElementById('filter-toggle');
  const filterMenu = document.getElementById('filter-menu');
  const dataEl = document.getElementById('search-data');

  if (!searchInput || !resultsList || !filterToggle || !filterMenu || !dataEl) return;

  const productos = JSON.parse(dataEl.textContent);

  // Si venimos de /search?q=..., mostramos ese término en el input
  const currentQuery = new URLSearchParams(window.location.search).get('q');
  if (currentQuery) {
    searchInput.value = currentQuery;
  }

  // Función para renderizar la lista en el HTML
  function renderResults(items) {
    if (items.length === 0) {
      resultsList.innerHTML = '<li class="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">No se encontraron productos</li>';
      return;
    }

    resultsList.innerHTML = items.map((item, index) => `
      <li class="search-result-item" style="animation-delay: ${index * 60}ms">
        <a href="/productView/${item.id}" class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-secondary/10 dark:hover:bg-secondary/15 transition-colors duration-300">
          <span class="flex items-center gap-3 min-w-0">
            <img src="${item.thumb}" alt="${item.name}" width="48" height="48" class="w-12 h-12 shrink-0 object-cover rounded-xl ring-1 ring-neutral-900/10 dark:ring-white/10" />
            <strong class="text-neutral-950 dark:text-white truncate">${item.name}</strong>
          </span>
          <span class="font-bold text-secondary whitespace-nowrap">$${item.price}</span>
        </a>
      </li>
    `).join('');
  }

  const MAX_RESULTS = 3;

  // Escuchar lo que escribe el usuario para filtrar en tiempo real
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
      // Si la barra está vacía, no mostramos nada
      resultsList.innerHTML = '';
      return;
    }

    // Filtramos el array de productos en el navegador
    const filtered = productos.filter(item => {
      const nombreMatch = item.name.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query) || false;
      return nombreMatch || descMatch;
    });

    renderResults(filtered.slice(0, MAX_RESULTS));
  });

  // Enter navega a la página con todos los resultados
  searchInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const query = e.target.value.trim();
    if (query === '') return;

    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  });

  // Menú de filtros
  filterToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !filterMenu.classList.contains('hidden');
    filterMenu.classList.toggle('hidden', isOpen);
    filterToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!filterMenu.contains(e.target) && e.target !== filterToggle) {
      filterMenu.classList.add('hidden');
      filterToggle.setAttribute('aria-expanded', 'false');
    }
  });
});
