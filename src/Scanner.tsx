import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

const ALL_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
];

function Scanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannedRef = useRef(false);

  const stopAndExit = (callback?: () => void) => {
    if (scannerRef.current) {
      scannerRef.current.stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          if (callback) callback();
        });
    } else {
      if (callback) callback();
    }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader', {
      formatsToSupport: ALL_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        qrbox: { width: 280, height: 150 },
      },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        stopAndExit(() => onScan(decodedText));
      },
      () => {}
    ).then(() => {
      setScanning(true);
    }).catch(() => {
      setError('Camera access denied. Please allow camera access and try again.');
    });

    return () => {
      stopAndExit();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
        Scan Device
      </div>
      <div style={{ color: '#888780', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
        Point camera at QR code or barcode
      </div>

      {error ? (
        <div style={{ backgroundColor: '#a63a2a', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '24px', maxWidth: '300px' }}>
          {error}
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <div
            id="qr-reader"
            style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #5d8b5f' }}
          />
          {!scanning && (
            <div style={{ color: '#888780', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
              Starting camera...
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => stopAndExit(onClose)}
        style={{ marginTop: '24px', padding: '14px 32px', backgroundColor: '#3d3d3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
      >
        Cancel
      </button>
    </div>
  );
}

export default Scanner;
