<template>
  <el-transfer v-model="value" :data="data"></el-transfer>
</template>

<script>
  export default {
    data() {
      const generateData = _ => {
        const data = [];
        for (let i = 1; i <= 15; i++) {
          data.push({
            key: i,
            label: `备选项 ${ i }`,
            disabled: i % 4 === 0
          });
        }
        return data;
      };
      return {
        data: generateData(),
        value: [1, 4]
      };
    }
  };
</script>
<style scoped>
/* 测试sass语法 */
::v-deep .el-transfer-panel .el-transfer-panel__header {
    height: 40px;
    line-height: 40px;
    background: red;
    margin: 0;
    padding-left: 15px;
    border-bottom: 1px solid #EBEEF5;
    box-sizing: border-box;
    color: #000;
}
</style>