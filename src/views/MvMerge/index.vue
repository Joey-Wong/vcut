<template>
  <div class="wrap">
    <h2 class="title">视频合并</h2>
    <div class="content-wrap">
      <BtnLine
        title="源文件夹:"
        :disabled="progressing"
        @onClick="choseDir('sourceDir')"
        type="primary"
        :text="sourceDir || '选择视频所在文件夹'"
      />
      <BtnLine
        title="保存位置:"
        :disabled="progressing"
        @onClick="choseDir('targetDir')"
        type="primary"
        :text="targetDir || '选择文件夹'"
      />
      <LineWrap title="支持格式:">
        <p class="tip">{{ exts.join("/") }}</p>
      </LineWrap>
      <n-button :loading="progressing" :disabled="progressing" @click="progress()" type="primary">开始合并</n-button>
    </div>
    <Log :show="progressing || Done" ref="log-conetnt" />
  </div>
</template>

<script>
import { NButton, useMessage } from "naive-ui";
import BtnLine from "@/components/BtnLine";
import LineWrap from "@/components/LineWrap";
import Log from "@/components/Log";
import common from "@/mixins/common";

const FileTypes = {
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
  name: "MvMerge",
  mixins: [common],
  components: {
    NButton,
    BtnLine,
    LineWrap,
    Log,
  },
  setup() {
    window.$message = useMessage();
  },
  data() {
    return {
      exts: [],
    };
  },
  beforeUnmount() {
    ipcRenderer.removeAllListeners("MvMerge");
  },
  mounted() {
    const keys = Object.keys(FileTypes);
    const exts = [];
    keys.forEach((v) => {
      exts.push(...FileTypes[v].exts);
    });
    this.exts = exts;
    ipcRenderer.on("MvMerge", (event, rsp) => {
      const res = JSON.parse(rsp);
      const { Code, Done, Log, Msg } = res;
      this.$refs["log-conetnt"].addLog({
        type: Code !== 0 ? "error" : "",
        log: Code !== 0 ? Msg : Log,
      });
      if (Done) {
        this.Done = true;
        this.progressing = false;
      }
    });
  },
  methods: {
    progress() {
      this.$refs["log-conetnt"].clearLog();
      if (!this.sourceDir) {
        window.$message.warning(`选择视频所在文件夹`);
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
        sourceDir: this.sourceDir, // 选择的文件路径
      };
      ipcRenderer.invoke("MvMerge", params);
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
