const path = require("path");
const { app, Tray, BrowserWindow, ipcMain } = require("electron");

// Don't show the app in the doc
app.dock.hide()

let win = null;
global.tray = null;

const recordStateDictionary = {
  stopped: false,
  record: true,
};

let recordState = false;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

  win.loadFile("index.html");

  const iconPath = path.join(__dirname, "/img/icon-green.png");

  global.tray = new Tray(iconPath);

  global.tray.on("click", function (e) {
    recordState = !recordState;

    if (recordState === recordStateDictionary.record)
      startRecord();
    else if (recordState === recordStateDictionary.stopped)
      stopRecord();
  });
});

const startRecord = () => {
  global.tray.setImage(__dirname + "/img/icon-red.png");
  win.webContents.send('record', 'record!')

};

const stopRecord = () => {
  global.tray.setImage(__dirname + "/img/icon-green.png");
  win.webContents.send('stop', 'stop!')
};
