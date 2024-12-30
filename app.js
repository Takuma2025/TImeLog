// 要素取得
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');

// 連続で同じQRを読み取ってタブを量産しないよう制御
let lastScannedData = null;
let resetTimerId = null;

// カメラ起動
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => {
    video.srcObject = stream;
    video.play();
    requestAnimationFrame(scanLoop);
  })
  .catch(err => {
    console.error("カメラ取得エラー:", err);
    output.textContent = "カメラを利用できません: " + err.message;
  });

/**
 * 毎フレーム呼ばれてQRコードを読み取るループ
 */
function scanLoop() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // ビデオ映像をCanvasに描画
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ピクセルデータを取得してjsQRで解析
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // 前回と同じデータなら無視 (短時間で何度も開かないように)
      if (code.data !== lastScannedData) {
        lastScannedData = code.data;
        output.textContent = code.data;

        // 別タブを開く。「newtab.html?data=◯◯」にクエリパラメータを渡す
        const newTabUrl = `newtab.html?data=${encodeURIComponent(code.data)}`;
        window.open(newTabUrl, "_blank");

        // 5秒後に、同じQRコードも再び読み取れるようにリセット
        if (resetTimerId) clearTimeout(resetTimerId);
        resetTimerId = setTimeout(() => {
          lastScannedData = null;
        }, 5000);
      }
    }
  }
  // 次フレームでも解析を継続
  requestAnimationFrame(scanLoop);
}
