import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Save, Clock, Power, AlertCircle, CheckCircle, Eye, EyeOff, Package, List } from 'lucide-react';
import { MenuItem, StoreSettings } from '../../types';
import { ITEM_ADDONS } from '../../constants';

interface DaySchedule {
    open: string;
    close: string;
    closed: boolean;
}

interface OpeningTimes {
    [key: string]: DaySchedule;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Get unique addon names from constant
    const allAddons = Array.from(new Set(
        Object.values(ITEM_ADDONS).flatMap(item => [
            ...item.extras,
            ...item.sauces,
            ...(item.drinks || [])
        ])
    )).sort();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, menuRes] = await Promise.all([
                supabase.from('store_settings').select('*').single(),
                supabase.from('menu_items').select('*').order('category').order('display_order')
            ]);

            if (settingsRes.error) throw settingsRes.error;
            if (menuRes.error) throw menuRes.error;

            setSettings(settingsRes.data);
            setMenuItems(menuRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
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
            // Determines effective is_store_open based on override
            let effectiveIsOpen = settings.is_store_open;
            if (settings.schedule_override === 'force_open') effectiveIsOpen = true;
            if (settings.schedule_override === 'force_closed') effectiveIsOpen = false;

            // Update settings
            const settingsUpdate = supabase
                .from('store_settings')
                .update({
                    is_store_open: effectiveIsOpen,
                    schedule_override: settings.schedule_override,
                    opening_times: settings.opening_times,
                    hidden_addons: settings.hidden_addons || [],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', settings.id);

            // Update menu items visibility
            const menuUpdates = menuItems.map(item =>
                supabase
                    .from('menu_items')
                    .update({ is_visible: item.is_visible })
                    .eq('id', item.id)
                    .select()
            );

            const [settingsRes, ...menuRes] = await Promise.all([settingsUpdate, ...menuUpdates]);

            if (settingsRes.error) throw settingsRes.error;

            const menuErrors = menuRes.filter(r => r.error);
            if (menuErrors.length > 0) throw menuErrors[0].error;

            // Check if any updates returned empty data (RLS blocked)
            const blockedUpdates = menuRes.filter(r => !r.error && (!r.data || r.data.length === 0));
            if (blockedUpdates.length > 0) {
                setMessage({
                    type: 'error',
                    text: 'Some items could not be updated. You may not have permission (RLS).'
                });
                return;
            }

            await fetchData();
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

    const toggleProductVisibility = (id: string) => {
        setMenuItems(prev => prev.map(item =>
            item.id === id ? { ...item, is_visible: !item.is_visible } : item
        ));
    };

    const toggleAddonVisibility = (addonName: string) => {
        if (!settings) return;
        const currentHidden = settings.hidden_addons || [];
        const isHidden = currentHidden.includes(addonName);

        let newHidden;
        if (isHidden) {
            newHidden = currentHidden.filter(name => name !== addonName);
        } else {
            newHidden = [...currentHidden, addonName];
        }

        setSettings({
            ...settings,
            hidden_addons: newHidden
        });
    };

    // Calculate display status dynamically
    const isStoreOpen = React.useMemo(() => {
        if (!settings) return false;
        if (settings.schedule_override === 'force_open') return true;
        if (settings.schedule_override === 'force_closed') return false;

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
            <div className="max-w-4xl mx-auto pb-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-wide">Store Settings</h1>
                        <p className="text-zinc-400 mt-1">Manage store availability and opening hours</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-brand-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20"
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
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6 shadow-xl">
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
                    </div>

                    {/* Opening Times Card */}
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6 shadow-xl">
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

                    {/* Product Visibility */}
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-brand-yellow">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Product Visibility</h2>
                                <p className="text-zinc-400 text-sm">Control which items are visible on the customer menu</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {menuItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden">
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-xs text-zinc-500 uppercase">{item.category}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleProductVisibility(item.id)}
                                        className={`p-2 rounded-lg transition-colors ${item.is_visible
                                            ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                                            : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                            }`}
                                        title={item.is_visible ? 'Visible' : 'Hidden'}
                                    >
                                        {item.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Addon Visibility */}
                    <div className="bg-brand-dark border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-brand-yellow">
                                <List className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Addon Visibility</h2>
                                <p className="text-zinc-400 text-sm">Control which addons and extras are available</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {allAddons.map(addon => {
                                const isHidden = settings?.hidden_addons?.includes(addon);
                                return (
                                    <button
                                        key={addon}
                                        onClick={() => toggleAddonVisibility(addon)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${!isHidden
                                            ? 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                                            : 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20'
                                            }`}
                                    >
                                        <span className={`font-medium ${!isHidden ? 'text-zinc-300' : 'text-zinc-500 line-through'}`}>{addon}</span>
                                        <div className={!isHidden ? 'text-green-500' : 'text-red-500'}>
                                            {!isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
