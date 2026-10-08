import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { MOCK_VENUES, MOCK_CALENDAR_SLOTS } from '../data/mockData';

export const ResourceCalendar = ({ onNavigate }) => {
  const [selectedVenue, setSelectedVenue] = useState(MOCK_VENUES[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [lockedSuccessMessage, setLockedSuccessMessage] = useState(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['09:00', '11:00', '14:00', '16:00'];

  const toggleSlotSelection = (day, time, isLocked) => {
    if (isLocked) return;
    const slotKey = `${day}-${time}`;
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter((k) => k !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  const handlePessimisticLockConfirm = () => {
    if (selectedSlots.length === 0) return;
    setLockedSuccessMessage(
      `Pessimistic row lock acquired for ${selectedSlots.length} slot(s) at ${selectedVenue.name} via SELECT FOR UPDATE. No conflict found.`
    );
    setSelectedSlots([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="approved">Module 04: Concurrency Engine</Badge>
            <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
              Pessimistic Database Row Locking
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Resource Booking &amp; Concurrency Matrix
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Visual interval scheduler enforcing mathematical overlap detection (HTTP 409
            Conflict prevention).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            disabled={selectedSlots.length === 0}
            onClick={handlePessimisticLockConfirm}
            icon={Lock}
          >
            Lock Selected Slots ({selectedSlots.length})
          </Button>
        </div>
      </div>

      {lockedSuccessMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lockedSuccessMessage}</span>
          </div>
          <button
            onClick={() => setLockedSuccessMessage(null)}
            className="underline font-bold text-emerald-600 dark:text-emerald-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VENUE SELECTOR TABS & CAPACITY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {MOCK_VENUES.map((venue) => {
          const isSelected = selectedVenue.id === venue.id;
          return (
            <div
              key={venue.id}
              onClick={() => setSelectedVenue(venue)}
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
                  Cap: {venue.capacity}
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-zinc-950 dark:text-white leading-snug">
                {venue.name}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans mt-1">
                {venue.building}
              </p>
            </div>
          );
        })}
      </div>

      {/* WEEKLY GRID CONTAINER */}
      <Card
        title={`Weekly Matrix: ${selectedVenue.name}`}
        subtitle="Week of Nov 16 – Nov 22, 2026 (Pessimistic Locks in Gray/Red, Available in White/Dark)"
        headerAction={
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10" />
              <span className="text-zinc-500 dark:text-slate-400">Locked / Unavailable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white dark:bg-[#090D10] border border-zinc-300 dark:border-white/20" />
              <span className="text-zinc-500 dark:text-slate-400">Selectable Slot</span>
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
                  const slotData = MOCK_CALENDAR_SLOTS.find(
                    (s) => s.day === day && s.time === time
                  );
                  const isLocked = slotData ? slotData.locked : false;
                  const isSelected = selectedSlots.includes(slotKey);

                  return (
                    <div
                      key={day}
                      onClick={() => toggleSlotSelection(day, time, isLocked)}
                      className={`p-2 min-h-[90px] border-r border-zinc-200/60 dark:border-white/5 last:border-r-0 transition-all duration-200 flex flex-col justify-between ${
                        isLocked
                          ? 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-400 dark:text-slate-500 cursor-not-allowed select-none'
                          : isSelected
                          ? 'bg-black text-white dark:bg-emerald-500 dark:text-black cursor-pointer shadow-md'
                          : 'bg-white hover:bg-zinc-50 dark:bg-[#090D10]/40 dark:hover:bg-white/[0.04] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold opacity-60">
                          {time}
                        </span>
                        {isLocked && (
                          <Lock className="w-3 h-3 text-zinc-400 dark:text-slate-600" />
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white dark:text-black" />
                        )}
                      </div>

                      <div className="mt-1">
                        {isLocked ? (
                          <>
                            <p className="text-[11px] font-semibold line-clamp-2 leading-tight text-zinc-700 dark:text-slate-400">
                              {slotData.title}
                            </p>
                            <span className="text-[9px] uppercase tracking-wider block mt-0.5 text-zinc-500 dark:text-slate-600">
                              {slotData.organizer || 'Reserved'}
                            </span>
                          </>
                        ) : isSelected ? (
                          <p className="text-[11px] font-bold">Selected for Lock</p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium">
                            + Select Slot
                          </p>
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
    </div>
  );
};

export default ResourceCalendar;
