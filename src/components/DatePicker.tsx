import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const date = new Date(value);
      return { month: date.getMonth(), year: date.getFullYear() };
    }
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value
  const selectedDate = value ? new Date(value) : null;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setViewDate({ month: date.getMonth(), year: date.getFullYear() });
    }
  }, [value]);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate.month, viewDate.year);
    const firstDay = getFirstDayOfMonth(viewDate.month, viewDate.year);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleYearChange = (delta: number) => {
    setViewDate(prev => ({ ...prev, year: prev.year + delta }));
  };

  const handleDayClick = (day: number) => {
    const month = String(viewDate.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${viewDate.year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.month &&
      selectedDate.getFullYear() === viewDate.year
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.month &&
      today.getFullYear() === viewDate.year
    );
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="date-picker" ref={containerRef}>
      <div className="date-picker-input-wrapper">
        <input
          type="date"
          value={value}
          onChange={handleInputChange}
          className="date-picker-input"
        />
        <button
          type="button"
          className="date-picker-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="date-picker-dropdown">
          {/* Year Navigation */}
          <div className="date-picker-year-nav">
            <button type="button" onClick={() => handleYearChange(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="date-picker-year">{viewDate.year}</span>
            <button type="button" onClick={() => handleYearChange(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Month Navigation */}
          <div className="date-picker-month-nav">
            <button type="button" onClick={handlePrevMonth}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="date-picker-month">{MONTHS[viewDate.month]}</span>
            <button type="button" onClick={handleNextMonth}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="date-picker-days-header">
            {DAYS.map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="date-picker-days">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                className={`date-picker-day ${day === null ? 'empty' : ''} ${day && isSelectedDay(day) ? 'selected' : ''} ${day && isToday(day) ? 'today' : ''}`}
                onClick={() => day && handleDayClick(day)}
                disabled={day === null}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-today-btn"
              onClick={() => {
                const today = new Date();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                onChange(`${today.getFullYear()}-${month}-${day}`);
                setIsOpen(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="date-picker-clear-btn"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
