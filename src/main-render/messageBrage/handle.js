import { ipcMain } from "electron";
import { to } from "@/utils";
import { getFiles, getResourcesDir, AppID, getFileMD5, getFileSize } from "@/main-render/utils";
import path from "path";
import { dialog } from "electron";
import MvOverlay from "../mvOverlay.js";
import Compress from "../compress.js";
import MvMerge from "../mvMerge.js";
const fnMap = {
  GetFiles: getFiles,
  OpenDevTools: async () => {
    return global.win.webContents.openDevTools();
  },
  ShowOpenDialog: async (params) => {
    return await dialog.showOpenDialog(params);
  },
  GetPathSep: async (params) => {
    return await path.sep;
  },
  GetResourcesDir: async (params) => {
    return await getResourcesDir(params);
  },
  AppID: async (params) => {
    return await AppID(params);
  },
  GetFileMD5: async (params) => {
    return await getFileMD5(params);
  },
  GetFileSize: async (params) => {
    return await getFileSize(params);
  },
  MvOverlay: async (params) => {
    return await MvOverlay(params);
  },
  Compress: async (params) => {
    return await Compress(params);
  },
  MvMerge: async (params) => {
    return await MvMerge(params);
  },
};
const keys = Object.keys(fnMap);
keys.forEach((k) => {
  ipcMain.handle(k, async (event, params) => {
    return await to(fnMap[k](params));
  });
});
