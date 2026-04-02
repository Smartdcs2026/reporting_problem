const API_BASE = "https://reportingproblam.somchaibutphon.workers.dev";

const state = {
  options: {
    osm: [],
    otm: []
  },
  photos: [],
  signatureDataUrl: "",
  maxPhotos: 4,
  sessionUser: "",
  activeCameraIndex: -1,
  cameraStream: null
};

const el = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  buildTimeSelects();
  setDefaultDate();
  bindEvents();
  addPhotoBox();
  await loadOptions();
});

function bindElements() {
  el.loginShell = document.getElementById("loginShell");
  el.appPage = document.getElementById("appPage");

  el.loginForm = document.getElementById("loginForm");
  el.loginPass = document.getElementById("loginPass");
  el.loginBtn = document.getElementById("loginBtn");
  el.loginResultBox = document.getElementById("loginResultBox");

  el.currentUserName = document.getElementById("currentUserName");
  el.logoutBtn = document.getElementById("logoutBtn");

  el.form = document.getElementById("incidentForm");
  el.incidentDate = document.getElementById("incidentDate");
  el.startHour = document.getElementById("startHour");
  el.startMinute = document.getElementById("startMinute");
  el.endHour = document.getElementById("endHour");
  el.endMinute = document.getElementById("endMinute");
  el.location = document.getElementById("location");
  el.incidentText = document.getElementById("incidentText");
  el.initialAction = document.getElementById("initialAction");

  el.uploadGrid = document.getElementById("uploadGrid");
  el.addPhotoBtn = document.getElementById("addPhotoBtn");

  el.supervisorType = document.getElementById("supervisorType");
  el.supervisorName = document.getElementById("supervisorName");
  el.openSignBtn = document.getElementById("openSignBtn");
  el.clearSignBtn = document.getElementById("clearSignBtn");
  el.signatureStatus = document.getElementById("signatureStatus");

  el.signatureOverlay = document.getElementById("signatureOverlay");
  el.closeSignModalBtn = document.getElementById("closeSignModalBtn");
  el.clearCanvasBtn = document.getElementById("clearCanvasBtn");
  el.saveSignatureBtn = document.getElementById("saveSignatureBtn");
  el.signMeta = document.getElementById("signMeta");
  el.signatureCanvas = document.getElementById("signatureCanvas");

  el.cameraOverlay = document.getElementById("cameraOverlay");
  el.closeCameraModalBtn = document.getElementById("closeCameraModalBtn");
  el.cameraMeta = document.getElementById("cameraMeta");
  el.cameraVideo = document.getElementById("cameraVideo");
  el.cameraEmpty = document.getElementById("cameraEmpty");
  el.fallbackCameraBtn = document.getElementById("fallbackCameraBtn");
  el.takePhotoBtn = document.getElementById("takePhotoBtn");

  el.submitBtn = document.getElementById("submitBtn");
  el.resetBtn = document.getElementById("resetBtn");
  el.resultBox = document.getElementById("resultBox");
  el.loadingOverlay = document.getElementById("loadingOverlay");
}

function bindEvents() {
  el.loginForm.addEventListener("submit", onLogin);
  el.logoutBtn.addEventListener("click", logout);

  el.addPhotoBtn.addEventListener("click", () => addPhotoBox());

  el.supervisorType.addEventListener("change", onSupervisorTypeChange);
  el.supervisorName.addEventListener("change", onSupervisorNameChange);

  el.openSignBtn.addEventListener("click", openSignatureModal);
  el.clearSignBtn.addEventListener("click", clearSignature);

  el.closeSignModalBtn.addEventListener("click", closeSignatureModal);
  el.clearCanvasBtn.addEventListener("click", clearSignatureCanvas);
  el.saveSignatureBtn.addEventListener("click", saveSignatureFromCanvas);

  el.closeCameraModalBtn.addEventListener("click", closeCameraModal);
  el.fallbackCameraBtn.addEventListener("click", triggerFallbackCameraInput);
  el.takePhotoBtn.addEventListener("click", capturePhotoFromVideo);

  el.form.addEventListener("submit", onSubmit);
  el.resetBtn.addEventListener("click", () => resetForm(true));
}

function buildTimeSelects() {
  fillNumberSelect(el.startHour, 0, 23, "-- ชั่วโมง --");
  fillNumberSelect(el.endHour, 0, 23, "-- ชั่วโมง --");
  fillNumberSelect(el.startMinute, 0, 59, "-- นาที --");
  fillNumberSelect(el.endMinute, 0, 59, "-- นาที --");

  const now = new Date();
  el.startHour.value = pad2(now.getHours());
  el.startMinute.value = pad2(now.getMinutes());
  el.endHour.value = pad2(now.getHours());
  el.endMinute.value = pad2(now.getMinutes());
}

function fillNumberSelect(selectEl, min, max, firstLabel) {
  selectEl.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  selectEl.appendChild(first);

  for (let i = min; i <= max; i++) {
    const op = document.createElement("option");
    op.value = pad2(i);
    op.textContent = pad2(i);
    selectEl.appendChild(op);
  }
}

function setDefaultDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  el.incidentDate.value = `${y}-${m}-${day}`;
}

async function loadOptions() {
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/options`, { method: "GET" });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || "โหลดตัวเลือกไม่สำเร็จ");

    state.options.osm = Array.isArray(data.osm) ? data.osm : [];
    state.options.otm = Array.isArray(data.otm) ? data.otm : [];
  } catch (err) {
    showResult(`โหลดตัวเลือกไม่สำเร็จ: ${err.message}`, "error");
  } finally {
    showLoading(false);
  }
}

async function onLogin(e) {
  e.preventDefault();

  try {
    const pass = (el.loginPass.value || "").trim();
    if (!pass) throw new Error("กรุณากรอกรหัสผ่าน");

    showLoading(true);
    el.loginBtn.disabled = true;

    const res = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "auth",
        pass
      })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");

    state.sessionUser = data.name || "";
    el.currentUserName.textContent = state.sessionUser || "-";

    el.loginShell.classList.add("hidden");
    el.appPage.classList.remove("hidden");

    showLoginResult("", "");
    showResult("", "");
  } catch (err) {
    showLoginResult(err.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
  } finally {
    showLoading(false);
    el.loginBtn.disabled = false;
  }
}

function logout() {
  state.sessionUser = "";
  el.currentUserName.textContent = "-";
  el.loginPass.value = "";

  el.appPage.classList.add("hidden");
  el.loginShell.classList.remove("hidden");

  resetForm(false);
  showLoginResult("", "");
}

function onSupervisorTypeChange() {
  const type = el.supervisorType.value;
  const names = type === "OSM"
    ? state.options.osm
    : type === "OTM"
      ? state.options.otm
      : [];

  el.supervisorName.innerHTML = `<option value="">-- เลือกชื่อ --</option>`;
  names.forEach(name => {
    const op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    el.supervisorName.appendChild(op);
  });

  el.supervisorName.disabled = !type;
  clearSignature();
  updateSignMeta();
}

function onSupervisorNameChange() {
  clearSignature();
  const hasName = !!el.supervisorName.value;
  el.openSignBtn.disabled = !hasName;
  el.clearSignBtn.disabled = !state.signatureDataUrl;
  updateSignMeta();
}

function addPhotoBox() {
  if (state.photos.length >= state.maxPhotos) return;

  const index = state.photos.length;
  state.photos.push({
    file: null,
    dataUrl: "",
    name: "",
    mimeType: ""
  });

  const box = document.createElement("div");
  box.className = "upload-box";
  box.dataset.index = String(index);

  box.innerHTML = `
    <div class="box-top">
      <div class="box-title">รูปภาพ ${index + 1}</div>
      <button type="button" class="btn btn-danger-soft remove-photo-btn">ลบ</button>
    </div>

    <div class="preview-wrap">
      <div class="preview-empty">ยังไม่มีรูปภาพ</div>
    </div>

    <div class="upload-actions">
      <button type="button" class="btn btn-line pick-file-btn">เลือกไฟล์</button>
      <button type="button" class="btn btn-line pick-camera-btn">เปิดกล้อง</button>
      <button type="button" class="btn btn-line clear-photo-btn">ล้างรูป</button>
    </div>

    <input type="file" accept="image/*" class="file-input hidden" />
    <input type="file" accept="image/*" capture="environment" class="camera-input hidden" />
  `;

  el.uploadGrid.appendChild(box);

  const pickFileBtn = box.querySelector(".pick-file-btn");
  const pickCameraBtn = box.querySelector(".pick-camera-btn");
  const clearPhotoBtn = box.querySelector(".clear-photo-btn");
  const removePhotoBtn = box.querySelector(".remove-photo-btn");
  const fileInput = box.querySelector(".file-input");
  const cameraInput = box.querySelector(".camera-input");

  pickFileBtn.addEventListener("click", () => fileInput.click());
  pickCameraBtn.addEventListener("click", () => openCameraForIndex(index));
  clearPhotoBtn.addEventListener("click", () => clearPhoto(index));
  removePhotoBtn.addEventListener("click", () => removePhoto(index));

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await setPhotoFile(index, file);
    fileInput.value = "";
  });

  cameraInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await setPhotoFile(index, file);
    cameraInput.value = "";
  });

  refreshAddPhotoBtn();
}

async function openCameraForIndex(index) {
  state.activeCameraIndex = index;

  const isSecure = window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isSecure) {
    triggerFallbackCameraInput();
    return;
  }

  const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!hasMedia) {
    triggerFallbackCameraInput();
    return;
  }

  try {
    showCameraEmpty("กำลังเปิดกล้อง...");
    el.cameraOverlay.classList.remove("hidden");
    el.cameraOverlay.classList.add("show");

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1600 },
        height: { ideal: 1200 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.cameraStream = stream;

    el.cameraVideo.srcObject = stream;
    el.cameraVideo.classList.remove("hidden");
    el.cameraEmpty.classList.add("hidden");
  } catch (err) {
    closeCameraModal();
    triggerFallbackCameraInput();
  }
}

function showCameraEmpty(message) {
  el.cameraVideo.classList.add("hidden");
  el.cameraEmpty.classList.remove("hidden");
  el.cameraEmpty.textContent = message;
}

function triggerFallbackCameraInput() {
  const index = state.activeCameraIndex;
  if (index < 0) return;

  closeCameraModal();

  const box = el.uploadGrid.querySelector(`.upload-box[data-index="${index}"]`);
  if (!box) return;

  const cameraInput = box.querySelector(".camera-input");
  if (!cameraInput) return;

  cameraInput.click();
}

function capturePhotoFromVideo() {
  const index = state.activeCameraIndex;
  if (index < 0 || !el.cameraVideo.videoWidth || !el.cameraVideo.videoHeight) {
    showResult("ยังไม่สามารถจับภาพจากกล้องได้", "error");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = el.cameraVideo.videoWidth;
  canvas.height = el.cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(el.cameraVideo, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) {
      showResult("สร้างภาพจากกล้องไม่สำเร็จ", "error");
      return;
    }

    const file = new File([blob], buildPhotoName(index, `camera_${Date.now()}.jpg`), {
      type: "image/jpeg"
    });

    await setPhotoFile(index, file);
    closeCameraModal();
  }, "image/jpeg", 0.9);
}

function closeCameraModal() {
  stopCameraStream();
  el.cameraOverlay.classList.add("hidden");
  el.cameraOverlay.classList.remove("show");
  el.cameraVideo.srcObject = null;
  state.activeCameraIndex = -1;
}

function stopCameraStream() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => {
      try { track.stop(); } catch (_) {}
    });
    state.cameraStream = null;
  }
}

async function setPhotoFile(index, file) {
  try {
    if (!file.type.startsWith("image/")) {
      throw new Error("ไฟล์ที่เลือกไม่ใช่รูปภาพ");
    }

    const processed = await compressImageFile(file, 1600, 0.82);

    state.photos[index] = {
      file,
      dataUrl: processed.dataUrl,
      name: buildPhotoName(index, file.name),
      mimeType: "image/jpeg"
    };

    renderPhotoBox(index);
  } catch (err) {
    showResult(`จัดการรูปภาพไม่สำเร็จ: ${err.message}`, "error");
  }
}

function buildPhotoName(index, originalName) {
  const base = String(originalName || `photo_${index + 1}`).replace(/\.[^.]+$/, "");
  return `${base}.jpg`;
}

function renderPhotoBox(index) {
  const box = el.uploadGrid.querySelector(`.upload-box[data-index="${index}"]`);
  if (!box) return;

  const preview = box.querySelector(".preview-wrap");
  const item = state.photos[index];

  if (item && item.dataUrl) {
    preview.innerHTML = `<img src="${item.dataUrl}" alt="preview" />`;
  } else {
    preview.innerHTML = `<div class="preview-empty">ยังไม่มีรูปภาพ</div>`;
  }
}

function clearPhoto(index) {
  if (!state.photos[index]) return;
  state.photos[index] = {
    file: null,
    dataUrl: "",
    name: "",
    mimeType: ""
  };
  renderPhotoBox(index);
}

function removePhoto(index) {
  state.photos.splice(index, 1);
  rebuildPhotoGrid();
}

function rebuildPhotoGrid() {
  el.uploadGrid.innerHTML = "";
  const current = state.photos.slice();
  state.photos = [];

  current.forEach((item) => {
    addPhotoBox();
    const idx = state.photos.length - 1;
    state.photos[idx] = item || { file: null, dataUrl: "", name: "", mimeType: "" };
    renderPhotoBox(idx);
  });

  if (state.photos.length === 0) addPhotoBox();
  refreshAddPhotoBtn();
}

function refreshAddPhotoBtn() {
  el.addPhotoBtn.disabled = state.photos.length >= state.maxPhotos;
}

function updateSignMeta() {
  const type = el.supervisorType.value || "-";
  const name = el.supervisorName.value || "-";
  el.signMeta.textContent = `ประเภท: ${type} | ชื่อ: ${name}`;
}

function openSignatureModal() {
  if (!el.supervisorType.value || !el.supervisorName.value) {
    showResult("กรุณาเลือกประเภทหัวหน้างานและชื่อหัวหน้างานก่อนเซ็น", "error");
    return;
  }

  el.signatureOverlay.classList.remove("hidden");
  el.signatureOverlay.classList.add("show");

  setupSignatureCanvas();
  updateSignMeta();
}

function closeSignatureModal() {
  el.signatureOverlay.classList.add("hidden");
  el.signatureOverlay.classList.remove("show");
}

function clearSignature() {
  state.signatureDataUrl = "";
  el.signatureStatus.textContent = "ยังไม่มีลายเซ็น";
  el.signatureStatus.className = "badge muted";
  el.clearSignBtn.disabled = true;
}

function clearSignatureCanvas() {
  const ctx = el.signatureCanvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, el.signatureCanvas.width, el.signatureCanvas.height);
}

function saveSignatureFromCanvas() {
  if (isCanvasBlank(el.signatureCanvas)) {
    showResult("กรุณาวาดลายเซ็นก่อนบันทึก", "error");
    return;
  }

  state.signatureDataUrl = el.signatureCanvas.toDataURL("image/png");
  el.signatureStatus.textContent = `บันทึกลายเซ็นแล้ว: ${el.supervisorName.value}`;
  el.signatureStatus.className = "badge";
  el.clearSignBtn.disabled = false;
  closeSignatureModal();
}

function setupSignatureCanvas() {
  const canvas = el.signatureCanvas;
  const parentWidth = canvas.parentElement.clientWidth;
  const cssHeight = window.innerWidth <= 760 ? 220 : 260;

  canvas.width = Math.max(300, Math.floor(parentWidth));
  canvas.height = cssHeight;

  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2.6;

  attachSignatureEvents(canvas, ctx);
  clearSignatureCanvas();
}

function attachSignatureEvents(canvas, ctx) {
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  canvas.onpointerdown = (e) => {
    drawing = true;
    const p = getCanvasPoint(canvas, e);
    lastX = p.x;
    lastY = p.y;
  };

  canvas.onpointermove = (e) => {
    if (!drawing) return;
    const p = getCanvasPoint(canvas, e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  };

  const stop = () => { drawing = false; };
  canvas.onpointerup = stop;
  canvas.onpointerleave = stop;
  canvas.onpointercancel = stop;
}

function getCanvasPoint(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function isCanvasBlank(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return false;
  }
  return true;
}

async function compressImageFile(file, maxSide = 1600, quality = 0.82) {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  const maxCurrent = Math.max(width, height);

  if (maxCurrent > maxSide) {
    const ratio = maxSide / maxCurrent;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", quality)
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
    img.src = src;
  });
}

function formatThaiDateTimeNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(p => {
    if (p.type !== "literal") map[p.type] = p.value;
  });

  return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}:${map.second}`;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const w = ctx.measureText(testLine).width;
    if (w > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);

  lines.forEach((ln, idx) => {
    ctx.fillText(ln, x, y + (idx * lineHeight));
  });

  return lines.length;
}

async function createStampedPhotoDataUrl(photoDataUrl, signatureDataUrl, supervisorName, acknowledgedAt) {
  const photo = await loadImage(photoDataUrl);
  const sign = await loadImage(signatureDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = photo.width;
  canvas.height = photo.height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

  const pad = Math.max(18, Math.round(canvas.width * 0.022));
  const panelX = pad;
  const panelW = canvas.width - (pad * 2);
  const panelH = Math.max(105, Math.round(canvas.height * 0.145));
  const panelY = canvas.height - panelH - pad;

  // พื้นหลังจางลง
  ctx.save();
  roundedRect(ctx, panelX, panelY, panelW, panelH, Math.max(12, Math.round(panelH * 0.18)));
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.08)";
  ctx.lineWidth = Math.max(1, Math.round(canvas.width * 0.001));
  ctx.stroke();
  ctx.restore();

  const innerPadX = Math.max(12, Math.round(panelW * 0.02));
  const innerPadY = Math.max(10, Math.round(panelH * 0.16));

  const contentX = panelX + innerPadX;
  const contentY = panelY + innerPadY;
  const contentW = panelW - (innerPadX * 2);
  const contentH = panelH - (innerPadY * 2);

  // ซ้ายเป็นลายเซ็น ขวาเป็นข้อความ
  const signAreaW = Math.max(140, Math.round(contentW * 0.28));
  const gap = Math.max(10, Math.round(contentW * 0.02));
  const textX = contentX + signAreaW + gap;
  const textW = contentW - signAreaW - gap;

  // ลายเซ็น
  const signMaxW = signAreaW;
  const signMaxH = Math.max(36, Math.round(contentH * 0.72));
  const signScale = Math.min(signMaxW / sign.width, signMaxH / sign.height);
  const signW = Math.max(1, Math.round(sign.width * signScale));
  const signH = Math.max(1, Math.round(sign.height * signScale));
  const signX = contentX + Math.round((signAreaW - signW) / 2);
  const signY = contentY + Math.round((contentH - signH) / 2) - 6;

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.drawImage(sign, signX, signY, signW, signH);
  ctx.restore();

  // เส้นใต้ลายเซ็นบาง ๆ
  ctx.save();
  ctx.strokeStyle = "rgba(15,23,42,0.14)";
  ctx.lineWidth = Math.max(1, Math.round(canvas.width * 0.00095));
  const lineW = Math.min(signAreaW * 0.8, signW * 0.92);
  const lineX = contentX + Math.round((signAreaW - lineW) / 2);
  const lineY = contentY + contentH - 6;
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX + lineW, lineY);
  ctx.stroke();
  ctx.restore();

  // ข้อความ
  const titleFont = Math.max(15, Math.round(canvas.width * 0.0135));
  const nameFont = Math.max(17, Math.round(canvas.width * 0.016));
  const metaFont = Math.max(13, Math.round(canvas.width * 0.0122));

  let y = contentY + 2;
  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "top";

  ctx.font = `700 ${titleFont}px "Noto Sans Thai", sans-serif`;
  ctx.fillText("รับทราบแล้ว", textX, y);

  y += titleFont + 4;

  ctx.font = `700 ${nameFont}px "Noto Sans Thai", sans-serif`;
  const nameLines = wrapCanvasText(
    ctx,
    supervisorName || "-",
    textX,
    y,
    textW,
    Math.round(nameFont * 1.28)
  );

  y += (nameLines * Math.round(nameFont * 1.28)) + 4;

  ctx.font = `600 ${metaFont}px "Noto Sans Thai", sans-serif`;
  wrapCanvasText(
    ctx,
    `เมื่อ ${acknowledgedAt}`,
    textX,
    y,
    textW,
    Math.round(metaFont * 1.32)
  );

  return canvas.toDataURL("image/jpeg", 0.90);
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function buildSubmitSummaryHtml(saved) {
  const photoHtml = (saved.stampedPreviewUrls || []).map((src, idx) => `
    <div class="savedPhotoCard">
      <img src="${src}" alt="saved-photo-${idx + 1}">
      <div class="savedPhotoCap">รูปภาพ ${idx + 1}</div>
    </div>
  `).join("");

  const metaItems = [
    ["ผู้บันทึก", saved.recorderName],
    ["วันเวลาบันทึก", saved.timestamp],
    ["วันที่", saved.date],
    ["เวลา", `${saved.timeStart} - ${saved.timeEnd}`],
    ["ประเภทหัวหน้างาน", saved.supervisorType],
    ["ชื่อหัวหน้างาน", saved.supervisorName]
  ].map(([label, value]) => `
    <div class="savedMiniItem">
      <span class="savedMiniLabel">${escapeHtml(label)}</span>
      <span class="savedMiniValue">${escapeHtml(value || "-")}</span>
    </div>
  `).join("");

  return `
    <div class="savedSummaryWrap compact">
      <div class="savedSummaryBlock compact">
        <div class="savedSummaryBlockTitle">ข้อมูลหลัก</div>
        <div class="savedMiniGrid">
          ${metaItems}
        </div>

        <div class="savedWideItem">
          <span class="savedMiniLabel">สถานที่</span>
          <span class="savedMiniValue">${escapeHtml(saved.location || "-")}</span>
        </div>
      </div>

      <div class="savedSummaryBlock compact">
        <div class="savedSummaryBlockTitle">รายละเอียดเหตุการณ์</div>
        <div class="savedTextCard compact">${escapeHtml(saved.incident || "-")}</div>
      </div>

      <div class="savedSummaryBlock compact">
        <div class="savedSummaryBlockTitle">การแก้ไขเบื้องต้น</div>
        <div class="savedTextCard compact">${escapeHtml(saved.initialAction || "-")}</div>
      </div>

      <div class="savedSummaryBlock compact">
        <div class="savedSummaryBlockTitle">รูปภาพที่บันทึก (${saved.stampedPreviewUrls.length} ภาพ)</div>
        <div class="savedPhotoGrid compact">
          ${photoHtml || '<div class="savedTextCard compact">ไม่มีรูปภาพ</div>'}
        </div>
      </div>
    </div>
  `;
}

async function showSavedSummarySwal(saved) {
  if (typeof Swal === "undefined") {
    showResult("บันทึกข้อมูลสำเร็จ", "ok");
    return;
  }

  await Swal.fire({
    title: "บันทึกข้อมูลสำเร็จ",
    html: buildSubmitSummaryHtml(saved),
    width: 860,
    confirmButtonText: "ปิด",
    confirmButtonColor: "#2563eb",
    allowOutsideClick: false,
    allowEscapeKey: true,
    showClass: {
      popup: "swal2-show"
    },
    hideClass: {
      popup: ""
    },
    customClass: {
      popup: "savedSummaryPopup",
      title: "savedSummaryTitle",
      htmlContainer: "savedSummaryHtml"
    }
  });

  // ปิดเฉพาะ SweetAlert เท่านั้น
  // ห้าม window.close()
}

async function onSubmit(e) {
  e.preventDefault();

  try {
    validateForm();

    const acknowledgedAt = formatThaiDateTimeNow();

    const stampedPreviewUrls = await Promise.all(
      state.photos
        .filter(p => p && p.dataUrl)
        .map(async (p, i) => {
          const stamped = await createStampedPhotoDataUrl(
            p.dataUrl,
            state.signatureDataUrl,
            el.supervisorName.value,
            acknowledgedAt
          );

          return {
            name: p.name || `photo_${i + 1}.jpg`,
            dataUrl: stamped
          };
        })
    );

    const payload = {
      action: "submit",
      date: el.incidentDate.value,
      startHour: el.startHour.value,
      startMinute: el.startMinute.value,
      endHour: el.endHour.value,
      endMinute: el.endMinute.value,
      location: el.location.value.trim(),
      incident: el.incidentText.value.trim(),
      initialAction: el.initialAction.value.trim(),
      supervisorType: el.supervisorType.value,
      supervisorName: el.supervisorName.value,
      supervisorSignatureBase64: state.signatureDataUrl,
      recorderName: state.sessionUser,
      photos: stampedPreviewUrls
    };

    showLoading(true);
    el.submitBtn.disabled = true;

    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");

    const savedSummary = {
      recorderName: state.sessionUser || "-",
      timestamp: data.timestamp || acknowledgedAt,
      date: el.incidentDate.value || "-",
      timeStart: `${el.startHour.value}:${el.startMinute.value}:00`,
      timeEnd: `${el.endHour.value}:${el.endMinute.value}:00`,
      location: el.location.value.trim(),
      incident: el.incidentText.value.trim(),
      initialAction: el.initialAction.value.trim(),
      supervisorType: el.supervisorType.value,
      supervisorName: el.supervisorName.value,
      stampedPreviewUrls: stampedPreviewUrls.map(x => x.dataUrl)
    };

    showResult("", "");

    showLoading(false);
    el.submitBtn.disabled = false;

    await showSavedSummarySwal(savedSummary);
    resetForm(false);

    return;
  } catch (err) {
    showResult(err.message || "เกิดข้อผิดพลาด", "error");
  } finally {
    showLoading(false);
    el.submitBtn.disabled = false;
  }
}

function validateForm() {
  if (!state.sessionUser) throw new Error("กรุณาเข้าสู่ระบบก่อน");
  if (!el.incidentDate.value) throw new Error("กรุณาเลือกวันที่");
  if (!el.startHour.value || !el.startMinute.value) throw new Error("กรุณาเลือกเวลาเริ่ม");
  if (!el.endHour.value || !el.endMinute.value) throw new Error("กรุณาเลือกเวลาสิ้นสุด");
  if (!el.location.value.trim()) throw new Error("กรุณากรอกสถานที่");
  if (!el.incidentText.value.trim()) throw new Error("กรุณากรอกรายละเอียดเกิดเหตุ");
  if (!el.initialAction.value.trim()) throw new Error("กรุณากรอกการแก้ไขเบื้องต้น");
  if (!el.supervisorType.value) throw new Error("กรุณาเลือกประเภทหัวหน้างาน");
  if (!el.supervisorName.value) throw new Error("กรุณาเลือกชื่อหัวหน้างาน");
  if (!state.signatureDataUrl) throw new Error("กรุณาให้หัวหน้างานเซ็นรับทราบ");
}

function resetForm(clearMessage = true) {
  el.form.reset();
  setDefaultDate();
  buildTimeSelects();

  el.supervisorName.innerHTML = `<option value="">-- เลือกชื่อ --</option>`;
  el.supervisorName.disabled = true;

  state.photos = [];
  el.uploadGrid.innerHTML = "";
  addPhotoBox();

  clearSignature();
  updateSignMeta();
  closeCameraModal();

  if (clearMessage) showResult("", "");
}

function showLoginResult(message, type) {
  if (!message) {
    el.loginResultBox.className = "result";
    el.loginResultBox.textContent = "";
    return;
  }

  el.loginResultBox.className = `result show ${type === "ok" ? "ok" : "error"}`;
  el.loginResultBox.textContent = message;
}

function showResult(message, type) {
  if (!message) {
    el.resultBox.className = "result";
    el.resultBox.textContent = "";
    return;
  }

  el.resultBox.className = `result show ${type === "ok" ? "ok" : "error"}`;
  el.resultBox.textContent = message;
}

function showLoading(show) {
  el.loadingOverlay.classList.toggle("show", !!show);
}

function pad2(num) {
  return String(num).padStart(2, "0");
}

window.addEventListener("beforeunload", () => {
  stopCameraStream();
});
