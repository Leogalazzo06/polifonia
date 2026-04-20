// ── CONFIGURACIÓN ──────────────────────────────────────
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ── PALETA DE COLORES (igual que admin.js) ─────────────
const CATEGORY_PALETTE = [
    { id: 'pink',   hex: '#fcd5e3', bg: 'bg-plm-pink/20',  text: 'text-pink-400',   badge: 'bg-pink-50 text-pink-700'   },
    { id: 'blue',   hex: '#bde3df', bg: 'bg-plm-blue/20',  text: 'text-blue-400',   badge: 'bg-blue-50 text-blue-700'   },
    { id: 'green',  hex: '#a8c292', bg: 'bg-green-50',      text: 'text-plm-green',  badge: 'bg-emerald-50 text-emerald-700' },
    { id: 'amber',  hex: '#fde68a', bg: 'bg-amber-50',      text: 'text-amber-500',  badge: 'bg-amber-50 text-amber-700' },
    { id: 'purple', hex: '#e9d5ff', bg: 'bg-purple-50',     text: 'text-purple-500', badge: 'bg-purple-50 text-purple-700' },
    { id: 'red',    hex: '#fecaca', bg: 'bg-red-50',        text: 'text-red-400',    badge: 'bg-red-50 text-red-700'     },
    { id: 'orange', hex: '#fed7aa', bg: 'bg-orange-50',     text: 'text-orange-500', badge: 'bg-orange-50 text-orange-700' },
    { id: 'teal',   hex: '#99f6e4', bg: 'bg-teal-50',       text: 'text-teal-500',   badge: 'bg-teal-50 text-teal-700'   },
    { id: 'gray',   hex: '#e5e7eb', bg: 'bg-gray-50',       text: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600'  },
];

function getCategoryStyle(colorId) {
    return CATEGORY_PALETTE.find(c => c.id === colorId) || CATEGORY_PALETTE[8];
}

document.addEventListener('DOMContentLoaded', async () => {

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
    const articlesWrapper = document.getElementById('articles-wrapper');

    try {
        // Cargar artículos y categorías en paralelo
        const [artRes, catRes] = await Promise.all([
            supabaseClient.from('articles').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('categories').select('*')
        ]);

        if (artRes.error) throw artRes.error;
        if (catRes.error) throw catRes.error;

        const articles   = artRes.data;
        const categories = catRes.data;

        // Mapa nombre → color_id para lookup rápido
        const catMap = {};
        categories.forEach(c => { catMap[c.name] = c.color_id; });

        articlesWrapper.innerHTML = '';

        if (articles.length === 0) {
            articlesWrapper.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center">Aún no hay artículos publicados.</p>';
            return;
        }

        articles.forEach(article => {
            const colorId = catMap[article.category];
            const style   = getCategoryStyle(colorId);

            // Fondo de la tarjeta: usamos inline style porque Tailwind no puede
            // generar clases dinámicas en runtime
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

            const cardHTML = `
                <div onclick="window.location.href='articulo.html?id=${article.id}'"
                    class="h-full w-full flex flex-col border border-gray-200 rounded-xl p-3 md:p-6 items-start text-left shadow-sm hover:shadow-md transition cursor-pointer" ${cardBg}>
                    ${mediaHTML}
                    <span class="text-[9px] md:text-[10px] font-bold ${style.text} uppercase tracking-widest mb-1 md:mb-2">${article.category}</span>
                    <h4 class="font-serif text-base md:text-2xl mb-2 md:mb-3 leading-tight">${article.title}</h4>
                    <p class="text-[11px] md:text-xs text-gray-500 mb-3 md:mb-4 line-clamp-2 hidden sm:block">${article.excerpt}</p>
                    ${article.author ? `
                    <div class="inline-flex items-start gap-1.5 border border-plm-dark rounded-full px-2.5 py-1 mb-3 md:mb-4 bg-white max-w-full">
                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="shrink-0 opacity-50 mt-0.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        <span class="text-[9px] md:text-[10px] font-bold text-plm-dark uppercase tracking-wide leading-tight">${article.author}</span>
                    </div>` : ''}
                    <button class="mt-auto border-b-2 border-plm-dark pb-0.5 md:pb-1 text-[9px] md:text-xs font-bold uppercase tracking-widest hover:text-plm-pink hover:border-plm-pink transition">Leer →</button>
                </div>
            `;

            articlesWrapper.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error('Error cargando artículos:', error);
        articlesWrapper.innerHTML = '<p class="text-sm text-red-500 col-span-full text-center">Hubo un error cargando el blog.</p>';
    }
});
