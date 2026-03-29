/* ============================================
   photos.js — Photo upload + gallery + baker review
   ============================================ */

const Photos = (() => {
  const BUCKET = 'treat-photos';
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  /* ── Guest: upload form + approved gallery ── */

  function renderGallery(container) {
    container.innerHTML = `
      <div class="photos-section">
        <h2>Treat Gallery 📸</h2>
        <div class="card photo-upload-card">
          <p style="margin-bottom: 12px; font-weight: 600;">Share a photo of your treat!</p>
          <div class="photo-upload-form">
            <input type="file" id="photo-file" accept="image/jpeg,image/png">
            <button class="btn btn-secondary btn-small" id="photo-upload-btn">Upload 📷</button>
          </div>
          <div class="photo-msg" id="photo-msg"></div>
        </div>
        <div class="photo-grid" id="photo-grid"></div>
      </div>
    `;

    document.getElementById('photo-upload-btn').addEventListener('click', handleUpload);
    loadGallery();
  }

  async function handleUpload() {
    const fileInput = document.getElementById('photo-file');
    const msg = document.getElementById('photo-msg');
    const file = fileInput.files[0];

    if (!file) {
      msg.textContent = 'Pick a photo first!';
      msg.className = 'photo-msg error';
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      msg.textContent = 'Only JPEG and PNG files allowed.';
      msg.className = 'photo-msg error';
      return;
    }

    if (file.size > MAX_SIZE) {
      msg.textContent = 'File too large — 5MB max.';
      msg.className = 'photo-msg error';
      return;
    }

    msg.textContent = 'Uploading...';
    msg.className = 'photo-msg';

    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await sb.storage.from(BUCKET).upload(filename, file);
    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      msg.textContent = 'Upload failed — try again.';
      msg.className = 'photo-msg error';
      return;
    }

    const { error: dbErr } = await sb.from('photos').insert({ filename, status: 'pending' });
    if (dbErr) {
      console.error('DB error:', dbErr);
      msg.textContent = 'Upload failed — try again.';
      msg.className = 'photo-msg error';
      return;
    }

    msg.textContent = 'Photo uploaded! Cassie will review it soon. 🎉';
    msg.className = 'photo-msg success';
    fileInput.value = '';
  }

  async function loadGallery() {
    const grid = document.getElementById('photo-grid');
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

  /* ── Baker: review pending + manage approved ── */

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

  return { renderGallery, renderBakerPhotos, approve, remove };
})();
