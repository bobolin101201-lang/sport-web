# Sport Activity Tracker Scaffold

這是一個使用 Node.js + Express 建置的簡易運動紀錄網站雛形，前端以單頁式介面呈現，
方便快速驗證功能。使用者登入後可以新增運動紀錄、上傳照片、選擇是否公開分享，
並在儀表板上查看天氣資訊與運動日曆。

## 快速開始

```bash
npm install
npm run dev
```

啟動後瀏覽 <http://localhost:3000>：

- 可使用預設帳密登入：帳號 `athlete` / 密碼 `123456`
- 也可以在首頁註冊新帳號；註冊成功後請改用該帳號登入
- 新增紀錄時支援照片上傳（常見圖片格式、大小 5 MB 以內）
- 儀表板顯示天氣資訊，目前伺服器在 `fetchWeatherForUser` 中預留串接第三方 API 的位置，尚未串接時會顯示「天氣」占位
- 「運動日曆」會以月曆標記有紀錄的日期，點選即可查看當日摘要
- 新增紀錄可勾選「分享到社群牆」，公開的紀錄會在所有使用者的社群列表呈現
- 個人紀錄列表支援編輯與刪除，編輯完成後會同步更新日曆與社群分享

- `npm run dev`：使用 nodemon，自動重啟伺服器
- `npm start`：以 Node.js 執行 `src/server.js`

## 專案結構

```
public/
  css/styles.css         # 基本樣式與布局（含日曆、列表樣式）
  js/app.js              # 前端邏輯：登入、註冊、活動 CRUD、日曆與社群串接
  uploads/               # 使用者上傳的運動照片（部署時可改用其他儲存方案）
  index.html             # 單頁式 UI
src/
  server.js              # Express 伺服器、登入註冊、活動 API、天氣 API 預留
package.json             # 套件與指令設定
README.md
```

## 下一步建議

- 將使用者與活動資料移至正式資料庫（MongoDB、PostgreSQL 等）
- 以雜湊（bcrypt…）處理密碼並實作正式的 Session/JWT 流程
- 在 `/api/weather` 中串接真實天氣 API，替換目前的占位資料
- 擴充統計報表或圖表，提供進階的運動分析
- 製作自動化測試，涵蓋 API 行為與前端互動流程
