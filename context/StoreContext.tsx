import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { MenuItem, StockItem, OrderItem, Order, Customer, Supplier, StockSignature, StoreContextType, StoreSettings, CartItem } from '../types';
import { MOCK_MENU, ADDON_PRICES } from '../constants';

// Mock data
const MOCK_STOCK: StockItem[] = [
  { id: 's1', name: 'Steaks', category: 'Food', quantity: 10, location: 'Trailer', lowStockThreshold: 5 },
  { id: 's4', name: 'Fries', category: 'Food', quantity: 50, location: 'Trailer', lowStockThreshold: 5 }
];

const MENU_STOCK_REQUIREMENTS: Record<string, string[]> = {
  'Deluxe Steak & Fries': ['Steaks', 'Fries'],
  'Steak & Fries': ['Steaks', 'Fries'],
  'Steak Only': ['Steaks'],
  'Signature Fries': ['Fries'],
  'Kids Meal': ['Steaks', 'Fries'],
  'Kids Fries': ['Fries'],
  'Short Rib': ['Short Rib'],
  'Lamb': ['Lamb'],
  'Coke': ['Coke'],
  'Coke Zero': ['Coke Zero'],
  'Tango Mango': ['Tango Mango'],
  'Sprite': ['Sprite'],
  'Fanta': ['Fanta'],
  'Dr Pepper': ['Dr Pepper'],
  '7UP': ['7UP'],
  'Pepsi': ['Pepsi'],
  'Pepsi Max': ['Pepsi Max'],
  'Orange Juice': ['Orange Juice'],
  'Apple Juice': ['Apple Juice'],
  'Milk': ['Milk'],
  'Water': ['Water']
};

// Stock deduction amounts (multipliers)
const STOCK_DEDUCTIONS: Record<string, number> = {
  'Steak & Fries': 1,
  'Deluxe Steak': 2,
  'Steak Only': 1,
  'Short Rib': 2,
  'Lamb': 2,
  // Drinks are 1 each, handled separately
};

// Items not to deduct automatically
const NO_DEDUCT_ITEMS = ['Fries', 'Chip Seasoning', 'Green Sauce', 'Mayo', 'Ketchup'];

// Function to calculate stock deductions from order items
const calculateStockDeductions = (orderItems: (OrderItem | CartItem)[]): Record<string, number> => {

  const deductions: Record<string, number> = {};

  orderItems.forEach(item => {
    const itemName = item.name.toLowerCase();

    // Handle main items
    if (itemName === 'deluxe steak') {
      deductions['Steaks'] = (deductions['Steaks'] || 0) + 2 * item.quantity;
    } else if (itemName.includes('steak') && itemName.includes('fries')) {
      deductions['Steaks'] = (deductions['Steaks'] || 0) + 1 * item.quantity;
    } else if (itemName.includes('steak only') || itemName === 'steak') {
      deductions['Steaks'] = (deductions['Steaks'] || 0) + 1 * item.quantity;
    } else if (itemName.includes('short rib')) {
      deductions['Short Rib'] = (deductions['Short Rib'] || 0) + 2 * item.quantity;
    } else if (itemName.includes('lamb')) {
      deductions['Lamb'] = (deductions['Lamb'] || 0) + 2 * item.quantity;
    } else if (itemName.includes('drink') || MENU_STOCK_REQUIREMENTS[item.name]) {
      // For drinks and other items in requirements
      const stockItems = MENU_STOCK_REQUIREMENTS[item.name];
      if (stockItems) {
        stockItems.forEach(stockName => {
          if (!NO_DEDUCT_ITEMS.includes(stockName)) {
            deductions[stockName] = (deductions[stockName] || 0) + 1 * item.quantity;
          }
        });
      }
    }

    // Handle addons
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(addon => {
        if (addon === 'Lamb') {
          deductions['Lamb'] = (deductions['Lamb'] || 0) + 2 * item.quantity;
        } else if (addon === 'Short Rib') {
          deductions['Short Rib'] = (deductions['Short Rib'] || 0) + 2 * item.quantity;
        } else if (addon.includes('Steak')) {
          deductions['Steaks'] = (deductions['Steaks'] || 0) + 1 * item.quantity;
        }
      });
    }
  });

  return deductions;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [signatures, setSignatures] = useState<StockSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [averageOrderTime, setAverageOrderTime] = useState<number>(15); // Default 15 mins
  const [addonPrices, setAddonPrices] = useState<Record<string, number>>(ADDON_PRICES);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Fetch store settings and subscribe
  useEffect(() => {
    fetchSettings();

    // Subscribe to settings changes
    const subscription = supabase
      .channel('store_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_settings' }, () => {
        // Re-fetch to ensure we get all columns including new ones
        fetchSettings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch menu from database
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('category')
          .order('display_order'); // Order by display_order within category

        if (error) {
          console.error('Error fetching menu:', error);
          setMenu(MOCK_MENU);
          return;
        }

        if (data && data.length > 0) {
          setMenu(data);
        } else {
          // Fallback if DB is empty
          console.log('No menu items in DB, using mock');
          setMenu(MOCK_MENU);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        setMenu(MOCK_MENU);
      }
    };

    fetchMenu();
  }, []);

  // Fetch stock from database
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_items')
          .select('*');

        if (error) {
          console.error('Error fetching stock:', error);
          return;
        }

        // Map DB data to StockItem format
        const mappedData = (data || []).map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          quantity: d.quantity,
          location: d.location,
          supplier: d.supplier,
          notes: d.notes,
          lowStockThreshold: d.low_stock_threshold || 5
        }));

        // Sort: first by location (Trailer first), then by category, then meats first, then alphabetical
        const sortedData = mappedData.sort((a, b) => {
          // Trailer before Lockup
          if (a.location !== b.location) {
            return a.location === 'Trailer' ? -1 : 1;
          }
          // Same category
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          // Within Food, prioritize meats
          if (a.category === 'Food') {
            const meatOrder = ['Steaks', 'Short Rib', 'Lamb'];
            const aIndex = meatOrder.indexOf(a.name);
            const bIndex = meatOrder.indexOf(b.name);
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
          }
          // Alphabetical
          return a.name.localeCompare(b.name);
        });

        setStock(sortedData);
      } catch (error) {
        console.error('Error fetching stock:', error);
      }
    };

    fetchStock();
  }, []);

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });

        // If user is logged in and not admin, filter by user_id
        if (user && !isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }

        // Map DB columns to Order type
        const mappedOrders: Order[] = (data || []).map(o => ({
          id: o.id,
          customerName: o.customer_name,
          status: o.status,
          items: o.items,
          total: o.total,
          createdAt: o.created_at,
          estimatedTime: o.estimated_time,
          completedAt: o.completed_at,
          paymentId: o.payment_id,
          displayId: o.display_id,
          userId: o.user_id,
          notes: o.notes
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  // Calculate average order time whenever orders change
  useEffect(() => {
    const completedOrders = orders.filter(o =>
      o.status === 'completed' || o.status === 'delivered'
    ).filter(o => o.completedAt && o.createdAt);

    if (completedOrders.length > 0) {
      // Take last 50 orders
      const recentOrders = completedOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      const totalDuration = recentOrders.reduce((acc, order) => {
        const start = new Date(order.createdAt).getTime();
        const end = new Date(order.completedAt!).getTime();
        return acc + (end - start);
      }, 0);

      const avgDurationMs = totalDuration / recentOrders.length;
      const avgMinutes = Math.round(avgDurationMs / 60000);

      // Ensure reasonable bounds (minimum 5 mins, max 60 mins)
      setAverageOrderTime(Math.max(5, Math.min(60, avgMinutes)));
    }
  }, [orders]);

  // Fetch suppliers from database
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching suppliers:', error);
          return;
        }

        const mappedSuppliers: Supplier[] = (data || []).map(s => ({
          id: s.id,
          name: s.name,
          createdAt: s.created_at
        }));

        setSuppliers(mappedSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch addon prices from database
  useEffect(() => {
    const fetchAddonPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('addon_prices')
          .select('*');

        if (error) {
          console.error('Error fetching addon prices:', error);
          return;
        }

        if (data && data.length > 0) {
          const prices: Record<string, number> = {};
          data.forEach((item: any) => {
            prices[item.name] = Number(item.price);
          });

          setAddonPrices(prev => ({
            ...prev,
            ...prices
          }));
        }
      } catch (error) {
        console.error('Error fetching addon prices:', error);
      }
    };

    fetchAddonPrices();
  }, []);

  // Filtered menu - temporarily disable stock filtering for debugging
  const filteredMenu = useMemo(() => {
    console.log('Menu items (no stock filtering):', menu.map(m => ({ name: m.name, category: m.category })));
    return menu; // Return all menu items without stock filtering
  }, [menu]);

  const addToCart = (item: OrderItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order functions
  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
    const newOrderPayload = {
      customer_name: order.customerName,
      status: order.status,
      items: order.items,
      total: order.total,
      created_at: new Date().toISOString(),
      estimated_time: order.estimatedTime || new Date(Date.now() + averageOrderTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed_at: order.completedAt,
      payment_id: order.paymentId,
      user_id: user?.id,
      notes: order.notes
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrderPayload])
        .select()
        .single();

      if (error) {
        console.error('Error adding order:', error);
        return null;
      }

      // Update local state with the returned data (which has the real UUID)
      const createdOrder: Order = {
        id: data.id,
        customerName: data.customer_name,
        status: data.status as Order['status'],
        items: data.items as OrderItem[],
        total: data.total,
        createdAt: data.created_at,
        estimatedTime: data.estimated_time,
        completedAt: data.completed_at,
        paymentId: data.payment_id,
        displayId: data.display_id,
        notes: data.notes
      };

      // Update stock automatically for trailer inventory
      const deductions = calculateStockDeductions(order.items);
      for (const [stockName, amount] of Object.entries(deductions)) {
        try {
          // First get current quantity
          const { data: currentStock, error: fetchError } = await supabase
            .from('stock_items')
            .select('quantity')
            .eq('name', stockName)
            .eq('location', 'Trailer')
            .single();

          if (fetchError) {
            console.error('Error fetching stock for', stockName, fetchError);
            continue;
          }

          if (currentStock) {
            const newQuantity = Math.max(0, currentStock.quantity - amount);
            const { error: updateError } = await supabase
              .from('stock_items')
              .update({ quantity: newQuantity })
              .eq('name', stockName)
              .eq('location', 'Trailer');

            if (updateError) {
              console.error('Error updating stock for', stockName, updateError);
            }
          }
        } catch (stockError) {
          console.error('Error updating stock for', stockName, stockError);
          // Continue with other updates even if one fails
        }
      }

      setOrders(prev => [createdOrder, ...prev]);
      return createdOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      return null;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const updates: any = { status };

      // Find current order to check if we need to set completedAt
      const currentOrder = orders.find(o => o.id === id);
      if (currentOrder && (status === 'delivered' || status === 'completed') && !currentOrder.completedAt) {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      setOrders(prev => prev.map(order => {
        if (order.id === id) {
          const localUpdates: Partial<Order> = { status };
          if (updates.completed_at) {
            localUpdates.completedAt = updates.completed_at;
          }
          return { ...order, ...localUpdates };
        }
        return order;
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const editOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  // Stock functions
  const updateStock = (updates: Partial<StockItem>[]) => {
    setStock(prev => prev.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, ...update } : item;
    }));
  };

  const updateStockItem = async (id: string, updates: Partial<StockItem>) => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating stock item:', error);
        return;
      }

      setStock(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error) {
      console.error('Error updating stock item:', error);
    }
  };

  const addStockItem = async (item: Omit<StockItem, 'id'>) => {
    try {
      const newItemPayload = {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        location: item.location,
        supplier: item.supplier,
        notes: item.notes,
        low_stock_threshold: item.lowStockThreshold
      };

      const { data, error } = await supabase
        .from('stock_items')
        .insert([newItemPayload])
        .select()
        .single();

      if (error) {
        console.error('Error adding stock item:', error);
        return;
      }

      const newItem: StockItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        location: data.location,
        supplier: data.supplier,
        notes: data.notes,
        lowStockThreshold: data.low_stock_threshold
      };

      setStock(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding stock item:', error);
    }
  };

  const deleteStockItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting stock item:', error);
        return;
      }

      setStock(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting stock item:', error);
    }
  };

  // Supplier functions
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      const newSupplierPayload = {
        name: supplier.name,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert([newSupplierPayload])
        .select()
        .single();

      if (error) {
        console.error('Error adding supplier:', error);
        throw error;
      }

      const newSupplier: Supplier = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at
      };

      setSuppliers(prev => [...prev, newSupplier]);
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting supplier:', error);
        return;
      }

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  // Signature functions
  const signStock = (location: StockSignature['location'], signedBy: string) => {
    const newSignature: StockSignature = {
      id: Date.now().toString(),
      location,
      signedBy,
      signedAt: new Date().toISOString(),
    };
    setSignatures(prev => [...prev, newSignature]);
  };

  // Analytics functions
  const getRevenueData = (startDate: string, endDate: string) => {
    // Filter orders within date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end && o.status !== 'cancelled';
    });

    // Group by date or hour depending on range
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Hourly grouping
      const hourlyData = new Array(24).fill(0).map((_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`,
        value: 0
      }));

      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour].value += order.total;
      });

      return hourlyData;
    } else {
      // Daily grouping
      const dailyData: Record<string, number> = {};

      // Initialize all days in range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // Format as DD/MM
        const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
        dailyData[displayDate] = 0;
      }

      filteredOrders.forEach(order => {
        const d = new Date(order.createdAt);
        const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
        if (dailyData[displayDate] !== undefined) {
          dailyData[displayDate] += order.total;
        }
      });

      return Object.entries(dailyData).map(([name, value]) => ({ name, value }));
    }
  };

  const getCategorySales = (startDate?: string, endDate?: string) => {
    // Use all orders if no date provided, or filter
    let filteredOrders = orders;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end && o.status !== 'cancelled';
      });
    }

    const categorySales: Record<string, number> = {};
    const colors: Record<string, string> = {
      'Main': '#FFC107', // Brand Yellow
      'Sides': '#F59E0B', // Amber
      'Drinks': '#3B82F6', // Blue
      'Kids': '#10B981', // Emerald
      'Fries': '#EF4444' // Red
    };

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        // Find category from menu items if possible, or guess
        const menuItem = menu.find(m => m.id === item.menuItemId);
        const category = menuItem?.category || 'Other';

        if (!categorySales[category]) categorySales[category] = 0;
        categorySales[category] += (item.price * item.quantity);
      });
    });

    return Object.entries(categorySales).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#71717a' // Zinc-500 fallback
    })).sort((a, b) => b.value - a.value);
  };

  const getTopProducts = (startDate: string, endDate: string) => {
    // Filter orders within date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end && o.status !== 'cancelled';
    });

    const productSales: Record<string, number> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getOrderVolume = (startDate: string, endDate: string) => {
    // Filter orders within date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end && o.status !== 'cancelled';
    });

    // Group by date or hour depending on range
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Hourly grouping
      const hourlyData = new Array(24).fill(0).map((_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`,
        value: 0
      }));

      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour].value += 1; // Count orders
      });

      return hourlyData;
    } else {
      // Daily grouping
      const dailyData: Record<string, number> = {};

      // Initialize all days in range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // Format as DD/MM
        const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
        dailyData[displayDate] = 0;
      }

      filteredOrders.forEach(order => {
        const d = new Date(order.createdAt);
        const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
        if (dailyData[displayDate] !== undefined) {
          dailyData[displayDate] += 1; // Count orders
        }
      });

      return Object.entries(dailyData).map(([name, value]) => ({ name, value }));
    }
  };

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      return {};
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Note: User might need to confirm email before being signed in
      return {};
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Check auth state on mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.app_metadata?.role === 'admin';

  // Calculate if store is open based on settings and time
  const isStoreOpen = useMemo(() => {
    if (!settings) return false;

    // Check override first
    if (settings.schedule_override === 'force_open') return true;
    if (settings.schedule_override === 'force_closed') return false;

    // Check schedule
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[now.getDay()];
    const schedule = settings.opening_times[dayName];

    if (!schedule || schedule.closed) return false;

    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return currentTime >= schedule.open && currentTime <= schedule.close;
  }, [settings]);

  // Update settings object to reflect calculated status for consumers
  const effectiveSettings = useMemo(() => {
    if (!settings) return null;
    return {
      ...settings,
      is_store_open: isStoreOpen
    };
  }, [settings, isStoreOpen]);

  return (
    <StoreContext.Provider value={{
      filteredMenu,
      menu,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      orders,
      addOrder,
      updateOrderStatus,
      editOrder,
      deleteOrder,
      stock,
      updateStock,
      updateStockItem,
      addStockItem,
      deleteStockItem,
      customers,
      suppliers,
      addSupplier,
      deleteSupplier,
      signatures,
      signStock,
      getRevenueData,
      getCategorySales,
      getTopProducts,
      getOrderVolume,
      user,
      signIn,
      signUp,
      signOut,
      loading,
      isAdmin,
      settings: effectiveSettings,
      averageOrderTime,
      addonPrices
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};