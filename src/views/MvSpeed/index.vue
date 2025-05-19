<template>
  <div ref="wrap" class="wrap">
    <h2 ref="title" class="title">视频变速</h2>
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
      <LineWrap title="设置倍速:" noMarginBottom>
        <n-slider :min="0.1" :max="10" v-model:value="speed" :step="0.1" />
      </LineWrap>
      <n-button :loading="progressing" :disabled="progressing" @click="progress()" type="primary">开始处理</n-button>
    </div>
    <Log :show="progressing || Done" ref="log-conetnt" />
  </div>
</template>

<script>
import { NButton, useMessage, NSlider } from "naive-ui";
import BtnLine from "@/components/BtnLine";
import LineWrap from "@/components/LineWrap";
import Log from "@/components/Log";
import common from "@/mixins/common";

export default {
  name: "MvSpeed",
  mixins: [common],
  components: {
    NButton,
    BtnLine,
    LineWrap,
    Log,
    NSlider,
  },
  setup() {
    window.$message = useMessage();
  },
  data() {
    return {
      speed: 1,
    };
  },
  mounted() {
    ipcRenderer.on("MvSpeedRes", this.mvSpeedRes);
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
        speed: this.speed,
      };
      ipcRenderer.send("MvSpeed", JSON.stringify(params));
    },
    mvSpeedRes(event, rsp) {
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
