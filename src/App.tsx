import React, { useState, useMemo, useRef } from 'react';
import './App.css';

interface Flight {
  id: string;
  start: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  cost: number;
}

interface Itinerary {
  id: string;
  name: string;
  flights: Flight[];
}

const App: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null);
  const [newItineraryName, setNewItineraryName] = useState('');
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [newFlight, setNewFlight] = useState<Partial<Flight>>({
    start: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    flightNumber: '',
    cost: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentItinerary = useMemo(() => 
    itineraries.find(it => it.id === currentItineraryId), 
    [itineraries, currentItineraryId]
  );

  const addItinerary = () => {
    if (!newItineraryName) return;
    if (itineraries.length >= 5) {
      alert('Maximum of 5 itineraries allowed.');
      return;
    }
    const id = crypto.randomUUID();
    setItineraries([...itineraries, { id, name: newItineraryName, flights: [] }]);
    setNewItineraryName('');
    setCurrentItineraryId(id);
  };

  const saveFlight = () => {
    if (!currentItinerary || !newFlight.start || !newFlight.destination) return;
    
    if (editingFlightId) {
      setItineraries(itineraries.map(it => 
        it.id === currentItineraryId 
          ? { ...it, flights: it.flights.map(f => f.id === editingFlightId ? {
              ...f,
              start: newFlight.start || '',
              destination: newFlight.destination || '',
              departureTime: newFlight.departureTime || '',
              arrivalTime: newFlight.arrivalTime || '',
              flightNumber: newFlight.flightNumber || '',
              cost: Number(newFlight.cost) || 0,
            } : f) } 
          : it
      ));
      setEditingFlightId(null);
    } else {
      const flight: Flight = {
        id: crypto.randomUUID(),
        start: newFlight.start || '',
        destination: newFlight.destination || '',
        departureTime: newFlight.departureTime || '',
        arrivalTime: newFlight.arrivalTime || '',
        flightNumber: newFlight.flightNumber || '',
        cost: Number(newFlight.cost) || 0,
      };

      setItineraries(itineraries.map(it => 
        it.id === currentItineraryId ? { ...it, flights: [...it.flights, flight] } : it
      ));
    }
    setNewFlight({ start: '', destination: '', departureTime: '', arrivalTime: '', flightNumber: '', cost: 0 });
  };

  const startEditing = (flight: Flight) => {
    setEditingFlightId(flight.id);
    setNewFlight({
      start: flight.start,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      flightNumber: flight.flightNumber,
      cost: flight.cost,
    });
  };

  const cancelEditing = () => {
    setEditingFlightId(null);
    setNewFlight({ start: '', destination: '', departureTime: '', arrivalTime: '', flightNumber: '', cost: 0 });
  };

  const deleteFlight = (flightId: string) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    setItineraries(itineraries.map(it => 
      it.id === currentItineraryId ? { ...it, flights: it.flights.filter(f => f.id !== flightId) } : it
    ));
    if (editingFlightId === flightId) {
      cancelEditing();
    }
  };

  const exportItinerary = (itinerary: Itinerary) => {
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `itinerary_${itinerary.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Itinerary;
        if (!imported.id || !imported.name || !Array.isArray(imported.flights)) {
          throw new Error('Invalid itinerary format');
        }

        if (itineraries.length >= 5) {
          alert('Maximum of 5 itineraries allowed. Please delete one first.');
          return;
        }

        setItineraries([...itineraries, { ...imported, id: crypto.randomUUID() }]);
        alert(`Imported itinerary "${imported.name}" successfully!`);
      } catch (err) {
        alert('Error importing file: Invalid JSON or format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calculateTotal = (flights: Flight[]) => 
    flights.reduce((sum, flight) => sum + flight.cost, 0);

  const minCost = useMemo(() => {
    if (itineraries.length === 0) return Infinity;
    return Math.min(...itineraries.map(it => calculateTotal(it.flights)));
  }, [itineraries]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Flight Itinerary Planner</h1>
        <p>Compare and optimize your travel routes</p>
      </header>
      
      <section className="setup-section">
        <div className="input-group">
          <input 
            value={newItineraryName} 
            onChange={(e) => setNewItineraryName(e.target.value)} 
            placeholder="Itinerary Name (e.g. Asia Tour)" 
          />
          <button className="primary-btn" onClick={addItinerary} disabled={itineraries.length >= 5}>
            {itineraries.length >= 5 ? 'Limit Reached' : 'Add Itinerary'}
          </button>
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
            Import Backup
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json" 
            onChange={handleImport} 
          />
        </div>
        <span className="limit-info">{itineraries.length}/5 Itineraries Used</span>
      </section>

      <div className="main-content">
        <aside className="itinerary-sidebar">
          <h2>Your Options</h2>
          <div className="itinerary-tabs">
            {itineraries.map((it, index) => (
              <div 
                key={it.id} 
                className={`tab-item ${currentItineraryId === it.id ? 'active' : ''}`}
                onClick={() => setCurrentItineraryId(it.id)}
              >
                <div className="tab-info">
                  <span className="tab-label">{String.fromCharCode(65 + index)}: {it.name}</span>
                  <span className="tab-cost">${calculateTotal(it.flights)}</span>
                </div>
                <button className="export-btn" onClick={(e) => {
                  e.stopPropagation();
                  exportItinerary(it);
                }} title="Export to JSON">
                  💾
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="editor-panel">
          {currentItinerary ? (
            <div className="editor-container">
              <div className="editor-header">
                <h2>Editing {currentItinerary.name}</h2>
                <div className="quick-stats">
                  <span>Legs: {currentItinerary.flights.length}</span>
                  <span>Total: ${calculateTotal(currentItinerary.flights)}</span>
                </div>
              </div>

              <div className="flight-form-card">
                <h3>{editingFlightId ? 'Update Flight Leg' : 'Add Flight Leg'}</h3>
                <div className="flight-grid">
                  <div className="field">
                    <label>Origin</label>
                    <input placeholder="NYC" value={newFlight.start} onChange={e => setNewFlight({...newFlight, start: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Destination</label>
                    <input placeholder="LON" value={newFlight.destination} onChange={e => setNewFlight({...newFlight, destination: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Flight #</label>
                    <input placeholder="BA123" value={newFlight.flightNumber} onChange={e => setNewFlight({...newFlight, flightNumber: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Departure</label>
                    <input type="time" value={newFlight.departureTime} onChange={e => setNewFlight({...newFlight, departureTime: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Arrival</label>
                    <input type="time" value={newFlight.arrivalTime} onChange={e => setNewFlight({...newFlight, arrivalTime: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Cost ($)</label>
                    <input type="number" value={newFlight.cost} onChange={e => setNewFlight({...newFlight, cost: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="add-btn" onClick={saveFlight}>
                    {editingFlightId ? 'Save Changes' : 'Add Leg to Itinerary'}
                  </button>
                  {editingFlightId && (
                    <button className="cancel-btn" onClick={cancelEditing}>Cancel</button>
                  )}
                </div>
              </div>

              <div className="flights-table-card">
                <h3>Flight Sequence</h3>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Flight</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItinerary.flights.map((f, i) => (
                      <tr key={f.id}>
                        <td>{i + 1}</td>
                        <td>{f.flightNumber}</td>
                        <td>{f.start}</td>
                        <td>{f.destination}</td>
                        <td>{f.departureTime}</td>
                        <td>{f.arrivalTime}</td>
                        <td>${f.cost}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => startEditing(f)}>Edit</button>
                            <button className="delete-btn" onClick={() => deleteFlight(f.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✈️</div>
              <p>Select an itinerary from the sidebar or create a new one to start planning your trip.</p>
            </div>
          )}
        </main>
      </div>

      <section className="compare-section">
        <div className="section-header">
          <h2>Comparison Dashboard</h2>
          <p>Analyze all options side-by-side</p>
        </div>
        <div className="comparison-grid">
          {itineraries.map((it, index) => {
            const total = calculateTotal(it.flights);
            const avg = it.flights.length > 0 ? (total / it.flights.length).toFixed(2) : 0;
            const isLowest = total > 0 && total === minCost;

            return (
              <div key={it.id} className={`comp-card ${isLowest ? 'lowest-cost' : ''}`}>
                {isLowest && <div className="badge">Lowest Cost</div>}
                <div className="card-header">
                  <h3>{String.fromCharCode(65 + index)}: {it.name}</h3>
                </div>
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Cost</span>
                    <span className="stat-value">${total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Legs</span>
                    <span className="stat-value">{it.flights.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg/Leg</span>
                    <span className="stat-value">${avg}</span>
                  </div>
                </div>
                <div className="card-breakdown">
                  <h4>Flight Breakdown</h4>
                  <ul>
                    {it.flights.map((f, i) => (
                      <li key={f.id}>
                        <span>{i+1}. {f.flightNumber}</span>
                        <span>{f.start} → {f.destination}</span>
                        <span>${f.cost}</span>
                      </li>
                    ))}
                    {it.flights.length === 0 && <li>No flights added</li>}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default App;
