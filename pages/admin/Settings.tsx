import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Save, Clock, Power, AlertCircle, CheckCircle } from 'lucide-react';

interface DaySchedule {
    open: string;
    close: string;
    closed: boolean;
}

interface OpeningTimes {
    [key: string]: DaySchedule;
}

interface StoreSettings {
    id: string;
    is_store_open: boolean;
    schedule_override: 'none' | 'force_open' | 'force_closed';
    opening_times: OpeningTimes;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .single();

            if (error) throw error;
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        setMessage(null);

        try {
            // Determine effective is_store_open based on override for the DB
            // This ensures that if we force open, the DB says open, so other clients see it immediately
            let effectiveIsOpen = settings.is_store_open;
            if (settings.schedule_override === 'force_open') effectiveIsOpen = true;
            if (settings.schedule_override === 'force_closed') effectiveIsOpen = false;
            // If auto, we let the backend or the client calculation handle it, but for consistency we can calculate it here too
            // However, usually 'auto' means we trust the schedule. 
            // For now, if auto, we don't change the boolean explicitly based on time here to avoid timezone drifts on save,
            // but we DO save the schedule_override value which is the source of truth.

            const { error } = await supabase
                .from('store_settings')
                .update({
                    is_store_open: effectiveIsOpen,
                    schedule_override: settings.schedule_override,
                    opening_times: settings.opening_times,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', settings.id);

            if (error) throw error;

            // Refresh local settings to ensure we have the latest (though we just saved it)
            await fetchSettings();

            setMessage({ type: 'success', text: 'Settings saved successfully' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const updateOpeningTime = (day: string, field: keyof DaySchedule, value: any) => {
        if (!settings) return;

        setSettings({
            ...settings,
            opening_times: {
                ...settings.opening_times,
                [day]: {
                    ...settings.opening_times[day],
                    [field]: value,
                },
            },
        });
    };

    // Calculate display status dynamically
    const isStoreOpen = React.useMemo(() => {
        if (!settings) return false;
        if (settings.schedule_override === 'force_open') return true;
        if (settings.schedule_override === 'force_closed') return false;

        // If auto, check schedule
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[now.getDay()];
        const schedule = settings.opening_times[dayName];

        if (!schedule || schedule.closed) return false;

        const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return currentTime >= schedule.open && currentTime <= schedule.close;
    }, [settings]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-wide">Store Settings</h1>
                        <p className="text-zinc-400 mt-1">Manage store availability and opening hours</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-brand-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-900' : 'bg-red-900/30 text-red-400 border border-red-900'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Store Status & Override Card */}
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isStoreOpen ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                    }`}>
                                    <Power className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Store Status</h2>
                                    <p className="text-zinc-400 text-sm">
                                        Current status: <span className={isStoreOpen ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                            {isStoreOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setSettings(s => s ? { ...s, schedule_override: 'none' } : null)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${settings?.schedule_override === 'none'
                                        ? 'bg-zinc-800 border-brand-yellow text-white shadow-lg shadow-yellow-900/10'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                            >
                                <Clock className={`w-6 h-6 ${settings?.schedule_override === 'none' ? 'text-brand-yellow' : ''}`} />
                                <span className="font-bold">Auto (Schedule)</span>
                                <span className="text-xs opacity-60">Follows opening hours</span>
                            </button>

                            <button
                                onClick={() => setSettings(s => s ? { ...s, schedule_override: 'force_open' } : null)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${settings?.schedule_override === 'force_open'
                                        ? 'bg-green-900/20 border-green-500 text-white shadow-lg shadow-green-900/10'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                            >
                                <CheckCircle className={`w-6 h-6 ${settings?.schedule_override === 'force_open' ? 'text-green-500' : ''}`} />
                                <span className="font-bold">Force Open</span>
                                <span className="text-xs opacity-60">Always open</span>
                            </button>

                            <button
                                onClick={() => setSettings(s => s ? { ...s, schedule_override: 'force_closed' } : null)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${settings?.schedule_override === 'force_closed'
                                        ? 'bg-red-900/20 border-red-500 text-white shadow-lg shadow-red-900/10'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                    }`}
                            >
                                <Power className={`w-6 h-6 ${settings?.schedule_override === 'force_closed' ? 'text-red-500' : ''}`} />
                                <span className="font-bold">Force Closed</span>
                                <span className="text-xs opacity-60">Always closed</span>
                            </button>
                        </div>

                        <p className="mt-6 text-sm text-zinc-500 border-t border-zinc-800 pt-4">
                            "Auto" mode will automatically open and close the store based on the schedule below. Use "Force" options to override the schedule manually.
                        </p>
                    </div>

                    {/* Opening Times Card */}
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-brand-yellow">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Opening Hours</h2>
                        </div>

                        <div className="space-y-4">
                            {DAYS.map((day) => {
                                const schedule = settings?.opening_times[day];
                                if (!schedule) return null;

                                return (
                                    <div key={day} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                        <div className="w-32">
                                            <span className="capitalize font-medium text-zinc-300">{day}</span>
                                        </div>

                                        <div className="flex items-center space-x-6 flex-1">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!schedule.closed}
                                                    onChange={(e) => updateOpeningTime(day, 'closed', !e.target.checked)}
                                                    className="w-4 h-4 rounded border-zinc-600 text-brand-yellow focus:ring-brand-yellow bg-zinc-800"
                                                />
                                                <span className="text-sm text-zinc-400">Open</span>
                                            </label>

                                            <div className={`flex items-center space-x-3 transition-opacity ${schedule.closed ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                                <input
                                                    type="time"
                                                    value={schedule.open}
                                                    onChange={(e) => updateOpeningTime(day, 'open', e.target.value)}
                                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none"
                                                />
                                                <span className="text-zinc-500">-</span>
                                                <input
                                                    type="time"
                                                    value={schedule.close}
                                                    onChange={(e) => updateOpeningTime(day, 'close', e.target.value)}
                                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
