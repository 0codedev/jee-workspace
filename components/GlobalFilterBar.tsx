
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { GlobalFilter } from '../types';
import { TestType, TestSubType } from '../types';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { MultiSelect } from './common/MultiSelect';

interface GlobalFilterBarProps {
    filter: GlobalFilter;
    setFilter: (filter: GlobalFilter) => void;
    testTypes: string[];
    subTypes: string[];
}

export const GlobalFilterBar = React.memo<GlobalFilterBarProps>(({ filter, setFilter, testTypes, subTypes }) => {
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const typeOptions = useMemo(() => testTypes.map(t => ({ label: t, value: t })), [testTypes]);
    const subTypeOptions = useMemo(() => subTypes.map(t => ({ label: t, value: t })), [subTypes]);
    const subjectOptions = useMemo(() => [
        { label: 'Physics', value: 'physics' },
        { label: 'Chemistry', value: 'chemistry' },
        { label: 'Maths', value: 'maths' }
    ], []);

    const selectedTypes = useMemo(() => Array.isArray(filter.type) ? filter.type : (filter.type === 'all' ? [] : [filter.type as string]), [filter.type]);
    const selectedSubTypes = useMemo(() => Array.isArray(filter.subType) ? filter.subType : (filter.subType === 'all' ? [] : [filter.subType as string]), [filter.subType]);
    const selectedSubjects = filter.subjects || [];

    const activeFilterCount = (selectedSubjects.length > 0 ? 1 : 0) + (selectedTypes.length > 0 ? 1 : 0) + (selectedSubTypes.length > 0 ? 1 : 0) + (filter.startDate ? 1 : 0) + (filter.endDate ? 1 : 0);

    const handleReset = () => {
        setFilter({ type: 'all', subType: 'all', subjects: [], startDate: '', endDate: '' });
    };

    return (
        <>
            {/* Mobile Filter Button */}
            <div className="md:hidden flex items-center">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsMobileOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 border-slate-700 text-slate-200"
                >
                    <span>⚡ Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center font-mono">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Desktop Inline Filter Bar */}
            <div className="hidden md:flex items-center gap-2.5 text-xs glass-panel p-1.5 rounded-xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium px-1">Subjects</span>
                    <MultiSelect
                        options={subjectOptions}
                        selectedValues={selectedSubjects}
                        onChange={values => setFilter({ ...filter, subjects: values as any })}
                        placeholder="All Subjects"
                        className="w-32"
                    />
                </div>

                <div className="w-[1px] h-4 bg-slate-800"></div>

                <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium px-1">Type</span>
                    <MultiSelect
                        options={typeOptions}
                        selectedValues={selectedTypes}
                        onChange={values => setFilter({ ...filter, type: values.length === 0 ? 'all' : values })}
                        placeholder="All Types"
                        className="w-32"
                    />
                </div>
                
                <div className="w-[1px] h-4 bg-slate-800"></div>

                <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium px-1">Sub</span>
                    <MultiSelect
                        options={subTypeOptions}
                        selectedValues={selectedSubTypes}
                        onChange={values => setFilter({ ...filter, subType: values.length === 0 ? 'all' : values })}
                        placeholder="All SubTypes"
                        className="w-32"
                    />
                </div>

                <div className="w-[1px] h-4 bg-slate-800"></div>

                <div className="flex items-center gap-1.5">
                    <Input 
                        type="date" 
                        value={filter.startDate || ''} 
                        onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                        className="!py-1 !px-2 !text-xs bg-slate-900 border-slate-700 text-slate-300 h-7 w-24"
                    />
                    <span className="text-slate-600 text-[10px]">-</span>
                    <Input 
                        type="date" 
                        value={filter.endDate || ''}
                        onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                        className="!py-1 !px-2 !text-xs bg-slate-900 border-slate-700 text-slate-300 h-7 w-24"
                    />
                </div>

                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="!text-cyan-400 hover:!text-cyan-300 hover:bg-transparent px-2 h-7"
                        title="Reset Filters"
                    >
                        Reset
                    </Button>
                )}
            </div>

            {/* Mobile Filter Modal Sheet -- Portal to document.body to avoid header containing-block clipping */}
            {isMobileOpen && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-end justify-center p-0 md:hidden" 
                    onClick={() => setIsMobileOpen(false)}
                >
                    <div 
                        className="w-full max-h-[88vh] overflow-y-auto bg-slate-900 border-t border-slate-700/80 rounded-t-2xl p-5 pb-8 space-y-4 animate-slide-up-fade shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Pull handle bar */}
                        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto -mt-2 mb-2" />

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-cyan-400 text-lg">⚡</span>
                                <h3 className="text-base font-bold text-white tracking-tight">
                                    Global Filters
                                </h3>
                                {activeFilterCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold font-mono">
                                        {activeFilterCount} active
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsMobileOpen(false)} 
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-300 block mb-1.5 font-semibold">Subjects</label>
                                <MultiSelect
                                    options={subjectOptions}
                                    selectedValues={selectedSubjects}
                                    onChange={values => setFilter({ ...filter, subjects: values as any })}
                                    placeholder="All Subjects"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 block mb-1.5 font-semibold">Test Type</label>
                                <MultiSelect
                                    options={typeOptions}
                                    selectedValues={selectedTypes}
                                    onChange={values => setFilter({ ...filter, type: values.length === 0 ? 'all' : values })}
                                    placeholder="All Types"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 block mb-1.5 font-semibold">Sub Type</label>
                                <MultiSelect
                                    options={subTypeOptions}
                                    selectedValues={selectedSubTypes}
                                    onChange={values => setFilter({ ...filter, subType: values.length === 0 ? 'all' : values })}
                                    placeholder="All SubTypes"
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="text-slate-300 block mb-1.5 font-semibold">Start Date</label>
                                    <Input 
                                        type="date" 
                                        value={filter.startDate || ''} 
                                        onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 block mb-1.5 font-semibold">End Date</label>
                                    <Input 
                                        type="date" 
                                        value={filter.endDate || ''} 
                                        onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-800">
                            <Button variant="secondary" className="flex-1 py-2.5 font-semibold" onClick={handleReset}>Reset</Button>
                            <Button variant="primary" className="flex-1 py-2.5 font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20" onClick={() => setIsMobileOpen(false)}>Apply</Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});