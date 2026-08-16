import React, { useState, useEffect } from 'react';
import Scanner from './Scanner';
import supabase from './supabase';

interface Device {
  id: number;
  serial_number: string;
  brand: string;
  model: string;
  location: string;
  overall_status: string;
  inspection_date: string;
  battery_status: string;
  battery_expiration_date: string;
  pads_status: string;
  pads_expiration_date: string;
  inspector_name: string;
}

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('latest_inspections')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setDevices(data);
    }
    setLoading(false);
  };

  const getStatusMessage = (device: Device) => {
    const today = new Date();
    const inspectionDate = new Date(device.inspection_date);
    const daysSince = Math.floor((today.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (device.battery_status === 'expired') return 'Battery expired';
    if (device.pads_status === 'expired') return 'Pads expired';
    if (device.battery_status === 'warning') return 'Battery expiring soon';
    if (device.pads_status === 'warning') return 'Pads expiring soon';
    return `Last inspection: ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;
  };

  const actionNeededDevices = devices.filter(d => d.overall_status === 'action_needed');
  const actionNeededCount = actionNeededDevices.length;

  const displayedDevices = actionFilter
    ? actionNeededDevices
    : devices.filter(device =>
        (device.brand + ' ' + device.model).toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Unique locations
  const locations = Array.from(new Set(devices.map(d => d.location))).map(loc => ({
    name: loc,
    deviceCount: devices.filter(d => d.location === loc).length,
  }));

  // Unique device types
  const typeMap: Record<string, number> = {};
  devices.forEach(d => {
    const key = `${d.brand} ${d.model}`;
    typeMap[key] = (typeMap[key] || 0) + 1;
  });
  const deviceTypes = Object.entries(typeMap).map(([name, count]) => ({ name, count }));

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
        <button onClick={fetchDevices} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'white', fontSize: '12px', fontWeight: '600' }}>
          Refresh
        </button>
      </div>

      {/* Menu */}
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
          <div style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>{devices.length} total devices tracked</div>
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
              placeholder="Search by device, location, or serial"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '16px', backgroundColor: '#dcdcdd', color: '#3d3d3a', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888780', fontSize: '14px' }}>
            Loading devices...
          </div>
        )}

        {/* Empty state */}
        {!loading && activeTab === 'fleet' && displayedDevices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888780', fontSize: '14px' }}>
            {devices.length === 0 ? 'No inspections recorded yet. Add your first inspection.' : 'No devices match your search.'}
          </div>
        )}

        {/* Fleet */}
        {!loading && activeTab === 'fleet' && displayedDevices.map(device => (
          <div key={device.id} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[device.overall_status] || '#888780', marginTop: '4px', flexShrink: 0, boxShadow: `0 0 8px ${STATUS_COLORS[device.overall_status] || '#888780'}` }} />
            <div style={{ flex: '1' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '2px' }}>{device.brand} {device.model}</div>
              <div style={{ fontSize: '11px', color: '#888780', marginBottom: '4px', fontFamily: 'monospace' }}>SN: {device.serial_number}</div>
              <div style={{ fontSize: '12px', color: '#888780', marginBottom: '8px' }}>{device.location}</div>
              <div style={{ fontSize: '12px', color: STATUS_COLORS[device.overall_status] || '#888780', fontWeight: '600' }}>{getStatusMessage(device)}</div>
            </div>
          </div>
        ))}

        {/* Locations */}
        {!loading && activeTab === 'locations' && locations.map((loc, i) => (
          <div key={i} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '4px' }}>{loc.name}</div>
            <div style={{ fontSize: '12px', color: '#888780' }}>{loc.deviceCount} device{loc.deviceCount !== 1 ? 's' : ''}</div>
          </div>
        ))}

        {!loading && activeTab === 'locations' && locations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888780', fontSize: '14px' }}>No locations recorded yet.</div>
        )}

        {/* Device Types */}
        {!loading && activeTab === 'types' && deviceTypes.map((type, i) => (
          <div key={i} style={{ backgroundColor: '#dcdcdd', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#3d3d3a', marginBottom: '4px' }}>{type.name}</div>
            <div style={{ fontSize: '12px', color: '#888780' }}>{type.count} device{type.count !== 1 ? 's' : ''}</div>
          </div>
        ))}

        {!loading && activeTab === 'types' && deviceTypes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888780', fontSize: '14px' }}>No devices recorded yet.</div>
        )}

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
          <button onClick={handleCameraScan} style={{ width: '100%', padding: '14px', backgroundColor: '#3d3d3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}>
            Scan QR / Barcode
          </button>
          <button onClick={handleManualEntry} style={{ width: '100%', padding: '14px', backgroundColor: '#5d8b5f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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
