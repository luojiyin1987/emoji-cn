# 拼音搜索迭代复盘

日期：2026-05-27

## 背景

这轮迭代的目标，是提升 `emoji-cn` 的中文拼音搜索准确性，同时压低首屏不必要的依赖链。

实际演进过程中，问题从“搜索排序不准”逐步扩展到：

- 运行时拼音匹配噪声过高
- Service Worker 缓存导致新旧逻辑混跑
- 首屏脚本依赖链过长
- 构建时生成的拼音索引本身存在系统性错误

这份文档按时间顺序记录决策和结论。

## 迭代时间线

### 1. 运行时搜索从 `includes` 改为评分排序

提交：

- `0a5db27` `fix: improve pinyin search relevance`

原始实现的问题：

- 把 `keywords`、`category`、`subCategory` 以及它们的拼音全部揉成一个大字符串
- 查询时只做 `includes`
- 不区分命中字段
- 不区分“完全命中 / 前缀命中 / 擦边命中 / 首字母命中”
- 没有排序，只有过滤

结果：

- 召回很多，但噪声也很多
- 分类拼音会和关键词拼音混在一起
- 用户输入拼音时，首屏结果经常不是最想找的那个 emoji

改法：

- 为 `keyword`、`category`、`subCategory` 分开建索引
- 引入轻量评分函数
- `keyword` 权重最高
- `subCategory` 次之
- `category` 最低
- 完整命中高于前缀命中，前缀高于普通包含
- 完整拼音高于首字母

结论：

- 这一步解决了“结果没有相关性排序”的问题
- 但短拼音查询仍然容易过宽

### 2. 修正短拼音查询过宽 + 修正缓存版本

提交：

- `aa166e5` `fix: tighten short pinyin matching and refresh cache`

现象：

- `da` 这类 2 字母拼音仍会命中过多结果
- 浏览器截图显示结果异常，且与当前源码行为不一致

根因有两层：

1. 查询层面：
   `da`、`sh`、`zh` 这种短拼音信息量太低，如果仍然允许宽松 `startsWith/includes`，结果集天然会爆炸。

2. 部署层面：
   站点使用 Service Worker 且策略偏 `Cache First`。只改 `main.js` 而不升级 `sw.js` 缓存版本时，浏览器可能持续执行旧版脚本。

改法：

- 纯字母且长度小于 3 的查询，关闭宽松前缀拼音匹配
- 保留更强的命中方式
- `sw.js` 缓存版本升级到 `emoji-cn-v4`

结论：

- 搜索噪声明显下降
- 浏览器终于能稳定拿到新脚本

### 3. 优化首屏网络依赖：`modulepreload` + `tiny-pinyin` 按需加载

提交：

- `cc4d383` `perf: preload core modules and lazy-load pinyin`

背景：

Chrome DevTools 的 `Network dependency tree` 显示首页首屏链路大致为：

- `HTML -> main.js -> emoji-data.js -> tiny-pinyin.js`

这说明：

- 浏览器必须先解析 `main.js`
- 才知道还要拉 `emoji-data.js`
- 拼音库也被卷入首屏关键路径

改法：

- 在 `index.html` 中加入：
  - `modulepreload main.js`
  - `modulepreload emoji-data.js`
- 不预加载 `tiny-pinyin.js`
- 将 `tiny-pinyin` 从顶层静态 `import` 改为用户输入纯字母查询时动态 `import()`
- 搜索输入回调加入请求序号，避免异步导入时旧请求覆盖新请求
- `sw.js` 缓存版本升级到 `emoji-cn-v5`

结果：

- 首屏关键链从“脚本链 + 样式”缩短到“主要剩样式”
- DevTools 后续只剩 `style.css` 作为典型渲染阻塞资源

结论：

- 这是正常优化结果
- 首屏 JS 链路问题基本被压下去了

### 4. 尝试把拼音索引前移到构建阶段

提交：

- `6e96263` `rebuild emoji pinyin index`

目标：

- 不在浏览器运行时现算拼音
- 直接把拼音索引写进 `emoji-data.js`
- 前端只做查询，不做拼音转换

实现方式：

- 新增 `scripts/build_pinyin.js`
- 通过解析 `static/js/vendor/tiny-pinyin.js` 内部字典，离线生成：
  - `pinyinKeywords`
  - `pinyinCategory`
  - `pinyinSubCategory`

方向本身是合理的：

- 减少运行时依赖
- 消掉按需导入的复杂度
- 让前端搜索变成纯索引匹配

但这次实现引入了新的大问题。

### 5. 构建期拼音生成出现系统性错误

在 `6e96263` 之后暴露出的典型错误：

- `笑哭了 -> xiao ku lao`
- `睡着了 -> shui zhe lao`
- `乐谱 -> lao pu`
- `音乐键盘 -> yin lao jian pan`
- `银行 -> yin xing`
- `重复按钮 -> zhong fu an niu`
- `浅肤色 -> qie fu se`
- `仙子 -> xia zi`
- `牵手 -> qie shou`
- `拿白手杖 -> mu bai shou zhang`
- 英文分类 `geometric -> g e o m e t r i c`

根因判断：

1. `tiny-pinyin` 的字典质量不足以支撑这类离线全量生成
   它对多音字和上下文敏感词覆盖不够。

2. 英文 `subCategory` 本来就不应该强制生成拼音
   这类字段只适合直接保留英文，不应转成按字符拆开的“伪拼音”。

3. 如果继续在这套字典上打补丁，会陷入无穷尽的例外修复
   因为暴露的问题不是几条，而是一整类。

量化观察：

- 纯英文 `subCategory` 受影响是大面积的
- 典型多音字和词块错误不是零散现象

结论：

- 问题不在“搜索逻辑”
- 问题在“拼音索引生成器”

### 6. 用更可靠的生成器重建拼音索引

提交：

- `ad3bc2d` `fix: rebuild pinyin index with reliable generator`

策略变化：

- 不再继续手写解析 `tiny-pinyin` 内部字典
- 改为构建时使用更可靠的 Node 依赖 `pinyin-pro`

实施内容：

- 新增 `package.json`
- 新增 `package-lock.json`
- `scripts/build_pinyin.js` 改用 `pinyin-pro`
- `node_modules/` 加入 `.gitignore`

新生成规则：

- 只有包含中文的字段才生成拼音索引
- 纯英文字段直接返回 `null`
- 生成结果统一为：
  - `text`
  - `compact`
  - `initials`
  - `syllables`
- `ü` 统一转 `v`，方便搜索输入

验证样本：

- `😂 笑哭了 -> xiao ku le`
- `😴 睡着了 -> shui zhao le`
- `🎼 乐谱 -> yue pu`
- `🎹 音乐键盘 -> yin yue jian pan`
- `🏦 银行 -> yin hang`
- `🔁 重复按钮 -> chong fu an niu`
- `🧚 精灵 -> jing ling`
- `人 拿白手杖: 浅肤色 -> ren na bai shou zhang qian fu se`
- 英文 `subCategory` 的 `pinyinSubCategory -> null`

结论：

- 到这一步，构建期索引方案才算真正可用

## 最终结构

当前拼音搜索链路可以概括为：

1. 构建阶段：
   `npm run build:pinyin`
   调用 `scripts/build_pinyin.js`
   使用 `pinyin-pro` 给中文字段生成拼音索引

2. 数据阶段：
   `static/js/emoji-data.js`
   直接携带拼音索引

3. 前端运行阶段：
   `static/js/main.js`
   不再实时生成拼音
   只消费已有索引并进行评分排序

这意味着：

- 拼音正确性主要取决于构建脚本和生成器
- 搜索相关性主要取决于前端评分规则
- 首屏性能不再被拼音库运行时依赖拉长

## 这一轮的关键教训

### 1. 搜索相关性和拼音正确性是两个问题

之前一开始处理的是“匹配策略太粗”，后来才暴露“索引本身是错的”。  
如果只修一层，用户体验仍然会差。

### 2. 运行时懒加载不能替代错误的数据

把 `tiny-pinyin` 延迟加载，只能优化首屏网络链路。  
如果生成的拼音本身不对，懒加载不会改善搜索质量。

### 3. Service Worker 会放大排障成本

如果缓存版本不升级，浏览器可能持续执行旧逻辑。  
每次前端行为明显与源码不符时，优先怀疑缓存链路。

### 4. 不要在不可靠的词典上堆例外表

当错误开始覆盖：

- 多音字
- 固定词块
- 英文字段
- 特殊组合字符

说明该换生成器，而不是继续打补丁。

## 当前可执行命令

安装构建依赖：

```bash
npm install
```

重建拼音索引：

```bash
npm run build:pinyin
```

前端语法校验：

```bash
node --check static/js/main.js
node --check sw.js
```

## 后续建议

### 1. 给拼音构建脚本补回归测试

至少固定一批高风险样本：

- `笑哭了`
- `睡着了`
- `乐谱`
- `音乐键盘`
- `银行`
- `重复按钮`
- `旅行与地点`
- `浅肤色`
- `拿白手杖`

只要这些词再次回退，构建就应该失败。

### 2. 明确“哪些字段应该生成拼音”

当前做法是：

- 中文字段生成拼音
- 英文分类字段不生成

这条规则应当保留，不建议回退。

### 3. 如果继续做搜索体验优化，优先动评分，不优先动索引结构

当前索引结构已经够用了。  
后续如果想继续优化“短拼音”“歧义词”“首字母命中”，应该从 `main.js` 的评分规则下手。

## 本轮涉及的关键提交

- `0a5db27` `fix: improve pinyin search relevance`
- `aa166e5` `fix: tighten short pinyin matching and refresh cache`
- `cc4d383` `perf: preload core modules and lazy-load pinyin`
- `6e96263` `rebuild emoji pinyin index`
- `ad3bc2d` `fix: rebuild pinyin index with reliable generator`

## 一句话总结

这轮迭代最后形成的稳定方案是：

- 构建期用可靠拼音库生成中文字段索引
- 运行时只做相关性排序
- 首屏不再为拼音库付出额外网络代价

前面的几次波动，本质上是在把“搜索准确性”“缓存一致性”“首屏性能”“索引正确性”这四层问题逐步拆开。
