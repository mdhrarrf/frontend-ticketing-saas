'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, RefreshCw, Zap, ZapOff, AlertCircle } from 'lucide-react';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  isScanning: boolean;
  onToggleScanning: (active: boolean) => void;
  disabled?: boolean;
}

export default function CameraScanner({
  onScan,
  isScanning,
  onToggleScanning,
  disabled = false,
}: CameraScannerProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>('');
  const scannerRef = useRef<any>(null);
  const isStartingRef = useRef<boolean>(false);

  const containerId = 'tixora-camera-viewport';
  const isProcessingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Instant feedback beep sound
  const playBeep = (success: boolean) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'square';
      osc.frequency.value = success ? 880 : 330;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not permitted or supported
    }
  };

  // Enumerate cameras once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const devices = await Html5Qrcode.getCameras();
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      } catch (err) {
        console.warn('Could not enumerate cameras', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Manage scanner instance
  useEffect(() => {
    let isCancelled = false;

    const stopExistingScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // Ignore interruption errors during cleanup
        }
        scannerRef.current = null;
      }
    };

    if (isScanning && !disabled) {
      (async () => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        try {
          await stopExistingScanner();
          if (isCancelled) return;

          const { Html5Qrcode } = await import('html5-qrcode');
          setScannerError('');

          const scanner = new Html5Qrcode(containerId);
          scannerRef.current = scanner;

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          const cameraConfig = selectedCameraId
            ? { deviceId: { exact: selectedCameraId } }
            : { facingMode: 'environment' };

          await scanner.start(
            cameraConfig,
            config,
            (decodedText: string) => {
              if (isProcessingRef.current || disabled) return;
              isProcessingRef.current = true;
              playBeep(true);

              onScan(decodedText);

              // Debounce next frame
              setTimeout(() => {
                isProcessingRef.current = false;
              }, 2200);
            },
            () => {
              // Frame scanning misses
            }
          );

          if (isCancelled) {
            await stopExistingScanner();
            return;
          }

          // Check torch capability
          try {
            const capabilities = scanner.getRunningTrackCameraCapabilities();
            if (capabilities && capabilities.torchFeature().isSupported()) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }
        } catch (err: any) {
          if (!isCancelled) {
            console.warn('Camera scanner start message:', err?.message || err);
            // Only show user-facing error if not a harmless media removal
            if (!String(err?.message || '').includes('media was removed')) {
              setScannerError('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
            }
          }
        } finally {
          isStartingRef.current = false;
        }
      })();
    } else {
      stopExistingScanner();
    }

    return () => {
      isCancelled = true;
      stopExistingScanner();
    };
  }, [isScanning, selectedCameraId]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 360,
        marginBottom: 14,
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={() => onToggleScanning(!isScanning)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 12,
            background: isScanning
              ? 'rgba(239, 68, 68, 0.15)'
              : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            color: isScanning ? '#EF4444' : 'white',
            border: isScanning ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: isScanning ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          {isScanning ? <CameraOff size={16} /> : <Camera size={16} />}
          <span>{isScanning ? 'Matikan Kamera' : 'Buka Kamera Pemindai'}</span>
        </button>

        {isScanning && (
          <div style={{ display: 'flex', gap: 6 }}>
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currIdx = cameras.findIndex(c => c.id === selectedCameraId);
                  const nextIdx = (currIdx + 1) % cameras.length;
                  setSelectedCameraId(cameras[nextIdx].id);
                }}
                title="Ganti Kamera Depan/Belakang"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
              </button>
            )}

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                title="Senter / Flash"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: torchOn ? 'rgba(245, 158, 11, 0.2)' : 'var(--card)',
                  border: torchOn ? '1px solid #F59E0B' : '1px solid var(--border)',
                  color: torchOn ? '#F59E0B' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {torchOn ? <Zap size={15} /> : <ZapOff size={15} />}
              </button>
            )}
          </div>
        )}
      </div>

      {scannerError && (
        <div style={{
          maxWidth: 360,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{scannerError}</span>
        </div>
      )}

      {/* Persistent Video Viewport Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#09090D',
          border: isScanning ? '2px solid var(--color-primary, #6366F1)' : '1px solid var(--border)',
          display: isScanning ? 'block' : 'none',
          boxShadow: isScanning ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'none',
          position: 'relative',
        }}
      >
        <div id={containerId} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
