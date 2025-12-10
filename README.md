# 🏃‍♂️ Sport Activity Tracker

一個功能完整的運動活動追蹤 Web 應用程式，支援個人運動記錄、社群分享、點讚留言等社交功能。採用現代 Web 技術棧開發，提供流暢的行動裝置體驗。

## ✨ 主要特色

- 📱 **響應式設計** - 支援桌面與行動裝置
- 🔄 **左右滑動導航** - 行動裝置上可滑動切換頁面
- 👥 **社群功能** - 公開分享、點讚、留言互動
- 📅 **運動日曆** - 可視化運動記錄與統計
- 🌤️ **天氣整合** - 顯示當前天氣資訊
- 📸 **照片上傳** - 支援運動照片記錄
- 🔐 **安全認證** - JWT 令牌驗證與密碼加密
- 🗄️ **PostgreSQL 數據庫** - 可靠的數據持久化

## 🚀 快速開始

### 系統需求

- **Node.js**: 16.0 或以上版本
- **PostgreSQL**: 12.0 或以上版本
- **npm**: 8.0 或以上版本
- **現代瀏覽器**: 支援 ES6+ 與 CSS Grid

### 安裝步驟

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd sport1
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **環境配置**
   ```bash
   # 複製環境變數模板
   cp .env.example .env

   # 編輯 .env 文件，設置數據庫連接
   DATABASE_URL=postgresql://username:password@localhost:5432/sport_tracker
   JWT_SECRET=your-secret-key-here
   PORT=3000
   ```

4. **數據庫設置**
   ```bash
   # 創建 PostgreSQL 數據庫
   createdb sport_tracker

   # 應用啟動時會自動創建表格
   ```

5. **啟動應用**
   ```bash
   # 開發模式（推薦）
   npm run dev

   # 或生產模式
   npm start
   ```

6. **訪問應用**
   - 打開瀏覽器訪問: `http://localhost:3000`
   - 預設測試帳號: `athlete` / `123456`

## 📋 核心功能

### 👤 用戶管理

- **註冊與登入**: 安全的用戶認證系統
- **個人資料**: 頭像、用戶名、個人統計
- **會話管理**: JWT 令牌自動過期處理

### 🏃 運動記錄

- **活動記錄**: 日期、運動類型、時長、強度等
- **照片上傳**: 支持多種圖片格式 (JPEG, PNG, WebP)
- **隱私控制**: 可選擇公開或私人記錄
- **編輯刪除**: 完整的 CRUD 操作

### 📅 運動日曆

- **月視圖**: 清晰的日曆界面
- **活動標記**: 有記錄的日期會高亮顯示
- **日期詳情**: 點擊查看當日所有活動
- **統計摘要**: 顯示當月運動總時長

### 👥 社群功能

- **公開牆**: 查看所有用戶的公開活動
- **點讚系統**: 每個用戶只能點讚一次
- **留言功能**: 支持多條留言與刪除
- **互動統計**: 顯示點讚數和留言數

### 🌤️ 天氣資訊

- **位置天氣**: 顯示當前位置的天氣狀況
- **即時更新**: 定期刷新天氣數據
- **視覺化**: 清晰的天氣圖標和溫度顯示

### 📱 行動體驗

- **觸控優化**: 專為觸控設備設計
- **滑動導航**: 左右滑動切換頁面
- **響應式布局**: 自適應不同螢幕尺寸

## 🛠️ 技術架構

### 後端技術棧

- **運行時**: Node.js 16+
- **Web 框架**: Express.js 5.1.0
- **數據庫**: PostgreSQL 12+
- **認證**: JWT (JSON Web Tokens)
- **密碼加密**: bcrypt 5.1.1
- **文件上傳**: Multer 2.0.2
- **HTTP 日誌**: Morgan 1.10.1
- **環境配置**: dotenv 16.3.1

### 前端技術棧

- **HTML5**: 語義化結構與表單驗證
- **CSS3**: Grid/Flexbox 布局，CSS 變數主題
- **Vanilla JavaScript**: ES6+ 特性，無框架依賴
- **響應式設計**: 移動優先的設計理念
- **Progressive Enhancement**: 增強式 Web 應用

### 數據庫設計

```sql
-- 用戶表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活動表
CREATE TABLE activities (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sport VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity VARCHAR(20) CHECK (intensity IN ('輕鬆', '中等', '劇烈')),
  notes TEXT,
  photo_url VARCHAR(500),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 點讚表 (唯一約束確保一人一讚)
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  activity_id VARCHAR(100) REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);

-- 留言表
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  activity_id VARCHAR(100) REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 會話表
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL
);
```

### 專案結構

```
sport1/
├── src/
│   └── server.js              # Express 後端服務器
├── public/
│   ├── index.html             # 單頁應用主頁面
│   ├── css/
│   │   ├── styles.css         # 主樣式表 (4000+ 行)
│   │   └── swipe.css          # 滑動導航樣式
│   ├── js/
│   │   ├── app.js             # 前端應用邏輯 (2500+ 行)
│   │   └── swipe-navigator.js # 滑動導航控制器
│   ├── images/                # 靜態圖片資源
│   └── uploads/               # 用戶上傳照片
├── package.json               # 項目配置與依賴
├── README.md                  # 項目文檔
└── .env                       # 環境變數配置
```

## 🔌 API 端點

### 認證 API

| 方法 | 端點 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用戶註冊 |
| POST | `/api/auth/login` | 用戶登入 |
| POST | `/api/auth/logout` | 用戶登出 |
| GET | `/api/check-username` | 檢查用戶名是否可用 |

### 活動 API

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/activities` | 獲取個人活動列表 |
| GET | `/api/activities/public` | 獲取公開活動列表 |
| POST | `/api/activities` | 新增活動 (支援文件上傳) |
| PUT | `/api/activities/:id` | 更新活動 |
| DELETE | `/api/activities/:id` | 刪除活動 |

### 社群 API

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/activities/:id/likes` | 獲取活動點讚狀態 |
| POST | `/api/activities/:id/like` | 點讚活動 |
| DELETE | `/api/activities/:id/like` | 取消點讚 |
| GET | `/api/activities/:id/comments` | 獲取活動留言 |
| POST | `/api/activities/:id/comments` | 新增留言 |
| DELETE | `/api/comments/:id` | 刪除留言 |

### 其他 API

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/weather` | 獲取天氣資訊 |

## 🎨 UI/UX 設計

### 設計理念

- **簡潔直觀**: 清晰的信息層次與導航結構
- **一致性**: 統一的顏色方案與互動模式
- **可及性**: 支援鍵盤導航與螢幕閱讀器
- **性能優化**: 快速載入與流暢動畫

### 顏色方案

```css
:root {
  --primary-blue: #2563eb;
  --secondary-gray: #64748b;
  --accent-rose: #f43f5e;
  --neutral-cream: #fef7ed;
  --neutral-dark: #1e293b;
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --error-red: #ef4444;
}
```

### 響應式斷點

- **手機**: < 768px
- **平板**: 768px - 1024px
- **桌面**: > 1024px

## 🔒 安全特性

- **密碼加密**: 使用 bcrypt 進行密碼雜湊
- **JWT 認證**: 安全的令牌驗證機制
- **輸入驗證**: 前後端雙重數據驗證
- **SQL 注入防護**: 使用參數化查詢
- **XSS 防護**: 輸出編碼與內容安全策略
- **文件上傳安全**: 文件類型與大小限制

## 📊 性能優化

- **數據庫索引**: 關鍵查詢字段的索引優化
- **圖片壓縮**: 上傳時自動優化圖片大小
- **懶載入**: 圖片和內容的按需載入
- **緩存策略**: 靜態資源的瀏覽器緩存
- **代碼分割**: JavaScript 的模塊化載入

## 🧪 測試與開發

### 開發環境設置

```bash
# 安裝開發依賴
npm install

# 啟動開發服務器 (自動重啟)
npm run dev

# 檢查代碼品質
npm run lint  # (未來添加)
```

### 測試數據

系統包含預設測試用戶和活動數據，方便開發測試。

### 調試技巧

- 使用瀏覽器開發者工具檢查網路請求
- 查看服務器控制台日誌
- 使用 PostgreSQL 客戶端查詢數據庫狀態

## 🚀 部署指南

### 生產環境部署

1. **環境變數配置**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
   JWT_SECRET=your-production-secret
   PORT=3000
   ```

2. **數據庫遷移**
   ```bash
   # 應用啟動時會自動創建表格
   npm start
   ```

3. **靜態資源優化**
   ```bash
   # 壓縮 CSS/JS 文件 (未來添加)
   npm run build
   ```

4. **反向代理配置** (Nginx 示例)
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 貢獻指南

### 開發工作流

1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 代碼規範

- 使用 ESLint 進行代碼檢查
- 遵循 JavaScript Standard Style
- 撰寫有意義的提交訊息
- 添加適當的註釋和文檔


## 🧑‍💻 技術架構細節

### 資料庫層
- 使用 PostgreSQL，所有資料皆以關聯式表格儲存。
- 主要表格：users（用戶）、activities（活動）、likes（點讚）、comments（留言）、sessions（會話）。
- 透過 SQL JOIN 查詢用戶活動、社群互動，並以 UNIQUE 約束確保一人一讚。
- 留言與點讚皆有 CASCADE 刪除，確保資料一致性。

### 後端層
- Node.js + Express 架構，RESTful API 設計。
- 使用 JWT 令牌做身份驗證，bcrypt 雜湊密碼。
- Multer 處理圖片上傳，檔案存放於 uploads 目錄。
- 所有 API 皆有權限驗證，公開活動可匿名瀏覽，私人活動僅限本人。
- 伺服器啟動時自動檢查/建立資料表。

### 前端層
- 單頁式應用（SPA），以 Vanilla JS 實現狀態管理與頁面切換。
- 使用 localStorage 儲存登入狀態與令牌。
- 主要互動元件：活動表單、日曆、社群牆、個人頁面、留言對話框。
- CSS 採用 Grid/Flexbox 響應式設計，支援行動裝置滑動切換。
- 所有互動（點讚、留言、CRUD）皆即時反映於 UI。

### 部署層
- 可於本地或雲端（如 Heroku、Vercel）部署。
- 支援 Docker 容器化，Nginx 反向代理。
- 以 .env 管理環境變數，方便多環境切換。

## 🏷️ Web App 使用流程

1. 使用者註冊新帳號或以預設帳號登入。
2. 登入後進入主頁，瀏覽個人運動紀錄、社群公開牆。
3. 新增活動時可選擇公開或私人，並可上傳照片。
4. 在公開牆可瀏覽所有人的公開活動，並進行點讚、留言互動。
5. 個人頁面可編輯、刪除自己的活動，檢視統計與日曆。
6. 所有互動（點讚、留言）即時更新，留言可刪除。
7. 登出後資料安全保存，重新登入可繼續管理。

## 📞 聯絡資訊

如有問題或建議，請透過以下方式聯絡：

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/sport-web/issues)
- 📖 Wiki: [專案文檔](https://github.com/your-username/sport-web/wiki)

## 📄 授權

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

---

**享受運動，記錄精彩時刻！ 🏆**

## 📞 聯絡資訊

如有問題或建議，請透過以下方式聯絡：

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/sport-web/issues)
- 📖 Wiki: [專案文檔](https://github.com/your-username/sport-web/wiki)

## 📄 授權

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

---

**享受運動，記錄精彩時刻！ 🏆**
