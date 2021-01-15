const fs = require("fs");
const electron = require("electron");

const { ipcRenderer } = electron;

const fullscreen_source_name = "Entire Screen";

let recorder;
let blobs = [];

function startRecording() {
  electron.desktopCapturer
    .getSources({ types: ["window", "screen"] })
    .then(function (sources) {
      for (let i = 0; i < sources.length; i++) {
        let src = sources[i];
        console.log(src.name);
        if (src.name === fullscreen_source_name) {
          navigator.webkitGetUserMedia(
            {
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: src.id,
                  minWidth: 800,
                  maxWidth: 1280,
                  minHeight: 600,
                  maxHeight: 720,
                },
              },
            },
            handleStream,
            handleUserMediaError
          );
          return;
        }
      }
    });
}

function handleStream(stream) {
  recorder = new MediaRecorder(stream);
  blobs = [];
  recorder.ondataavailable = function (event) {
    blobs.push(event.data);
  };
  recorder.start();
  recorder.onstop = function (event) {
    toArrayBuffer(new Blob(blobs, { type: "video/webm" }), function (ab) {
      const buffer = toBuffer(ab);

      ipcRenderer
        .invoke("showSaveDialog", "showSaveDialog")
        .then((file) => {
          // Stating whether dialog operation was cancelled or not.
          console.log(file.canceled);
          if (!file.canceled) {
            console.log(file.filePath.toString());

            // Creating and Writing to the sample.txt file
            fs.writeFile(file.filePath.toString(), buffer, function (err) {
              if (err) throw err;
              console.log("Saved!");
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };
}

function stopRecording() {
  recorder.stop();
}

function handleUserMediaError(e) {
  console.error("handleUserMediaError", e);
}

function toArrayBuffer(blob, cb) {
  let fileReader = new FileReader();
  fileReader.onload = function () {
    let arrayBuffer = this.result;
    cb(arrayBuffer);
  };
  fileReader.readAsArrayBuffer(blob);
}

function toBuffer(ab) {
  return Buffer.from(ab);
}

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("recordController", {
  start: () => {
    electron.ipcRenderer.on("record", (event, message) => {
      startRecording();
    });

    electron.ipcRenderer.on("stop", (event, message) => {
      stopRecording();
    });
  },
});
