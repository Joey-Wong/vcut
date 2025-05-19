<template>
  <div ref="wrap" class="wrap">
    <h2 ref="title" class="title">视频加水印</h2>
    <div :style="{ height: calcHeight }" class="content-wrap">
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
      <BtnLine
        title="水印内容:"
        :disabled="progressing"
        @onClick="selectFile()"
        type="primary"
        :text="sourceFileName || '选择需要叠加的水印'"
      />
      <LineWrap title="高级选项:">
        <n-space>
          <n-radio :checked="cusMode" @change="setIsCusMode(true)">是</n-radio>
          <n-radio :checked="!cusMode" @change="setIsCusMode(false)">否</n-radio>
        </n-space>
        <p style="color: #999">可以自定义设置水印位置/水印大小/起止时间/水印透明度</p>
      </LineWrap>
      <div v-show="cusMode">
        <LineWrap title="水印位置:">
          <n-space>
            <n-radio-group v-model:value="position">
              <n-radio v-for="v in positionList" :key="v.v" :value="v.v">
                {{ v.text }}
              </n-radio>
            </n-radio-group>
          </n-space>
        </LineWrap>
        <LineWrap title="水印大小:" noMarginBottom>
          <n-slider :min="1" :max="100" v-model:value="size" :step="1" />
        </LineWrap>
        <LineWrap title="">
          <p class="tip">水印占背景视频的百分比例</p>
        </LineWrap>
        <LineWrap title="起止时间:">
          <n-space>
            <n-radio-group v-model:value="durationType">
              <n-radio v-for="v in durationList" :key="v.v" :value="v.v">
                {{ v.text }}
              </n-radio>
            </n-radio-group>
          </n-space>
          <p class="tip">水印在视频中出现的起止时间段</p>
        </LineWrap>
        <LineWrap v-show="durationType !== 'ALL'" title="">
          <n-input-number
            style="width: 100px"
            v-model:value="durationStart"
            :show-button="false"
            size="small"
            :placeholder="durationType === 'PERCENT' ? '起始百分比' : '起始秒'"
            :precision="0"
          >
            <template #suffix>{{ durationType === "PERCENT" ? "%" : "秒" }}</template>
          </n-input-number>
          <span class="line-wrap"><span /></span>
          <n-input-number
            style="width: 100px"
            v-model:value="durationEnd"
            :show-button="false"
            size="small"
            :placeholder="durationType === 'PERCENT' ? '结束百分比' : '结束秒'"
            :precision="0"
          >
            <template #suffix>{{ durationType === "PERCENT" ? "%" : "秒" }}</template>
          </n-input-number>
          <p style="margin-left: 20px" class="tip">
            结束{{ durationType === "PERCENT" ? "百分比" : "秒" }}不填默认到
            <span>视频结束</span>
          </p>
        </LineWrap>
        <LineWrap title="透明度:" noMarginBottom>
          <n-slider :min="1" :max="100" v-model:value="opacity" :step="1" />
        </LineWrap>
      </div>
      <LineWrap title="支持格式:">
        <p class="tip">{{ exts.join("/") }}</p>
      </LineWrap>
      <n-button :loading="progressing" :disabled="progressing" @click="progress()" type="primary">开始处理</n-button>
      <Log :show="progressing || Done" ref="log-conetnt" height="400px" />
    </div>
  </div>
</template>

<script>
import { NButton, useMessage, NRadioGroup, NSpace, NRadio, NSlider, NInputNumber } from "naive-ui";
import BtnLine from "@/components/BtnLine";
import LineWrap from "@/components/LineWrap";
import Log from "@/components/Log";
import { getFileInfo } from "@/utils";
import common from "@/mixins/common";

export default {
  name: "MvOverlay",
  mixins: [common],
  components: {
    NButton,
    BtnLine,
    LineWrap,
    Log,
    NRadioGroup,
    NSpace,
    NRadio,
    NSlider,
    NInputNumber,
  },
  setup() {
    window.$message = useMessage();
  },
  data() {
    return {
      calcHeight: "80%",
      exts: ["mp4", "mov", "wmv", "avi", "flv", "jpg", "jpeg", "png", "gif"],
      // 水印位置
      positionList: [
        {
          v: "C",
          text: "居中",
        },
        {
          v: "LT",
          text: "左上角",
        },
        {
          v: "RT",
          text: "右上角",
        },
        {
          v: "LB",
          text: "左下角",
        },
        {
          v: "RB",
          text: "右下角",
        },
      ],
      position: "C",
      durationList: [
        {
          v: "ALL",
          text: "所有时间",
        },
        {
          v: "PERCENT",
          text: "按百分比",
        },
        {
          v: "S",
          text: "按秒",
        },
      ],
      durationType: "ALL",
      durationStart: 0,
      durationEnd: 100,
      size: 50,
      opacity: 100,
      cusMode: false,
    };
  },
  mounted() {
    const allHeight = this.$refs.wrap.offsetHeight;
    const titleHeight = this.$refs.title.offsetHeight;
    this.calcHeight = `${allHeight - titleHeight}px`;
    ipcRenderer.on("MvOverlayRes", this.mvOverlayRes);
  },
  methods: {
    setIsCusMode(v) {
      this.cusMode = v;
    },
    async selectFile() {
      await this.choseFile();
      const ext = getFileInfo(this.sourceFilePath).ext.toLocaleLowerCase();
      const fileType = this.exts.find((v) => v === ext);
      if (!ext || !fileType) {
        window.$message.error(`文件格式不支持,请重新选择`);
        return false;
      }
    },
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
      if (!this.sourceFilePath) {
        window.$message.warning(`请选择需叠加的视频`);
        return false;
      }
      let cusModeParams = null;
      if (this.cusMode) {
        if (this.durationType === "PERCENT" || this.durationType === "S") {
          const msg = this.durationType === "PERCENT" ? "百分比" : "秒";
          if (!this.durationStart) {
            window.$message.warning(`请输入起始${msg}`);
            return false;
          }
          if (this.durationEnd && Number(this.durationEnd) < Number(this.durationStart)) {
            const msg = this.durationType === "PERCENT" ? "百分比" : "秒";
            window.$message.warning(`结束${msg}不能小于起始${msg},请重新输入`);
            return false;
          }
        }
        cusModeParams = {
          position: this.position,
          size: this.size / 100,
          durationType: this.durationType,
          durationStart: this.durationStart,
          durationEnd: this.durationEnd,
          opacity: this.opacity / 100,
        };
      } else {
        cusModeParams = {
          position: "C",
          size: 1,
          durationType: "ALL",
          durationStart: 0,
          durationEnd: 100,
          opacity: 1,
        };
      }

      this.Done = false;
      this.progressing = true;

      const params = {
        targetDir: this.targetDir,
        sourceDir: this.sourceDir, // 选择的文件路径
        sourceFilePath: this.sourceFilePath,
        ...cusModeParams,
      };
      ipcRenderer.send("MvOverlay", JSON.stringify(params));
    },
    mvOverlayRes(event, rsp) {
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
  border-radius: 4px;
}
.line-wrap {
  display: inline-flex;
  width: 30px;
  align-items: center;
  justify-content: center;
  span {
    display: inline-block;
    width: 16px;
    height: 1px;
    background: #999;
  }
}
.content-wrap {
  width: 100%;
  overflow-y: auto;
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding: 10px;
  padding-bottom: 40px;
  /* WebKit 内核浏览器滚动条样式设置 */
  &::-webkit-scrollbar {
    width: 5px; /* 设置滚动条宽度为 5 像素，可按需修改 */
  }

  /* 滚动条轨道样式 */
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  /* 滚动条滑块样式 */
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }

  /* 鼠标悬停在滑块上时的样式 */
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
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
