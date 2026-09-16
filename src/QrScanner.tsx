import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type Props = {
  experienceId: string;
  experienceName: string;
  onVerified: (decodedText: string) => void;
  onCancel: () => void;
};

function matchesCheckpoint(decodedText: string, experienceId: string) {
  const value = decodedText.trim();
  if (value === experienceId || value === `hikone://checkin/${experienceId}`) return true;

  try {
    const url = new URL(value);
    return url.searchParams.get('checkin') === experienceId;
  } catch {
    return false;
  }
}

export default function QrScanner({ experienceId, experienceName, onVerified, onCancel }: Props) {
  const readerId = useId().replace(/:/g, '-');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onVerifiedRef = useRef(onVerified);
  const verifiedRef = useRef(false);
  const [message, setMessage] = useState('カメラを起動しています…');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    const stopScanner = async () => {
      try {
        if (started) {
          await scanner.stop();
          started = false;
        }
      } catch {
        // Camera may already be stopped. Safe to ignore during cleanup.
      }
      try {
        await scanner.clear();
      } catch {
        // The reader may already be cleared.
      }
    };

    const verify = async (decodedText: string) => {
      if (cancelled || verifiedRef.current) return;
      if (!matchesCheckpoint(decodedText, experienceId)) {
        setMessage('この体験のQRコードではありません。現地のQRを読み取ってください。');
        return;
      }

      verifiedRef.current = true;
      setMessage('訪問を確認しました。');
      await stopScanner();
      if (!cancelled) onVerifiedRef.current(decodedText);
    };

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          decodedText => void verify(decodedText),
          () => undefined,
        );
        started = true;
        if (!cancelled) {
          setCameraError(false);
          setMessage('現地にあるQRコードを枠の中に入れてください。');
        }
      } catch {
        if (!cancelled) {
          setCameraError(true);
          setMessage('カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。');
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      void stopScanner();
      scannerRef.current = null;
    };
  }, [experienceId, readerId]);

  const verifyManualCode = async () => {
    if (!manualCode.trim()) return;
    if (!matchesCheckpoint(manualCode, experienceId)) {
      setMessage('確認コードが一致しません。QRの下にあるコードをもう一度確認してください。');
      return;
    }

    verifiedRef.current = true;
    setMessage('訪問を確認しました。');
    try {
      await scannerRef.current?.stop();
    } catch {
      // Camera may not have started.
    }
    onVerifiedRef.current(manualCode.trim());
  };

  return (
    <section className="center qr-screen">
      <p className="eyebrow">現地チェックイン</p>
      <h2>{experienceName}</h2>
      <p>現地のQRコードを読み取ると、訪問済みとして記録します。</p>
      <div id={readerId} className="qr-reader" aria-label="QRコード読み取りカメラ" />
      <p className={cameraError ? 'qr-message error' : 'qr-message'}>{message}</p>

      <details className="qr-fallback">
        <summary>カメラが使えない場合</summary>
        <p className="muted">QRコードの下に表示されている確認コードを入力してください。</p>
        <input
          value={manualCode}
          onChange={event => setManualCode(event.target.value)}
          placeholder="確認コード"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button className="secondary" onClick={() => void verifyManualCode()} disabled={!manualCode.trim()}>
          確認する
        </button>
      </details>

      <button className="link" onClick={onCancel}>読み取りをやめる</button>
    </section>
  );
}
