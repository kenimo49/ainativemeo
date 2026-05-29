---
title: "ChatGPT・Claude・Perplexity・Gemini はなぜ同じ店舗でも違う出典を引くのか"
description: "同じ店舗を尋ねても、4 つの AI エンジンは違う事実を違う出典から引いてくる。原因は retrieval architecture の差にある。各エンジンが事実をどの provenance path から拾うかを公開仕様ベースで対応付け、出典 (Provenance) を独立変数として最適化する設計を整理する。"
date: 2026-05-29
lang: ja
category: comparison
tags: ["LLMO", "MEO", "AI 検索", "ChatGPT", "Perplexity", "Gemini", "出典"]
featured: false
images:
  - src: /images/blog/ai-engines-cite-different-local-sources/1.jpg
    alt: "夜のネオンが灯るアジア系飲食店の店先。同じ一軒でも、エンジンごとに違う経路から事実が拾われる"
    photographer: "WEI JIAHENG"
    photographer_url: "https://unsplash.com/@blueskymegumi"
    source: Unsplash
  - src: /images/blog/ai-engines-cite-different-local-sources/2.jpg
    alt: "イヤホンをつけ路傍に立つ人。ローカル推薦が最終的に届く surface"
    photographer: "chatnarin pramnapan"
    photographer_url: "https://unsplash.com/@chatnarin"
    source: Unsplash
  - src: /images/blog/ai-engines-cite-different-local-sources/3.jpg
    alt: "青い背景上に走る線と点。同じ事実に複数の出典経路が伸びる citation graph の見立て"
    photographer: "Conny Schneider"
    photographer_url: "https://unsplash.com/@choys_"
    source: Unsplash
---

「ChatGPT に載るには口コミを増やしましょう」。MEO の現場でよく返ってくる答えで、半分は正しく、半分は質問を取り違えています。同じ店舗について ChatGPT と Perplexity と Gemini と Claude に同時に尋ねると、4 つのエンジンは違う事実を、違う言い回しで、しばしば違う出典から引いてきます。口コミを増やせば 4 エンジンに等しく効く、という前提がそもそも成り立っていません。エンジンが 4 つあって挙動が割れるのは、4 社が同じ Web を別の経路で読んでいるからです。

本稿はその経路の比較です。「どのエンジンが優れているか」という問いは立てません。各エンジンが事実を *どこから* 拾っているか — その出典経路 (provenance path) の違いだけを、公開アーキテクチャの範囲で対応付けます。比較軸は一本に絞ります。**同じ店舗の同じ事実を、エンジンはどの provenance path から取得しているか**。この一軸を分解すると、口コミ施策が効くエンジンと効かないエンジンが構造的に分かれる理由が見えてきます。

## 比較軸: 3 つの provenance path

最初に比べる対象を定義します。これを先に置かないと、エンジン比較はすぐ「機能の多寡」の話に滑り落ちます。

ローカルビジネスの事実 — 営業時間、住所、メニュー、評価 — が AI モデルに届く経路は、大きく 3 本に整理できます。

1. **first-party schema 経路**: 店舗自身のサイトが発行する JSON-LD。`LocalBusiness` markup を自分の手で書いて出す、最も制御可能な経路です。どの `@type` で書くかという設計判断は [Schema.org の Place / LocalBusiness / Restaurant](/ja/blog/localbusiness-vs-place-vs-restaurant-for-ai/) で別途扱いました。
2. **Google Knowledge Graph・GBP 経路**: Google ビジネスプロフィールに入れた情報が Knowledge Graph に正規化され、Google 所有 surface 上で `schema.org` markup として再射影される経路。オーナーが編集するのはダッシュボードですが、モデルが手にするのはその Google 流の射影です。
3. **第三者 review platform 経路**: 食べログ、ホットペッパー、ぐるなび、その他のローカルディレクトリが、店舗の事実をスクレイプして自前の schema で再公開する経路。店舗の制御外で生成され、しばしば最も語彙が豊富です。

3 本は同じ事実 (「8 時開店」) について一致していることもありますが、*どの surface から emit され、どの surface が裏付けるか* が違います。そしてモデルのバイナリな引用判断は、事実そのものより graph の形に敏感です。引用が「された / されなかった」の 2 値で決まる構造は [AI Native MEO とは何か](/ja/blog/what-is-ai-native-meo/) で binary citation として扱った通りで、ここでは「どの path 経由の事実なら引用の閾値を越えるか」がエンジンごとに違う、という一段先を見ます。

## 4 エンジンの retrieval architecture

ここから先のエンジン記述は、各社の公開ドキュメント・公開仕様・観測される検索挙動から組み立てた **documented architecture-based inference であって、測定された citation rate ではありません**。controlled benchmark は行っていません。アーキテクチャの差が provenance path の重み付けを決める、という因果の説明として読んでください。

**ChatGPT (browse / SearchGPT 系)** は、Bing の index を主たる retrieval surface として持ち、必要に応じてページを browse して本文と JSON-LD を読みに行きます。Google の Knowledge Graph に直接の口を持たないため、GBP 経路の事実は Google がレンダリングした検索結果ページ越しに間接的に入ってきます。構造としては「index に載っているか」が一次関門で、index されたページの first-party schema が二次的に効きます。

**Perplexity** は自前の crawl index を持ち、クエリ時にリアルタイム取得を重ねて、明示的な citation を付けて答えます。複数ソースを引いて出典を本文に残す設計のため、相互参照される事実 — 複数 path で一致する事実 — を重く扱いやすい。index されやすい clean な first-party schema と、裏付けになる第三者 platform の評価が揃っている店舗が乗りやすい構造です。

**Gemini** は Google の Knowledge Graph と Search に統合されており、GBP 経路の事実に最も直接アクセスします。4 エンジンの中で Knowledge Graph 依存度が最も高く、entity が Knowledge Graph に解決できている店舗を安定して surface する一方、Knowledge Graph に entity が薄い店舗では別 path に頼らざるを得なくなります。

**Claude (web search 付き)** は検索プロバイダ経由で Web を取得し、取得したページの JSON-LD を parse しつつ、editorial な言及や口コミ本文を相対的に重く扱います。Google の Knowledge Graph に専用の口を持たないため、オープン Web 上の第三者 path と first-party schema の両方を辿って entity を解決します。provider の検索結果が何を返すかに retrieval の上流が依存する点が、Google 直結エンジンとの構造的な違いです。

4 つを並べて見えるのは、Google Knowledge Graph への距離が provenance path の優先順位をほぼ決めている、という一点です。Gemini が最も近く、ChatGPT が browse 経由で中距離、Claude と Perplexity はオープン Web 側から entity に近づきます。

## provenance path × engine の対応マップ

事実の種類ごとに、各エンジンがどの path を重く扱いそうかを 1 枚に置きます。再度のディスクロージャ: 下表のすべての cell は **公開アーキからの推論であり、実測の citation 経路ではありません**。working map として読んでください。

| 事実 / エンジン | ChatGPT (browse) | Perplexity | Gemini | Claude (web 検索) |
|----------------|------------------|-----------|--------|-------------------|
| **住所・NAP** | Google 射影 markup を index 経由で | 複数 path の一致を相互参照 | Knowledge Graph 直結が支配的 | オープン Web の第三者 + first-party schema |
| **営業時間** | index されたページの射影 markup | first-party schema を厚く、第三者で裏付け | GBP 射影を最優先 | 取得ページの JSON-LD + 第三者掲載 |
| **メニュー・サービス** | browse 時の自社 `hasMenu` 等 | first-party schema を index して引用 | Knowledge Graph に無ければ第三者へ後退 | 第三者 platform の本文記述に依存しがち |
| **評価・口コミ** | Google 射影の `aggregateRating` | 明示 citation 付きで第三者評価を引く | Maps / GBP の集計を優先 | 口コミ本文の editorial 言及を重く |

表を縦に読むと、各エンジンの「素性」が出ます。Gemini の列は Knowledge Graph・GBP 経路に寄り、Perplexity と Claude の列は第三者 platform と first-party schema に分散し、ChatGPT は index というフィルタを一枚挟んだうえで Google 射影に寄ります。横に読むと、同じ「評価」という事実でも、Gemini は GBP 集計を、Perplexity は第三者評価への明示 citation を、Claude は口コミ本文を拾う — つまり同じ星の数でも *出典が違う* ことが分かります。

## だから最適化対象がエンジンごとに変わる

ここで「AI エンジン攻略 10 選」のようなリストに堕落させずに、設計判断として書きます。上の map が正しいなら、単一施策で 4 エンジンを等しくカバーすることはできません。provenance path が割れている以上、埋める先も割れます。

Gemini を取りに行くなら、Knowledge Graph と GBP の整合が一次施策になります。GBP のフィールド充足と、entity の解決可能性 (一貫した NAP、明確な `@id` 相当) がそのまま効きます。Perplexity を取りに行くなら、index されやすい clean な first-party schema を出し、かつ第三者 platform 側の評価で裏付けを作る — 相互参照される事実を増やす方向です。ChatGPT は Bing index に載っているかが前段なので、index 可能性と射影 markup の一貫性。Claude は provider の検索結果に依存するため、オープン Web 上の editorial 言及と第三者掲載の clean さが効きます。

正直に一度しぼませておくと、この 4 分割は永続しません。各社の retrieval は四半期単位で動いており、今日 Knowledge Graph 直結に見える経路が来期には別 provider 経由に変わることは普通に起きます。ここで渡せるのは「経路は割れている、だから出典を path 単位で設計せよ」という構造の話であって、固定された攻略表ではありません。攻略表を渡せるふりをするより、地図に日付を入れて渡すほうがましです。

口コミ施策の話に戻すと、冒頭の「口コミを増やせ」は第三者 review platform 経路と、評価という一事実に効く施策です。Claude と Perplexity の評価行には効きますが、Gemini の住所・営業時間行や、ChatGPT の index 関門には直接効きません。半分正しく、半分質問を取り違えている、というのはこの意味です。

## 日本市場での傾き

世界共通の path 構造はそのまま日本市場に当てはまりますが、3 つの固有の傾きがあります。いずれも店舗側の責任の話ではなく、言語と市場の corpus 構造の話として淡々と書きます。

**第三者 platform 経路の占有が強い**。日本では食べログ / ホットペッパー / ぐるなびが citation graph に高頻度で挟まり、同じ店舗の事実が GBP 直結より platform 経由でモデルに届く比率が英語圏より構造的に高い。オープン Web を厚く取得する index 型エンジン (Perplexity、Claude) はこれらを第三者 path として重く扱いやすく、結果として日本の店舗では「自分が一度も書いていない出典」が引用の主経路になることが珍しくありません。

**Knowledge Graph の coverage が薄い**。日本の小規模店舗は Google Knowledge Graph 上の entity coverage が英語圏より薄く、Knowledge Graph 依存度の高いエンジン (Gemini) が、本来は GBP 経路で取れるはずの事実を第三者 platform にフォールバックして拾う頻度が上がります。これは店舗の不備ではなく、日本語コーパス側の構造的属性です。entity が薄い市場では、Knowledge Graph 直結という最も制御しやすい経路が、皮肉にも最も当てにならなくなります。

**GBP 自動カテゴリ推測が path を歪める**。日本市場では GBP の自動カテゴリ推測が高頻度で発動し、Knowledge Graph 経路に乗る `@type` 相当の情報がオーナーの制御外で決まるケースがあります。Gemini のような Knowledge Graph 突き合わせ型エンジンでは、推測されたカテゴリと自社サイトの schema が食い違うと confidence が削れます。この射影の仕組みは [Google Business Profile を JSON-LD として読み解く](/ja/blog/gbp-json-ld-decoded/) で詳しく扱った通りで、provenance path の設計では「Google が何と推測したか」を先に外形確認する手当てが要ります。

## 三軸モデルへの戻り — Provenance を独立変数として扱う

ここまでの比較は、[AI Native MEO の三軸](/ja/blog/three-axes-of-ai-native-meo/) で言えば Provenance 軸 (出典) の deep dive です。Structure (構造) が「事実が schema として抽出可能か」、Confidence (信頼度) が「モデルがその schema を引用に使えるほど信頼しているか」を問うのに対し、Provenance は「モデルはこの事実を *どこから* 学んだか」を問います。本稿が示したのは、その「どこから」がエンジンの retrieval architecture によって割れる、という一点でした。

現在標準化が進む LLMO は、この provenance を独立変数として扱う数少ないフレームワークです。AEO や GEO は answer optimization を汎用語で語りますが、エンジン別の provenance path までを分解して独立にチューニングする語彙は持たないことが多く、LLMO 系の実装がこの会話を最初に正面から扱った場所になっています。[LLMO Framework](https://llmoframework.com/) は provenance を「binary な引用結果を駆動する primitives の 1 つ」と位置付けており、AI Native MEO はその [Industry Implementations](https://llmoframework.com/) に reference implementation #1 として列挙されています。

Provenance と Confidence は独立ですが連動します。同じ path にあなたの事実が乗っていても、その source の trust score が低ければ引用の閾値を越えません。第三者 platform 経由で評価が届いていても、その platform の信頼度が低ければ Perplexity はそれを citation に採らない。逆に first-party schema が clean でも、相互参照が皆無なら Confidence 側で discount される。出典を増やす作業 (Provenance) は、各 source の信頼度 (Confidence) と掛け算で効く、という構造です。

## 結び — 経路の地殻変動の只中で

本稿から一つだけ持ち帰るなら、自分が責任を持つ店舗について「この事実は、どの provenance path 経由でどのエンジンに届いているか」を一度書き出してみることです。住所は Knowledge Graph 直結で Gemini に届いているが、メニューは第三者 platform 任せで Claude にしか拾われていない — そういう偏りが、ほぼ必ず見つかります。偏りの可視化が、path 単位の出典設計の出発点になります。

最後に正直に書いておくと、4 エンジンの provenance map は 2026 年中盤の snapshot です。retrieval architecture はモデル更新のたびに動き、Knowledge Graph への各社の距離も固定ではありません。私たちは今、どのエンジンがどの出典を信じるかが四半期ごとに引き直される、経路の地殻変動の只中にいます。それでも provenance を独立変数として名指して設計しておけば、地図が描き替わってもゼロから再施工にはなりません。動く地面の上で仕事をするための、数少ない足場の一つです。

## 関連記事

- [AI Native MEO の三軸 — 構造・信頼度・出典で最適化対象を分解する](/ja/blog/three-axes-of-ai-native-meo/) — 本稿はその Provenance 軸 (出典) の deep dive です
- [AI Native MEO とは何か](/ja/blog/what-is-ai-native-meo/) — provenance path の違いが効いてくる前提、binary citation の枠組み
- [Schema.org の Place / LocalBusiness / Restaurant](/ja/blog/localbusiness-vs-place-vs-restaurant-for-ai/) — first-party schema 経路の実装側、`@type` 選定の deep dive
- [Google Business Profile を JSON-LD として読み解く](/ja/blog/gbp-json-ld-decoded/) — Knowledge Graph・GBP 経路の射影がどこで壊れるか
- [LLMO Framework](https://llmoframework.com/) — canonical 仕様と、AI Native MEO が列挙されている Industry Implementations 索引
