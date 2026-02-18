import React, { useState, useMemo } from 'react';
import { Flashcard } from '../../types';
import { Calendar, Flame, CheckCircle2, AlertTriangle, Layers, Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ScheduleTabProps {
  cards: Flashcard[];
  streakCount: number;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ cards, streakCount }) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(0);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // 1. Compute 7-day upcoming due cards for the selected week offset
  const next7Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (weekOffset * 7));

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const dueInDay = cards.filter(c => {
        if (!c.nextReview || c.back === '__STUB__' || c.back === '__GROUPED_STUB__') return false;
        const cDate = new Date(c.nextReview).toISOString().split('T')[0];
        if (weekOffset === 0 && i === 0) {
          // Today includes overdue
          return cDate <= dateStr;
        }
        return cDate === dateStr;
      });

      const physics = dueInDay.filter(c => c.subject === 'physics').length;
      const chemistry = dueInDay.filter(c => c.subject === 'chemistry').length;
      const maths = dueInDay.filter(c => c.subject === 'maths').length;

      const isToday = d.getTime() === today.getTime();

      return {
        offset: i,
        date: d,
        dateStr,
        label: isToday ? 'Today (Due)' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: dueInDay.length,
        physics,
        chemistry,
        maths,
        cards: dueInDay
      };
    });

    return days;
  }, [cards, weekOffset]);

  // 2. Compute standard Month Calendar Grid for monthOffset
  const monthCalendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear();
    const month = today.getMonth() + monthOffset;

    // Target month date
    const targetMonthDate = new Date(year, month, 1);
    const monthName = targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    // First day of month (0 = Sun, 1 = Mon, ... 6 = Sat)
    const firstDayIndex = targetMonthDate.getDay();
    // Days in current month
    const daysInMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();

    // Previous month total days for leading overflow
    const daysInPrevMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 0).getDate();

    const cells = [];
    const totalSlots = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

    let monthlyTotalReviews = 0;

    for (let i = 0; i < totalSlots; i++) {
      let dayDate: Date;
      let isCurrentMonth = true;

      if (i < firstDayIndex) {
        // Leading days from previous month
        const prevDayNum = daysInPrevMonth - (firstDayIndex - 1 - i);
        dayDate = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() - 1, prevDayNum);
        isCurrentMonth = false;
      } else if (i >= firstDayIndex + daysInMonth) {
        // Trailing days from next month
        const nextDayNum = i - (firstDayIndex + daysInMonth) + 1;
        dayDate = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, nextDayNum);
        isCurrentMonth = false;
      } else {
        // Current month day
        const dayNum = i - firstDayIndex + 1;
        dayDate = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), dayNum);
      }

      dayDate.setHours(0, 0, 0, 0);
      const dateStr = dayDate.toISOString().split('T')[0];

      const dueCount = cards.filter(c => {
        if (!c.nextReview || c.back === '__STUB__' || c.back === '__GROUPED_STUB__') return false;
        return new Date(c.nextReview).toISOString().split('T')[0] === dateStr;
      }).length;

      if (isCurrentMonth) {
        monthlyTotalReviews += dueCount;
      }

      const isToday = dayDate.getTime() === today.getTime();

      cells.push({
        date: dayDate,
        dateStr,
        dayNum: dayDate.getDate(),
        isCurrentMonth,
        isToday,
        dueCount
      });
    }

    return {
      monthName,
      cells,
      monthlyTotalReviews
    };
  }, [cards, monthOffset]);

  // 3. Compute mastered topics list
  const masteredTopics = useMemo(() => {
    const topicMap = new Map<string, { topic: string; subject?: string; totalCards: number; masteredCards: number }>();

    cards.forEach(c => {
      if (c.isGroupMaster) return;
      const key = c.topic;
      if (!topicMap.has(key)) {
        topicMap.set(key, { topic: key, subject: c.subject, totalCards: 0, masteredCards: 0 });
      }
      const entry = topicMap.get(key)!;
      entry.totalCards++;
      if (c.masteredAt || (c.consecutiveCorrect && c.consecutiveCorrect >= 3)) {
        entry.masteredCards++;
      }
    });

    return Array.from(topicMap.values()).filter(t => t.masteredCards > 0);
  }, [cards]);

  const activeDayCards = selectedDayOffset !== null ? next7Days[selectedDayOffset]?.cards || [] : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex items-center justify-between bg-gradient-to-br from-amber-950/20 to-slate-900">
          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-1">Review Streak</div>
            <div className="text-3xl font-black text-white flex items-center gap-2">
              <span>{streakCount} Days</span>
              <Flame className="w-7 h-7 text-amber-500 fill-amber-500 animate-bounce" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Keep daily momentum to solidify neural pathways</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex items-center justify-between bg-gradient-to-br from-cyan-950/20 to-slate-900">
          <div>
            <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-1">Total Active Immunity</div>
            <div className="text-3xl font-black text-cyan-300">
              {cards.filter(c => c.back !== '__STUB__' && !c.isGroupMaster).length} Cards
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Vaccinated cards currently in SM-2 spaced repetition</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between bg-gradient-to-br from-emerald-950/20 to-slate-900">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1">Mastered Topics</div>
            <div className="text-3xl font-black text-emerald-300">
              {masteredTopics.length} Topics
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Synced to Chapter Progress in Syllabus</p>
          </div>
        </div>
      </div>

      {/* 7-Day Upcoming Review Forecast */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> 7-Day Due Forecast & Daily Schedule
          </h3>

          {/* Week Navigation Controls */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 font-medium"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev Week</span>
            </button>

            {weekOffset !== 0 && (
              <button 
                onClick={() => setWeekOffset(0)}
                className="px-2 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Today
              </button>
            )}

            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 font-medium"
              title="Next Week"
            >
              <span className="hidden sm:inline">Next Week</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {next7Days.map(day => (
            <button 
              key={day.offset}
              onClick={() => setSelectedDayOffset(day.offset)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all ${selectedDayOffset === day.offset ? 'bg-cyan-950/50 border-cyan-500 shadow-lg shadow-cyan-500/20' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{day.label}</span>
              <span className={`text-2xl font-black my-2 ${day.count > 0 ? (day.offset === 0 && weekOffset === 0 ? 'text-red-400' : 'text-cyan-300') : 'text-slate-600'}`}>
                {day.count}
              </span>
              <div className="flex gap-1 text-[10px] font-mono">
                {day.physics > 0 && <span className="text-emerald-400">P:{day.physics}</span>}
                {day.chemistry > 0 && <span className="text-amber-400">C:{day.chemistry}</span>}
                {day.maths > 0 && <span className="text-rose-400">M:{day.maths}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Day Card Preview */}
        {selectedDayOffset !== null && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex justify-between items-center">
              <span>Cards Due for {next7Days[selectedDayOffset]?.label} ({activeDayCards.length})</span>
            </h4>

            {activeDayCards.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No reviews scheduled for this day!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeDayCards.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white truncate max-w-[180px]">{c.topic}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{c.subject} | EF: {c.easeFactor.toFixed(1)}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      Lvl {c.ladderLevel || 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monthly Spaced Repetition Heatmap - Real Month Calendar View */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Monthly Spaced Repetition Heatmap
              </h3>
              <p className="text-xs text-purple-300 font-mono">
                {monthCalendarData.monthName} • {monthCalendarData.monthlyTotalReviews} Scheduled Reviews
              </p>
            </div>
          </div>
          
          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button 
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold text-xs"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Prev Month</span>
            </button>

            {monthOffset !== 0 && (
              <button 
                onClick={() => setMonthOffset(0)}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 font-bold text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Today
              </button>
            )}

            <button 
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold text-xs"
              title="Next Month"
            >
              <span>Next Month</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real 7-Column Month Calendar View */}
        <div className="max-w-xl mx-auto p-5 bg-slate-950/90 rounded-2xl border border-slate-800/80 shadow-2xl space-y-3">
          {/* Calendar Month Banner Header */}
          <div className="text-center pb-3 text-sm font-black text-cyan-400 tracking-widest uppercase border-b border-slate-800/80">
            {monthCalendarData.monthName}
          </div>

          {/* Days of Week Header Row */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-mono font-black text-slate-400 uppercase">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* 7x5 / 7x6 Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthCalendarData.cells.map((cell, idx) => {
              let bgClass = 'bg-slate-900/70 border-slate-800 text-slate-300';

              if (!cell.isCurrentMonth) {
                bgClass = 'bg-slate-950/30 border-slate-900/40 text-slate-700 opacity-30';
              } else if (cell.dueCount > 0) {
                if (cell.dueCount >= 10) bgClass = 'bg-cyan-400 text-slate-950 font-black border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]';
                else if (cell.dueCount >= 5) bgClass = 'bg-cyan-600 text-white font-bold border-cyan-500';
                else bgClass = 'bg-cyan-950 text-cyan-300 border-cyan-800/80';
              }

              return (
                <div 
                  key={idx}
                  title={`${cell.dateStr}: ${cell.dueCount} cards scheduled`}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-xs font-mono transition-all hover:scale-105 cursor-pointer relative ${bgClass} ${cell.isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 font-black text-amber-300' : ''}`}
                >
                  <span className="text-xs font-bold">{cell.dayNum}</span>
                  {cell.dueCount > 0 && cell.isCurrentMonth && (
                    <span className={`text-[9px] font-extrabold ${cell.dueCount >= 10 ? 'text-slate-950' : 'text-cyan-300'}`}>
                      {cell.dueCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Footer Legend */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500 font-medium">Less</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" title="0 cards"></div>
              <div className="w-3.5 h-3.5 rounded bg-cyan-950 border border-cyan-800" title="1-4 cards"></div>
              <div className="w-3.5 h-3.5 rounded bg-cyan-600 border border-cyan-500" title="5-9 cards"></div>
              <div className="w-3.5 h-3.5 rounded bg-cyan-400 border border-cyan-300" title="10+ cards"></div>
            </div>
            <span className="text-slate-500 font-medium">More</span>
          </div>
        </div>
      </div>

      {/* Mastered Topics List */}
      {masteredTopics.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Syllabus Mastered Topics ({masteredTopics.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {masteredTopics.map(t => (
              <div key={t.topic} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-300">{t.topic}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{t.subject} • {t.masteredCards}/{t.totalCards} cards mastered</div>
                </div>
                <span className="text-emerald-400 text-base">✅</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
