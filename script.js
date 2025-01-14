let codeReader = null;
let videoInputDevices = [];
let currentDeviceIndex = 0;
let videoElem = null;

window.addEventListener('load', async () => {
  videoElem = document.getElementById('videoInput');
  const statusElem = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const switchBtn = document.getElementById('switchBtn');

  statusElem.textContent = "Загрузка списка камер...";
  codeReader = new ZXing.BrowserMultiFormatReader();

  startBtn.addEventListener('click', startScanner);
  stopBtn.addEventListener('click', stopScanner);
  switchBtn.addEventListener('click', switchCamera);

  videoInputDevices = await codeReader.listVideoInputDevices();
  if (videoInputDevices.length === 0) {
    statusElem.textContent = "Камера не найдена.";
  } else {
    let environmentIndex = videoInputDevices.findIndex(device =>
      device.label.toLowerCase().includes('back') ||
      device.label.toLowerCase().includes('rear') ||
      device.label.toLowerCase().includes('environment')
    );

    if (environmentIndex > -1) {
      currentDeviceIndex = environmentIndex;
    } else {
      currentDeviceIndex = 0;
    }

    statusElem.textContent =
      `Найдено ${videoInputDevices.length} камеры. Можно начинать сканирование.`;
  }

  statusElem.addEventListener('dblclick', copyDecodedText);
});

async function startScanner() {
  const statusElem = document.getElementById('status');
  if (!codeReader || videoInputDevices.length === 0) return;

  await stopScanner();

  let deviceId = videoInputDevices[currentDeviceIndex].deviceId;
  statusElem.textContent =
    `Камера: ${videoInputDevices[currentDeviceIndex].label}`;

  codeReader.decodeFromVideoDevice(deviceId, 'videoInput', (result, err) => {
    if (result) {
      showBoundingBox(result);
      statusElem.textContent = "Декодированный результат: " + result.getText();
    } else if (err && !(err instanceof ZXing.NotFoundException)) {
      hideBoundingBox();
      console.error(err);
      statusElem.textContent = "Ошибка: " + err;
    } else {
      hideBoundingBox();
    }
  });
}

async function stopScanner() {
  const statusElem = document.getElementById('status');
  if (codeReader) {
    await codeReader.reset();
    statusElem.textContent = "Сканер выключен.";
  }
  hideBoundingBox();
}

async function switchCamera() {
  const statusElem = document.getElementById('status');
  if (videoInputDevices.length < 2) {
    statusElem.textContent = "Вторая камера не найдена.";
    return;
  }
  currentDeviceIndex = (currentDeviceIndex + 1) % videoInputDevices.length;
  statusElem.textContent =
    `Камера изменена на: ${videoInputDevices[currentDeviceIndex].label}`;
  await startScanner();
}

function copyDecodedText() {
  const statusElem = document.getElementById('status');
  const text = statusElem.textContent;
  const prefix = "Декодированный результат: ";
  if (text.startsWith(prefix)) {
    const decodedText = text.substring(prefix.length);
    navigator.clipboard.writeText(decodedText)
      .then(() => {
        statusElem.textContent = "Скопировано!";
        setTimeout(() => {
          statusElem.textContent = text;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  }
}

/** 
 * Compute and draw a bounding box around the result points.
 */
function showBoundingBox(result) {
  const overlay = document.getElementById('qrOverlay');
  const box = document.getElementById('qrBoundingBox');

  if (!result.resultPoints || result.resultPoints.length === 0) {
    hideBoundingBox();
    return;
  }

  let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY;

  result.resultPoints.forEach(pt => {
    if (!pt) return;
    const x = pt.x;
    const y = pt.y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  if (minX === Infinity || minY === Infinity) {
    hideBoundingBox();
    return;
  }

  const videoWidth = videoElem.videoWidth;
  const videoHeight = videoElem.videoHeight;
  const displayedWidth = videoElem.offsetWidth;
  const displayedHeight = videoElem.offsetHeight;
  const xRatio = displayedWidth / videoWidth;
  const yRatio = displayedHeight / videoHeight;

  const bx = minX * xRatio;
  const by = minY * yRatio;
  const bWidth = (maxX - minX) * xRatio;
  const bHeight = (maxY - minY) * yRatio;

  box.style.left = bx + "px";
  box.style.top = by + "px";
  box.style.width = bWidth + "px";
  box.style.height = bHeight + "px";

  box.style.display = "block";
}

function hideBoundingBox() {
  const box = document.getElementById('qrBoundingBox');
  if (box) {
    box.style.display = 'none';
  }
}