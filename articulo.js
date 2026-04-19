// articulo.js
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
// IMPORTANTE: Reemplaza esto con tu anon public key de Supabase (Settings -> API)
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz'; 

// Cambiamos el nombre a supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // Obtenemos el ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // Elementos del DOM para el Loader y el Contenido
    const loaderContainer = document.getElementById('loader-container');
    const articleWrapper = document.getElementById('article-wrapper');

    // Función para ocultar el loader y mostrar el artículo con transición suave
    const showContent = () => {
        loaderContainer.classList.add('hidden');
        articleWrapper.classList.remove('hidden');
        // Pequeño retraso para que la animación de opacidad se aplique correctamente
        setTimeout(() => {
            articleWrapper.classList.remove('opacity-0');
        }, 50);
    };

    if (!articleId) {
        document.getElementById('article-title').textContent = "Artículo no encontrado";
        document.getElementById('article-content').innerHTML = "<p>No se especificó ningún artículo en la URL.</p>";
        document.getElementById('article-image').parentElement.classList.add('hidden');
        showContent();
        return;
    }

    try {
        // Usamos supabaseClient
        const { data: article, error } = await supabaseClient
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error) throw error;

        // Llenamos el diseño con los datos reales
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-category').textContent = article.category;
        document.getElementById('article-content').innerHTML = article.content;

        // Mostrar autor si existe
        const authorEl = document.getElementById('article-author');
        const authorNameEl = document.getElementById('article-author-name');
        if (article.author && article.author.trim() !== '') {
            authorNameEl.textContent = '✍︎ ' + article.author;
            authorEl.style.display = 'block';
        }
        
        // --- LÓGICA ESTRICTA DE IMÁGENES ---
        const imgContainer = document.getElementById('article-image').parentElement;
        const hasImage = article.cover_image_url && typeof article.cover_image_url === 'string' && article.cover_image_url.trim() !== '' && article.cover_image_url !== 'null';

        if (hasImage) {
            document.getElementById('article-image').src = article.cover_image_url;
            imgContainer.classList.remove('hidden'); // Asegurarnos de que se muestre
        } else {
            // Ocultamos el contenedor completo si no hay imagen ni portada
            imgContainer.classList.add('hidden');
        }

        // Mantenemos la lógica de colores para las NUEVAS etiquetas
        const catElement = document.getElementById('article-category');
        if (article.category === 'Música') {
            catElement.className = "text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2 block";
        } else if (article.category === 'Maquillaje') {
            catElement.className = "text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block";
        } else if (article.category === 'Emprendedurismo') {
            catElement.className = "text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 block";
        } else {
            // Por defecto para Cine
            catElement.className = "text-[10px] font-bold text-plm-green uppercase tracking-widest mb-2 block";
        }

        // Una vez cargado todo, mostramos el contenido
        showContent();

    } catch (error) {
        console.error("Error cargando el artículo:", error);
        document.getElementById('article-title').textContent = "Artículo no encontrado";
        document.getElementById('article-content').innerHTML = "<p>Lo sentimos, no pudimos encontrar esta publicación o fue eliminada.</p>";
        document.getElementById('article-image').parentElement.classList.add('hidden');
        showContent();
    }
});