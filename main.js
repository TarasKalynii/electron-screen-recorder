const path = require("path");
const { app, Tray, BrowserWindow, ipcMain, dialog } = require("electron");

// Don't show the app in the doc
app.dock.hide()

process.env.AWS_ACCESS_KEY_ID = "AWS_ACCESS_KEY_ID";
process.env.AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY";

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
      enableRemoteModule: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "/preload.js") // use a preload script
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

ipcMain.handle('showSaveDialog', async (event, someArgument) => {
  const file = await dialog
  .showSaveDialog({
    title: "Select the File Path to save",
    buttonLabel: "Save",
    defaultPath: `${Date.now()}.webm`,
    // Restricting the user to only Text Files.
    filters: [
      {
        name: "Video Files",
        extensions: ["webm"],
      },
    ],
    properties: [],
  });
  return file;
})
