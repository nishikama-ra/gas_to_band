const CONFIG = {
  // --- 接続情報 ---
  // BAND DevelopersのMyAPIで取得したアクセストークン
  BAND_ACCESS_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  // 投稿先のBANDのキー（BandHelper.gsのgetBandList関数で取得可能）
  TARGET_BAND_KEY: 'XXXXXXXXXXXXXXXXXXXXXXXX', 
  // 添付ファイルがあった際の格納先GoogleDriveのフォルダ  
  IMAGE_FOLDER_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 
  // --- 実行制御 ---
  MAX_THREADS_PER_RUN: 15, 

  // --- タグ定義 ---
  TAGS: {
    BOUHAN: '#防犯',
    NONE: null
  },

  // --- 投稿本文の装飾ルール ---
  RULES: {
    KAMAKURA: {
      customHeader: '【鎌倉市防災・安全情報メールからの自動投稿です】',
      cutOffString: '登録の変更・解除は下記ページ'
    },
    POLICE: {
      customHeader: '【ピーガルくん安全メールからの自動投稿です】',
      cutOffString: '※※※※※※※※※※'
    },
    JORUDAN: {
      customHeader: '【ジョルダン運行情報からの自動投稿です】',
      cutOffString: 'メール設定変更・配信解除'
    },
    GENERAL: {
      customHeader: '【自動投稿メールです】',
      cutOffString: null
    }
  },


  // --- メールフィルタ設定 ---
  // 送信元アドレスをキーにして、個別のフィルタ条件を定義します
  MAIL_FILTERS: {
    'unkou@jorudan.co.jp': {
      priorityRoutes: ['湘南モノレール', '江ノ島電鉄'],
      criticalKeywords: ['運休', '見合わせ', '折返し運転', '運転再開見込は立っていません']
    }
    // 他のアドレスでフィルタが必要になったらここに追加するだけ
  },
  
  // --- 送信元アドレスと適応ルールの紐付け ---
  SENDERS: {
    'kamakura@sg-p.jp': ['KAMAKURA', 'BOUHAN'],
    'oshirase@kodomoanzen.police.pref.kanagawa.jp': ['POLICE', 'BOUHAN'],
    'unkou@jorudan.co.jp': ['JORUDAN', 'NONE']
  },

  // --- エラー通知メール設定 ---
  ERROR_MAIL: {
    TO: 'itpromotion@nishikamakura-jichikai.com',
    SUBJECT: '【GASエラー通知】Gmail to BAND連携',
    TEMPLATE: `
■発生したエラー:
{errorMessage}

■対象メールの情報:
・受信日時: {date}
・件名: {subject}
・送信元: {sender}

■状況:
このメールは投稿に失敗したため、Gmail上で【未読】のまま保留されています。
エラー原因（API制限など）が解消されれば、次回の実行時に再度処理されます。
`.trim()
  },

// --- 天気予報設定 ---
  WEATHER_CONFIG: {
    LATITUDE: "35.322356",
    LONGITUDE: "139.502873",
    TITLE: "【西鎌倉 3時間おき予報】",
    TAG: "#天気予報",
    // 投稿に含める予報の件数（8件で24時間分）
    FOOTER: "地点：西鎌倉交差点周辺（北緯35.322356 東経139.502873）\n提供：Open-Meteo",
    WEATHER_FORECAST_COUNT: 12, 
    // Open-Meteo WMO天気コード変換表
WEATHER_MAP: {
      0: "☀️ 快晴",
      1: "🌤️ 晴れ",
      2: "⛅ 晴れ時々曇り",
      3: "☁️ 曇り",
      45: "🌫️ 霧",
      48: "🌫️ 霧",
      51: "🌦️ 弱い霧雨",
      53: "🌦️ 霧雨",
      55: "🌦️ 強い霧雨",
      61: "☔ 小雨",
      63: "☔ 雨",
      65: "☔ 強い雨",
      71: "❄️ 弱い雪",
      73: "❄️ 雪",
      75: "❄️ 大雪",
      80: "🌦️ 弱いにわか雨",
      81: "🌦️ にわか雨",
      82: "🌦️ 強いにわか雨",
      95: "⚡ 雷雨"
    },
  }
};
