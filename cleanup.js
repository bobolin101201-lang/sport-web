#!/usr/bin/env node
'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? false 
    : { rejectUnauthorized: false }
});

async function cleanupDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n🗑️  開始清理數據庫...\n');

    // 先查看統計
    const statsBefore = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM activities) as activities_count,
        (SELECT COUNT(*) FROM sessions) as sessions_count
    `);
    
    const before = statsBefore.rows[0];
    console.log('📊 清理前的統計：');
    console.log(`   使用者: ${before.users_count}`);
    console.log(`   活動: ${before.activities_count}`);
    console.log(`   會話: ${before.sessions_count}\n`);

    // 刪除非 athlete 帳號的活動
    const deleteActivitiesResult = await client.query(`
      DELETE FROM activities 
      WHERE owner_id IN (
        SELECT id FROM users WHERE username != 'athlete'
      )
    `);
    console.log(`✅ 已刪除 ${deleteActivitiesResult.rowCount} 條活動`);

    // 刪除非 athlete 帳號的會話
    const deleteSessionsResult = await client.query(`
      DELETE FROM sessions 
      WHERE user_id IN (
        SELECT id FROM users WHERE username != 'athlete'
      )
    `);
    console.log(`✅ 已刪除 ${deleteSessionsResult.rowCount} 個會話`);

    // 刪除非 athlete 的使用者
    const deleteUsersResult = await client.query(`
      DELETE FROM users WHERE username != 'athlete'
    `);
    console.log(`✅ 已刪除 ${deleteUsersResult.rowCount} 個使用者\n`);

    // 驗證結果
    const statsAfter = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM activities) as activities_count,
        (SELECT COUNT(*) FROM sessions) as sessions_count
    `);

    const after = statsAfter.rows[0];
    console.log('📊 清理後的統計：');
    console.log(`   使用者: ${after.users_count}`);
    console.log(`   活動: ${after.activities_count}`);
    console.log(`   會話: ${after.sessions_count}\n`);

    // 驗證 athlete 帳號存在
    const athleteCheck = await client.query("SELECT id, username, display_name FROM users WHERE username = 'athlete'");
    if (athleteCheck.rows.length > 0) {
      const athlete = athleteCheck.rows[0];
      console.log('✨ Athlete 帳號已保留：');
      console.log(`   ID: ${athlete.id}`);
      console.log(`   使用者名: ${athlete.username}`);
      console.log(`   顯示名稱: ${athlete.display_name}\n`);
    }

    console.log('✨ 數據庫清理完成！\n');
  } catch (err) {
    console.error('❌ 清理過程出錯：', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

cleanupDatabase();
