/**
 * 気象庁APIを監視し発表情報を照合して投稿を判断する
 */
function checkJmaAndPostToBand() {
  const conf = CONFIG.BOUSAI_CONFIG;
  const master = conf.MASTER;
  const scriptProps = PropertiesService.getScriptProperties();
  
  const lastCheck = scriptProps.getProperty('LAST_JMA_DATETIME') || "";
  const lastPostedContent = scriptProps.getProperty('LAST_JMA_POST_CONTENT') || "";
  let latestDateTime = lastCheck;

  try {
    // --- 1. 気象警報・注意報セクション ---
    const resWarning = UrlFetchApp.fetch(conf.URL_WARNING);
    const dataWarning = JSON.parse(resWarning.getContentText());
    
    let cityData = null;
    const areaTypes = dataWarning.areaTypes || [];
    for (let i = areaTypes.length - 1; i >= 0; i--) {
      const found = areaTypes[i].areas.find(a => a.code === conf.CITY_CODE);
      if (found && found.warnings) {
        cityData = found;
        break;
      }
    }

    if (cityData) {
      let activeMessages = [];
      let maxLevel = 3; 
      let hasUpdate = false;

      cityData.warnings.forEach(w => {
        const msg = master.special_warnings[w.code] || 
                    master.warnings[w.code] || 
                    master.advisories[w.code];
        
        if (msg) {
          const statusLabel = (w.status === "解除") ? "（解除）" : "";
          activeMessages.push(msg + statusLabel);
          if (w.status !== "継続") hasUpdate = true;
          if (w.status !== "解除") {
            if (master.special_warnings[w.code]) maxLevel = Math.min(maxLevel, 1);
            else if (master.warnings[w.code]) maxLevel = Math.min(maxLevel, 2);
            else if (master.advisories[w.code]) maxLevel = Math.min(maxLevel, 3);
          }
        }
      });

      if (activeMessages.length > 0 && hasUpdate) {
        const sortedContent = activeMessages.sort().join('\n');
        let levelLabel = (maxLevel === 1) ? "特別警報" : (maxLevel === 2) ? "警報・注意報" : "注意報";
        const header = conf.TITLE_PREFIX + "気象情報" + conf.TITLE_SUFFIX;
        const body = header + "\n" + levelLabel + "が発表されています。\n\n" + sortedContent;

        if (body !== lastPostedContent) {
          postToBand(body);
          scriptProps.setProperty('LAST_JMA_POST_CONTENT', body);
          console.log("気象警報・注意報の投稿が完了しました。");
          Utilities.sleep(20000);
        }
      }
    }

    // --- 2. 地震・津波・火山セクション ---
    const resFeed = UrlFetchApp.fetch(conf.URL_FEED_EQVOL);
    const xmlFeed = resFeed.getContentText();
    const entries = xmlFeed.split("<entry>");

    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/);
      if (!updatedMatch) continue;
      const updated = updatedMatch[1];
      if (updated <= lastCheck) continue;

      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const linkMatch = entry.match(/<link\s+type="application\/xml"\s+href="(.*?)"/);
      if (!titleMatch || !linkMatch) continue;

      const title = titleMatch[1];
      const detailUrl = linkMatch[1];
      let currentPostBody = ""; // ループごとに個別の変数を使用

      // A. 地震情報の判定（鎌倉市：震度3以上に限定）
      if (title.includes("震源") || title.includes("震度")) {
        const resDetail = UrlFetchApp.fetch(detailUrl);
        const xmlDetail = resDetail.getContentText();
        const kamakuraMatch = xmlDetail.match(new RegExp(`<Area>.*?<Name>${conf.CITY_NAME}<\/Name>.*?<MaxInt>(.*?)<\/MaxInt>`, "s"));
        
        if (kamakuraMatch) {
          const kamakuraInt = kamakuraMatch[1];
          const targetInts = ["3", "4", "5-", "5+", "6-", "6+", "7"];
          if (targetInts.includes(kamakuraInt)) {
            const epicenterMatch = xmlDetail.match(/<Hypocenter>.*?<Name>(.*?)<\/Name>/);
            const magnitudeMatch = xmlDetail.match(/<jmx_eb:Magnitude.*?>(.*?)<\/jmx_eb:Magnitude>/);
            const maxIntMatch = xmlDetail.match(/<MaxInt>(.*?)<\/MaxInt>/);
            
            let detailMsg = title + "\n";
            if (epicenterMatch) detailMsg += "震源地：" + epicenterMatch[1] + "\n";
            if (magnitudeMatch) detailMsg += "規模：M" + magnitudeMatch[1] + "\n";
            if (maxIntMatch) detailMsg += "最大震度：" + maxIntMatch[1].replace(/(\d)[\+\-]/, (m, p1) => p1 + (m.includes('+') ? '強' : '弱')) + "\n";
            const kamakuraIntJP = kamakuraInt.replace("5-", "5弱").replace("5+", "5強").replace("6-", "6弱").replace("6+", "6強");
            detailMsg += "【鎌倉市の震度：" + kamakuraIntJP + "】";
            currentPostBody = `#防災情報\n【地震情報】\n${detailMsg}`;
          }
        }
      }

      // B. 津波情報の判定
      else if (title.includes("津波")) {
        const resDetail = UrlFetchApp.fetch(detailUrl);
        const xmlDetail = resDetail.getContentText();
        if (xmlDetail.includes(conf.WATCH_TSUNAMI_REGION)) {
          const contentMatch = entry.match(/<content.*?>(.*?)<\/content>/);
          const headline = contentMatch ? contentMatch[1] : title;
          currentPostBody = `#防災情報\n【津波情報】\n${headline}`;
        }
      }

      // C. 火山情報の判定
      else if (title.includes("火山") || title.includes("降灰")) {
        const resDetail = UrlFetchApp.fetch(detailUrl);
        const xmlDetail = resDetail.getContentText();
        if (conf.WATCH_VOLCANOES.some(v => xmlDetail.includes(v)) || xmlDetail.includes(conf.PREF_NAME)) {
          const contentMatch = entry.match(/<content.*?>(.*?)<\/content>/);
          const headline = contentMatch ? contentMatch[1] : title;
          currentPostBody = `#防災情報\n【火山・降灰情報】\n${headline}`;
        }
      }

      // 共通の投稿処理
      if (currentPostBody !== "" && currentPostBody !== lastPostedContent) {
        postToBand(currentPostBody);
        scriptProps.setProperty('LAST_JMA_POST_CONTENT', currentPostBody);
        console.log(`投稿完了: ${title}`);
        Utilities.sleep(20000);
      }
      
      // 更新日時の記録
      if (updated > latestDateTime) {
        latestDateTime = updated;
      }
    }

    // 最後に一括して最新チェック時刻を更新
    if (latestDateTime !== lastCheck) {
      scriptProps.setProperty('LAST_JMA_DATETIME', latestDateTime);
    }

  } catch (e) {
    console.error("処理失敗: " + e.toString());
  }
}
