const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg'); ffmpeg从这复制

const platform = os.platform();
const arch = os.arch();
console.log(`${platform},${arch}`);
// 架构与平台 eg. darwin-x64 or win32-x64
const basePath = path.resolve(
  process.env.NODE_ENV !== "production"
    ? process.cwd().replaceAll("\\", "/") + "/resources/bin/ffmpeg"
    : process.resourcesPath + "/bin/ffmpeg"
);

const name = "ffmpeg";
const ffmpegBinPath = path.resolve(basePath, platform === "win32" ? `${name}.exe` : name).replace(/\\/g, "/");

let ffmpeg = null;
const ffmpegCmd = (args, stdoutCb, stderrCb) => {
  return new Promise((resolve, reject) => {
    if (ffmpeg) {
      ffmpeg = null;
    }

    /*
    const tmp = [
      "-i",
      `C:/Users/51121/Desktop/1.mp4`,
      "-i",
      `C:/Users/51121/Desktop/vcut.png`,
      "-t",
      "31",
      "-filter_complex",
      `[1:v]format=rgba,scale=1080:1080,colorchannelmixer=aa=1[scaled_overlay];[0:v][scaled_overlay]overlay=0:420:enable='between(t,0,31)'`,
      "-c:a",
      "copy",
      `C:/Users/51121/Desktop/1_20250522.mp4`,
    ];
    */

    if (os.platform() === "win32") {
      // 在 Windows 系统中，使用 cmd.exe 执行命令
      ffmpeg = spawn("cmd.exe", ["/c", ffmpegBinPath, ...args]);
    } else {
      // 在其他系统中，直接执行命令
      ffmpeg = spawn(ffmpegBinPath, args || []);
    }

    ffmpeg.stdout.on("data", stdoutCb);

    ffmpeg.stderr.on("data", stderrCb);

    ffmpeg.on("close", (code) => {
      ffmpeg = null;
      if (code !== 0) {
        reject(`process exited with code ${code}`);
      } else {
        resolve();
      }
    });

    ffmpeg.on("error", (error) => {
      ffmpeg = null;
      reject(error);
    });
  });
};

export default ffmpegCmd;
