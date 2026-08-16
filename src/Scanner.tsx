import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

function Scanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText);
        });
      },
      () => {}
    ).then(() => {
      setStarted(true);
    }).catch((err) => {
      setError('Camera access denied. Please allow camera access and try again.');
    });

    return () => {
      if (scannerRef.current && started) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
        Scan Serial Number
      </div>
      <div style={{ color: '#888780', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
        Point camera at QR code or barcode
      </div>

      {error ? (
        <div style={{ backgroundColor: '#a63a2a', color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
          {error}
        </div>
      ) : (
        <div
          id="qr-reader"
          style={{ width: '100%', maxWidth: '320px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #5d8b5f' }}
        />
      )}

      <button
        onClick={handleClose}
        style={{ marginTop: '24px', padding: '14px 32px', backgroundColor: '#3d3d3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
      >
        Cancel
      </button>
    </div>
  );
}

export default Scanner;
