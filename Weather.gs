/**
 * 指定座標の3時間おき予報をBANDに投稿する
 */
function postWeatherToBand() {
  try {
    const config = CONFIG.WEATHER_CONFIG;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.LATITUDE}&longitude=${config.LONGITUDE}&hourly=temperature_2m,weathercode&timezone=Asia%2FTokyo`;
    
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    const hourly = data.hourly;
    const now = new Date();
    
    let content = `${config.TAG}\n${config.TITLE}\n\n`;

    let count = 0;
    for (let i = 0; i < hourly.time.length; i++) {
      const forecastTime = new Date(hourly.time[i]);
      
      // 現在時刻より後、かつ3時間おき(0,3,6...)の予報を抽出
      if (forecastTime > now && count < config.WEATHER_FORECAST_COUNT) {
        if (forecastTime.getHours() % 3 === 0) {
          const timeStr = Utilities.formatDate(forecastTime, "JST", "MM/dd HH:00");
          
          // 気温（小数点1桁）
          const tempVal = hourly.temperature_2m[i].toFixed(1);
          // 天気名称
          const weatherDesc = config.WEATHER_MAP[hourly.weathercode[i]] || "❓ 不明";
          
          // --- レイアウトの工夫 ---
          // 無理に全角スペースで右端を揃えず、天気と気温をセットにする
          // 時刻と天気の間のスペースだけ固定することで、左側のラインはピシッと揃います
          content += `${timeStr}   ${weatherDesc} (${tempVal}℃)\n`;
          count++;
        }
      }
    }

    content += `\n---\n${config.FOOTER}`;

    postToBand(content);
    console.log("天気予報を投稿しました。");

  } catch (e) {
    console.error("天気予報取得エラー: " + e.message);
  }
}

/**
 * 定期実行用
 */
function triggerWeather() {
  postWeatherToBand();
}
