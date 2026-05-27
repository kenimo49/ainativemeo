---
title: "Schema.org の Place / LocalBusiness / Restaurant: AI アシスタントはどの type を最も重く扱うのか"
description: "schema.org LocalBusiness 系の継承ツリーをエンジニアの目で辿り、各サブタイプが獲得する property の差分と、四つの AI エンジンが階層をどう解決しているらしいかを公開仕様ベースで整理する。日本市場のタベログ系 taxonomy・GBP 自動カテゴリ推測との不一致も扱う。"
date: 2026-05-27
lang: ja
category: engineering
tags: ["LLMO", "MEO", "Schema.org", "JSON-LD", "LocalBusiness", "AI 検索", "エンジニアリング"]
featured: false
images:
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/1.jpg
    alt: "木製の扉と窓が並ぶ小さな店舗の外観。AI は一つの実体としてこれをひとつの schema type に圧縮しなければならない"
    photographer: "Alan Jiang"
    photographer_url: "https://unsplash.com/@alan_j"
    source: Unsplash
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/2.jpg
    alt: "QR メニューを表示するスマートフォン。type の選択が AI の語れる内容を静かに左右する surface"
    photographer: "Markus Winkler"
    photographer_url: "https://unsplash.com/@markuswinkler"
    source: Unsplash
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/3.jpg
    alt: "青い背景に走る線と点。継承グラフを別名で描いたような図"
    photographer: "Conny Schneider"
    photographer_url: "https://unsplash.com/@choys_"
    source: Unsplash
---

「とりあえず `LocalBusiness` を貼っておけばいい」。これは MEO 業界がこの十年あまり繰り返してきた回答で、AI アシスタントが `@type` をエンティティ全体の解釈ヒントとして読みに来る前提を一度受け入れた瞬間に、正しくなくなる回答です。`@type` フィールドはラベルではありません。モデルが「この実体にはどの property が現れるはずか」「どこまで推論で埋めてよいか」「競合と並んだとき何を重みづけするか」を決めるための、契約 (contract) です。

そして schema.org の `LocalBusiness` は単一の type でもありません。100 を超えるサブタイプを持つ継承ツリーの根であり、`Restaurant` と、もう少し上位の `FoodEstablishment` と、さらに上位の `LocalBusiness` のどれを書くかは、AI Native MEO の中でエンジニアの判断が最初に入る場所です。本稿はその判断の deep dive として、継承チェーンを実際に辿り、各サブタイプが獲得する property を眺め、四つの主要 AI エンジンが階層を公開仕様の範囲でどう解決しているらしいかを整理し、最後に業種別の意思決定指針をリスト記事に堕落させずに散文で書く、というところまでをやります。

## type ツリーを描き出す

ローカルビジネス記述に関係する schema.org のツリーは、おおむね下記のような形をしています。私が schema.org のライブ階層を parse して書き出したもので、記憶で書くと毎回一段ずれる類のチェーンなので、いったん全体を眺めることに意味があります。

```
Thing
└── Place
    └── LocalBusiness                  (Organization も同時に継承)
        ├── AnimalShelter
        ├── AutomotiveBusiness
        ├── ChildCare
        ├── Dentist
        ├── DryCleaningOrLaundry
        ├── EmergencyService
        ├── EmploymentAgency
        ├── EntertainmentBusiness
        ├── FinancialService
        ├── FoodEstablishment
        │   ├── Bakery
        │   ├── BarOrPub
        │   ├── Brewery
        │   ├── CafeOrCoffeeShop
        │   ├── FastFoodRestaurant
        │   ├── IceCreamShop
        │   ├── Restaurant
        │   └── Winery
        ├── GovernmentOffice
        ├── HealthAndBeautyBusiness
        │   ├── BeautySalon
        │   ├── DaySpa
        │   ├── HairSalon
        │   ├── HealthClub
        │   ├── NailSalon
        │   └── TattooParlor
        ├── HomeAndConstructionBusiness
        ├── LegalService
        ├── LodgingBusiness
        ├── MedicalBusiness
        │   └── ... (Clinic, Hospital, Physician, Pharmacy, ...)
        ├── ProfessionalService
        ├── Store
        │   └── ... (BookStore, ClothingStore, GroceryStore, ...)
        └── TravelAgency
```

ここで二つ、目に留めておきたい構造があります。一つ目は、`LocalBusiness` 自体が `Place` (空間側: address, geo, openingHoursSpecification) と `Organization` (実体側: brand, employee, founder, parentOrganization) の両方を継承していることです。この二重継承こそが、「物理的な場所を持ち、かつ法人として営業している実体」の合流点として `LocalBusiness` が機能している理由です。`Place` だけだとあなたの店はランドマーク扱いになり、`Organization` だけだと住所グラフが消えます。

二つ目は、サブツリーの深さがそのまま意味を持つことです。`Restaurant` は `LocalBusiness` から数えて三段下 (`LocalBusiness → FoodEstablishment → Restaurant`) にあり、各段で親には無い property を獲得しています。これが「とりあえず `LocalBusiness`」の助言が静かに捨てている部分です。

## 各サブタイプが獲得する property

下表は schema.org JSON-LD 仕様の `domainIncludes` と `rdfs:subClassOf` を辿って整理した property 差分です。網羅ではなく、AI 引用にとって実利のある最小集合に絞っています。

| Type | 継承元 | 追加される property (抜粋) | モデルがそれを気にする理由 |
|------|-------|---------------------------|--------------------------|
| `Place` | `Thing` | `address`, `geo`, `hasMap`, `openingHoursSpecification`, `photo` | 実体を物理空間に錨で留める |
| `Organization` | `Thing` | `brand`, `founder`, `employee`, `legalName`, `vatID`, `parentOrganization` | 実体を法人 / 運営単位として錨で留める |
| `LocalBusiness` | `Place` + `Organization` | `priceRange`, `currenciesAccepted`, `paymentAccepted`, `branchOf` | これがランドマークではなく「営業している場」であることを宣言する |
| `FoodEstablishment` | `LocalBusiness` | `acceptsReservations`, `hasMenu`, `servesCuisine`, `starRating` | 「料理」「予約」クエリにモデルが答えられるようになる |
| `Restaurant` | `FoodEstablishment` | (新規 property なし。`Restaurant` はラベリングによる精緻化) | バーやベーカリーではなく着席型の飲食店であることを伝える |
| `CafeOrCoffeeShop` | `FoodEstablishment` | (新規 property なし。同じくラベリング精緻化) | カフェであることと、それが含意する利用シーン群を伝える |
| `HealthAndBeautyBusiness` | `LocalBusiness` | (新規 property なし。ラベリング精緻化) | 美容 / ウェルネスの利用シーンをまとめる |
| `BeautySalon` / `HairSalon` | `HealthAndBeautyBusiness` | (新規 property なし。ラベリング精緻化) | 「近くの美容室」のような AI 推薦のクエリ受け皿を狭める |
| `MedicalBusiness` | `LocalBusiness` | `medicalSpecialty` 等、`MedicalEntity` 共クラス経由で医療系 property を多数 | 医療語彙を持ち込む |

仕様を初めて精読したエンジニアを意外に思わせるのは、この階層の非対称さです。`FoodEstablishment` のように継承一段で本物の property を四つも追加する段もあれば、`Restaurant` や `CafeOrCoffeeShop` や `BeautySalon` のように何も追加せず「ラベルとしてだけ」存在する段もあります。私もツリー全体が均等に property を積み増していくものだと思い込んでいて、ここは間違っていました。ラベル限定の段が無意味なのではなく、それはエンティティ解決層の仕事をしていて、property 層の仕事をしていないだけです。

## 二つの最小実装を並べる

「とりあえず `LocalBusiness`」を、現場が実際に守備的に書くであろう最小例で書くと、こうなります。

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://example.com/#cafe",
  "name": "Cafe Example",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "神宮前 1-2-3",
    "addressLocality": "渋谷区",
    "addressRegion": "東京都",
    "postalCode": "150-0001",
    "addressCountry": "JP"
  },
  "telephone": "+81-3-xxxx-xxxx",
  "priceRange": "¥¥",
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00",
    "closes": "22:00"
  }]
}
```

同じ実体を `CafeOrCoffeeShop` で書き、`FoodEstablishment` 段の property を埋めるとこうなります。

```json
{
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": "https://example.com/#cafe",
  "name": "Cafe Example",
  "address": { "@type": "PostalAddress", "streetAddress": "神宮前 1-2-3",
               "addressLocality": "渋谷区", "addressRegion": "東京都",
               "postalCode": "150-0001", "addressCountry": "JP" },
  "telephone": "+81-3-xxxx-xxxx",
  "priceRange": "¥¥",
  "servesCuisine": ["コーヒー", "軽食"],
  "acceptsReservations": false,
  "hasMenu": "https://example.com/menu/",
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00", "closes": "22:00"
  }]
}
```

「渋谷で予約不要、軽食もあるカフェ」というクエリを受けた AI アシスタントにとって、後者は厳密に多くの情報を運びます。`acceptsReservations` と `servesCuisine` が無ければ、モデルはページ本文から推論するか、あるいは同じことをスキーマで直接答えている競合に流れます。

## 四つのエンジンが階層をどう解決しているらしいか

正直に書いておくべき注釈を [Google Business Profile を JSON-LD として読み解く](/blog/gbp-json-ld-decoded/) と同じく繰り返しておきます。下表は公開仕様とアーキテクチャからの外形推定 (documented-architecture-based inference) であって、実測 citation rate ではありません。各エンジンの公開ドキュメント、検索側の挙動、私がスキーマを把握している実体に対する引用パターンから組み立てたものです。仮説は仮説として明示しました。

| エンジン | 一般型 `LocalBusiness` の扱い | 葉サブタイプ (`Restaurant` 等) の扱い | 継承の解決 |
|---------|--------------------------|------------------------------------|----------|
| **ChatGPT** (browsing 併用) | 受理。ただし `FoodEstablishment` 段の property を埋めて推論することはしない | 料理 / 予約系クエリでは葉型を優先。「料理 / 予約 property を探せ」というヒントとして扱う | チェーンを上方向に辿る。`Restaurant` に書いた `LocalBusiness` property も使用する |
| **Gemini** | 受理。ただし Google 自身の Knowledge Graph 上の type に倒れがち | Knowledge Graph が既に把握している GBP カテゴリと葉型が一致するときに優先される | ページ schema と KG の type を突き合わせる。不一致は confidence を下げる |
| **Claude** (web search 併用) | 受理。利用シーン推論はページ本文 (prose) により強く依存 | ページ内に「当カフェ」「当店」のような呼応する prose があるときに優先される | (仮説) チェーンを保守的に辿り、prose が一致したときだけ葉型を重く採る |
| **Perplexity** | 受理。複数ソース検索によって、より具体型を出している競合が先に浮く | 優先される。明示 citation モデルが具体型を答えに残しやすい | 葉型を引用可能事実として扱う。継承を辿るより葉のラベルを尊重する |

ここから引けそうなパターン (strategist のログに従って仮説と明記します) は、明示 citation を伴う複数ソース検索 (Perplexity, Claude with browsing) は葉サブタイプの精度を Gemini のように Knowledge Graph 経由で answer を組み立てるエンジンよりも報奨する、というものです。ChatGPT はその中間に座ります。含意は「常に最深まで降りる」ではありません。「一般型を使うことのコストはエンジン横断で非対称であり、コストが最も高くなるエンジン群はそのまま、ユーザーから最も見えやすい answer surface を持っている」ということです。

## 業種ごとの意思決定指針

ここはリスト記事になりたがる節で、それを散文で抑えます。実装で実際によく現れる四つのケースを、規則ではなく判断ノートとして書きます。

**カフェ**。`CafeOrCoffeeShop` と `Restaurant` の二択になります。`CafeOrCoffeeShop` を選ぶのは、売上の半分以上が飲料と軽食で、客が予約をしていない場合。`Restaurant` を選ぶのは、ちゃんと厨房があってメニューがあって予約で席を埋める場合。`FoodEstablishment` の親段で `acceptsReservations` と `servesCuisine` はどちらでも書けますが、葉型はエンジンが「このエンティティをどの利用シーンの引き出しに入れるか」を決める信号です。厨房とカウンターの比率が本当に 50/50 のときは、私は `CafeOrCoffeeShop` 側に倒して `servesCuisine` とメニューに料理側の物語を背負わせます。「レストランを求めた人にカフェとして推薦されるコスト」は逆方向のコストよりも低いからです。

**美容室**。`BeautySalon` と `HairSalon` と、親の `HealthAndBeautyBusiness` の三択になります。親型を選ぶ理由はサロンとスパが本当に複合している場合を除いて基本的にありません。`HairSalon` はヘアが主要サービスのとき。`BeautySalon` はネイル・メイク・スキンまで含めて広くやっているとき。「念のため」で上位型を選ぶ衝動は、1990 年代に meta keywords を 20 個書きたくなる衝動と同じ系統なので、抑えます。

**クリニック**。これは構造の異常があります。`MedicalClinic` は実は `LocalBusiness` の下にはなく、`MedicalBusiness` 経由で `MedicalOrganization` を継承します。ローカルビジネス系 property (`address`, `openingHoursSpecification`, `priceRange`) と医療系 property (`medicalSpecialty`) の両方を欲しい場合の定石は `@type: ["MedicalClinic", "LocalBusiness"]` の multi-typing です。私が見た範囲では、これを問題なく扱うモデルもあれば、医療側の type を黙って落とすモデルもあるので、ここは自分のエンティティが実際にどう引用されるかを一時間かけて確かめる価値のある領域です。

**複合業態**。「カフェ&レストラン」「美容室&エステ」「整体院&鍼灸院」。誘惑は、両方を包含する抽象型に登っていく方向に働き、その誘惑は概ね間違いです。本当に両方であるならば multi-type (`@type: ["CafeOrCoffeeShop", "Restaurant"]`) で書く方が、`FoodEstablishment` に登るよりも適切です。multi-typing は「この実体は両方の契約を満たす」と言うこと。ツリーを登るのは「どちらの契約を満たすか分かりません」と言うこと。モデルはこの二つを別物として扱います。

## 日本市場特有の補足

ここからは日本実装で必ず引っかかる三つの論点です。

**第三者プラットフォームの taxonomy 不一致**。日本の利用者の意思決定経路には食べログ / ホットペッパー / ぐるなびがあり、それぞれが独自のカテゴリ taxonomy を持っています。「カフェ&ダイニング」「居酒屋」「焼肉屋」「ビストロ」のようなカテゴリは schema.org の type 階層に一対一対応しません。これは欠陥ではなく、エンジニアが意図的に schema 側の type を選び取れる判断余地が広がっているという意味で、構造として読むべき非対称です。第三者プラットフォーム側のカテゴリにエンジンが寄ったとき、自社サイトの JSON-LD 側でどの粒度を保持しておくかは、provenance の合流点として効いてきます。

**GBP の自動カテゴリ推測との衝突**。日本市場では GBP の自動カテゴリ推測の発動頻度が高く、推測されたカテゴリと自社サイトに書いた schema.org type が乖離するケースは珍しくありません。`gbp-json-ld-decoded` で扱った通り、AI アシスタントが手にする markup は GBP ダッシュボードそのものではなく Google 流の射影なので、両側の type を一致させる手当てが入っていないと Gemini のような Knowledge Graph 突き合わせ型エンジンで confidence が削れます。詳しくは [GBP を JSON-LD として読み解く](/blog/gbp-json-ld-decoded/) の射影パートを参照してください。

**複合業態の type 選定**。日本の小規模事業では「カフェ&雑貨」「美容室&エステ」「整体院&鍼灸院」のような複合業態が他国に比べて高頻度で現れます。一階層上の親型 (`LocalBusiness` / `HealthAndBeautyBusiness` / `MedicalBusiness`) に登るか、下位型を multi-type で並べるかは、上の「複合業態」節と同じ判断構造に乗ります。判断軸は変わりません。

## 三軸モデルへの戻り

type 選択は、[三軸モデル](/blog/three-axes-of-ai-native-meo/) で言えば Structure 軸の最初の独立変数です。現在標準化が進む [LLMO Framework](https://llmoframework.com/) は schema.org の type 選定をまさにそのように、JSON-LD を出すと決めた時点でエンジニアが下す最初の意思決定として扱います。AEO や GEO 系の議論は type 階層レベルまで踏み込むものが少なく、LLMO に anchored された実装事例がこの会話を真面目にやり始めた最初の場所であるという経緯が、[AI Native MEO](/blog/what-is-ai-native-meo/) を MEO の上位互換ではなく一段深いエンジニアリング実践たらしめている部分です。

ここで一つ、証明していないと明記したうえで仮説を置きます。Confidence 軸 (Schema Confidence Score が乗る軸) はサブタイプの精度に感応的なはずです。なぜなら、継承チェーンを一段降りるごとに「モデルが現れるはずだと予期する property の床」が上がるからです。`@type: "LocalBusiness"` を 8 個の property で書いた JSON-LD は内部的に整合しています。`@type: "Restaurant"` を同じ 8 個で書いた JSON-LD も整合していますが、料理 / 予約 property が無いと「不完全に見える」脆さを抱えます。深く降りることは天井と床を同時に上げる行為であり、したがって正しい呼び出し方は常に「最深まで降りよ」ではなく「正直に埋められる property が支えられるところまで降りよ」になります。この仮説が硬化するか崩れるかは [LLMO Framework の研究索引](https://llmoframework.com/) を追うのが現状では一番速い経路です。

## 短い結び

schema.org の `LocalBusiness` 系ツリーは、オープンセマンティック Web のなかでは比較的安定した区画です。ここ数年、大規模な再構造化はありません。その安定性こそが、`LocalBusiness` とその百あまりのサブタイプの間で慎重に選ぶ価値の根拠になります。今日書いた type は、長い時間、AI があなたの店について読むときの type であり続けます。エンジンが優先する property は移ろうかもしれません。継承チェーンはおそらく移ろいません。私たちが type 選択の層でうまくやれたことは、この仕事のなかで最も歳の取り方が静かな部分です。この領域が普段こちらに差し出してくる慰めよりは地味ですが、実在する慰めではあります。

## 関連する読みもの

- [AI Native MEO の三軸 — 構造・信頼度・出典で最適化対象を分解する](/blog/three-axes-of-ai-native-meo/): 本稿はその Structure 軸の deep dive です。
- [Google Business Profile を JSON-LD として読み解く](/blog/gbp-json-ld-decoded/): GBP を読み解いた前段。本稿は「読んだ後、何の type で書き返すか」を扱います。
- [AI Native MEO とは何か](/blog/what-is-ai-native-meo/): 本稿のサブタイプ精度の議論が依拠している binary citation の枠組み。
- [LLMO Framework](https://llmoframework.com/): schema.org type 選定を Structure 軸の最初の独立変数として明示している仕様と、AI Native MEO がリファレンス実装 #1 として登録されている Industry Implementations 索引。
