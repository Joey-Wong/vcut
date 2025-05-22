const fs = require("fs");
import { getFileInfo, to } from "@/utils";
import dayjs from "dayjs";
import ffmpegCmd from "./core/ffmpeg.js";
const compressFile = async ({ targetDir, sourceFilePath, crf, sourceFileName, fileType }) => {
  const fileNameRes = getFileInfo(sourceFileName);
  let outputFilePath = `${targetDir}/${fileNameRes.name}_${dayjs().format("YYYYMMDD")}.${fileNameRes.ext}`;
  let args = "";
  if (fileType === "video") {
    // 恒定速率因子 值越小画质越高，默认值为18，20以下即可实现视觉上的无损 ffmpeg -i 输入文件名 -c:v libx265 -x265-params crf=18 输出文件名.mp4
    args = [`-i`, `${sourceFilePath}`, `-c:v`, `libx265`, `-x265-params`, `crf=${crf}`, `${outputFilePath}`];
  }
  if (fileType === "image") {
    // https://www.jianshu.com/p/b53943fc3819
    args = [`-i`, `${sourceFilePath}`, `-q`, `${crf}`, `${outputFilePath}`];
  }
  if (fileType === "audio") {
    // https://21xrx.com/Articles/read_article/244019
    // https://zhuanlan.zhihu.com/p/587630161
    outputFilePath = `${targetDir}/${fileNameRes.name}_${dayjs().format("YYYYMMDD")}.mp3`;
    const rates = ["16k", "24k", "40k", "56k", "64k", "112k", "128k", "192k", "320k"];
    args = [`-i`, `${sourceFilePath}`, `-b`, `${rates[crf]}`, `-ar`, `44100`, `-ac`, `2`, `${outputFilePath}`];
  }
  console.log(args);

  const [err] = await to(
    ffmpegCmd(
      args,
      (data) => {
        const res = {
          Code: 0,
          Done: false,
          Log: data.toString("utf8"),
        };

        global.win.webContents.send("Compress", JSON.stringify(res));
      },
      (data) => {
        const res = {
          Code: 0,
          Done: false,
          Log: data.toString("utf8"),
        };

        global.win.webContents.send("Compress", JSON.stringify(res));
      }
    )
  );
  if (err) {
    const res = {
      Code: -1,
      Done: true,
      Msg: `[运行失败]${err}`,
    };
    global.win.webContents.send("Compress", JSON.stringify(res));
    return false;
  }

  const res = {
    Code: 0,
    Done: true,
    Log: `[压缩成功]文件保存在${outputFilePath}`,
  };
  global.win.webContents.send("Compress", JSON.stringify(res));
};

export default compressFile;
