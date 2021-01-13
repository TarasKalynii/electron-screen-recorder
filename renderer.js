// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const fs = require("fs");
const path = require("path");
const electron = require("electron");

const dialog = electron.remote.dialog;

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

      dialog
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
        })
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

electron.ipcRenderer.on("record", (event, message) => {
  startRecording();
});

electron.ipcRenderer.on("stop", (event, message) => {
  stopRecording();
});
