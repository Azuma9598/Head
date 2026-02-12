// script.js — Vanilla JS, upload with progress simulation

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');

// ---------- DRAG & DROP ----------
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#b721ff';
  dropZone.style.background = 'rgba(183,33,255,0.08)';
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'rgba(0,240,255,0.5)';
  dropZone.style.background = 'rgba(255,255,255,0.03)';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'rgba(0,240,255,0.5)';
  dropZone.style.background = 'rgba(255,255,255,0.03)';
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

selectFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

// ---------- FILE UPLOAD & PROCESSING ----------
async function handleFile(file) {
  // Validate extension
  const validExts = ['.zip', '.mcaddon', '.mcpack'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExts.includes(ext)) {
    alert('Only .zip, .mcaddon, .mcpack files are allowed.');
    return;
  }

  // Show progress bar with shimmer effect
  progressContainer.hidden = false;
  progressFill.style.width = '0%';
  progressStatus.innerText = 'Uploading...';

  const formData = new FormData();
  formData.append('file', file);

  // Use XMLHttpRequest for upload progress
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressFill.style.width = `${percent}%`;
      progressStatus.innerText = `Uploading ${Math.round(percent)}%`;
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      // Success – trigger download
      progressStatus.innerText = 'Processing complete! Downloading...';
      
      // Create blob from response and trigger download
      const blob = new Blob([xhr.response], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIXED_${file.name}`; // backend also sets filename, but this ensures client-side name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Reset UI after short delay
      setTimeout(resetUI, 2000);
    } else {
      // Error
      let errorMsg = 'Unknown error';
      try {
        const errJson = JSON.parse(xhr.responseText);
        errorMsg = errJson.error || 'Processing failed';
      } catch (e) {
        errorMsg = xhr.statusText || 'Upload failed';
      }
      progressStatus.innerText = `Error: ${errorMsg}`;
      progressFill.style.backgroundColor = '#ff4444';
      progressFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4444)';
      setTimeout(resetUI, 3000);
    }
  });

  xhr.addEventListener('error', () => {
    progressStatus.innerText = 'Network error. Please try again.';
    setTimeout(resetUI, 3000);
  });

  xhr.open('POST', '/upload');
  xhr.responseType = 'blob';
  xhr.send(formData);

  // Simulate "Processing..." after upload completes
  // The actual processing time is unknown, but we can set a timer after upload reaches 100%
  // We'll override the upload progress when it's done
  const originalProgress = xhr.upload.addEventListener;
  // This is a bit hacky but works: after upload done, set status to processing
  xhr.upload.addEventListener('load', () => {
    progressStatus.innerText = 'Repairing addon (JSON fix, head removal, manifest repair)...';
    progressFill.style.width = '100%'; // hold at full during processing
    // progress will stay full until response arrives
  });
}

function resetUI() {
  progressContainer.hidden = true;
  progressFill.style.width = '0%';
  progressFill.style.background = 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))';
  fileInput.value = ''; // clear file input
}