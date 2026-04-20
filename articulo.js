// articulo.js
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variable global para manejar la respuesta a comentarios
let currentReplyToId = null;

const CATEGORY_PALETTE = [
    { id: 'pink',   hex: '#fcd5e3', text: 'text-pink-400'   },
    { id: 'blue',   hex: '#bde3df', text: 'text-blue-400'   },
    { id: 'green',  hex: '#a8c292', text: 'text-plm-green'  },
    { id: 'amber',  hex: '#fde68a', text: 'text-amber-500'  },
    { id: 'purple', hex: '#e9d5ff', text: 'text-purple-500' },
    { id: 'red',    hex: '#fecaca', text: 'text-red-400'    },
    { id: 'orange', hex: '#fed7aa', text: 'text-orange-500' },
    { id: 'teal',   hex: '#99f6e4', text: 'text-teal-500'   },
    { id: 'gray',   hex: '#e5e7eb', text: 'text-gray-500'   },
];

function getCategoryStyle(colorId) {
    return CATEGORY_PALETTE.find(c => c.id === colorId) || CATEGORY_PALETTE[8];
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lbImg    = document.getElementById('lightbox-img');
    const lbClose  = document.getElementById('lightbox-close');
    function openLightbox(src, alt) {
        lbImg.src = src; lbImg.alt = alt || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { lbImg.src = ''; }, 300);
    }
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    const coverImg = document.getElementById('article-image');
    coverImg.addEventListener('click', () => {
        if (coverImg.src && coverImg.src !== window.location.href) openLightbox(coverImg.src, coverImg.alt);
    });
    document.getElementById('article-content').addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') openLightbox(e.target.src, e.target.alt);
    });
}

// Función global para establecer a quién se responde
window.setReplyTo = function(parentId, authorName) {
    currentReplyToId = parentId;
    document.getElementById('reply-to-name').textContent = authorName;
    document.getElementById('reply-indicator').classList.remove('hidden');
    document.getElementById('comment-content').focus();
};

function buildCommentHTML(c, isReply = false) {
    const initials = c.author_name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
    const date = new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    const safeContent = c.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Forzamos un solo nivel de anidación. Si responden a una respuesta, se agrupa bajo el comentario principal.
    const targetParentId = isReply ? c.parent_id : c.id;
    const escapedName = c.author_name.replace(/'/g, "\\'");

    return `<div class="comment-card ${isReply ? 'bg-gray-50 border-none shadow-sm' : ''}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div class="comment-avatar" style="${isReply ? 'width:24px;height:24px;font-size:9px;' : ''}">${initials}</div>
            <span style="font-size:11px;font-weight:700;color:#222;">${c.author_name}</span>
            <span style="font-size:10px;color:#9ca3af;margin-left:auto;">${date}</span>
        </div>
        <p style="font-size:13px;color:#4b5563;line-height:1.65;margin:0;margin-bottom:8px;">${safeContent}</p>
        <button onclick="window.setReplyTo('${targetParentId}', '${escapedName}')" class="text-[10px] font-bold text-gray-400 hover:text-plm-dark uppercase tracking-widest transition">Responder</button>
    </div>`;
}

async function loadComments(articleId) {
    const section = document.getElementById('comments-section');
    const list    = document.getElementById('comments-list');
    const countEl = document.getElementById('comments-count');
    
    // Obtenemos los comentarios más recientes primero
    const { data: comments, error } = await supabaseClient
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
        
    if (error) { console.error('Error cargando comentarios:', error); return; }
    
    section.classList.remove('hidden');
    const n = comments.length;
    countEl.textContent = n === 0 ? 'Sin comentarios aún' : `${n} comentario${n > 1 ? 's' : ''}`;
    
    if (n === 0) { list.innerHTML = '<p class="text-xs text-gray-400">Sé el primero en comentar.</p>'; return; }
    
    // Separamos comentarios principales y respuestas
    const mainComments = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    
    // Las respuestas las ordenamos de más vieja a más nueva para mantener el hilo lógico de conversación
    replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    list.innerHTML = mainComments.map(main => {
        let html = buildCommentHTML(main, false);
        const childReplies = replies.filter(r => r.parent_id === main.id);
        
        if (childReplies.length > 0) {
            html += `<div class="ml-6 md:ml-10 border-l-2 border-gray-100 pl-4 mt-3 space-y-3">`;
            html += childReplies.map(r => buildCommentHTML(r, true)).join('');
            html += `</div>`;
        }
        
        return `<div class="mb-4">${html}</div>`;
    }).join('');
}

function setupCommentForm(articleId) {
    const btn = document.getElementById('comment-submit');
    const feedback = document.getElementById('comment-feedback');
    const cancelReplyBtn = document.getElementById('cancel-reply');
    
    cancelReplyBtn.addEventListener('click', () => {
        currentReplyToId = null;
        document.getElementById('reply-indicator').classList.add('hidden');
    });

    function showFeedback(msg, isError) {
        feedback.textContent = msg;
        feedback.className = `text-[10px] ${isError ? 'text-red-400' : 'text-green-500'}`;
        feedback.classList.remove('hidden');
    }
    
    btn.addEventListener('click', async () => {
        const author  = document.getElementById('comment-author').value.trim();
        const content = document.getElementById('comment-content').value.trim();
        
        if (!author || !content) { showFeedback('Completá tu nombre y comentario.', true); return; }
        
        btn.disabled = true; btn.textContent = 'Publicando...'; feedback.classList.add('hidden');
        
        const payload = { 
            article_id: articleId, 
            author_name: author, 
            content: content,
            parent_id: currentReplyToId 
        };

        const { error } = await supabaseClient.from('comments').insert([payload]);
        
        if (error) { 
            showFeedback('Hubo un error. Intentá de nuevo.', true); 
        } else {
            document.getElementById('comment-author').value = '';
            document.getElementById('comment-content').value = '';
            
            // Limpiamos el estado de respuesta
            currentReplyToId = null;
            document.getElementById('reply-indicator').classList.add('hidden');
            
            showFeedback('¡Comentario publicado!', false);
            // La carga de comentarios ahora se dispara por WebSockets, 
            // pero lo llamamos por si falla la conexión en tiempo real
            await loadComments(articleId); 
        }
        btn.disabled = false; btn.textContent = 'Publicar comentario';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const loaderContainer = document.getElementById('loader-container');
    const articleWrapper  = document.getElementById('article-wrapper');

    initLightbox();

    // 🚀 LÓGICA DE TIEMPO REAL (WebSockets)
    if (articleId) {
        supabaseClient.channel('realtime-comments')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` },
                (payload) => {
                    // Si entra un comentario nuevo por base de datos, refrescamos la lista
                    loadComments(articleId);
                }
            )
            .subscribe();
    }

    const showContent = () => {
        loaderContainer.classList.add('hidden');
        articleWrapper.classList.remove('hidden');
        setTimeout(() => { articleWrapper.classList.remove('opacity-0'); }, 50);
    };

    if (!articleId) {
        document.getElementById('article-title').textContent = 'Artículo no encontrado';
        document.getElementById('article-content').innerHTML = '<p>No se especificó ningún artículo en la URL.</p>';
        document.getElementById('article-image').parentElement.classList.add('hidden');
        showContent(); return;
    }

    try {
        const [artRes, catRes] = await Promise.all([
            supabaseClient.from('articles').select('*').eq('id', articleId).single(),
            supabaseClient.from('categories').select('*')
        ]);
        if (artRes.error) throw artRes.error;

        const article    = artRes.data;
        const categories = catRes.data || [];
        const catData    = categories.find(c => c.name === article.category);
        const style      = getCategoryStyle(catData?.color_id);

        document.getElementById('article-title').textContent    = article.title;
        document.getElementById('article-category').textContent = article.category;
        
        // Asignar el contenido al contenedor
        const contentContainer = document.getElementById('article-content');
        contentContainer.innerHTML = article.content;

        // --- LÓGICA PARA CONVERTIR ENLACES EN VIDEOS (Vimeo/YouTube) ---
        const links = contentContainer.querySelectorAll('a');
        links.forEach(link => {
            const url = link.href;
            let embedUrl = '';
            
            // Detectar Vimeo
            if (url.includes('vimeo.com')) {
                const match = url.match(/vimeo\.com\/(\d+)/);
                if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
            } 
            // Detectar YouTube
            else if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                const videoId = urlObj.searchParams.get('v');
                if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } 
            // Detectar YouTube (formato corto)
            else if (url.includes('youtu.be/')) {
                const match = url.match(/youtu\.be\/([^?]+)/);
                if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
            }

            // Si es un video válido, reemplazamos el enlace por el reproductor
            if (embedUrl) {
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media');
                iframe.setAttribute('allowfullscreen', 'true');
                
                link.parentNode.replaceChild(iframe, link);
            }
        });
        // ---------------------------------------------------------------

        const catEl = document.getElementById('article-category');
        catEl.className = `text-[10px] font-bold ${style.text} uppercase tracking-widest mb-2 block`;

        const authorEl     = document.getElementById('article-author');
        const authorNameEl = document.getElementById('article-author-name');
        if (article.author && article.author.trim() !== '') {
            authorNameEl.textContent = article.author;
            authorEl.style.display   = 'inline-flex';
            authorEl.classList.remove('hidden');
        }

        const imgContainer = document.getElementById('article-image').parentElement;
        const hasImage = article.cover_image_url && typeof article.cover_image_url === 'string' &&
                         article.cover_image_url.trim() !== '' && article.cover_image_url !== 'null';
        if (hasImage) { document.getElementById('article-image').src = article.cover_image_url; imgContainer.classList.remove('hidden'); }
        else { imgContainer.classList.add('hidden'); }

        showContent();
        await loadComments(articleId);
        setupCommentForm(articleId);

    } catch (error) {
        console.error('Error cargando el artículo:', error);
        document.getElementById('article-title').textContent    = 'Artículo no encontrado';
        document.getElementById('article-content').innerHTML    = '<p>Lo sentimos, no pudimos encontrar esta publicación o fue eliminada.</p>';
        document.getElementById('article-image').parentElement.classList.add('hidden');
        showContent();
    }
});
