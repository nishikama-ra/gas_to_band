/**
 * 【本番用】タイマートリガーにはこの関数をセット
 */
function triggerPollen_Production() {
  setBandDestination('PROD');
  postPollenToBand();
}

/**
 * 【テスト用】エディタの「実行」ボタンで試す時用
 */
function debug_PollenTest() {
  setBandDestination('TEST');
  postPollenToBand();
}

/**
 * 花粉情報用のWebアプリ入り口
 * 注意: Weather.gsに既にdoGetがある場合は、
 * パラメータで呼び出す関数を振り分ける等の統合が必要です。
 */
function doGet(e) {
  let mode = 'PROD';
  if (e && e.parameter && e.parameter.mode === 'test') {
    mode = 'TEST';
  }
  
  try {
    setBandDestination(mode);
    postPollenToBand();
    
    const label = (mode === 'TEST') ? '🛠️ 【テスト】' : '✅ 【本番】';
    return HtmlService.createHtmlOutput(`<h2>${label} 花粉情報を投稿しました</h2>`);
  } catch (err) {
    return HtmlService.createHtmlOutput(`<h2>❌ エラー</h2><p>${err.toString()}</p>`);
  }
}

/**
 * 指定座標の5日分花粉情報をBANDに投稿する
 */
function postPollenToBand() {
  const conf = CONFIG.POLLEN_CONFIG;
  // Open-Meteo Air Quality API
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${conf.LATITUDE}&longitude=${conf.LONGITUDE}&hourly=${conf.API_PARAMS}&timezone=Asia%2FTokyo&forecast_days=5`;

  try {
    const response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
    const resCode = response.getResponseCode();
    
    if (resCode !== 200) {
      throw new Error(`APIエラー (Status: ${resCode})`);
    }

    const data = JSON.parse(response.getContentText());
    const hourly = data.hourly;
    
    // 日付ごとにデータを集計（その日の最大飛散量）
    const dailyData = {};

    for (let i = 0; i < hourly.time.length; i++) {
      const dateStr = hourly.time[i].split('T')[0]; 
      const cedar = hourly.cedar_pollen[i];
      const birch = hourly.birch_pollen[i];

      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { maxCedar: 0, maxBirch: 0 };
      }
      
      if (cedar > dailyData[dateStr].maxCedar) dailyData[dateStr].maxCedar = cedar;
      if (birch > dailyData[dateStr].maxBirch) dailyData[dateStr].maxBirch = birch;
    }

    // 本文組み立て
    let body = "";
    const dates = Object.keys(dailyData).sort();

    dates.forEach(date => {
      const d = new Date(date);
      const dayLabel = Utilities.formatDate(d, "JST", "MM/dd");
      const info = dailyData[date];

      const cedarStatus = getPollenLabel(info.maxCedar);
      const birchStatus = getPollenLabel(info.maxBirch);

      body += `${dayLabel}\n`;
      body += `  スギ: ${cedarStatus.emoji}${cedarStatus.text} (${Math.round(info.maxCedar)})\n`;
      body += `  ヒノキ系: ${birchStatus.emoji}${birchStatus.text} (${Math.round(info.maxBirch)})\n\n`;
    });

    const finalContent = `${conf.TAG}\n${conf.TITLE}\n\n${body}---\n${conf.FOOTER}`;
    postToBand(finalContent);
    
    console.log("BANDへの花粉情報投稿が完了しました。");

  } catch (e) {
    // 天気予報側のエラー通知メール関数を流用
    if (typeof sendWeatherErrorMail === "function") {
      sendWeatherErrorMail("花粉情報解析エラー: " + e.message);
    } else {
      console.error("エラー: " + e.message);
    }
  }
}

/**
 * 数値からランク表示を取得
 */
function getPollenLabel(value) {
  const labels = CONFIG.POLLEN_CONFIG.LABELS;
  for (const label of labels) {
    if (value <= label.max) {
      return label;
    }
  }
  return { text: "不明", emoji: "❓" };
}
