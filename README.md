# toybox

ブラウザで動く物理音シミュレーター。床に物を落とすと、材質・大きさ・重さに合わせた衝突音が鳴ります。

- 物理音シミュレーター: https://rokuromarund.github.io/toybox/
- ゲーム「積み上げタワー」: https://rokuromarund.github.io/toybox/tower/
  次々に出てくる日用品を、台から落とさずにどこまで高く積めるかを競います。
- ゲーム「ペタペタ大そうじ」: https://rokuromarund.github.io/toybox/roll/
  ミニチュアのちらかった部屋で、ネバネバのかたまりを転がして物をくっつけ、4分のうちにどこまで大きくなれるかを競います。
  くっついた物はふれた場所にそのまま貼りつき、ボコボコの「物の山」として育ちます（細長い物はトゲになります）。
  同じモデルを大きさ違いで何百個も使い回していて、45cm くらいまで育つと、壁（1辺4枚）に体当たりして1枚ずつたおせます。たおれた壁のすき間から広場へ。そこでは部屋にあった物の巨大版がごろごろしています。
  小さいうちに壁や家具にぶつかると「ドスッ」と弾かれてヒントが出ます。大きくなると家具（ローテーブル・本棚・オットマン）や広場の箱もふっとばせて、さらに大きくなるとかたまりにくっつきます。
- 描画: [three.js](https://threejs.org/) / 物理: [Rapier](https://rapier.rs/) / 音: Web Audio API（モーダル合成）

## ファイル

- `index.html` 物理音シミュレーター
- `tower/index.html` 積み上げタワー
- `roll/index.html` ペタペタ大そうじ（軽量版 LOD のモデルを使用）
- `common.js` 各ページで使う部分（データの場所・材質の判定・音の合成）

## 3Dモデル

[Google Scanned Objects](https://research.google/blog/scanned-objects-by-google-research-a-dataset-of-3d-scanned-common-household-items/)
by Google Research（CC BY 4.0）を、Hugging Face の
[codepawl/scanned-objects-glb](https://huggingface.co/datasets/codepawl/scanned-objects-glb)
からその場で読み込んでいます。
