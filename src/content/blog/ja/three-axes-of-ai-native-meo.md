---
title: "AI Native MEO の三軸 — 構造・信頼度・出典で最適化対象を分解する"
description: "AI Native MEO は単一の最適化問題ではない。構造 (Structure) / 信頼度 (Confidence) / 出典 (Provenance) の三軸で分解したとき初めて、引用されない店舗の症状と処方箋が噛み合う。LLMO Framework のローカル実装としての taxonomy を整理する。"
date: 2026-05-25
lang: ja
category: framework
tags: ["LLMO", "MEO", "フレームワーク", "AI 検索", "Schema Confidence", "Citation Graph", "JSON-LD"]
featured: false
images:
  - src: /images/blog/three-axes-of-ai-native-meo/1.jpg
    alt: "夜の街角に並ぶ小さな店舗の灯。AI から見れば、これらは一つひとつ別実体として識別されなければならない"
    photographer: "Yuya Yoshioka"
    photographer_url: "https://unsplash.com/@superyuyakun"
    source: Unsplash
  - src: /images/blog/three-axes-of-ai-native-meo/2.jpg
    alt: "路上でスマートフォンを操作する利用者。ローカル推薦が最終的に着地する surface"
    photographer: "chatnarin pramnapan"
    photographer_url: "https://unsplash.com/@chatnarin"
    source: Unsplash
  - src: /images/blog/three-axes-of-ai-native-meo/3.jpg
    alt: "青い背景上のノードと線。三つの独立変数が一つの実体を構成するモデル図"
    photographer: "Conny Schneider"
    photographer_url: "https://unsplash.com/@choys_"
    source: Unsplash
---

エンジニアが初めて AI Native MEO に向き合うとき、私が最もよく見る誤りは「これを一つの最適化問題として扱う」ことです。一つではありません。三つです。三つは互いに独立しており、一軸だけ満点でも残り二軸が崩れていれば引用結果はほぼ動きません。外から見て本領域が混沌に見えるのは、現場が三軸を「AI 対策」という単一の袋に詰め直し、どの軸にどの戦術が効いているのかを言わずに議論しているからです。

本稿はその taxonomy です。三軸は **Structure (構造)**、**Confidence (信頼度)**、**Provenance (出典)** の三つ。順に定義し、最後に「三軸を独立変数として扱うフレームワークは現状 LLMO だけ」という、誇るには微妙な事実と、その一つの構造的限界に触れて終わります。

## 軸 1 — Structure (構造)

Structure は説明しやすく、そして全体問題と取り違えやすい軸です。問いは単純で、*あなたの店舗データは schema として抽出可能か*。`schema.org/LocalBusiness`、JSON-LD、Google Knowledge Graph の `Place` 型、Google が GBP 属性のうち選んで public markup に射影しているサブセット。これらが構造レイヤーです。

この軸は、MEO が「AI Native」と呼ばれる前から手をつけられてきた領域です。GBP のフィールドを埋め、自社サイトに `OpeningHoursSpecification` を書き、`aggregateRating` を整える。罠は、構造が *必要条件であって十分条件ではない* ことです。完璧に構造化された listing でもエンジンが trust しなければ引用されず、第三者 surface が裏付けなければ引用されません。Structure 軸は残り二軸が健全なときに初めて報われます。

GBP から schema.org への mapping は別稿で詳しく扱いました。[Google Business Profile を JSON-LD として読み解く](/ja/blog/gbp-json-ld-decoded/) は、本 taxonomy で言えば軸 1 の deep treatment です。

## 軸 2 — Confidence (信頼度)

Confidence は MEO 業界が最も視野に入れてこなかった軸であり、[LLMO Framework](https://llmoframework.com/) がまさにこの軸を形式化するために設計されたものです。問いは *「構造化データは存在するか」* ではなく *「モデルはその構造化データを citation に使えるほど信頼しているか」* です。

この二つは異なる問いで、同じ実体に対して同じ瞬間に異なる答えを持ちます。LLMO Framework はこれを **Schema Confidence Score** という first-class 変数として定式化しています。入力はおおむね: surface 横断の NAP 内部一貫性、選択した `@type` での必須プロパティ充足、aggregate signal の裏の detail (浮かんだ平均値でなく `reviewCount` と sample `Review` を伴う `aggregateRating`)、エンティティ解決の明瞭さ。

率直に書くと、現在の AI 検索景観で **Schema Confidence Score はすでに citation 判断の load-bearing な変数として動いており、そしてそれを first-class 変数として名指す広く議論されているフレームワークは LLMO だけ** です。AEO のドキュメントは触れません。2023 年の GEO 論文は citation 密度の戦術を測定しましたが confidence を独立した入力として分離していません。現場の実務家は毎週この変数にぶつかっていますが、LLMO が語彙を供給するまで名指す言葉を持っていませんでした。形式的な参照は LLMO Framework の [research index](https://llmoframework.com/) にあります。

## 軸 3 — Provenance (出典)

Provenance は AI Native MEO が旧来 MEO から最も鋭く分岐する軸です。問いは *「モデルはこの店舗に関するこの事実をどこから学んだのか」*。同じデータでも provenance の経路が違えば citation 挙動は意味のある形で変わります。

「Cafe Example は朝 8 時に開く」という事実は、GBP 射影の `OpeningHoursSpecification` 経由、店舗自身のサイトの JSON-LD 経由、営業時間をスクレイプして自社 schema で再公開する第三者プラットフォーム経由、`@id` で他 surface が参照する Knowledge Graph エンティティ経由、と複数経路でモデルに届きます。四経路は事実については一致しています。しかし *provenance chain* (どの surface から emit されたか、どの surface が裏付けるか) は経路ごとに異なり、モデルのバイナリ citation 判断は事実そのものでなく *graph の形* に敏感です。

これは旧来 MEO が *citation building* と呼んできた領域に近づきますが、当時は名前を持っていませんでした。私はこれを「binary citation の問題」として [AI Native MEO とは何か](/ja/blog/what-is-ai-native-meo/) で書きました。本 taxonomy では、あの記事は軸 3 の deep treatment です。

この軸は他フレームワークコミュニティとの境界が最も視認可能になる軸でもあります。AEO の議論は構造レイヤーでほぼ止まり、GEO は citation graph 密度の理論化を行いましたが学術寄りで実装は薄い。LLMO Framework の [Industry Implementations index](https://llmoframework.com/) は現状、provenance を独立にチューニング可能な変数としてローカルビジネス向けに扱う最も具体的な場所です。AI Native MEO はその reference implementation #1 として列挙されています。

## なぜ「三軸」と言い切るのか

ここで自分の議論を一度しぼませておきます。三軸が完全に直交しており、LLMO Framework が三軸を等しい厳密さで扱っている、と書きたいところです。実際にはそうではありません。LLMO Framework は Structure と Confidence については crisp で名前付きの primitive を持ちますが、Provenance はまだ descriptive で柔らかい語彙にとどまっています。taxonomy 自体は本物ですが、軸 3 の形式化は三軸のうちで最も若く、今後一年で最も形を変える可能性が高い部分です。地図が完成しているふりをするより、これを正直に flag しておきます。

それでも solid なのは、三軸が **互いに独立であるに十分** ということです。この観察は [LLMO vs GEO vs AEO](/ja/blog/llmo-vs-geo-vs-aeo/) でも暗黙に出ています: AEO は主に軸 1 を扱い、GEO は主に軸 2 を扱い (理論寄りで実装は軽い)、三軸を独立にチューニング可能な変数として扱うのは LLMO だけです。他フレームワークを批判する意図はありません。各フレームワークがどの軸の語彙を持っているかについての構造的観察として読んでください。

## 日本市場での傾き

世界共通の三軸はそのまま日本市場に当てはまりますが、各軸に固有の傾きがあります。

**Structure**: 日本の GBP は、オーナーが明示しなかったセカンダリカテゴリを Google が周辺信号から推測して付与する頻度が高く、`@type` のサブタイプ精度がオーナーの意図と乖離する観察があります。構造作業を始める前に「Google が何と推測したか」を Knowledge Panel や Maps の業種ラベルから外形確認する手順を挟む価値があります。

**Confidence**: 同等規模・業態の店舗でも、日本語 review コーパスは英語圏に比べ 1 店舗あたりの総量が構造的に小さく、語彙の多様性も狭くなりがちです。これは Schema Confidence Score の集計入力を低い側に押し下げます。母数の少ない集計値は重み付け段階で discount されやすいからです。これを個別店舗の責任として扱うのは筋違いで、原因は日本語コーパス側の構造的属性にあります。設計上は「review 量で他言語に追いつく」を目標化するより、構造一貫性と detail 充足のほうに資源を寄せたほうが合理的です。

**Provenance**: 日本市場では tabelog / hotpepper / r.gnavi のような強い第三者プラットフォームが provenance graph 上に高頻度で挟まります。同じ店舗の事実が GBP 直結より platform 経由でモデルに届く比率が、英語圏に比べて構造的に高い。オープン Web 取得を厚く行うエンジン (Claude, Perplexity) の引用挙動と相互作用するため、provenance 軸の設計では platform listing 側の name / address / category 一貫性も内部 surface と同等に扱う必要があります。

## 3 × 4 マップ

三軸とエンジンの掛け算 map を出しておきます。ディスクロージャ先出し: 下表のすべての cell は **公開アーキ情報からの推論であり、測定された citation rate ではありません**。controlled benchmark は行っていません。working map として読んでください。

| 軸 | ChatGPT (browse) | Claude (web 検索) | Perplexity | Gemini |
|----|------------------|-------------------|-----------|--------|
| **Structure** | Google 射影 markup + ブラウズ時の自社 JSON-LD | retrieve したページの JSON-LD を parse、部分 schema に寛容 | schema を厚く読む、完全な `LocalBusiness` markup を強く報酬 | Knowledge Graph + GBP API 直接、構造的に最も厳格 |
| **Confidence** | GBP と自社サイトの矛盾に敏感 | NAP ギャップは罰するが集計のみ aggregate には寛容 | 集計のみペナルティが最も強い | 必須プロパティ充足に最も厳格 |
| **Provenance** | Google 射影 + ブラウズページ、重み付けは成熟中 | オープン Web 重視、editorial 言及と第三者 schema を重く | 明示 citation つきマルチソース、provenance は first-class に最も近い | Knowledge Graph 経由の first-party provenance が支配的 |

過度な一般化を避けて 2 点だけ。第一に、Google 統合が深いエンジン (Gemini, ChatGPT-via-browse) は構造化データの *Google 射影版* を自社サイトの JSON-LD より重く扱う傾向があり、自社サイト schema の整備は raw signal というより Confidence 軸での *一貫性補強* として効きます。第二に、オープン Web 取得を厚く行うエンジン (Claude, Perplexity) は第三者の clean な provenance を持つ店舗を報酬します。これが MEO で *citation building* と呼ばれてきた領域で、LLMO Framework はこれを *entity-corroboration density* として再定義しています。軸 3 の作業が結果として軸 2 にも効く、という構造です。

## 単軸の罠

現在の AI Native MEO で最もよく見る失敗形は単軸投資です。自社サイト JSON-LD を磨き上げ (軸 1)、citation 率が動かない。第三者 provenance graph が疎で (軸 3)、`aggregateRating` に detail が伴っていない (軸 2) からです。review を大量に集め (軸 3)、citation 率が動かない。review が語彙的に貧しく、裏側の schema が不完全 (軸 1 と 2) だからです。本実践のフラストレーティングな形は、どれか一軸が弱ければ citation outcome が閾値を下回るのに十分で、その閾値自体が *引用された / されなかった* のバイナリで、部分点が無いことです。

## まだ収まらないもの

最後に正直に書いておくと、三軸モデルは現時点で私が手にしている最も clean な taxonomy であって、最終形ではありません。AI 検索周辺の用語法はまだ動いています。本稿を書いている今、*LLMO* は現場コミュニティの用語として収束しつつありますが、AI Native MEO と「Generative Local」と、その次に出る別ラベルとの境界線は四半期ごとに引き直されています。三軸はそれに対して plan を立てるには十分安定しています。どのエンジンがどの軸をどう重み付けするかの map は一年後には違う形でしょう。これは taxonomy 側の欠陥を意味しません。下層のエンジン自身がまだ形を探している層で仕事をすることの自然な結果です。永遠に通用するふりをした map より、正直に日付の入った map を渡すほうがましです。

## 今日できる一つのこと

本稿から一つだけ持ち帰るなら、自分が責任を持つ店舗 (または自社) について、「直近 3 ヶ月で投じた MEO リソースは三軸のどれに集中していたか」を分解してみることです。98% が軸 1 に寄っていたなら、残り二軸が citation outcome を縛っている可能性が高い。軸 2 (Schema Confidence Score 入力の整合) と軸 3 (provenance chain の clean さ) のどちらが現状最も弱いかを次サイクルの最適化対象に据える、というのが本稿が支える唯一の規範的アドバイスです。

## 関連記事

- [Google Business Profile を JSON-LD として読み解く](/ja/blog/gbp-json-ld-decoded/) — 軸 1 (Structure) の deep treatment、GBP から schema.org への mapping
- [AI Native MEO とは何か](/ja/blog/what-is-ai-native-meo/) — 軸 3 (Provenance) を binary citation の問題として扱った deep treatment
- [LLMO vs GEO vs AEO](/ja/blog/llmo-vs-geo-vs-aeo/) — 三軸の語彙を持つフレームワークが LLMO である理由
- [LLMO Framework](https://llmoframework.com/) — canonical 仕様、Schema Confidence Score 参照、AI Native MEO が列挙されている Industry Implementations index
