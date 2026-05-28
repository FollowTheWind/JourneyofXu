# Journey of Xu

《徐霞客游记》阅读体验网站。首版是可部署到 GitHub Pages 的静态站，包含原文/现代译文句级对照、选区分享图、段落朗读与场景背景音的内容管线。

## 本地运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://127.0.0.1:5173/JourneyofXu/
```

## 构建与校验

```bash
npm run validate:content
npm run build
```

`validate:content` 会检查：

- 目录引用的文章 JSON 是否存在
- `pairId` 是否重复
- 每段是否包含原文、译文、分享图、背景音和四种朗读音色
- 图片与音频资源路径是否真实存在

## 内容结构

```text
public/content/catalog.json
public/content/articles/{articleId}.json
public/content/assets/{articleId}/images
public/content/assets/{articleId}/audio
```

当前样章用于演示结构和交互。正式原文底本、译文校订、朗读音频与图像素材可以按相同结构逐篇替换。

## GitHub Pages

仓库推送到 GitHub 后，在仓库 Settings 中启用 Pages，并选择 GitHub Actions 作为来源。`.github/workflows/pages.yml` 会在推送到 `main` 分支后自动构建并发布 `dist`。

`vite.config.ts` 中的 `base` 已设置为 `/JourneyofXu/`，适配 GitHub Project Pages。如果仓库名改变，需要同步修改该值。
