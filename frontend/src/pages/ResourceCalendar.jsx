import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  Check,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { resourcesApi } from '../api';

export const ResourceCalendar = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [resourceType, setResourceType] = useState('Venue');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastNotification, setToastNotification] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [confirmedLocks, setConfirmedLocks] = useState([]);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageCost, setDamageCost] = useState('');
  const [reportingDamage, setReportingDamage] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['09:00', '11:00', '14:00', '16:00'];

  const getConfirmedSlots = (bookingData, resourceId) => {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (bookingData || [])
      .filter((booking) => booking.resource_id === resourceId && booking.status === 'Confirmed')
      .map((booking) => new Date(booking.start_time))
      .filter((start) => start >= now && start < weekEnd)
      .map((start) => `${weekdayNames[start.getDay()]}-${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
  };

  // Fetch the selected resource category from GET /resources/.
  const fetchLiveResources = async () => {
    setLoading(true);
    try {
      const [data, bookingData] = await Promise.all([
        resourcesApi.list(resourceType || null),
        resourcesApi.listBookings(),
      ]);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item) => ({
          id: item.id,
          name: item.name,
          capacity: item.capacity,
          building: item.location || 'Campus Center',
          type: item.type || 'Venue',
          status: item.status || 'Available',
          details: item.equipment_type || item.vehicle_no || item.building || item.condition || '',
        }));
        setVenues(mapped);
        setSelectedVenue(mapped[0]);
        setConfirmedLocks(getConfirmedSlots(bookingData, mapped[0].id));
        setIsLiveConnected(true);
      } else {
        setVenues([]);
        setSelectedVenue(null);
        setConfirmedLocks([]);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('[ResourceCalendar] GET /resources/ offline or error:', err);
      setVenues([]);
      setSelectedVenue(null);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveResources();
  }, [resourceType]);

  const toggleSlotSelection = (day, time, isLocked) => {
    if (isLocked) return;
    const slotKey = `${day}-${time}`;
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter((k) => k !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  // Map booking submission to POST /resources/book with explicit 409 Conflict catch
  const handlePessimisticLockConfirm = async () => {
    if (selectedSlots.length === 0 || !selectedVenue) return;
    setSubmitting(true);
    setToastNotification(null);

    try {
      const today = new Date();
      const bookings = selectedSlots.map((slot) => {
        const [day, time] = slot.split('-');
        const targetDay = day === 'Sun' ? 0 : days.indexOf(day) + 1;
        const daysUntil = (targetDay - today.getDay() + 7) % 7 || 7;
        const start = new Date(today);
        start.setDate(today.getDate() + daysUntil);
        const [hours, minutes] = time.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return {
          slot,
          request: resourcesApi.book({
            resource_id: selectedVenue.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          }),
        };
      });
      const results = await Promise.allSettled(bookings.map(({ request }) => request));
      const successfulSlots = results.flatMap((result, index) =>
        result.status === 'fulfilled' ? [bookings[index].slot] : []
      );
      const failedSlots = results.length - successfulSlots.length;
      setConfirmedLocks((prev) => [...prev, ...successfulSlots]);
      setSelectedSlots((prev) => prev.filter((slot) => !successfulSlots.includes(slot)));
      setToastNotification({
        type: failedSlots === 0 ? 'success' : successfulSlots.length ? 'warning' : 'error',
        message: `${successfulSlots.length} of ${results.length} selected time slot(s) booked for ${selectedVenue.name}.${failedSlots ? ` ${failedSlots} could not be booked; check availability and retry.` : ''}`,
      });
      if (successfulSlots.length) {
        const updatedBookings = await resourcesApi.listBookings();
        setBookings(Array.isArray(updatedBookings) ? updatedBookings : []);
      }
    } catch (err) {
      console.warn('[ResourceCalendar] POST /resources/book response:', err);

      // Check for 409 Conflict response
      if (err.response && err.response.status === 409) {
        setToastNotification({
          type: 'error',
          message: 'Resource locked by another transaction. Please select a different time.',
        });
      } else {
        const detail = err.response?.data?.detail || err.message;
        if (detail && detail.toLowerCase().includes('conflict')) {
          setToastNotification({
            type: 'error',
            message: 'Resource locked by another transaction. Please select a different time.',
          });
        } else {
          setToastNotification({
            type: 'warning',
          message: `Booking failed: ${detail || 'the requested time is unavailable.'}`,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await resourcesApi.cancelBooking(bookingId);
      setToastNotification({ type: 'success', message: `Booking #${bookingId} cancelled.` });
      await fetchLiveResources();
    } catch (err) {
      setToastNotification({ type: 'error', message: err.response?.data?.detail || 'Could not cancel this booking.' });
    }
  };

  const handleDamageReport = async (event) => {
    event.preventDefault();
    if (!selectedVenue || damageDescription.trim().length < 5) return;
    setReportingDamage(true);
    try {
      await resourcesApi.reportDamage(selectedVenue.id, {
        description: damageDescription.trim(),
        estimated_cost: damageCost ? Number(damageCost) : null,
      });
      setDamageDescription('');
      setDamageCost('');
      setToastNotification({ type: 'success', message: `Damage report submitted for ${selectedVenue.name}.` });
    } catch (err) {
      setToastNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Could not submit the damage report.',
      });
    } finally {
      setReportingDamage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
          <Badge variant="approved">Module 04: Resource Management</Badge>
            <div className="flex items-center gap-1.5 text-xs font-sans">
              {isLiveConnected ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>FastAPI Connected (GET /api/v1/resources/)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Connecting to Catalog...</span>
                </span>
              )}
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Resource Management
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Logged in as <strong className="text-zinc-900 dark:text-white">{currentUser?.name || currentUser?.email}</strong> &bull;{' '}
            Role: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentUser?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchLiveResources}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Sync Catalog'}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={selectedSlots.length === 0 || submitting || !selectedVenue}
            onClick={handlePessimisticLockConfirm}
            icon={submitting ? Loader2 : Lock}
          >
            {submitting ? 'Locking via DB...' : `Lock Selected Slots (${selectedSlots.length})`}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label htmlFor="resource-type" className="text-xs font-semibold text-zinc-700 dark:text-slate-300">Resource type</label>
        <select
          id="resource-type"
          value={resourceType}
          onChange={(event) => {
            setSelectedSlots([]);
            setResourceType(event.target.value);
          }}
          className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-white/15 dark:bg-[#090D10] dark:text-white"
        >
          <option value="Venue">Venues</option>
          <option value="Equipment">Equipment</option>
          <option value="Transport">Transport</option>
          <option value="Accommodation">Accommodation</option>
        </select>
      </div>

      {/* TOAST / ALERT NOTIFICATION */}
      {toastNotification && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center justify-between text-xs font-sans transition-all duration-300 ${
            toastNotification.type === 'error'
              ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/60 dark:border-rose-500/50 dark:text-rose-200'
              : toastNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/50 dark:text-emerald-200'
              : 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold text-sm">{toastNotification.message}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="underline font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VENUE SELECTOR TABS & CAPACITY CARD */}
      {loading ? (
        <div className="p-12 text-center border rounded-lg border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-slate-400 mb-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
          <p className="text-xs">Loading campus resources...</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="p-12 text-center border rounded-lg border-dashed border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-slate-400 mb-8">
          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">No records found</p>
          <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5">
            No {resourceType.toLowerCase()} resources registered in the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {venues.slice(0, 8).map((venue) => {
            const isSelected = selectedVenue?.id === venue.id;
            return (
              <div
                key={venue.id}
                onClick={() => {
                  setSelectedVenue(venue);
                  setConfirmedLocks(getConfirmedSlots(bookings, venue.id));
                  setSelectedSlots([]);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-zinc-100 border-black shadow-sm dark:bg-[#101417] dark:border-emerald-400/80 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 dark:bg-[#090D10]/80 dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white font-sans">
                    {venue.type}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              {venue.type === 'Venue' ? `Capacity: ${venue.capacity ?? '—'}` : venue.status}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-sm text-zinc-950 dark:text-white leading-snug">
                  {venue.name}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans mt-1">
                  {venue.building || venue.details || 'Campus resource'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEKLY GRID CONTAINER */}
      {selectedVenue && (
        <Card
          title={`Weekly Availability Matrix: ${selectedVenue.name}`}
          subtitle="Pessimistic concurrency locks enforced via PostgreSQL SELECT FOR UPDATE"
          headerAction={
            <div className="flex items-center gap-4 text-xs font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10" />
                <span className="text-zinc-500 dark:text-slate-400">Locked / Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white dark:bg-[#090D10] border border-zinc-300 dark:border-white/20" />
                <span className="text-zinc-500 dark:text-slate-400">Available Slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-black dark:bg-emerald-400" />
                <span className="text-zinc-900 dark:text-white font-semibold">Selected</span>
              </div>
            </div>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days Header */}
              <div className="grid grid-cols-8 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans text-center">
                <div className="p-3 border-r border-zinc-200 dark:border-white/10">Time</div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="p-3 border-r border-zinc-200 dark:border-white/10 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {times.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b border-zinc-200/60 dark:border-white/5 text-xs font-sans"
                >
                  {/* Time Label */}
                  <div className="p-3 font-mono font-semibold text-zinc-500 dark:text-slate-400 text-center flex items-center justify-center border-r border-zinc-200/60 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                    {time}
                  </div>

                  {/* Day Columns */}
                  {days.map((day) => {
                    const slotKey = `${day}-${time}`;
                    const isConfirmedLock = confirmedLocks.includes(slotKey);
                    const isSelected = selectedSlots.includes(slotKey);

                    return (
                      <div
                        key={slotKey}
                        onClick={() => toggleSlotSelection(day, time, isConfirmedLock)}
                        className={`p-3 border-r border-zinc-200/60 dark:border-white/5 last:border-r-0 min-h-[75px] transition-all duration-150 flex flex-col justify-between ${
                          isConfirmedLock
                            ? 'bg-zinc-100/90 dark:bg-white/[0.04] cursor-not-allowed text-zinc-400 dark:text-slate-500'
                            : isSelected
                            ? 'bg-black text-white dark:bg-emerald-400 dark:text-black font-semibold cursor-pointer shadow-inner'
                            : 'bg-white hover:bg-zinc-50 dark:bg-[#05080A] dark:hover:bg-white/[0.02] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono opacity-60">{time}</span>
                          {isConfirmedLock && (
                            <Lock className="w-3 h-3 text-zinc-400 dark:text-slate-500" />
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white dark:text-black" />
                          )}
                        </div>

                        <div className="mt-1">
                          {isConfirmedLock ? (
                            <span className="text-[10px] font-medium block leading-tight">
                              Locked
                            </span>
                          ) : isSelected ? (
                            <span className="text-[10px] font-bold block leading-tight">
                              Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 dark:text-slate-500 block leading-tight">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Booking Records"
        subtitle="Confirmed reservations are loaded from the resource booking service."
        className="mt-6"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-white/[0.02] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {bookings.length ? bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-semibold">{booking.resource?.name || `Resource #${booking.resource_id}`}</td>
                  <td className="px-4 py-3">{new Date(booking.start_time).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(booking.end_time).toLocaleString()}</td>
                  <td className="px-4 py-3">{booking.status}</td>
                  <td className="px-4 py-3 text-right">
                    {booking.status === 'Confirmed' && (
                      <Button variant="secondary" size="sm" onClick={() => handleCancelBooking(booking.id)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedVenue && (
        <Card
          title="Report Resource Damage"
          subtitle="Log an incident and optional repair estimate for the selected resource."
          className="mt-6"
        >
          <form onSubmit={handleDamageReport} className="grid grid-cols-1 md:grid-cols-[1fr_12rem_auto] gap-3 items-end">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Incident description
              <textarea
                value={damageDescription}
                onChange={(event) => setDamageDescription(event.target.value)}
                minLength={5}
                required
                rows={3}
                className="mt-1 block w-full rounded border border-zinc-300 bg-white p-2 text-sm font-normal text-zinc-900 dark:border-white/15 dark:bg-[#090D10] dark:text-white"
                placeholder="Describe the damage or incident"
              />
            </label>
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Estimated repair cost
              <input
                type="number"
                min="0"
                step="0.01"
                value={damageCost}
                onChange={(event) => setDamageCost(event.target.value)}
                className="mt-1 block h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 dark:border-white/15 dark:bg-[#090D10] dark:text-white"
                placeholder="Optional"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={reportingDamage || damageDescription.trim().length < 5}>
              {reportingDamage ? 'Submitting…' : 'Submit Report'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ResourceCalendar;
