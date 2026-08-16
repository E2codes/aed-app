import React, { useState } from 'react';
import Scanner from './Scanner';

const MOCK_DEVICES = [
  { id: '1', name: 'Philips OnSite AED', location: 'Bldg A, Room 102', status: 'action_needed', statusMessage: 'Battery expires in 3 days' },
  { id: '2', name: 'Zoll AED Plus', location: 'Bldg C, Lobby', status: 'attention', statusMessage: 'Last inspection: 45 days ago' },
  { id: '3', name: 'Cardiac Science Powerheart', location: 'Bldg B, 3rd Floor', status: 'ready', statusMessage: 'Last inspection: 12 days ago' },
  { id: '4', name: 'HeartStart Onsite', location: 'Bldg A, Cafeteria', status: 'ready', statusMessage: 'Last inspection: 8 days ago' },
  { id: '5', name: 'Philips OnSite AED', location: 'Bldg D, Entrance', status: 'action_needed', statusMessage: 'Pads expired 6 days ago' },
];

const MOCK_LOCATIONS = [
  { id: '1', name: 'Building A', deviceCount: 3 },
  { id: '2', name: 'Building B', deviceCount: 2 },
  { id: '3', name: 'Building C', deviceCount: 1 },
  { id: '4', name: 'Building D', deviceCount: 1 },
];

const MOCK_DEVICE_TYPES = [
  { id: '1', brand: 'Philips', model: 'OnSite AED', deviceCount: 2 },
  { id: '2', brand: 'Zoll', model: 'AED Plus', deviceCount: 1 },
  { id: '3', brand: 'Cardiac Science', model: 'Powerheart', deviceCount: 1 },
  { id: '4', brand: 'Philips', model: 'HeartStart Onsite', deviceCount: 1 },
];

const STATUS_COLORS: Record<string, string> = {
  ready: '#5d8b5f',
  attention: '#8b7a3f',
  action_needed: '#a63a2a',
};

function Logo() {
  return (
    <img src="/logo.png" alt="National Safety Training Center" style={{ height: '40px' }} />
  );
}

interface Props {
  user: any;
  onLogout: () => void;
}

function AEDAppHome({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('fleet');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const actionNeededDevices = MOCK_DEVICES.filter(d => d.status === 'action_needed');
  const actionNeededCount = actionNeededDevices.length;

  const displayedDevices = actionFilter
    ? actionNeededDevices
    : MOCK_DEVICES.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const navigate = (page: string, prefill = {}) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
    if (Object.keys(prefill).length > 0) {
      window.dispatchEvent(new CustomEvent('prefill', { detail: prefill }));
    }
  };

  const handleCameraScan = () => {
    setDrawerOpen(false);
    setScannerOpen(true);
  };

  const handleScanResult = (result: string) => {
    setScannerOpen(false);
    window.dispatchEvent(new CustomEvent('prefill', { detail: { serialNumber: result } }));
    navigate('inspection');
  };

  const handleManualEntry = () => {
    setDrawerOpen(false);
    setTimeout(() => navigate('inspection'), 300);
  };

  const handleActionNeededClick = () => {
    setActionFilter(true);
    setActiveTab('fleet');
    setSearchQuery('');
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#9a9a9c', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <Logo />
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={{ backgroundColor: '#c8c8ca', borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '12px 16px', fontSize: '14px', color: '#3d3d3a' }}>
          <div style={{ padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Profile</div>
          <div style={{ padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Organization</div>
          <div style={{ padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Logs & Reports</div>
          <div style={{ padding: '4px 0', fontSize: '11px', color: '#888780' }}>{user?.email}</div>
          <div onClick={onLogout} style={{ padding: '8px 0', cursor: 'pointer', color: '#a63a2a', fontWeight: '700' }}>Sign out</div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: '1', padding: '24px 16px' }}>

        {/* Stat Card */}
        <div
          onClick={handleActionNeededClick}
          style={{ backgroundColor: '#dcdcdd', borderRadius: '8px', padding: '20px', marginBottom: '24px', border: actionFilter ? '2px solid #a63a2a' : '1px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: '700', color: '#a63a2a' }}>{actionNeededCount}</span>
            <span style={{ fontSize: '14px', color: '#3d3d3a', fontWeight: '500' }}>devices with action needed</span>
          </div>
          {actionFilter && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#a63a2a', fontWeight: '600' }}>
              Showing action needed only —{' '}
              <span onClick={e => { e.stopPropagation(); setActionFilter(false); }} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                clear filter
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {['fleet', 'locations', 'types'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setActionFilter(false); }}
              style={{ flex: '1', padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700', color: activeTab === tab ? '#3d3d3a' : '#888780', borderBottom: activeTab === tab ? '2px solid #5d8b5f' : '2px solid transparent', fontSize: '13px', textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab === 'fleet' && !actionFilter && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search devices"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '14px', backgroundColor: '#dcdcdd', color: '#3d3d3a', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Fleet */}
        {activeTab === 'fleet' && displayedDevices.map(device => (
          <div key={device.id} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[device.status], marginTop: '4px', flexShrink: 0, boxShadow: `0 0 8px ${STATUS_COLORS[device.status]}` }} />
            <div style={{ flex: '1' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '4px' }}>{device.name}</div>
              <div style={{ fontSize: '12px', color: '#888780', marginBottom: '8px' }}>{device.location}</div>
              <div style={{ fontSize: '12px', color: STATUS_COLORS[device.status], fontWeight: '600' }}>{device.statusMessage}</div>
            </div>
          </div>
        ))}

        {/* Locations */}
        {activeTab === 'locations' && MOCK_LOCATIONS.map(loc => (
          <div key={loc.id} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '4px' }}>{loc.name}</div>
            <div style={{ fontSize: '12px', color: '#888780' }}>{loc.deviceCount} devices</div>
          </div>
        ))}

        {/* Device Types */}
        {activeTab === 'types' && MOCK_DEVICE_TYPES.map(type => (
          <div key={type.id} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '4px' }}>{type.brand} {type.model}</div>
            <div style={{ fontSize: '12px', color: '#888780' }}>{type.deviceCount} devices</div>
          </div>
        ))}

      </div>

      {/* QR Scanner */}
      {scannerOpen && (
        <Scanner
          onScan={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Drawer overlay */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 998 }} />
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', bottom: '72px', left: '16px', right: '16px', backgroundColor: '#dcdcdd', borderRadius: '12px', padding: '20px', zIndex: 999, border: '1px solid rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '16px' }}>Add Inspection</div>

          <button
            onClick={handleCameraScan}
            style={{ width: '100%', padding: '14px', backgroundColor: '#3d3d3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            Scan QR / Barcode
          </button>

          <button
            onClick={handleManualEntry}
            style={{ width: '100%', padding: '14px', backgroundColor: '#5d8b5f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            Manual Entry
          </button>
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', backgroundColor: '#9a9a9c', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.15)', zIndex: 997 }}>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{ width: '100%', padding: '14px', backgroundColor: '#3d3d3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
        >
          + New Inspection
        </button>
      </div>

    </div>
  );
}

export default AEDAppHome;
