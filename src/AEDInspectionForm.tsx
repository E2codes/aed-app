import React, { useState, useEffect } from 'react';
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
  user?: any;
  prefill?: Prefill;
  onSubmit?: () => void;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefill.brand) setBrand(prefill.brand);
    if (prefill.model) setModel(prefill.model);
    if (prefill.serialNumber) setSerialNumber(prefill.serialNumber);
    if (prefill.location) setLocation(prefill.location);
  }, [prefill]);

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

  const section = { backgroundColor: '#dcdcdd', borderRadius: '8px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.08)' };
  const label = { display: 'block' as const, fontSize: '12px', fontWeight: '600' as const, color: '#3d3d3a', marginBottom: '6px' };
  const input = (hasError: boolean) => ({ width: '100%', padding: '10px', border: hasError ? '1px solid #a63a2a' : '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', color: '#3d3d3a', boxSizing: 'border-box' as const });
  const err = { fontSize: '12px', color: '#a63a2a', marginTop: '4px' };
  const field = { marginBottom: '16px' };
  const radioRow = { display: 'flex' as const, gap: '16px', flexWrap: 'wrap' as const };
  const radioLabel = { display: 'flex' as const, alignItems: 'center' as const, gap: '6px', fontSize: '16px', cursor: 'pointer' as const };

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
          <div style={{ fontSize: '16px', color: '#888780' }}>Returning to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', paddingTop: '60px', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#9a9a9c', padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(0,0,0,0.15)', zIndex: 100 }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>New Inspection</span>
      </div>

      <div style={{ padding: '24px 16px' }}>

        {/* Pre-filled notice */}
        {(prefill.brand || prefill.serialNumber) && (
          <div style={{ backgroundColor: '#5d8b5f', color: 'white', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
            Device info pre-filled from scan — verify and complete the form
          </div>
        )}

        {/* Section 1: Device */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Device Information</h3>

          <div style={field}>
            <label style={label}>Brand</label>
            <select value={brand} onChange={e => { setBrand(e.target.value); setModel(''); }} style={input(!!errors.brand)}>
              <option value="">Select brand</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.brand && <div style={err}>{errors.brand}</div>}
          </div>

          <div style={field}>
            <label style={label}>Model</label>
            {brand && BRAND_MODELS[brand]?.length > 0 ? (
              <select value={model} onChange={e => setModel(e.target.value)} style={input(!!errors.model)}>
                <option value="">Select model</option>
                {BRAND_MODELS[brand].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Enter model name" style={input(!!errors.model)} />
            )}
            {errors.model && <div style={err}>{errors.model}</div>}
          </div>

          <div style={field}>
            <label style={label}>Serial Number</label>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. PH-2024-00142" style={input(!!errors.serialNumber)} />
            {errors.serialNumber && <div style={err}>{errors.serialNumber}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={label}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Building A, Room 102" style={input(!!errors.location)} />
            {errors.location && <div style={err}>{errors.location}</div>}
          </div>
        </div>

        {/* Section 2: Inspector */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Inspector</h3>

          <div style={field}>
            <label style={label}>Your Name</label>
            <input type="text" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Full name" style={input(!!errors.inspectorName)} />
            {errors.inspectorName && <div style={err}>{errors.inspectorName}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={label}>Inspection Date</label>
            <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} style={input(false)} />
          </div>
        </div>

        {/* Section 3: Consumables */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Consumables</h3>

          <div style={field}>
            <label style={label}>Battery Status</label>
            <div style={radioRow}>
              {['Good', 'Warning', 'Expired'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="battery" value={s.toLowerCase()} checked={batteryStatus === s.toLowerCase()} onChange={e => setBatteryStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.batteryStatus && <div style={err}>{errors.batteryStatus}</div>}
          </div>

          <div style={field}>
            <label style={label}>Battery Expiration Date</label>
            <input type="date" value={batteryExpiration} onChange={e => setBatteryExpiration(e.target.value)} style={input(false)} />
          </div>

          <div style={field}>
            <label style={label}>Pads Status</label>
            <div style={radioRow}>
              {['Good', 'Warning', 'Expired'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="pads" value={s.toLowerCase()} checked={padsStatus === s.toLowerCase()} onChange={e => setPadsStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.padsStatus && <div style={err}>{errors.padsStatus}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={label}>Pads Expiration Date</label>
            <input type="date" value={padsExpiration} onChange={e => setPadsExpiration(e.target.value)} style={input(false)} />
          </div>
        </div>

        {/* Section 4: Operational */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Operational Checks</h3>

          <div style={field}>
            <label style={label}>Display Status</label>
            <div style={radioRow}>
              {['Functional', 'Issues'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="display" value={s.toLowerCase()} checked={displayStatus === s.toLowerCase()} onChange={e => setDisplayStatus(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.displayStatus && <div style={err}>{errors.displayStatus}</div>}
          </div>

          <div style={field}>
            <label style={{ ...radioLabel, cursor: 'pointer' }}>
              <input type="checkbox" checked={soundTest} onChange={e => setSoundTest(e.target.checked)} />
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#3d3d3a' }}>Sound test passed</span>
            </label>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={label}>Physical Condition</label>
            <div style={radioRow}>
              {['Good', 'Damaged'].map(s => (
                <label key={s} style={radioLabel}>
                  <input type="radio" name="physical" value={s.toLowerCase()} checked={physicalCondition === s.toLowerCase()} onChange={e => setPhysicalCondition(e.target.value)} />
                  {s}
                </label>
              ))}
            </div>
            {errors.physicalCondition && <div style={err}>{errors.physicalCondition}</div>}
          </div>
        </div>

        {/* Section 5: Overall */}
        <div style={section}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Sign Off</h3>

          <div style={field}>
            <label style={label}>Overall Device Status</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'ready', label: 'Ready' },
                { value: 'attention', label: 'Attention needed' },
                { value: 'action_needed', label: 'Action needed' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: overallStatus === opt.value ? `${STATUS_COLORS[opt.value]}18` : 'white', border: overallStatus === opt.value ? `1.5px solid ${STATUS_COLORS[opt.value]}` : '1px solid rgba(0,0,0,0.1)' }}>
                  <input type="radio" name="overall" value={opt.value} checked={overallStatus === opt.value} onChange={e => setOverallStatus(e.target.value)} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[opt.value], display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${STATUS_COLORS[opt.value]}` }} />
                  <span style={{ fontSize: '16px', fontWeight: '600', color: overallStatus === opt.value ? STATUS_COLORS[opt.value] : '#3d3d3a' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.overallStatus && <div style={err}>{errors.overallStatus}</div>}
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={label}>Additional Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations, follow-up actions, or comments"
              rows={4}
              style={{ ...input(false), resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Submit */}
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
