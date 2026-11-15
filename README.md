# toybox

ブラウザで動く物理音シミュレーター。床に物を落とすと、材質・大きさ・重さに合わせた衝突音が鳴ります。

- 公開ページ: https://rokuromarund.github.io/toybox/
- 描画: [three.js](https://threejs.org/) / 物理: [Rapier](https://rapier.rs/) / 音: Web Audio API（モーダル合成）

## 3Dモデル

[Google Scanned Objects](https://research.google/blog/scanned-objects-by-google-research-a-dataset-of-3d-scanned-common-household-items/)
by Google Research（CC BY 4.0）を、Hugging Face の
[codepawl/scanned-objects-glb](https://huggingface.co/datasets/codepawl/scanned-objects-glb)
からその場で読み込んでいます。
