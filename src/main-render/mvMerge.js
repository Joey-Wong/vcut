const fs = require("fs");
import { getFileInfo, to } from "@/utils";
import dayjs from "dayjs";
import ffmpegCmd from "./core/ffmpeg.js";
import { getFiles } from "@/main-render/utils";
// 多步骤处理分解成多次文件输入输出
const outFileOutPathList = [];
const getOutFilePath = (targetDir, fileExt) => {
  const len = outFileOutPathList.length;
  const newPath = `${targetDir}/_tmp_${dayjs().format("YYYYMMDD")}${len}.${fileExt}`;
  outFileOutPathList[len] = newPath;
  return newPath;
};
const mvMerge = async (e, params, interfacePath) => {
  const now = Date.now();
  const { targetDir, sourceDir, sourceFilePath } = params;
  console.log(sourceFilePath);
  const filesList = getFiles(sourceDir, false);
  // 按开头的数字排序
  filesList.sort((a, b) => {
    const fileNameA = a.substring(a.lastIndexOf("/") + 1);
    const fileNameB = b.substring(b.lastIndexOf("/") + 1);
    const numA = parseInt(fileNameA.match(/^\d+/)[0], 10);
    const numB = parseInt(fileNameB.match(/^\d+/)[0], 10);
    return numA - numB;
  });
  const fileNameRes = getFileInfo(filesList[0]);
  // 视频拼接转换成统一格式
  const len = filesList.length;
  let i = 0;
  let error = false;
  while (i < len && !error) {
    getOutFilePath(targetDir, fileNameRes.ext);
    const cmd = [
      "-i",
      filesList[i],
      "-c:v",
      "libx264",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-ar",
      "44100",
      outFileOutPathList[outFileOutPathList.length - 1],
    ];
    [error] = await to(
      ffmpegCmd(
        cmd,
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
    i++;
  }
  if (error) {
    const res = {
      Code: -1,
      Done: true,
      Msg: `[运行失败]${error}`,
    };

    global.win.webContents.send("MvOverlay", JSON.stringify(res));
    return false;
  }

  const txtContent = outFileOutPathList
    .map((item) => {
      return `file '${item}'`;
    })
    .join("\r\n");
  const txtPath = `${targetDir}/list.txt`;
  fs.writeFileSync(txtPath, txtContent, { encoding: "utf8" });
  getOutFilePath(targetDir, fileNameRes.ext);
  // 拼接
  const args1 = [
    `-f`,
    `concat`,
    `-safe`,
    `0`,
    `-i`,
    `${txtPath}`,
    `-c`,
    `copy`,
    outFileOutPathList[outFileOutPathList.length - 1],
  ];
  const [err1] = await to(
    ffmpegCmd(
      args1,
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
  if (err1) {
    const res = {
      Code: -1,
      Done: true,
      Msg: `[运行失败]${err1}`,
    };
    global.win.webContents.send("MvOverlay", JSON.stringify(res));
    return false;
  }

  const lastFilePath = outFileOutPathList.pop();
  const resFilePath = `${targetDir}/合并结果_${dayjs().format("YYYYMMDD")}.${fileNameRes.ext}`;
  // 删除过程中产生的临时文件
  fs.renameSync(lastFilePath, resFilePath);
  if (outFileOutPathList.length) {
    outFileOutPathList.forEach((item) => {
      fs.unlinkSync(item);
    });
  }
  fs.unlinkSync(txtPath);
  const spendTime = (Date.now() - now) / 1000;
  const res = {
    Code: 0,
    Done: true,
    Log: `[处理完成]:耗时${spendTime}秒`,
  };

  global.win.webContents.send("MvOverlay", JSON.stringify(res));
  // 清空数组
  outFileOutPathList.length = 0;
};

export default mvMerge;
