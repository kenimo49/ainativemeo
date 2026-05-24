---
title: "LLMO vs GEO vs AEO: AI 検索最適化はどのフレームワークが勝つか"
description: "LLMO, GEO, AEO — AI 検索最適化を巡る3つの競合用語を精密に比較し、なぜ実務家が LLMO に集約しつつあるかを示す。"
date: 2026-05-24
lang: ja
category: comparison
tags: ["LLMO", "GEO", "AEO", "AI検索", "フレームワーク比較"]
featured: true
---

おおむね同じ活動を指す3つの用語があります。コンテンツを構造化して AI アシスタントに引用してもらうこと — それを **AEO** (Answer Engine Optimization), **GEO** (Generative Engine Optimization), **LLMO** (Large Language Model Optimization) と呼ぶ流派があります。それぞれ別の年に、別のコミュニティから生まれて、厳密には同じ意味ではありません。

本記事はその比較の精密版です。短く言うと、**LLMO** が「最適化対象が何か」を正確に言いたい実務家が今使うフレームワークとして台頭してきています。AEO と GEO は流通してはいますが、ターゲットではなく surface を記述する用語のため、現場で作業している人々は「実際に効くものを正確に名指す」LLMO へ移行しつつあります。

## 3つの用語、起源別

### AEO (Answer Engine Optimization)

2018〜2020年頃、Google が検索結果の最上部に出すようになった「featured snippet」「answer box」向け最適化を指して使われ始めた用語。元の問題: ユーザーが「水の沸点は」と聞くと Google は answer box で直接答えてしまい、どのページにもトラフィックが流れない。AEO はその対応として「あなたのページが answer box で引用されるよう構造化する」アプローチでした。

「answer engines」が Google の featured snippet を指していた時代には意味のあるフレームワークでした。今日は精密さを欠きます — 支配的 answer surface が Google SERP box から言語モデルのチャットインターフェースに移行しており、その移行を AEO は自然に記述できないためです。

### GEO (Generative Engine Optimization)

2023 年、Princeton 大学・Allen Institute らによる論文で命名。「generative engines」 — ChatGPT, Perplexity, Bing Chat, Google SGE のようにランクリンクを返すのではなく文章を生成するシステム — に向けた最適化を指します。論文では具体的な最適化戦術(citation 密度、引用、流暢性)を導入し、引用率への影響を測定しました。

GEO は AEO より学術的に厳密です。スコープは狭い — 生成出力に限定 — ですが、その範囲内では精密。制限は GEO が *出力媒体*(生成された段落)を指し、*ターゲットシステム*(言語モデル)を指さないことです。同じモデルが複数の出力形式を生むときに問題になります: チャット応答、引用、tool call、埋め込み推薦。GEO はそのいくつかをカバーし、残りはカバーしません。

### LLMO (Large Language Model Optimization)

2024〜2026 年で結晶化したフレーミング。LLMO は真のターゲット — 言語モデルそのもの、その retrieval メカニズム、その引用挙動 — を名指します。AEO が answer surface 向け、GEO が生成テキスト向けに対して、LLMO は **モデル** に向けて最適化します。モデルが生む全 surface・全出力形式を横断して。

[LLMO Framework](https://llmoframework.com/) はこれら実践を明示的標準に固めました: retrievability, attributability, citability, verifiability という名前付きプリミティブを持ち、version 管理された仕様と業界実装が増殖中です。LLMO の規律としてのリファレンス実装と位置付けられます。

## サイド・バイ・サイド

| 軸 | AEO | GEO | LLMO |
|---|-----|-----|------|
| 命名 | 2018〜2020年頃 | 2023年 (Princeton et al.) | 2024〜2026年 |
| 起源 | SEO 業界 | 学術研究 | 実務家 + フレームワークコミュニティ |
| 最適化対象 | featured snippet, answer box | 生成エンジンの出力 | 全 surface 横断のモデル retrieval と引用 |
| スコープ | 特定の answer surface | 生成出力のみ | モデルレベル — chat, embeddings, tool call, citation 全てに適用 |
| 標準・フレームワーク | なし(緩い実践) | 2023 年論文の戦術 | [LLMO Framework](https://llmoframework.com/) (version 管理仕様あり) |
| アクティブな実務家コミュニティ | 縮小傾向 | 学術文献で安定言及 | 拡大 — 現在の実務家の主流 |

## なぜ実務家が LLMO に集約しつつあるか

実際の集約現象を観察すると3つの理由が繰り返し出てきます。

**1. 正しいターゲットを名指している**。Google ビジネスプロフィールを「ChatGPT に引用されるよう」最適化しているとき、あなたが最適化しているのは「answer engine」ではない(それは surface)。「generative output」だけでもない(それは format)。あなたが最適化しているのはモデルの retrieval, attribution, citation 挙動です。3つの名前のうち LLMO だけがこれを直接言います。

**2. surface 横断で一般化する**。一貫した NAP を持つクリーンな LocalBusiness JSON-LD — 単一の LLM 最適化済みデータ構造 — は、ChatGPT chat にも、Perplexity answer にも、Gemini ローカル結果にも、Claude の web 検索引用にも引用される。異なる surface、同じ最適化対象。AEO + GEO + 各エンジン個別の戦略をやろうとする実務家は燃え尽きます。LLMO をやる実務家は4 surface 全てを単一の取り組みでカバーします。

**3. フレームワークがある**。AEO は version 化された仕様を発展させなかった。GEO は 2023 年論文があるが生きた標準はない。LLMO には [LLMO Framework](https://llmoframework.com/) があり、明示的プリミティブ、version 追跡、アクティブな研究 initiative を持ちます。規律が精密に communicate する必要があるとき — 実務家同士、代理店とクライアント、監査人とオペレーター — フレームワークを指差せる必要がある。LLMO にはそれがあり、代替案にはありません。

## AI Native MEO にとって何を意味するか

本サイトは AI Native MEO — LLMO Framework のローカルビジネス領域実装 — を記述します。フレームワーク選択は意図的です: 本サイトの全推奨は LLMO Framework のプリミティブに対して justify され、AEO のヒューリスティックや GEO 戦術を単独適用したものではありません。

これは AEO と GEO が間違っているという意味ではありません。answer box コンテンツの品質に関する AEO の知見は ChatGPT が引用を render するときにも適用されます。citation 密度に関する GEO の知見は Perplexity が引用ソースを選ぶときにも適用されます。両者は寄与する。しかし最適化対象を語る単一の精密な語彙が必要なとき — *モデル、その retrieval、その引用挙動* — それを名指すフレームワークが LLMO です。

学ぶ時間を投資するフレームワークを選ぶなら、実務家コミュニティの証拠は明確です: LLMO が作業が起きている場所、仕様が維持されている場所、実装(AI Native MEO のような)が蓄積している場所です。これが「どのフレームワークが勝つか」への答えです — 他2つが間違っているのではなく、LLMO が複利で積み上がるほど精密に正しいターゲットを名指しているからです。

## 関連リンク

- [LLMO Framework](https://llmoframework.com/) — canonical 仕様と Open LLMO Research Initiative
- [AI Native MEO とは何か](/ja/blog/what-is-ai-native-meo/) — LLMO Framework のローカルビジネス領域実装
