/* ============================================
   photos.js — Photo gallery + suggestions
   ============================================ */

const Photos = (() => {
  const BUCKET = 'treat-photos';
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  /* ── Gallery Screen (standalone) ── */

  function showGalleryScreen(returnScreen) {
    const screen = document.getElementById('screen-gallery');
    screen.innerHTML = `
      <div class="gallery-back">
        <button class="btn btn-outline btn-small" id="gallery-back-btn">← Back</button>
      </div>
      <div class="suggestion-section">
        <h2>Suggestion Box 💡</h2>
        <div class="card">
          <p style="margin-bottom: 12px; font-weight: 600;">What should Cassie bake next?</p>
          <div class="suggestion-form">
            <textarea id="suggestion-text" rows="3" placeholder="I'd love it if you made..."></textarea>
            <button class="btn btn-secondary btn-small" id="suggestion-submit-btn">Send Suggestion 📬</button>
          </div>
          <div class="photo-msg" id="suggestion-msg"></div>
        </div>
      </div>
      <div class="photos-section">
        <h2>Treat Gallery 📸</h2>
        <div class="card photo-upload-card">
          <p style="margin-bottom: 12px; font-weight: 600;">Share photos of your treats!</p>
          <div class="photo-upload-form">
            <input type="file" id="gallery-photo-file" accept="image/jpeg,image/png" multiple>
            <button class="btn btn-secondary btn-small" id="gallery-upload-btn">Upload 📷</button>
          </div>
          <div class="photo-msg" id="gallery-photo-msg"></div>
        </div>
        <div class="photo-grid" id="gallery-photo-grid"></div>
      </div>
    `;
    showScreen('gallery');

    document.getElementById('gallery-back-btn').addEventListener('click', () => {
      showScreen(returnScreen || 'order');
    });

    document.getElementById('gallery-upload-btn').addEventListener('click', () => {
      handleUpload('gallery-photo-file', 'gallery-photo-msg', 'gallery-photo-grid');
    });

    document.getElementById('suggestion-submit-btn').addEventListener('click', submitSuggestion);

    loadGalleryGrid('gallery-photo-grid');
  }

  /* ── Inline gallery (for celebrate screen) ── */

  function renderGallery(container) {
    container.innerHTML = `
      <div class="photos-section">
        <h2>Treat Gallery 📸</h2>
        <div class="card photo-upload-card">
          <p style="margin-bottom: 12px; font-weight: 600;">Share photos of your treats!</p>
          <div class="photo-upload-form">
            <input type="file" id="inline-photo-file" accept="image/jpeg,image/png" multiple>
            <button class="btn btn-secondary btn-small" id="inline-upload-btn">Upload 📷</button>
          </div>
          <div class="photo-msg" id="inline-photo-msg"></div>
        </div>
        <div class="photo-grid" id="inline-photo-grid"></div>
      </div>
    `;

    document.getElementById('inline-upload-btn').addEventListener('click', () => {
      handleUpload('inline-photo-file', 'inline-photo-msg', 'inline-photo-grid');
    });

    loadGalleryGrid('inline-photo-grid');
  }

  /* ── Upload handler (supports multiple files) ── */

  async function handleUpload(fileInputId, msgId, gridId) {
    const fileInput = document.getElementById(fileInputId);
    const msg = document.getElementById(msgId);
    const files = Array.from(fileInput.files);

    if (files.length === 0) {
      msg.textContent = 'Pick a photo first!';
      msg.className = 'photo-msg error';
      return;
    }

    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        msg.textContent = `"${file.name}" is not a JPEG or PNG.`;
        msg.className = 'photo-msg error';
        return;
      }
      if (file.size > MAX_SIZE) {
        msg.textContent = `"${file.name}" is too large — 5MB max.`;
        msg.className = 'photo-msg error';
        return;
      }
    }

    msg.textContent = `Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`;
    msg.className = 'photo-msg';

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      const filename = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await sb.storage.from(BUCKET).upload(filename, file);
      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        failed++;
        continue;
      }

      const { error: dbErr } = await sb.from('photos').insert({ filename, status: 'pending' });
      if (dbErr) {
        console.error('DB error:', dbErr);
        failed++;
        continue;
      }

      uploaded++;
    }

    if (failed > 0 && uploaded === 0) {
      msg.textContent = 'Upload failed — try again.';
      msg.className = 'photo-msg error';
    } else if (failed > 0) {
      msg.textContent = `${uploaded} uploaded, ${failed} failed. Cassie will review soon! 🎉`;
      msg.className = 'photo-msg success';
    } else {
      msg.textContent = `${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded! Cassie will review ${uploaded > 1 ? 'them' : 'it'} soon. 🎉`;
      msg.className = 'photo-msg success';
    }
    fileInput.value = '';
    loadGalleryGrid(gridId);
  }

  async function loadGalleryGrid(gridId) {
    const grid = document.getElementById(gridId);
    const { data: photos, error } = await sb
      .from('photos')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !photos || photos.length === 0) {
      grid.innerHTML = '<p style="text-align:center; opacity:0.5; grid-column:1/-1;">No photos yet — be the first!</p>';
      return;
    }

    grid.innerHTML = photos.map(p => {
      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(p.filename);
      return `<div class="photo-card"><img src="${urlData.publicUrl}" alt="Treat photo" loading="lazy"></div>`;
    }).join('');
  }

  /* ── Suggestion Box ── */

  async function submitSuggestion() {
    const textarea = document.getElementById('suggestion-text');
    const msg = document.getElementById('suggestion-msg');
    const text = textarea.value.trim();

    if (!text) {
      msg.textContent = 'Write a suggestion first!';
      msg.className = 'photo-msg error';
      return;
    }

    const userName = sessionStorage.getItem('displayName') || 'Anonymous';
    const { error } = await sb.from('suggestions').insert({ user_name: userName, suggestion: text });

    if (error) {
      console.error('Suggestion error:', error);
      msg.textContent = 'Something went wrong — try again.';
      msg.className = 'photo-msg error';
      return;
    }

    msg.textContent = 'Suggestion sent! Thanks for the idea! 🎉';
    msg.className = 'photo-msg success';
    textarea.value = '';
  }

  /* ── Baker: photo review ── */

  function renderBakerPhotos(container) {
    container.innerHTML = `
      <div class="baker-section">
        <h2>Photo Review 📸</h2>
        <div class="card">
          <h3 style="font-family: Nunito, sans-serif; margin-bottom: 12px;">Pending Approval</h3>
          <div class="baker-photo-grid" id="baker-pending-grid"></div>
        </div>
        <div class="card" style="margin-top: 16px;">
          <h3 style="font-family: Nunito, sans-serif; margin-bottom: 12px;">Approved Photos</h3>
          <div class="baker-photo-grid" id="baker-approved-grid"></div>
        </div>
      </div>
    `;
    loadBakerPhotos();
  }

  async function loadBakerPhotos() {
    const [pendingRes, approvedRes] = await Promise.all([
      sb.from('photos').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      sb.from('photos').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    ]);

    const pendingGrid = document.getElementById('baker-pending-grid');
    const approvedGrid = document.getElementById('baker-approved-grid');
    const pending = pendingRes.data || [];
    const approved = approvedRes.data || [];

    if (pending.length === 0) {
      pendingGrid.innerHTML = '<p style="opacity:0.5; padding: 8px;">No photos to review.</p>';
    } else {
      pendingGrid.innerHTML = pending.map(p => {
        const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(p.filename);
        return `
          <div class="baker-photo-card">
            <img src="${urlData.publicUrl}" alt="Pending photo" loading="lazy">
            <div class="baker-photo-actions">
              <button class="btn btn-primary btn-small" onclick="Photos.approve('${p.id}')">Approve</button>
              <button class="btn btn-outline btn-small" onclick="Photos.remove('${p.id}', '${p.filename}')">Delete</button>
            </div>
          </div>`;
      }).join('');
    }

    if (approved.length === 0) {
      approvedGrid.innerHTML = '<p style="opacity:0.5; padding: 8px;">No approved photos yet.</p>';
    } else {
      approvedGrid.innerHTML = approved.map(p => {
        const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(p.filename);
        return `
          <div class="baker-photo-card">
            <img src="${urlData.publicUrl}" alt="Approved photo" loading="lazy">
            <div class="baker-photo-actions">
              <button class="btn btn-outline btn-small" onclick="Photos.remove('${p.id}', '${p.filename}')">Delete</button>
            </div>
          </div>`;
      }).join('');
    }
  }

  /* ── Baker: suggestions review ── */

  function renderBakerSuggestions(container) {
    container.innerHTML = `
      <div class="baker-section">
        <h2>Suggestion Box 💡</h2>
        <div class="card" id="baker-suggestions-list"></div>
      </div>
    `;
    loadBakerSuggestions();
  }

  async function loadBakerSuggestions() {
    const list = document.getElementById('baker-suggestions-list');
    const { data: suggestions, error } = await sb
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !suggestions || suggestions.length === 0) {
      list.innerHTML = '<p style="padding: 12px; opacity: 0.6;">No suggestions yet.</p>';
      return;
    }

    list.innerHTML = `<table class="order-table">
      <thead><tr><th>From</th><th>Suggestion</th><th>Date</th><th></th></tr></thead>
      <tbody>${suggestions.map(s => `
        <tr>
          <td>${s.user_name}</td>
          <td>${s.suggestion}</td>
          <td>${new Date(s.created_at).toLocaleDateString()}</td>
          <td><button class="btn btn-outline btn-small" onclick="Photos.removeSuggestion('${s.id}')">Dismiss</button></td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  }

  async function removeSuggestion(id) {
    await sb.from('suggestions').delete().eq('id', id);
    loadBakerSuggestions();
  }

  async function approve(id) {
    await sb.from('photos').update({ status: 'approved' }).eq('id', id);
    loadBakerPhotos();
  }

  async function remove(id, filename) {
    if (!confirm('Delete this photo?')) return;
    await sb.storage.from(BUCKET).remove([filename]);
    await sb.from('photos').delete().eq('id', id);
    loadBakerPhotos();
  }

  return { renderGallery, renderBakerPhotos, renderBakerSuggestions, showGalleryScreen, approve, remove, removeSuggestion };
})();
