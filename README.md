# toybox

ブラウザで動く物理音シミュレーター。床に物を落とすと、材質・大きさ・重さに合わせた衝突音が鳴ります。

- 物理音シミュレーター: https://rokuromarund.github.io/toybox/
- ゲーム「積み上げタワー」: https://rokuromarund.github.io/toybox/tower/
  次々に出てくる日用品を、台から落とさずにどこまで高く積めるかを競います。
- ゲーム「ペタペタ大そうじ」: https://rokuromarund.github.io/toybox/roll/
  ミニチュアのちらかった部屋で、ネバネバの玉を転がして小さな物をくっつけ、制限時間内に直径50cmまで育てます。
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
