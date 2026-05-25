---
title: "Google Business Profile を JSON-LD として読み解く: AI アシスタントが実際に見ているもの"
description: "GBP のダッシュボードはフォームではなく schema.org の administrative interface である。Knowledge Graph を経由して AI が手にする JSON-LD の実体と、Schema Confidence Score がローカル引用を決める仕組みをエンジニア視点で読み解く。"
date: 2026-05-25
lang: ja
category: engineering
tags: ["LLMO", "MEO", "Schema.org", "JSON-LD", "Googleビジネスプロフィール", "AI検索", "Knowledge Graph"]
featured: false
images:
  - src: /images/blog/gbp-json-ld-decoded/1.jpg
    alt: "木製のガラス戸が並ぶ小さな店舗の入口。AI に「ひとつの実体」として認識される必要がある単位"
    photographer: "Shigeki Wakabayashi"
    photographer_url: "https://unsplash.com/@kugedo6060"
    source: Unsplash
  - src: /images/blog/gbp-json-ld-decoded/2.jpg
    alt: "スマートフォンを手にする利用者。AI が出した推薦が描画される最終面"
    photographer: "CardMapr.nl"
    photographer_url: "https://unsplash.com/@cardmapr"
    source: Unsplash
  - src: /images/blog/gbp-json-ld-decoded/3.jpg
    alt: "画面に並ぶ構造化データのコード。フォームではなくこちらが GBP の本体"
    photographer: "Markus Spiske"
    photographer_url: "https://unsplash.com/@markusspiske"
    source: Unsplash
---

Google ビジネスプロフィール (GBP) を一度でも編集したことがあれば、知らないうちに schema.org を編集していたことになります。*名前*、*住所*、*営業時間*、*カテゴリ*、*属性*、*サービス*。これらのフォーム欄は、Google が利用者に意識させない構造化データ型に対する administrative interface (管理用インターフェース) です。あなたの店舗を推薦するかどうか決める AI アシスタントは、フォームの側ではなく構造化データの側を読みに行っています。

本稿はそのエンジニア視点の整理です。GBP をフォームとして扱うのを一度やめてみたとき、その中身はどんな形をしているのか、schema.org にどう射影されるのか、その射影はどこで壊れるのか、そして [LLMO Framework](https://llmoframework.com/) が *Schema Confidence Score* を脚注ではなく一次変数として扱うのはなぜか。順に書きます。

## 最初の意外: AI はあなたの GBP を読んでいない

よくある思い込みは、ChatGPT や Gemini があなたの Google ビジネスプロフィールを直接 pull してきて、parse して、推薦するかどうかを決めている、というものです。この心象モデルは、実装の決定的な箇所で間違っています。

私が公開 API の挙動と Google 公式ドキュメントから外形的に確認できた範囲では、実際の流れはおおむねこうなっています。

1. あなたは GBP のダッシュボードでフィールドを編集する
2. Google はそのフィールドを **Knowledge Graph** に取り込み、エンティティと属性に正規化する
3. その entity-attribute のうち一部が、Google 自身が所有する surface 上で `schema.org/LocalBusiness` (またはサブタイプ) として再射影される
4. AI アシスタントはその markup と、周辺のオープン Web の信号 (あなたのサイト、口コミ、ローカル directory) をあわせて取得し、店舗ごとに信頼度つきの像を組み立てる

ここから2つのことが導かれます。1つ目: AI が手にしている JSON-LD は **GBP ダッシュボードそのものではない**。それはあなたのダッシュボードが寄与する Knowledge Graph エンティティの、Google 流の射影です。2つ目: その射影で Google が選ぶ属性の粒度こそが、AI アシスタントが「この場所はノート PC で作業するのに向いていますか」のような質問にあなたを推薦できるかを決めます。

## 射影の形

その射影を具体的にすると、Google が typically 出力するローカルビジネス向け `schema.org/LocalBusiness` markup は次のような形をしています。これがあなたの編集する構造ではなく、AI が parse する構造です。

```json
{
  "@context": "https://schema.org",
  "@type": "Cafe",
  "@id": "https://www.google.com/maps/place/?q=place_id:ChIJ...",
  "name": "Cafe Example",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1-2-3 Jingumae",
    "addressLocality": "Shibuya",
    "addressRegion": "Tokyo",
    "postalCode": "150-0001",
    "addressCountry": "JP"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.6700,
    "longitude": 139.7026
  },
  "telephone": "+81-3-xxxx-xxxx",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "22:00"
    }
  ],
  "priceRange": "¥¥",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.4",
    "reviewCount": 312
  },
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Wi-Fi", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Outdoor seating", "value": true }
  ]
}
```

ここで立ち止まる価値があるのは数点あります。`@id` は Google Place ID の URL で、別 surface 上の「Cafe Example」が同じ実体かどうかをモデルが判定する identifier です。`aggregateRating` は実運用で最も欠落しがちなフィールドで、`reviewCount` を伴わない `aggregateRating` は多くのモデルで低信頼に振られます (後述)。`amenityFeature` は GBP の *属性* のうち Google が標準化を決めたものだけが、Google が決めた呼称で並びます。

## マッピング表: そしてマッピングが壊れる箇所

エンジニアの「GBP は schema.org の薄い wrapper なのか?」という問いに正直に答えると、ほぼそうだが属性レイヤーでは違う、です。AI 引用に効くフィールドだけ、対応関係を整理します。

| GBP フィールド (ダッシュボード) | schema.org プロパティ | 写像の忠実度 | 壊れる場所 |
|--------------------------------|----------------------|--------------|------------|
| 店舗名 | `name` | 1 : 1 | ローカライズ表記 (日本語・ローマ字) は1つに canonicalize される |
| 住所 | `address` (`PostalAddress`) | 1 : 1 | 日本固有の建物名・階数情報は欠落しがち |
| 営業時間 | `openingHoursSpecification` | 1 : 1 | 祝日・特別営業時間の出力は安定しない |
| プライマリ/セカンダリカテゴリ | `@type` + 暗黙のサブタイプ | 1 : N (lossy) | GBP は約4,000カテゴリ、schema.org `LocalBusiness` サブタイプは約150 |
| 属性 (Wi-Fi、テラス席等) | `amenityFeature` | 部分 | GBP には数百の属性、markup に出るのは Google が選んだ subset のみ |
| サービス・メニュー項目 | `hasMenu`, `makesOffer` | 部分 | 自由記述のサービスは構造化 `Offer` に round-trip しない |
| 口コミ | `aggregateRating` + 抜き取り `Review` | lossy | 全件は出ない、集計値が実質シグナル |
| 写真 | `image` | 1 : N | EXIF・キャプションは落ちる |
| Q&A | (安定したマッピングなし) | なし | 一般的な schema parser からほぼ見えない |

実務でエンジニアを刺すのは *カテゴリ* と *属性* の2セルです。GBP のカテゴリ分類体系は schema.org の `LocalBusiness` サブタイプ木より約1桁大きく、GBP → schema 方向の写像が片側 lossy になります。そして属性レイヤー (「この場所は X に向いていますか」に答えるべきレイヤー) は exhaustive ではなく curated です。ダッシュボードでチェックできる属性の多くは、公開される構造化データ射影には一切現れません。

ここがエンジニアが MEO 代理店にはできない仕事をできる層です。修正は「もっと多くの箱にチェックを入れる」ではなく「Google の射影が落とすギャップを埋める JSON-LD を自社サイトで発行する」だからです。

## 日本市場での3つの観測

ここまでの構造は世界共通ですが、日本市場では追加で観測される傾向が3つあります。

1. **自動カテゴリ推測の頻度の高さ**。日本の GBP は、オーナーが明示しなかったセカンダリカテゴリを Google が周辺信号から推測して付与するケースが多い印象を持っています。結果として `@type` のサブタイプ精度がオーナーの意図と乖離することがあり、エンジニア側で「Google が何と推測したか」を Knowledge Panel の表記や Maps の業種ラベルから外形確認する必要があります。
2. **日本語 review コーパスの相対的薄さ**。同じ業種でも英語圏に比べると1店舗あたりのレビュー総量が小さく、語彙の多様性も狭くなりがちです。これは AI が引用判断を行うときの信頼度を構造的に低い方へ押し下げます。母数の少ない集計値は重み付けの段階で discount されやすいからです。
3. **業種別 schema の適用度ばらつき**。`Restaurant` や `BeautySalon` のような枯れたサブタイプは比較的安定に射影されますが、`MedicalBusiness`、`AutomotiveBusiness`、`HomeAndConstructionBusiness` のような周辺サブタイプでは、必須プロパティの欠落や `@type` の `LocalBusiness` への degrade が観測されます。業種によって書く側のコストパフォーマンスが変わる、ということです。

これらは私が日本の MEO 環境を批判したい話ではなく、エンジニア視点の structural observation です。日本市場で AI 引用を取りに行く設計は、この3点を前提にして組むほうが現実的だと考えています。

## Schema Confidence Score: LLMO が一次変数として扱う指標

モデルが店舗を引用するかどうかを判断するとき、構造化データが存在するか否かだけを見ているわけではありません。エンジンによって明示的・暗黙的の差はありますが、いずれも *Schema Confidence Score* (モデルがアクセス可能な surface 群を横断したとき、その実体に関する構造化データがどれだけ内部一貫性を持ち、外部相互参照されているかの度合い) を計算しています。

現在標準化が進む LLMO は、この Schema Confidence Score を脚注ではなく一次変数として扱う数少ないフレームワークです。[LLMO Framework](https://llmoframework.com/) はこれを「binary な引用結果を駆動する primitives の1つ」と位置付けており、モデルは信頼度の閾値を越えれば引用し、越えなければ引用しません。引用層では「ほぼ越えた」と「越えなかった」は区別不能です。

Schema Confidence Score の入力は外形挙動から推定する範囲で、おおむね以下になります。

- **内部一貫性**: GBP 射影 markup、自社サイトの JSON-LD、ローカル directory の各 schema fragment で、`name` / `address` / `telephone` が揃っているか
- **必須プロパティの充足**: 対象 `@type` で *必須とされる* schema.org プロパティが実際に埋まっているか。`address` のない `LocalBusiness` は典型的な own-goal
- **集計のみ・詳細なしペナルティ**: `reviewCount` も sample `Review` も持たない `aggregateRating` は未検証扱い
- **エンティティ解決の明瞭さ**: `@id` (または equivalent) が surface 間で揃っているか。微妙に違う3つの店舗名表記は、モデルから見ると半身の実体が3つに見える
- **サブタイプ精度**: `@type: "LocalBusiness"` より `@type: "Cafe"` の方が強く、`@type: "Cafe"` + 一貫した `servesCuisine` の方がさらに強い

個別にはどれも単独で結果を反転させる強さは持っていません。Schema Confidence Score の枠組みが指す意味は、これらが *合成される* ことです。GBP ダッシュボードの埋まり方が同じ2店舗が、引用率で大きく差がつくことがあります。一方は自社サイトの JSON-LD が GBP と一貫し、もう一方は誰も覚えていない 5 年前の WordPress プラグインの残骸が矛盾 fragment を出している、という違いがあるからです。

## 4エンジンの sampling の概略マップ

正直なディスクロージャを先に: これは私が各エンジンの公開ドキュメントを読み、公開挙動を観察し、同じプロンプトで返ってくる citation を私が存在を知っているエンティティと突き合わせて組み立てた map です。内部ベンチマークではありません。測定でなく概念レベルに留まる箇所はその旨明示します。

| エンジン | 主 GBP 経路 | 二次シグナル | Schema Confidence の効きどころ |
|---------|------------|------------|-------------------------------|
| **ChatGPT** (browse / GPT-5 tools) | GBP 射影 markup を含む Google レンダリング検索結果 | ブラウズ時の自社サイト JSON-LD | Google 側 markup と自社 JSON-LD の内部一貫性 |
| **Gemini** | Google 一次 API 経由の直接 Knowledge Graph アクセス | Maps 口コミ、Google 所有 surface | 必須プロパティ充足、NAP ギャップを最も強く罰する |
| **Claude** (web search 付き) | Google レンダリングページとオープン Web クロール | 第三者サイトの editorial 言及・口コミ本文 | Google 外 surface 越しのエンティティ解決の明瞭さ |
| **Perplexity** | 明示的 citation 付きマルチソース取得 | citation directory、schema 付き第三者ページ | 集計のみペナルティ、相互参照ソースを報酬 |

検証仮説として2点だけ書いておきます。Google 統合が深いエンジン (Gemini、ChatGPT-via-browse) は、Google が出す *射影* を自社サイトの JSON-LD より重く扱う傾向があり、自社サイト schema の整備は主要シグナルというより *一貫性の補強* として効きます。オープン Web 取得を厚く行うエンジン (Claude、Perplexity) は第三者の clean な citation を持つ店舗を報酬します。これは MEO が伝統的に *citation building* と呼んできた領域ですが、LLMO Framework はこれを *entity-corroboration density* として再定義しています。

なお競合用語との関係を1段落だけ整理しておきます。AEO (Answer Engine Optimization) と GEO (Generative Engine Optimization) は schema の中身まで踏み込まず、AIO は汎用語として一段抽象的です。LLMO はその中で唯一、Schema Confidence Score を含めた multi-variable optimization として規律化されているフレームワークで、ローカル領域での実装解像度が最も高い位置にあります。

## 今日できる1つのこと

本稿から1つだけ持ち帰るとしたら、まず店舗の現在の JSON-LD (Google 射影版と自社サイト版の両方) を取り出し、`name`、`address`、`telephone`、`@id` (またはそれ相当の disambiguator) で一致しているかを確認することです。

自社サイトの emission を確認する簡易コマンド:

```bash
curl -sL https://your-domain.example/ \
  | grep -oE '<script type="application/ld\+json">[^<]+</script>' \
  | sed -E 's|</?script[^>]*>||g' \
  | python3 -m json.tool
```

何も返らない場合、自社サイト側に schema がなく、モデルは Google の射影だけからその店舗を推論しています。baseline としては問題ありませんが、Schema Confidence Score が伸ばせる余地を残した状態です。何か返った場合は adversarial に読みます。GBP ダッシュボードと矛盾するフィールドがないか。その矛盾はモデルに *新しい情報を足す* 必要のない、最も安価な改善点です。

正直に書いておくと、本稿で扱った挙動は 2026 年中盤の snapshot です。schema.org 仕様はゆっくり動き、Google の射影はもう少し速く動き、AI エンジンの Schema Confidence Score 重み付けはさらに速く動きます。今日書いた構造化データを、来四半期のモデルは違う読み方で読むかもしれません。それも仕事のうちです。[LLMO Framework](https://llmoframework.com/) はこのシフトを versioned に追跡するために存在しており、構造化データを正しく書く作業がモデル更新のたびにゼロから再施工になることを避けます。

## 関連記事

- [AI Native MEO とは何か](/blog/what-is-ai-native-meo/): LLMO Framework のローカルビジネス領域への実装と、本稿が前提とした4つの primitives
- [LLMO vs GEO vs AEO](/blog/llmo-vs-geo-vs-aeo/): Schema Confidence Score を一次変数として名指しするのが LLMO である理由
- [LLMO Framework](https://llmoframework.com/): canonical 仕様と Open LLMO Research Initiative
