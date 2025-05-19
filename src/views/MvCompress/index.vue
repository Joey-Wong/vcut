<template>
  <div class="wrap">
    <h2 class="title">音视频图片压缩</h2>
    <div class="content-wrap">
      <BtnLine
        title="源文件:"
        :disabled="progressing"
        @onClick="selectFile()"
        type="primary"
        :text="sourceFilePath || '选择文件'"
      />
      <BtnLine
        title="保存位置:"
        :disabled="progressing"
        @onClick="choseDir('targetDir')"
        type="primary"
        :text="targetDir || '选择文件夹'"
      />
      <div v-for="(v, k, i) in FileTypes" :key="i" v-show="fileType === k">
        <LineWrap :title="v.title" noMarginBottom>
          <n-slider :min="v.min" :max="v.max" v-model:value="crf" :step="1" />
        </LineWrap>
        <LineWrap title="">
          <p class="tip">
            <span>{{ v.desBold }}</span>
            {{ v.des }}
          </p>
        </LineWrap>
      </div>
      <LineWrap title="支持格式:">
        <p class="tip">{{ exts.join("/") }}</p>
      </LineWrap>
      <n-button :loading="progressing" :disabled="progressing" @click="compress()" type="primary">开始压缩</n-button>
    </div>
    <Log :show="progressing || Done" ref="log-conetnt" />
  </div>
</template>

<script>
import { NButton, useMessage, NSlider } from "naive-ui";
import BtnLine from "@/components/BtnLine";
import LineWrap from "@/components/LineWrap";
import Log from "@/components/Log";
import { getFileInfo } from "@/utils";
import common from "@/mixins/common";

const FileTypes = {
  image: {
    exts: ["gif", "png", "jpeg", "bmp", "webp", "jpg"],
    min: 1,
    max: 100,
    title: "压缩比率:",
    desBold: "压缩比率",
    des: "数值越大,输出的图片越模糊,但文件大小越小.",
    defaultValue: 10,
  },
  audio: {
    exts: ["mp3", "wav", "ogg"],
    min: 0,
    max: 8,
    title: "压缩比率:",
    desBold: "压缩比率",
    des: "数值越大,输出的音频质量越高,但文件大小越大.",
    defaultValue: 4,
  },
  video: {
    exts: ["mp4", "mov", "wmv", "avi", "flv"],
    min: 0,
    max: 51,
    title: "恒定速率:",
    desBold: "恒定速率",
    des: "数值越大,输出的视频越模糊,但文件大小越小.",
    defaultValue: 28,
  },
};

export default {
  name: "Compress",
  mixins: [common],
  components: {
    NButton,
    BtnLine,
    NSlider,
    LineWrap,
    Log,
  },
  setup() {
    window.$message = useMessage();
  },
  data() {
    return {
      exts: [],
      FileTypes,
      fileType: "",
      crf: 28, // 恒定速率因子 值越小画质越高，默认值为18，20以下即可实现视觉上的无损 ffmpeg -i 输入文件名 -c:v libx265 -x265-params crf=18 输出文件名.mp4
      key: "",
      cryptoType: "",
    };
  },
  mounted() {
    const keys = Object.keys(this.FileTypes);
    const exts = [];
    keys.forEach((v) => {
      exts.push(...this.FileTypes[v].exts);
    });
    this.exts = exts;
    ipcRenderer.on("Compress", this.compressRes);
  },
  methods: {
    async selectFile() {
      await this.choseFile();
      const ext = getFileInfo(this.sourceFilePath).ext.toLocaleLowerCase();
      const keys = Object.keys(this.FileTypes);
      this.fileType = "";
      keys.forEach((v) => {
        if (this.FileTypes[v].exts.indexOf(ext) > -1) {
          this.fileType = v;
          this.crf = this.FileTypes[v].defaultValue;
        }
      });
      if (!ext || !this.fileType) {
        window.$message.error(`文件格式不支持,请重新选择`);
        return false;
      }
    },
    compress() {
      this.$refs["log-conetnt"].clearLog();
      if (!this.sourceFilePath || !this.fileType) {
        window.$message.warning(`请选择文件`);
        return false;
      }

      if (!this.targetDir) {
        window.$message.warning(`请选择保存位置`);
        return false;
      }
      this.Done = false;
      this.progressing = true;
      const params = {
        targetDir: this.targetDir,
        sourceFilePath: this.sourceFilePath, // 选择的文件路径
        crf: this.crf,
        sourceFileName: this.sourceFileName,
        fileType: this.fileType,
      };
      ipcRenderer.send("Compress", JSON.stringify(params));
    },
    compressRes(event, rsp) {
      const res = JSON.parse(rsp);
      const {
        RspHeader: { IsSuccess, Msg, Done },
      } = res;
      this.$refs["log-conetnt"].addLog({ type: !IsSuccess ? "error" : "", log: Msg });
      if (Done) {
        this.Done = true;
        this.progressing = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.content-wrap {
  width: 100%;
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding: 10px;
}

.margin-left-10 {
  margin-left: 10px;
}

.align-item-center {
  display: flex;
  align-items: center;
}
.compute-status {
  margin-bottom: 10px;
  color: #999;
}
</style>
