// 要素取得
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const scanningIndicator = document.getElementById('scanningIndicator');

// 連続で同じQRを読み取ってタブを量産しないよう制御
let lastScannedData = null;
let resetTimerId = null;

// スキャン制御用のフラグを追加
let isHandlingScan = false;

// カメラ起動
navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
  .then(stream => {
    video.srcObject = stream;
    video.play();
    requestAnimationFrame(scanLoop);
  })
  .catch(err => {
    console.error("カメラ取得エラー:", err);
    output.textContent = "カメラを利用できません: " + err.message;
    scanningIndicator.style.display = 'none';
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
      // スキャン処理中でないこと、かつ新しいデータであることを確認
      if (code.data !== lastScannedData && !isHandlingScan) {
        isHandlingScan = true; // スキャン処理中に設定
        lastScannedData = code.data;
        output.textContent = code.data;
        scanningIndicator.style.display = 'none';

        // 別タブを開く。「newtab.html?data=◯◯」にクエリパラメータを渡す
        const newTabUrl = `newtab.html?data=${encodeURIComponent(code.data)}`;
        window.open(newTabUrl, "_blank");

        // 即座に lastScannedData をリセットして、同じQRコードの連続スキャンを防止
        // さらに、スキャン処理を一時停止
        clearTimeout(resetTimerId);
        resetTimerId = setTimeout(() => {
          isHandlingScan = false; // スキャン処理中フラグをリセット
          lastScannedData = null;
          scanningIndicator.style.display = 'block';
        }, 5000); // 5秒後に再スキャンを許可
      }
    }
  }
  // 次フレームでも解析を継続
  requestAnimationFrame(scanLoop);
}

