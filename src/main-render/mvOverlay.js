const fs = require("fs");
import { getFileInfo, to, formatToSeconds } from "@/utils";
import ffmpegCmd from "./core/ffmpeg.js";
import { getFiles } from "@/main-render/utils";
import sizeOf from "image-size";
import dayjs from "dayjs";

// 定义常见视频文件后缀数组
const commonVideoExtensions = ["mp4", "avi", "mov", "mkv", "flv", "wmv"];
const mvOverlay = async ({
  targetDir,
  sourceDir,
  sourceFilePath,
  position,
  size,
  durationType,
  durationStart,
  durationEnd,
  opacity,
}) => {
  console.log(`---111---`);
  const now = Date.now();
  const videoInfoOverlay = [];
  const argsOverlay = [`-i`, sourceFilePath];
  console.log(`-------------`);
  console.log(`ffmpeg ${argsOverlay.join(" ")}`);
  const reg = {
    Duration: /Duration: ([\s\S]*?),/,
    Vs: /\d+x\d+ \[SAR/,
  };
  const imageTypes = ["jpg", "jpeg", "png", "gif"];
  const overlayIsImage = imageTypes.includes(getFileInfo(sourceFilePath).ext.toLowerCase());
  // 获取叠加视频的宽高时长
  if (overlayIsImage) {
    const { width, height } = sizeOf(sourceFilePath);
    videoInfoOverlay[0] = ``;
    videoInfoOverlay[1] = `${width}x${height}`;
  } else {
    await to(
      ffmpegCmd(
        argsOverlay,
        (data) => {
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        },
        (data) => {
          const dataStr = data.toString("utf8");
          const tmp = {
            Duration: null,
            Vs: null,
          };

          tmp.Duration = dataStr.match(reg.Duration);
          if (tmp.Duration) {
            // Duration: 00:00:16.23,
            videoInfoOverlay[0] = tmp.Duration[0].replaceAll("Duration: ", "").replaceAll(",", "");
          }
          tmp.Vs = dataStr.match(reg.Vs);
          if (tmp.Vs) {
            // 720x1402 [SAR
            videoInfoOverlay[1] = tmp.Vs[0].replaceAll(" [SAR", "");
          }
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        }
      )
    );
  }

  console.log(`-----videoInfoOverlay-----`);
  console.log(videoInfoOverlay);
  // 循环叠加
  const filesList = getFiles(sourceDir, false);
  const len = filesList.length;
  let i = 0;
  let error = false;
  const videoInfo = []; // 00:54:56.32,1080x606
  while (i < len && !error) {
    const ext = getFileInfo(filesList[i]).ext.toLowerCase();
    if (!commonVideoExtensions.includes(ext)) {
      i++;
      continue;
    }
    const args = [`-i`, filesList[i]];

    await to(
      ffmpegCmd(
        args,
        (data) => {
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        },
        (data) => {
          const dataStr = data.toString("utf8");
          const tmp = {
            Duration: null,
            Vs: null,
          };

          tmp.Duration = dataStr.match(reg.Duration);
          if (tmp.Duration) {
            // Duration: 00:00:16.23,
            videoInfo[0] = tmp.Duration[0].replaceAll("Duration: ", "").replaceAll(",", "");
          }
          tmp.Vs = dataStr.match(reg.Vs);
          if (tmp.Vs) {
            // 720x1402 [SAR
            videoInfo[1] = tmp.Vs[0].replaceAll(" [SAR", "");
          }
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        }
      )
    );

    const [oW, oH] = videoInfoOverlay[1].split("x");
    const [bW, bH] = videoInfo[1].split("x");
    const resOverlay = {
      w: 0,
      h: 0,
      x: 0,
      y: 0,
    };
    if (oW / oH > bW / bH) {
      // 视频2宽度能铺满 高度不能
      resOverlay.w = bW;
      resOverlay.h = parseInt((bW * oH) / oW);
    } else {
      // 视频2宽度能铺满 高度不能
      resOverlay.h = bH;
      resOverlay.w = parseInt((oW * bH) / oH);
    }
    // 按比例缩放
    resOverlay.w = parseInt(size * resOverlay.w);
    resOverlay.h = parseInt(size * resOverlay.h);

    if (position === "LT") {
      // 左上角
      resOverlay.x = 0;
      resOverlay.y = 0;
    }
    if (position === "RT") {
      // 右上角
      resOverlay.x = bW - resOverlay.w;
      resOverlay.y = 0;
    }
    if (position === "LB") {
      // 左下角
      resOverlay.x = 0;
      resOverlay.y = bH - resOverlay.h;
    }
    if (position === "RB") {
      // 右下角
      resOverlay.x = bW - resOverlay.w;
      resOverlay.y = bH - resOverlay.h;
    }
    if (position === "C") {
      // 居中
      resOverlay.x = parseInt((bW - resOverlay.w) / 2);
      resOverlay.y = parseInt((bH - resOverlay.h) / 2);
    }

    durationType, durationStart, durationEnd;
    const overlayDuration = {
      start: 0,
      end: 0,
    };
    const end = parseInt(formatToSeconds(videoInfo[0]));
    if (durationType === "ALL") {
      overlayDuration.start = 0;
      overlayDuration.end = end;
    }
    if (durationType === "PERCENT") {
      overlayDuration.start = parseInt(Number(durationStart / 100) * end);
      overlayDuration.end =
        durationEnd && parseInt(durationEnd) <= 100 ? parseInt(Number(durationEnd / 100) * end) : end;
    }
    if (durationType === "S") {
      overlayDuration.start = parseInt(durationStart) < end ? parseInt(durationStart) : 0;
      overlayDuration.end = parseInt(durationEnd) <= end ? parseInt(durationEnd) : end;
    }
    const fileInfo = getFileInfo(filesList[i]);
    const savePath = `${targetDir}/${fileInfo.name}_${dayjs().format("YYYYMMDD")}.${fileInfo.ext}`;
    const argsOverlay = overlayIsImage
      ? [
          `-i`,
          `${filesList[i]}`,
          `-i`,
          `${sourceFilePath}`,
          `-t`,
          end,
          `-filter_complex`,
          `[1:v]format=rgba,scale=${resOverlay.w}:${resOverlay.h},colorchannelmixer=aa=${opacity}[scaled_overlay];[0:v][scaled_overlay]overlay=${resOverlay.x}:${resOverlay.y}:enable='between(t,${overlayDuration.start},${overlayDuration.end})'`,
          `-c:a`,
          `copy`,
          `${savePath}`,
        ]
      : [
          `-i`,
          `${filesList[i]}`,
          `-i`,
          `${sourceFilePath}`,
          `-t`,
          end,
          `-filter_complex`,
          `[1:v]format=rgba,scale=${resOverlay.w}:${resOverlay.h},colorchannelmixer=aa=${opacity}[scaled_overlay];[0:v][scaled_overlay]overlay=${resOverlay.x}:${resOverlay.y}:enable='between(t,${overlayDuration.start},${overlayDuration.end})'`,
          `-map`,
          `0:v`,
          `-map`,
          `0:a`,
          `-c:v`,
          `libx264`,
          `-c:a`,
          `aac`,
          `${savePath}`,
        ];
    [error] = await to(
      ffmpegCmd(
        argsOverlay,
        (data) => {
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        },
        (data) => {
          const res = {
            Code: 0,
            Done: false,
            Log: data.toString("utf8"),
          };

          global.win.webContents.send("MvOverlay", JSON.stringify(res));
        }
      )
    );
    if (error) {
      break;
    }
    i++;
  }

  if (error) {
    const res = {
      Code: -1,
      Msg: `[运行失败]${error}`,
      Done: true,
    };

    global.win.webContents.send("MvOverlay", JSON.stringify(res));
    return false;
  }
  const spendTime = (Date.now() - now) / 1000;

  const res = {
    Code: 0,
    Log: `[处理完成]:耗时${spendTime}秒`,
    Done: true,
  };

  global.win.webContents.send("MvOverlay", JSON.stringify(res));
};

export default mvOverlay;
