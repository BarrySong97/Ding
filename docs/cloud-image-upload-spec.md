# 云图片上传规范

本文档定义了图片上传软件需要遵循的命名规范和处理流程，确保上传的图片能被前端组件正确解析和显示。

---

## URL 命名格式

### 基本格式

```
{basename}_{type}_{width}x{height}.{ext}
```

| 部分 | 说明 | 示例 |
|------|------|------|
| `basename` | 图片基础名称，可包含字母、数字、连字符 | `my-photo`, `screenshot-01` |
| `type` | 图片类型/用途 | `cover`, `card`, `thumbnail`, `content`, `original` |
| `width` | 图片宽度（像素） | `1920`, `800`, `400` |
| `height` | 图片高度（像素） | `1080`, `600`, `300` |
| `ext` | 文件扩展名 | `webp`, `jpg`, `png` |

### 完整 URL 示例

```
https://cdn.example.com/images/my-photo_cover_1920x1080.webp
https://cdn.example.com/images/my-photo_card_800x600.webp
https://cdn.example.com/images/my-photo_thumbnail_400x300.webp
https://cdn.example.com/images/my-photo_content_1200x800.webp
https://cdn.example.com/images/my-photo_original_2400x1600.webp
https://cdn.example.com/images/my-photo_blurhash.webp
```

---

## 图片类型定义

### 类型说明

| 类型 | 用途 | 说明 |
|------|------|------|
| `cover` | 封面图、Hero 图 | 页面顶部大图、文章封面 |
| `card` | 卡片配图 | 列表卡片、推荐内容 |
| `thumbnail` | 缩略图 | 小预览图、网格展示 |
| `content` | 正文配图 | 文章内的插图 |
| `original` | 原图 | 最高质量，用于下载或放大查看 |
| `blurhash` | 模糊占位图 | 极小尺寸，用于加载占位 |

---

## 推荐尺寸规格

### 各类型推荐尺寸

| 类型 | 推荐宽度 | 推荐比例 | 说明 |
|------|----------|----------|------|
| `cover` | 1200px 或 1920px | 16:9 或 1.91:1 | 1.91:1 是社交分享标准 |
| `card` | 600px ~ 800px | 4:3 或 16:9 | 根据卡片设计选择 |
| `thumbnail` | 300px ~ 400px | 4:3 或 1:1 | 小图，快速加载 |
| `content` | 1000px ~ 1200px | 保持原比例 | 见下方说明 |
| `original` | 原始尺寸 | 保持原比例 | 不压缩或轻度压缩 |
| `blurhash` | 32px ~ 64px | 与原图相同 | 极小，用于模糊占位 |

### 正文配图 (content) 特殊说明

正文配图**不强制固定比例**，保持原图比例即可。但为了阅读体验，建议：

- **优先使用横图**（宽度 > 高度）
- **推荐比例范围**：4:3 ~ 21:9
- **避免竖图**：竖图会导致页面过长，影响阅读

| 比例 | 适合内容 | 阅读体验 |
|------|----------|----------|
| 16:9 | 截图、演示 | ✅ 好 |
| 4:3 | 通用配图 | ✅ 好 |
| 3:2 | 照片 | ✅ 好 |
| 1:1 | 图标、头像 | ⚠️ 一般 |
| 9:16 竖图 | - | ❌ 避免 |

---

## 压缩参数建议

### WebP 格式（推荐）

| 类型 | 质量 (quality) | 说明 |
|------|----------------|------|
| `cover` | 80-85 | 大图需要较高质量 |
| `card` | 75-80 | 中等质量 |
| `thumbnail` | 70-75 | 小图可降低质量 |
| `content` | 80-85 | 正文图需要清晰 |
| `original` | 90-95 | 最高质量 |
| `blurhash` | 50-60 | 极低质量，只需轮廓 |

### 文件大小参考

| 类型 | 目标文件大小 |
|------|--------------|
| `cover` | 100KB ~ 300KB |
| `card` | 50KB ~ 100KB |
| `thumbnail` | 10KB ~ 30KB |
| `content` | 80KB ~ 200KB |
| `original` | 不限制 |
| `blurhash` | 1KB ~ 5KB |

---

## BlurHash 占位图

### 生成规则

BlurHash 图片的文件名格式：

```
{basename}_blurhash.{ext}
```

**注意**：BlurHash 文件名中**不包含尺寸信息**。

### 示例

```
原图:     my-photo_cover_1920x1080.webp
BlurHash: my-photo_blurhash.webp
```

### BlurHash 图片要求

1. **尺寸**：32x32 ~ 64x64 像素
2. **比例**：与原图相同（用于正确的占位比例）
3. **质量**：低质量即可，只需保留颜色和大致轮廓
4. **模糊**：可选择性应用高斯模糊

---

## 上传流程

### 单张图片上传流程

```
1. 用户选择原图
   ↓
2. 读取原图尺寸和比例
   ↓
3. 生成各变体：
   - cover:     缩放到 1920px 宽，质量 80
   - card:      缩放到 800px 宽，质量 75
   - thumbnail: 缩放到 400px 宽，质量 70
   - content:   缩放到 1200px 宽，质量 80
   - original:  保持原尺寸，质量 90
   - blurhash:  缩放到 32px 宽，质量 50
   ↓
4. 按命名规则重命名
   ↓
5. 上传到云存储
   ↓
6. 返回各变体 URL
```

### 批量上传

支持批量选择图片，每张图片独立执行上述流程。

---

## 命名规范

### basename 命名建议

| 规则 | 示例 | 说明 |
|------|------|------|
| 使用小写字母 | `my-photo` | ✅ 推荐 |
| 使用连字符分隔 | `screenshot-01` | ✅ 推荐 |
| 避免空格 | `my photo` | ❌ 不允许 |
| 避免特殊字符 | `photo@2x` | ❌ 不允许 |
| 避免下划线 | `my_photo` | ⚠️ 避免（与格式分隔符冲突） |

### 有效的 basename 字符

```
a-z  小写字母
A-Z  大写字母（会被转为小写）
0-9  数字
-    连字符
```

---

## 完整示例

### 输入

用户上传一张名为 `vacation.jpg` 的照片，原始尺寸 4000x3000。

### 输出

```
vacation_cover_1920x1440.webp      (1920x1440, 质量80, ~150KB)
vacation_card_800x600.webp         (800x600, 质量75, ~60KB)
vacation_thumbnail_400x300.webp    (400x300, 质量70, ~20KB)
vacation_content_1200x900.webp     (1200x900, 质量80, ~100KB)
vacation_original_4000x3000.webp   (4000x3000, 质量90, ~800KB)
vacation_blurhash.webp             (32x24, 质量50, ~2KB)
```

### 返回的 URL 列表

```json
{
  "cover": "https://cdn.example.com/images/vacation_cover_1920x1440.webp",
  "card": "https://cdn.example.com/images/vacation_card_800x600.webp",
  "thumbnail": "https://cdn.example.com/images/vacation_thumbnail_400x300.webp",
  "content": "https://cdn.example.com/images/vacation_content_1200x900.webp",
  "original": "https://cdn.example.com/images/vacation_original_4000x3000.webp",
  "blurhash": "https://cdn.example.com/images/vacation_blurhash.webp"
}
```

---

## 注意事项

1. **保持比例一致**：同一张图片的所有变体应保持相同的宽高比
2. **BlurHash 比例**：BlurHash 图片的比例必须与其他变体一致
3. **文件格式**：推荐使用 WebP 格式，兼容性好且压缩率高
4. **CDN 配置**：确保云存储配置了正确的 CORS 和缓存策略
5. **HTTPS**：所有 URL 应使用 HTTPS
