// articulo.js
const supabaseUrl = 'https://gwtjajhssvaxnlbycdtx.supabase.co';
const supabaseKey = 'sb_publishable_qb7kHS1lsN7X_aF4TBfqCA_3Yq2dEoz';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentReplyToId = null;
const COMMENTS_PAGE_SIZE = 3;

const CATEGORY_PALETTE = [
    { id: 'pink',    hex: '#fce7f3', text: 'text-pink-500'    },
    { id: 'rose',    hex: '#ffe4e6', text: 'text-rose-500'    },
    { id: 'fuchsia', hex: '#fae8ff', text: 'text-fuchsia-500' },
    { id: 'purple',  hex: '#f3e8ff', text: 'text-purple-500'  },
    { id: 'violet',  hex: '#ede9fe', text: 'text-violet-500'  },
    { id: 'indigo',  hex: '#e0e7ff', text: 'text-indigo-500'  },
    { id: 'blue',    hex: '#dbeafe', text: 'text-blue-500'    },
    { id: 'sky',     hex: '#e0f2fe', text: 'text-sky-500'     },
    { id: 'cyan',    hex: '#cffafe', text: 'text-cyan-600'    },
    { id: 'teal',    hex: '#ccfbf1', text: 'text-teal-600'    },
    { id: 'emerald', hex: '#d1fae5', text: 'text-emerald-600' },
    { id: 'green',   hex: '#dcfce7', text: 'text-green-600'   },
    { id: 'lime',    hex: '#f7fee7', text: 'text-lime-600'    },
    { id: 'yellow',  hex: '#fefce8', text: 'text-yellow-600'  },
    { id: 'amber',   hex: '#fffbeb', text: 'text-amber-600'   },
    { id: 'orange',  hex: '#fff7ed', text: 'text-orange-600'  },
    { id: 'red',     hex: '#fef2f2', text: 'text-red-500'     },
    { id: 'stone',   hex: '#f5f5f4', text: 'text-stone-500'   },
    { id: 'zinc',    hex: '#f4f4f5', text: 'text-zinc-500'    },
    { id: 'gray',    hex: '#f9fafb', text: 'text-gray-500'    },
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

window.setReplyTo = function(parentId, authorName) {
    currentReplyToId = parentId;
    document.getElementById('reply-to-name').textContent = authorName;
    document.getElementById('reply-indicator').classList.remove('hidden');
    document.getElementById('comment-content').focus();
};

function buildCommentHTML(c, isReply = false) {
    const initials = c.author_name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
    const date = new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const safeContent = c.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const targetParentId = isReply ? c.parent_id : c.id;
    const escapedName = c.author_name.replace(/'/g, "\\'");

    return `<div class="comment-card ${isReply ? 'bg-gray-50 border-none shadow-sm' : ''}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
            <div class="comment-avatar" style="${isReply ? 'width:24px;height:24px;font-size:9px;' : ''}">${initials}</div>
            <span style="font-size:11px;font-weight:700;color:#222;">${c.author_name}</span>
            <span style="font-size:10px;color:#9ca3af;margin-left:auto;">${date}</span>
        </div>
        <p style="font-size:13px;color:#4b5563;line-height:1.65;margin:0;margin-bottom:8px;word-break:break-word;">${safeContent}</p>
        <button onclick="window.setReplyTo('${targetParentId}', '${escapedName}')" class="text-[10px] font-bold text-gray-400 hover:text-plm-dark uppercase tracking-widest transition">Responder</button>
    </div>`;
}

async function loadComments(articleId) {
    const section     = document.getElementById('comments-section');
    const list        = document.getElementById('comments-list');
    const countEl     = document.getElementById('comments-count');
    const loadMoreBtn = document.getElementById('load-more-comments');

    const { data: comments, error } = await supabaseClient
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

    if (error) { console.error('Error cargando comentarios:', error); return; }

    section.classList.remove('hidden');
    const n = comments.length;
    countEl.textContent = n === 0 ? 'Sin comentarios aún' : `${n} comentario${n > 1 ? 's' : ''}`;

    if (n === 0) {
        list.innerHTML = '<p class="text-xs text-gray-400">Sé el primero en comentar.</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    const mainComments = comments.filter(c => !c.parent_id);
    const replies      = comments.filter(c => c.parent_id);
    replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let visibleCount = COMMENTS_PAGE_SIZE;

    function renderComments() {
        const toShow    = mainComments.slice(0, visibleCount);
        const remaining = mainComments.length - visibleCount;

        list.innerHTML = toShow.map(main => {
            let html = buildCommentHTML(main, false);
            const childReplies = replies.filter(r => r.parent_id === main.id);
            if (childReplies.length > 0) {
                html += `<div class="ml-4 md:ml-10 border-l-2 border-gray-100 pl-3 md:pl-4 mt-3 space-y-3">`;
                html += childReplies.map(r => buildCommentHTML(r, true)).join('');
                html += `</div>`;
            }
            return `<div class="mb-4">${html}</div>`;
        }).join('');

        if (remaining > 0) {
            loadMoreBtn.textContent = `Ver ${remaining} comentario${remaining > 1 ? 's' : ''} más`;
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    renderComments();

    // Reemplazamos el botón para limpiar listeners previos
    const freshBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(freshBtn, loadMoreBtn);
    freshBtn.addEventListener('click', () => {
        visibleCount += COMMENTS_PAGE_SIZE;
        renderComments();
    });
}

function setupCommentForm(articleId) {
    const btn           = document.getElementById('comment-submit');
    const feedback      = document.getElementById('comment-feedback');
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
            document.getElementById('comment-author').value  = '';
            document.getElementById('comment-content').value = '';
            currentReplyToId = null;
            document.getElementById('reply-indicator').classList.add('hidden');
            showFeedback('¡Comentario publicado!', false);
            await loadComments(articleId);
        }
        btn.disabled = false; btn.textContent = 'Publicar comentario';
    });
}

// -----------------------------------------------------------------------
// Copiar / compartir enlace — funciona en mobile (iOS Safari, Android Chrome)
// -----------------------------------------------------------------------
function setupShareButton() {
    const shareBtn  = document.getElementById('share-button');
    const shareText = document.getElementById('share-text');
    if (!shareBtn) return;

    function onShared() {
        shareText.textContent = '¡Copiado!';
        shareBtn.classList.add('bg-plm-dark', 'text-white');
        shareBtn.classList.remove('bg-white', 'text-plm-dark');
        setTimeout(() => {
            shareText.textContent = 'Copiar Enlace';
            shareBtn.classList.remove('bg-plm-dark', 'text-white');
            shareBtn.classList.add('bg-white', 'text-plm-dark');
        }, 2500);
    }

    shareBtn.addEventListener('click', async () => {
        const url = window.location.href;

        // 1. Intentamos la Web Share API (nativa en iOS/Android, muestra hoja de compartir)
        if (navigator.share) {
            try {
                await navigator.share({ url });
                return; // éxito — no mostramos "¡Copiado!" porque el usuario eligió dónde compartir
            } catch (e) {
                // El usuario canceló el diálogo nativo → no hacemos nada más
                if (e.name === 'AbortError') return;
                // Otro error → caemos al clipboard
            }
        }

        // 2. Clipboard API (desktop moderno, Android Chrome)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(url);
                onShared(); return;
            } catch (e) { /* caemos al fallback */ }
        }

        // 3. Fallback universal con execCommand (iOS Safari antiguo, WebViews)
        try {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            onShared();
        } catch (e) {
            console.error('No se pudo copiar el enlace:', e);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams       = new URLSearchParams(window.location.search);
    const articleId       = urlParams.get('id');
    const loaderContainer = document.getElementById('loader-container');
    const articleWrapper  = document.getElementById('article-wrapper');

    initLightbox();

    // Tiempo real (WebSockets)
    if (articleId) {
        supabaseClient.channel('realtime-comments')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` },
                () => { loadComments(articleId); }
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

        document.getElementById('article-title').textContent = article.title;

        const contentContainer = document.getElementById('article-content');
        contentContainer.innerHTML = article.content;

        // Convertir enlaces de YouTube/Vimeo en iframes
        contentContainer.querySelectorAll('a').forEach(link => {
            const url = link.href;
            let embedUrl = '';
            if (url.includes('vimeo.com')) {
                const m = url.match(/vimeo\.com\/(\d+)/);
                if (m) embedUrl = `https://player.vimeo.com/video/${m[1]}`;
            } else if (url.includes('youtube.com/watch')) {
                const v = new URL(url).searchParams.get('v');
                if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
            } else if (url.includes('youtu.be/')) {
                const m = url.match(/youtu\.be\/([^?]+)/);
                if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`;
            }
            if (embedUrl) {
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media');
                iframe.setAttribute('allowfullscreen', 'true');
                link.parentNode.replaceChild(iframe, link);
            }
        });

        const catEl = document.getElementById('article-category');
        catEl.textContent = article.category;
        catEl.className = `text-[10px] font-bold ${style.text} uppercase tracking-widest mb-2 block`;

        const authorEl     = document.getElementById('article-author');
        const authorNameEl = document.getElementById('article-author-name');
        if (article.author && article.author.trim() !== '') {
            authorNameEl.textContent = article.author;
            authorEl.style.display   = 'inline-flex';
            authorEl.classList.remove('hidden');
        }

        const imgContainer = document.getElementById('article-image').parentElement;
        const hasImage = article.cover_image_url &&
                         typeof article.cover_image_url === 'string' &&
                         article.cover_image_url.trim() !== '' &&
                         article.cover_image_url !== 'null';
        if (hasImage) {
            document.getElementById('article-image').src = article.cover_image_url;
        } else {
            imgContainer.classList.add('hidden');
        }

        showContent();
        await loadComments(articleId);
        setupCommentForm(articleId);
        setupShareButton();

    } catch (error) {
        console.error('Error cargando el artículo:', error);
        document.getElementById('article-title').textContent = 'Artículo no encontrado';
        document.getElementById('article-content').innerHTML = '<p>Lo sentimos, no pudimos encontrar esta publicación o fue eliminada.</p>';
        document.getElementById('article-image').parentElement.classList.add('hidden');
        showContent();
    }
});
