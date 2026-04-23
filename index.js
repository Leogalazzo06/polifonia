// ── CONFIGURACIÓN ──────────────────────────────────────
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ── PALETA DE COLORES (igual que admin.js) ─────────────
const CATEGORY_PALETTE = [
    { id: 'pink',    hex: '#fce7f3', bg: 'bg-pink-50',    text: 'text-pink-500',    badge: 'bg-pink-100 text-pink-700'       },
    { id: 'rose',    hex: '#ffe4e6', bg: 'bg-rose-50',    text: 'text-rose-500',    badge: 'bg-rose-100 text-rose-700'       },
    { id: 'fuchsia', hex: '#fae8ff', bg: 'bg-fuchsia-50', text: 'text-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-700' },
    { id: 'purple',  hex: '#f3e8ff', bg: 'bg-purple-50',  text: 'text-purple-500',  badge: 'bg-purple-100 text-purple-700'   },
    { id: 'violet',  hex: '#ede9fe', bg: 'bg-violet-50',  text: 'text-violet-500',  badge: 'bg-violet-100 text-violet-700'   },
    { id: 'indigo',  hex: '#e0e7ff', bg: 'bg-indigo-50',  text: 'text-indigo-500',  badge: 'bg-indigo-100 text-indigo-700'   },
    { id: 'blue',    hex: '#dbeafe', bg: 'bg-blue-50',    text: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700'       },
    { id: 'sky',     hex: '#e0f2fe', bg: 'bg-sky-50',     text: 'text-sky-500',     badge: 'bg-sky-100 text-sky-700'         },
    { id: 'cyan',    hex: '#cffafe', bg: 'bg-cyan-50',    text: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700'       },
    { id: 'teal',    hex: '#ccfbf1', bg: 'bg-teal-50',    text: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700'       },
    { id: 'emerald', hex: '#d1fae5', bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    { id: 'green',   hex: '#dcfce7', bg: 'bg-green-50',   text: 'text-green-600',   badge: 'bg-green-100 text-green-700'     },
    { id: 'lime',    hex: '#f7fee7', bg: 'bg-lime-50',    text: 'text-lime-600',    badge: 'bg-lime-100 text-lime-700'       },
    { id: 'yellow',  hex: '#fefce8', bg: 'bg-yellow-50',  text: 'text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700'   },
    { id: 'amber',   hex: '#fffbeb', bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700'     },
    { id: 'orange',  hex: '#fff7ed', bg: 'bg-orange-50',  text: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700'   },
    { id: 'red',     hex: '#fef2f2', bg: 'bg-red-50',     text: 'text-red-500',     badge: 'bg-red-100 text-red-700'         },
    { id: 'stone',   hex: '#f5f5f4', bg: 'bg-stone-50',   text: 'text-stone-500',   badge: 'bg-stone-100 text-stone-700'     },
    { id: 'zinc',    hex: '#f4f4f5', bg: 'bg-zinc-50',    text: 'text-zinc-500',    badge: 'bg-zinc-100 text-zinc-700'       },
    { id: 'gray',    hex: '#f9fafb', bg: 'bg-gray-50',    text: 'text-gray-500',    badge: 'bg-gray-100 text-gray-600'       },
];

function getCategoryStyle(colorId) {
    return CATEGORY_PALETTE.find(c => c.id === colorId) || CATEGORY_PALETTE[8];
}

document.addEventListener('DOMContentLoaded', async () => {

    // ── MODAL QUIERO PUBLICAR ─────────────────────────
    const colaborarModal   = document.getElementById('colaborar-modal');
    const modalBackdrop    = document.getElementById('modal-backdrop');
    const modalCloseBtn    = document.getElementById('modal-close-btn');
    const modalCloseBottom = document.getElementById('modal-close-bottom');

    function openModal() {
        colaborarModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        colaborarModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Abrir desde desktop y mobile
    document.getElementById('colaborar-btn-desktop')?.addEventListener('click', openModal);
    document.getElementById('colaborar-btn-mobile')?.addEventListener('click', () => {
        const mm = document.getElementById('mobile-menu');
        if (mm) { mm.classList.add('hidden'); mm.classList.remove('flex'); }
        openModal();
    });

    // Cerrar
    modalCloseBtn?.addEventListener('click', closeModal);
    modalCloseBottom?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ── MENÚ HAMBURGUESA ──────────────────────────────
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu    = document.getElementById('mobile-menu');
    const mobileLinks   = document.querySelectorAll('.mobile-link');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            });
        });
    }

    // ── ARTÍCULOS + CATEGORÍAS ────────────────────────
    const articlesWrapper  = document.getElementById('articles-wrapper');
    const categoryFilters  = document.getElementById('category-filters');
    const noResults        = document.getElementById('no-results');
    let   activeFilter     = 'all';
    let   allArticles      = [];
    let   catMap           = {};

    // ── LÓGICA DE SCROLL DE CATEGORÍAS ────────────────
    const btnScrollLeft = document.getElementById('btn-scroll-left');
    const btnScrollRight = document.getElementById('btn-scroll-right');
    
    if (btnScrollLeft && btnScrollRight && categoryFilters) {
        btnScrollLeft.addEventListener('click', () => {
            categoryFilters.scrollBy({ left: -250, behavior: 'smooth' });
        });
        btnScrollRight.addEventListener('click', () => {
            categoryFilters.scrollBy({ left: 250, behavior: 'smooth' });
        });
    }

    // Genera el HTML de una card
    function buildCardHTML(article) {
        const colorId = catMap[article.category];
        const style   = getCategoryStyle(colorId);
        const palette = CATEGORY_PALETTE.find(p => p.id === colorId);
        const cardBg  = palette ? `style="background-color:${palette.hex}22"` : '';

        let mediaHTML = '';
        if (article.cover_image_url && typeof article.cover_image_url === 'string' && article.cover_image_url.trim() !== '' && article.cover_image_url !== 'null') {
            mediaHTML = `
                <div class="w-full h-32 md:h-48 bg-gray-100 rounded-lg mb-3 md:mb-4 overflow-hidden">
                    <img src="${article.cover_image_url}" alt="Blog Post" class="w-full h-full object-cover hover:scale-105 transition duration-500">
                </div>`;
        } else {
            mediaHTML = `
                <div class="w-full h-32 md:h-48 bg-gray-50 rounded-lg mb-3 md:mb-4 overflow-hidden flex items-center justify-center border border-gray-100">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin Portada</span>
                </div>`;
        }

        return `
            <div onclick="window.location.href='articulo.html?id=${article.id}'"
                class="h-full w-full flex flex-col border border-gray-200 rounded-xl p-3 md:p-6 items-start text-left shadow-sm hover:shadow-md transition cursor-pointer" ${cardBg}>
                ${mediaHTML}
                <span class="text-[9px] md:text-[10px] font-bold ${style.text} uppercase tracking-widest mb-1 md:mb-2">${article.category}</span>
                <h4 class="font-serif text-base md:text-2xl mb-2 md:mb-3 leading-tight">${article.title}</h4>
                <p class="text-[11px] md:text-xs text-gray-500 mb-3 md:mb-4 line-clamp-2">${article.excerpt}</p>
                ${article.author ? `
                <div class="inline-flex items-start gap-1.5 border border-plm-dark rounded-full px-2.5 py-1 mb-3 md:mb-4 bg-white max-w-full">
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="shrink-0 opacity-50 mt-0.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span class="text-[9px] md:text-[10px] font-bold text-plm-dark uppercase tracking-wide leading-tight">${article.author}</span>
                </div>` : ''}
                <button class="mt-auto border-b-2 border-plm-dark pb-0.5 md:pb-1 text-[9px] md:text-xs font-bold uppercase tracking-widest hover:text-plm-pink hover:border-plm-pink transition">Leer →</button>
            </div>
        `;
    }

    // Renderiza las cards según el filtro activo
    function renderArticles() {
        const filtered = activeFilter === 'all'
            ? allArticles
            : allArticles.filter(a => a.category === activeFilter);

        articlesWrapper.innerHTML = '';

        if (filtered.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
            filtered.forEach(a => { articlesWrapper.innerHTML += buildCardHTML(a); });
        }
    }

    // Construye los botones de filtro
    function buildFilters(categories) {
        // "Todos" primero
        const allBtn = document.createElement('button');
        allBtn.dataset.cat = 'all';
        allBtn.className = 'filter-btn active-filter whitespace-nowrap flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-plm-dark bg-plm-dark text-white transition';
        allBtn.textContent = 'Todos';
        categoryFilters.appendChild(allBtn);

        // Ordenar categorías con artículos
        const usedCats = [...new Set(allArticles.map(a => a.category))];
        usedCats.forEach(catName => {
            const cat     = categories.find(c => c.name === catName);
            const palette = CATEGORY_PALETTE.find(p => p.id === cat?.color_id);
            const hex     = palette?.hex || '#e5e7eb';

            const btn = document.createElement('button');
            btn.dataset.cat = catName;
            btn.className   = 'filter-btn whitespace-nowrap flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-plm-dark hover:text-plm-dark transition';
            btn.style.setProperty('--cat-hex', hex);
            btn.textContent = catName;
            categoryFilters.appendChild(btn);
        });

        // Listener global (delegación)
        categoryFilters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            activeFilter = btn.dataset.cat;

            // Resetear estilos
            categoryFilters.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active-filter', 'bg-plm-dark', 'text-white', 'border-plm-dark');
                b.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
                b.style.removeProperty('background-color');
            });

            // Activar el pulsado
            btn.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
            if (activeFilter === 'all') {
                btn.classList.add('active-filter', 'bg-plm-dark', 'text-white', 'border-plm-dark');
            } else {
                const palette = CATEGORY_PALETTE.find(p => p.id === catMap[activeFilter]);
                btn.style.backgroundColor = palette ? palette.hex : '#e5e7eb';
                btn.classList.add('active-filter', 'border-plm-dark', 'text-plm-dark');
            }

            renderArticles();
        });
    }

    try {
        const [artRes, catRes] = await Promise.all([
            supabaseClient.from('articles').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('categories').select('*')
        ]);

        if (artRes.error) throw artRes.error;
        if (catRes.error) throw catRes.error;

        allArticles = artRes.data.filter(a => !a.archived);
        const categories = catRes.data;

        categories.forEach(c => { catMap[c.name] = c.color_id; });

        if (allArticles.length === 0) {
            articlesWrapper.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center">Aún no hay artículos publicados.</p>';
            return;
        }

        buildFilters(categories);
        renderArticles();

    } catch (error) {
        console.error('Error cargando artículos:', error);
        articlesWrapper.innerHTML = '<p class="text-sm text-red-500 col-span-full text-center">Hubo un error cargando el blog.</p>';
    }
});
