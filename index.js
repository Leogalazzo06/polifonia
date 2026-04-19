// --- CONFIGURACIÓN ---
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz'; // Pon la misma key que en admin.js

// Cambiamos el nombre a supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- LÓGICA DEL MENÚ HAMBURGUESA ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (mobileMenuBtn && mobileMenu) {
        // Abrir/cerrar menú al tocar el botón
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });

        // Cerrar menú automáticamente al hacer click en cualquier enlace
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            });
        });
    }

    // --- LÓGICA DE LOS ARTÍCULOS ---
    const articlesWrapper = document.getElementById('articles-wrapper');

    try {
        // Usamos supabaseClient y quitamos el filtro is_published por si acaso
        const { data: articles, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Limpiamos el texto de "Cargando..."
        articlesWrapper.innerHTML = '';

        if (articles.length === 0) {
            articlesWrapper.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center">Aún no hay artículos publicados.</p>';
            return;
        }

        // Renderizamos cada tarjeta respetando TU diseño exacto
        articles.forEach(article => {
            // Asignamos colores según las NUEVAS categorías
            let bgColor = "bg-white";
            let tagColor = "text-plm-green"; // Por defecto (usado para Cine)
            
            if (article.category === "Música") {
                bgColor = "bg-plm-pink/20";
                tagColor = "text-pink-400";
            } else if (article.category === "Maquillaje") {
                bgColor = "bg-plm-blue/20";
                tagColor = "text-blue-400";
            } else if (article.category === "Emprendedurismo") {
                bgColor = "bg-amber-50";
                tagColor = "text-amber-500";
            }

            // Lógica exclusiva de imágenes
            let mediaHTML = '';
            if (article.cover_image_url && typeof article.cover_image_url === 'string' && article.cover_image_url.trim() !== '' && article.cover_image_url !== 'null') {
                mediaHTML = `
                    <div class="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        <img src="${article.cover_image_url}" alt="Blog Post" class="w-full h-full object-cover hover:scale-105 transition duration-500">
                    </div>`;
            } else {
                mediaHTML = `
                    <div class="w-full h-48 bg-gray-50 rounded-lg mb-4 overflow-hidden flex items-center justify-center border border-gray-100">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin Portada</span>
                    </div>`;
            }

            const cardHTML = `
                <div onclick="window.location.href='articulo.html?id=${article.id}'" class="h-full w-full flex flex-col ${bgColor} border border-gray-200 rounded-xl p-6 items-start text-left shadow-sm hover:shadow-md transition cursor-pointer">
                    ${mediaHTML}
                    <span class="text-[10px] font-bold ${tagColor} uppercase tracking-widest mb-2">${article.category}</span>
                    <h4 class="font-serif text-2xl mb-3 leading-tight">${article.title}</h4>
                    <p class="text-xs text-gray-500 mb-4 line-clamp-3">${article.excerpt}</p>
                    ${article.author ? `<p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">✍︎ ${article.author}</p>` : ''}
                    <button class="mt-auto border-b-2 border-plm-dark pb-1 text-xs font-bold uppercase tracking-widest hover:text-plm-pink hover:border-plm-pink transition">Leer Artículo →</button>
                </div>
            `;
            
            articlesWrapper.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Error cargando artículos:", error);
        articlesWrapper.innerHTML = '<p class="text-sm text-red-500 col-span-full text-center">Hubo un error cargando el blog.</p>';
    }
});