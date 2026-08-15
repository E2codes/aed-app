import React, { useState, useEffect, useRef } from 'react';
import supabase from './supabase';

const BRANDS = ['Philips', 'Zoll', 'Cardiac Science', 'HeartSine', 'Defibtech', 'Physio-Control', 'Other'];

const BRAND_MODELS: Record<string, string[]> = {
  'Philips': ['HeartStart OnSite', 'HeartStart FRx', 'HeartStart HS1'],
  'Zoll': ['AED Plus', 'AED 3', 'AED Pro'],
  'Cardiac Science': ['Powerheart G3', 'Powerheart G5'],
  'HeartSine': ['Samaritan PAD 350P', 'Samaritan PAD 360P', 'Samaritan PAD 450P'],
  'Defibtech': ['Lifeline AED', 'Lifeline AUTO', 'Lifeline VIEW'],
  'Physio-Control': ['LIFEPAK CR2', 'LIFEPAK 1000'],
  'Other': [],
};

interface Prefill {
  brand?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
}

interface Props {
  prefill?: Prefill;
  user?: any;
  onSubmit?: () => void;
}

// Compress image to under 300KB before upload
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.7);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AEDInspectionForm({ prefill = {}, onSubmit, user }: Props) {
  const [brand, setBrand] = useState(prefill.brand || '');
  const [model, setModel] = useState(prefill.model || '');
  const [serialNumber, setSerialNumber] = useState(prefill.serialNumber || '');
  const [location, setLocation] = useState(prefill.location || '');
  const [inspectorName, setInspectorName] = useState(user?.email || '');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [batteryStatus, setBatteryStatus] = useState('');
  const [batteryExpiration, setBatteryExpiration] = useState('');
  const [padsStatus, setPadsStatus] = useState('');
  const [padsExpiration, setPadsExpiration] = useState('');
  const [displayStatus, setDisplayStatus] = useState('');
  const [soundTest, setSoundTest] = useState(false);
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [overallStatus, setOverallStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefill.brand) setBrand(prefill.brand);
    if (prefill.model) setModel(prefill.model);
    if (prefill.serialNumber) setSerialNumber(prefill.serialNumber);
    if (prefill.location) setLocation(prefill.location);
  }, [prefill]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);

    const previews = newPhotos.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}...`);
      const compressed = await compressImage(photos[i]);
      const fileName = `${Date.now()}-${i}.jpg`;
      const { data, error } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    setUploadProgress('');
    return urls;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!brand) e.brand = 'Required';
    if (!model) e.model = 'Required';
    if (!serialNumber) e.serialNumber = 'Required';
    if (!location) e.location = 'Required';
    if (!inspectorName) e.inspectorName = 'Required';
    if (!batteryStatus) e.batteryStatus = 'Required';
    if (!padsStatus) e.padsStatus = 'Required';
    if (!displayStatus) e.displayStatus = 'Required';
    if (!physicalCondition) e.physicalCondition = 'Required';
    if (!overallStatus) e.overallStatus = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const photoUrls = await uploadPhotos();
      const { error } = await supabase.from('inspections').insert([{
        brand,
        model,
        serial_number: serialNumber,
        location,
        inspector_name: inspectorName,
        inspection_date: inspectionDate,
        battery_status: batteryStatus,
        battery_expiration_date: batteryExpiration,
        pads_status: padsStatus,
        pads_expiration_date: padsExpiration,
        display_status: displayStatus,
        sound_test: soundTest,
        physical_condition: physicalCondition,
        overall_status: overallStatus,
        notes,
        photo_urls: photoUrls,
      }]);
      if (error) {
        alert('Error saving: ' + error.message);
        setSaving(false);
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 1500);
    } catch (err) {
      alert('Error: ' + err);
      setSaving(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    ready: '#5d8b5f',
    attention: '#8b7a3f',
    action_needed: '#a63a2a',
  };

  const section: React.CSSProperties = { backgroundColor: '#dcdcdd', borderRadius: '8px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.08)' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#3d3d3a', marginBottom: '6px' };
  const inputStyle = (hasError: boolean): React.CSSProperties => ({ width: '100%', padding: '10px', border: hasError ? '1px solid #a63a2a' : '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', color: '#3d3d3a', boxSizing: 'border-box' });
  const errStyle: React.CSSProperties = { fontSize: '12px', color: '#a63a2a', marginTop: '4px' };
  const fieldStyle: React.CSSProperties = { marginBottom: '16px' };
  const radioRow: React.CSSProperties = { display: 'flex', gap: '16px', flexWrap: 'wrap' };
  const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', cursor: 'pointer' };

  if (submitted) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#5d8b5f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontWeight: '700', fontSize: '18px', color: '#3d3d3a', marginBottom: '8px' }}>Inspection Saved</div>
          <div style={{ fontSize: '14px', color: '#888780' }}>Returning to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', paddingTop: '60px', paddingBottom: '32px' }}>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#9a9a9c', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(0,0,0,0.15)', zIndex: 100 }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>New Inspection</span>
      </div>

      <div style={{ padding: '24px 16px' }}>

        {(prefill.brand || prefill.serialNumber) && (
          <div style={{ backgroundColor: '#5d8b5f', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
            Device info pre-filled from scan — verify and complete the form
          </div>
        )}

        {/* Device Info */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Device Information</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Brand</label>
            <select value={brand} onChange={e => { setBrand(e.target.value); setModel(''); }} style={inputStyle(!!errors.brand)}>
              <option value="">Select brand</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.brand && <div style={errStyle}>{errors.brand}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Model</label>
            {brand && BRAND_MODELS[brand]?.length > 0 ? (
              <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle(!!errors.model)}>
                <option value="">Select model</option>
                {BRAND_MODELS[brand].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Enter model name" style={inputStyle(!!errors.model)} />
            )}
            {errors.model && <div style={errStyle}>{errors.model}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Serial Number</label>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. PH-2024-00142" style={inputStyle(!!errors.serialNumber)} />
            {errors.serialNumber && <div style={errStyle}>{errors.serialNumber}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Building A, Room 102" style={inputStyle(!!errors.location)} />
            {errors.location && <div style={errStyle}>{errors.location}</div>}
          </div>
        </div>

        {/* Inspector */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Inspector</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Your Name</label>
            <input type="text" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Full name" style={inputStyle(!!errors.inspectorName)} />
            {errors.inspectorName && <div style={errStyle}>{errors.inspectorName}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Inspection Date</label>
            <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} style={inputStyle(false)} />
          </div>
        </div>

        {/* Consumables */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Consumables</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Battery Status</label>
            <div style={radioRow}>
              {['Good', 'Warning', 'Expired'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="battery" value={s.toLowerCase()} checked={batteryStatus === s.toLowerCase()} onChange={e => setBatteryStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.batteryStatus && <div style={errStyle}>{errors.batteryStatus}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Battery Expiration Date</label>
            <input type="date" value={batteryExpiration} onChange={e => setBatteryExpiration(e.target.value)} style={inputStyle(false)} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Pads Status</label>
            <div style={radioRow}>
              {['Good', 'Warning', 'Expired'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="pads" value={s.toLowerCase()} checked={padsStatus === s.toLowerCase()} onChange={e => setPadsStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.padsStatus && <div style={errStyle}>{errors.padsStatus}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Pads Expiration Date</label>
            <input type="date" value={padsExpiration} onChange={e => setPadsExpiration(e.target.value)} style={inputStyle(false)} />
          </div>
        </div>

        {/* Operational */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Operational Checks</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Display Status</label>
            <div style={radioRow}>
              {['Functional', 'Issues'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="display" value={s.toLowerCase()} checked={displayStatus === s.toLowerCase()} onChange={e => setDisplayStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.displayStatus && <div style={errStyle}>{errors.displayStatus}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={{ ...radioLabel, cursor: 'pointer' }}>
              <input type="checkbox" checked={soundTest} onChange={e => setSoundTest(e.target.checked)} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#3d3d3a' }}>Sound test passed</span>
            </label>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Physical Condition</label>
            <div style={radioRow}>
              {['Good', 'Damaged'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="physical" value={s.toLowerCase()} checked={physicalCondition === s.toLowerCase()} onChange={e => setPhysicalCondition(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.physicalCondition && <div style={errStyle}>{errors.physicalCondition}</div>}
          </div>
        </div>

        {/* Photos */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Photos <span style={{ fontWeight: '400', color: '#888780' }}>(optional, max 5)</span></h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />

          {photoPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {photoPreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={preview} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#a63a2a', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '14px', backgroundColor: 'white', color: '#3d3d3a', border: '1px dashed rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3d3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {photos.length === 0 ? 'Take or Add Photos' : 'Add More Photos'}
            </button>
          )}
        </div>

        {/* Sign Off */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Sign Off</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Overall Device Status</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'ready', label: 'Ready' },
                { value: 'attention', label: 'Attention needed' },
                { value: 'action_needed', label: 'Action needed' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: overallStatus === opt.value ? `${STATUS_COLORS[opt.value]}18` : 'white', border: overallStatus === opt.value ? `1.5px solid ${STATUS_COLORS[opt.value]}` : '1px solid rgba(0,0,0,0.1)' }}>
                  <input type="radio" name="overall" value={opt.value} checked={overallStatus === opt.value} onChange={e => setOverallStatus(e.target.value)} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[opt.value], display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${STATUS_COLORS[opt.value]}` }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: overallStatus === opt.value ? STATUS_COLORS[opt.value] : '#3d3d3a' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.overallStatus && <div style={errStyle}>{errors.overallStatus}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations, follow-up actions, or comments"
              rows={4}
              style={{ ...inputStyle(false), resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {uploadProgress && (
          <div style={{ backgroundColor: '#5d8b5f', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
            {uploadProgress}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', padding: '16px', backgroundColor: saving ? '#888780' : '#5d8b5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : 'Record Inspection'}
        </button>

      </div>
    </div>
  );
}

export default AEDInspectionForm;