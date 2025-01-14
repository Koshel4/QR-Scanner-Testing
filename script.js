let codeReader = null;
let videoInputDevices = [];
let currentDeviceIndex = 0;
let videoElem = null;

window.addEventListener('load', async () => {
  videoElem = document.getElementById('videoInput');
  const statusElem  = document.getElementById('status');
  const startBtn    = document.getElementById('startBtn');
  const stopBtn     = document.getElementById('stopBtn');
  const switchBtn   = document.getElementById('switchBtn');
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
      statusElem.textContent = "Декодированный результат: " + result.getText();
    } else if (err && !(err instanceof ZXing.NotFoundException)) {
      console.error(err);
      statusElem.textContent = "Ошибка: " + err;
    }
  });
}

async function stopScanner() {
  const statusElem = document.getElementById('status');
  if (codeReader) {
    await codeReader.reset();
    statusElem.textContent = "Сканер выключен.";
  }
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