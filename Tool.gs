/**
 * 【初期設定用】
 * この関数を一度実行して、ログ画面から投稿したいBANDの「band_key」を確認してください。
 */
function getBandList() {
  const endpoint = 'https://openapi.band.us/v2.1/bands';
  const url = `${endpoint}?access_token=${CONFIG.BAND_ACCESS_TOKEN}`;
  
  try {
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    
    if (json.result_code === 1) {
      console.log("=== あなたのBAND一覧 ===");
      json.result_data.bands.forEach(band => {
        console.log(`BAND名: ${band.name}`);
        console.log(`band_key: ${band.band_key}`);
        console.log("------------------------");
      });
      console.log("Config.gsの TARGET_BAND_KEY に、該当する band_key をコピーしてください。");
    } else {
      console.log("BAND情報の取得に失敗しました。アクセストークンを確認してください。");
      console.log(json);
    }
  } catch (e) {
    console.log("エラーが発生しました: " + e.toString());
  }
}
/**
 * 
 * 投稿件数のカウント
 */

function countCategoryPosts() {
  const accessToken = CONFIG.BAND_ACCESS_TOKEN;
  const bandKey = CONFIG.TARGET_BAND_KEY;
  
  // 集計用カウンター
  let tally = {
    dayori: 0, // #西鎌倉だより
    kairan: 0, // #回覧板
    others: 0  // いずれも含まない
  };
  
  let nextParams = null;
  let totalProcessed = 0;

  console.log("集計を開始します...");

  try {
    do {
      // APIのURL構築
      let url;
      if (nextParams) {
        // 次のページがある場合
        const query = Object.keys(nextParams).map(k => `${k}=${encodeURIComponent(nextParams[k])}`).join('&');
        url = `https://openapi.band.us/v2/band/posts?access_token=${accessToken}&${query}`;
      } else {
        // 初回呼び出し
        url = `https://openapi.band.us/v2/band/posts?access_token=${accessToken}&band_key=${bandKey}&locale=ja_JP`;
      }
      
      const response = UrlFetchApp.fetch(url);
      const json = JSON.parse(response.getContentText());
      
      if (json.result_code !== 1) {
        throw new Error("APIエラー: " + json.result_data.message);
      }

      const items = json.result_data.items;
      
      // ハッシュタグ判定ロジック
      items.forEach(item => {
        const content = item.content || "";
        const hasDayori = content.includes("#西鎌倉だより");
        const hasKairan = content.includes("#回覧板");

        if (hasDayori) {
          tally.dayori++;
        } else if (hasKairan) {
          tally.kairan++;
        } else {
          tally.others++;
        }
        totalProcessed++;
      });

      // 次のページのパラメータを更新
      nextParams = json.result_data.paging.next_params;
      
      // 連続アクセスによるレート制限回避のため、1ページごとに1秒待機
      if (nextParams) {
        console.log(`${totalProcessed}件まで処理済み... 次のページを読み込みます。`);
        Utilities.sleep(1000);
      }
      
    } while (nextParams);

    // 最終結果をログに出力
    console.log("--- 【最終集計結果】 ---");
    console.log("1. #西鎌倉だより　: " + tally.dayori + " 件");
    console.log("2. #回覧板　　　　: " + tally.kairan + " 件");
    console.log("3. 指定タグなし　 : " + tally.others + " 件");
    console.log("------------------------");
    console.log("蓄積全投稿数　　 : " + totalProcessed + " 件");

  } catch (e) {
    console.error("エラーが発生しました: " + e.message);
  }
}
