Gmail to BAND Announce Bot
Google Apps Script (GAS) を使用して、Gmailで受信した特定の防犯・防災メールを BAND 掲示板へ自動投稿する連携システムです。

西鎌倉自治会などの地域コミュニティにおいて、行政や警察からの防犯情報をリアルタイムかつ自動的に住民へ共有することを目的としています。 

🌟 主な機能

自動転送: 指定した送信元からのメールを検出し、BANDの掲示板に投稿します。 
+3


ルールベースの加工: 送信元ごとに「カスタムヘッダー」の追加や、不要なフッター（解除案内など）のカットが可能です。 
+2


ハッシュタグ対応: 投稿時に #防犯 などのタグを自動付与できます。 
+2


添付ファイル対応: メールの添付ファイルを Google ドライブに自動保存し、閲覧用URLを投稿に添えます。 
+4


API ポータル機能: Google の認証や審査に対応するための、シンプルなポータル画面を表示可能です。 
+1

📋 構成ファイル

Main.gs: メインロジック（メール走査・投稿制御）。 


BandHelper.gs: BAND API との通信、および Google ドライブへのファイル保存。 
+3


Config.gs: 認証情報、送信元ルール、タグの定義（Config_sample.gs を元に作成）。 
+1


Announce.gs: API 連携用のポータル画面（Webアプリ）の定義。 

⚙️ セットアップ手順
1. BAND API の準備

BAND Developers にて Access Token を取得します。 
+1


BandHelper.gs 内の getBandList() 関数を実行し、投稿先となる BAND の band_key を確認してください。 
+1

2. Google Apps Script の設定
GAS プロジェクトを作成し、本リポジトリのファイルをアップロードします。


Config_sample.gs を Config.gs にリネームし、以下を設定します： 
+1

BAND_ACCESS_TOKEN

TARGET_BAND_KEY

IMAGE_FOLDER_ID: 添付ファイルを保存する Google ドライブのフォルダID

SENDERS: 監視対象のメールアドレスと適用するルールの紐付け

3. トリガーの設定
GAS エディタの「トリガー（時計アイコン）」を開きます。


checkGmailAndPostToBand 関数を、分単位（例：5分〜15分おき）で実行するように設定します。 

🛠 カスタマイズ
Config.gs の RULE_ 定数を書き換えることで、メール本文の切り取り位置やヘッダーを自由に調整できます。

JavaScript

const RULE_CUSTOM = {
  customHeader: '【〇〇からの重要なお知らせ】',
  cutOffString: '--- 配信停止はこちら ---' // この文字列以降をカット
};
📄 ライセンス
Copyright (c) Nishi-kamakura Residents' Association All Rights Reserved. 


西鎌倉自治会 IT推進チーム  itpromotion@nishikamakura-jichikai.com

次のステップとして
この README.md をリポジトリに配置するほか、Config.gs のサンプルコードに含まれているメールアドレスやトークンのダミー値を、実際の運用に合わせて差し替えるお手伝いも可能です。必要であればお申し付けください。
