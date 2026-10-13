import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Unlock,
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
  const [selectedLockedSlots, setSelectedLockedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
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

  // Auto-sync data fetching on component mount and resource type change
  useEffect(() => {
    fetchLiveResources();
  }, [resourceType]);

  const toggleSlotSelection = (day, time, isLocked) => {
    const slotKey = `${day}-${time}`;
    if (isLocked) {
      if (selectedLockedSlots.includes(slotKey)) {
        setSelectedLockedSlots(selectedLockedSlots.filter((k) => k !== slotKey));
      } else {
        setSelectedLockedSlots([...selectedLockedSlots, slotKey]);
      }
      return;
    }
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

  const handleUnlockSelectedSlots = async () => {
    if (selectedLockedSlots.length === 0 || !selectedVenue) return;
    setUnlocking(true);
    setToastNotification(null);
    try {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const bookingsToCancel = (bookings || []).filter((b) => {
        if (b.resource_id !== selectedVenue.id || b.status !== 'Confirmed') return false;
        const start = new Date(b.start_time);
        if (start < now || start >= weekEnd) return false;
        const slot = `${weekdayNames[start.getDay()]}-${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        return selectedLockedSlots.includes(slot);
      });

      if (bookingsToCancel.length > 0) {
        await Promise.all(bookingsToCancel.map((b) => resourcesApi.cancelBooking(b.id)));
      } else {
        await resourcesApi.unlockSlots({
          resource_id: selectedVenue.id,
          booking_ids: bookingsToCancel.map((b) => b.id),
        });
      }

      setToastNotification({
        type: 'success',
        message: `Successfully released locks for ${selectedLockedSlots.length} slot(s) on ${selectedVenue.name}.`,
      });
      setSelectedLockedSlots([]);
      await fetchLiveResources();
    } catch (err) {
      console.warn('[ResourceCalendar] Unlock error:', err);
      setToastNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Could not unlock selected slots.',
      });
    } finally {
      setUnlocking(false);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-stone-200 dark:border-[#2A2A2A]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Resource Management
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans mt-1">
            Logged in as <strong className="text-neutral-900 dark:text-neutral-100">{currentUser?.name || currentUser?.email}</strong> &bull;{' '}
            Role: <span className="text-neutral-900 dark:text-stone-300 font-semibold">{currentUser?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            disabled={selectedLockedSlots.length === 0 || unlocking || !selectedVenue}
            onClick={handleUnlockSelectedSlots}
            icon={unlocking ? Loader2 : Unlock}
            className={selectedLockedSlots.length > 0 ? 'border-rose-400 text-rose-700 dark:text-rose-300 dark:border-rose-700 font-semibold' : ''}
          >
            {unlocking ? 'Unlocking Slots...' : `Unlock Selected Slots (${selectedLockedSlots.length})`}
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
        <label htmlFor="resource-type" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Resource type</label>
        <select
          id="resource-type"
          value={resourceType}
          onChange={(event) => {
            setSelectedSlots([]);
            setResourceType(event.target.value);
          }}
          className="h-10 rounded border border-stone-300 bg-stone-50 px-3 text-sm text-neutral-900 dark:border-[#2A2A2A] dark:bg-[#111111] dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-stone-400"
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
              ? 'bg-stone-200/80 border-stone-300 text-neutral-900 dark:bg-[#1F1F1F] dark:border-[#333333] dark:text-stone-200'
              : 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-neutral-900 dark:text-stone-300 shrink-0" />
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
        <div className="p-12 text-center border rounded-lg border-stone-200 dark:border-[#2A2A2A] text-neutral-500 dark:text-neutral-400 mb-8 bg-stone-100 dark:bg-[#1A1A1A]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-900 dark:text-stone-300" />
          <p className="text-xs">Loading campus resources...</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="p-12 text-center border rounded-lg border-dashed border-stone-300 dark:border-[#2A2A2A] text-neutral-500 dark:text-neutral-400 mb-8 bg-stone-100 dark:bg-[#1A1A1A]">
          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">No records found</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
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
                  setSelectedLockedSlots([]);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-stone-200 border-neutral-900 shadow-sm dark:bg-[#222222] dark:border-stone-300'
                    : 'bg-stone-100 border-stone-200 hover:border-stone-300 dark:bg-[#1A1A1A] dark:border-[#2A2A2A] dark:hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-sans">
                    {venue.type}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
              {venue.type === 'Venue' ? `Capacity: ${venue.capacity ?? '—'}` : venue.status}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                  {venue.name}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans mt-1">
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
                <span className="w-3 h-3 rounded bg-stone-300 dark:bg-[#2E2E2E] border border-stone-400 dark:border-[#3E3E3E]" />
                <span className="text-neutral-500 dark:text-neutral-400">Locked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-950 border border-rose-400" />
                <span className="text-rose-700 dark:text-rose-400 font-semibold">Selected to Unlock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#2A2A2A]" />
                <span className="text-neutral-500 dark:text-neutral-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-neutral-900 dark:bg-stone-200" />
                <span className="text-neutral-900 dark:text-neutral-100 font-semibold">Selected</span>
              </div>
            </div>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days Header */}
              <div className="grid grid-cols-8 border-b border-stone-200 dark:border-[#2A2A2A] bg-stone-50 dark:bg-[#151515] text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans text-center">
                <div className="p-3 border-r border-stone-200 dark:border-[#2A2A2A]">Time</div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="p-3 border-r border-stone-200 dark:border-[#2A2A2A] last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {times.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b border-stone-200 dark:border-[#2A2A2A] text-xs font-sans"
                >
                  {/* Time Label */}
                  <div className="p-3 font-mono font-semibold text-neutral-500 dark:text-neutral-400 text-center flex items-center justify-center border-r border-stone-200 dark:border-[#2A2A2A] bg-stone-50/60 dark:bg-[#141414]">
                    {time}
                  </div>

                  {/* Day Columns */}
                  {days.map((day) => {
                    const slotKey = `${day}-${time}`;
                    const isConfirmedLock = confirmedLocks.includes(slotKey);
                    const isSelected = selectedSlots.includes(slotKey);
                    const isLockedSelected = selectedLockedSlots.includes(slotKey);

                    return (
                      <div
                        key={slotKey}
                        onClick={() => toggleSlotSelection(day, time, isConfirmedLock)}
                        className={`p-3 border-r border-stone-200 dark:border-[#2A2A2A] last:border-r-0 min-h-[75px] transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                          isConfirmedLock
                            ? isLockedSelected
                              ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-500 font-semibold ring-1 ring-rose-500 shadow-inner'
                              : 'bg-stone-200/70 dark:bg-[#202020] text-stone-600 dark:text-neutral-400 hover:ring-1 hover:ring-rose-400/50'
                            : isSelected
                            ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 font-semibold shadow-inner'
                            : 'bg-stone-50 hover:bg-stone-100 dark:bg-[#111111] dark:hover:bg-[#181818]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono opacity-60">{time}</span>
                          {isConfirmedLock && (
                            isLockedSelected ? (
                              <Unlock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                            )
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-stone-50 dark:text-neutral-900" />
                          )}
                        </div>

                        <div className="mt-1">
                          {isConfirmedLock ? (
                            <span className={`text-[10px] font-medium block leading-tight ${isLockedSelected ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}`}>
                              {isLockedSelected ? 'Unlock' : 'Locked'}
                            </span>
                          ) : isSelected ? (
                            <span className="text-[10px] font-bold block leading-tight">
                              Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block leading-tight">
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
            <thead className="bg-stone-50 text-neutral-500 dark:bg-[#151515] dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-[#2A2A2A]">
              {bookings.length ? bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{booking.resource?.name || `Resource #${booking.resource_id}`}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{new Date(booking.start_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{new Date(booking.end_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{booking.status}</td>
                  <td className="px-4 py-3 text-right">
                    {booking.status === 'Confirmed' && (
                      <Button variant="secondary" size="sm" onClick={() => handleCancelBooking(booking.id)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No bookings found.</td></tr>
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
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Incident description
              <textarea
                value={damageDescription}
                onChange={(event) => setDamageDescription(event.target.value)}
                minLength={5}
                required
                rows={3}
                className="mt-1 block w-full rounded border border-stone-300 bg-stone-50 p-2 text-sm font-normal text-neutral-900 dark:border-[#2A2A2A] dark:bg-[#111111] dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-stone-400"
                placeholder="Describe the damage or incident"
              />
            </label>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Estimated repair cost
              <input
                type="number"
                min="0"
                step="0.01"
                value={damageCost}
                onChange={(event) => setDamageCost(event.target.value)}
                className="mt-1 block h-10 w-full rounded border border-stone-300 bg-stone-50 px-3 text-sm font-normal text-neutral-900 dark:border-[#2A2A2A] dark:bg-[#111111] dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-stone-400"
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
