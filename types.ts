export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Main' | 'Kids' | 'Drinks' | 'Sides' | 'Fries';
  image_url: string;
  image?: string; // Optional as DB uses image_url
  is_available: boolean;
  prep_time_minutes?: string;
  time?: string;
  preparation_time?: number;
  display_order?: number;
  stock_requirements?: any;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addons: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  addons?: string[];
}

export interface Order {
  id: string;
  customerName: string;
  status: 'pending' | 'preparing' | 'cooking' | 'ready' | 'completed' | 'delivered';
  items: CartItem[] | OrderItem[];
  total: number;
  createdAt: string;
  estimatedTime: string;
  completedAt?: string;
  paymentId?: string;
  displayId?: string;
  userId?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: 'Trailer' | 'Lockup';
  supplier?: string;
  notes?: string;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'Active' | 'Inactive';
  segment: 'VIP' | 'Regular' | 'New';
}

export interface Supplier {
  id: string;
  name: string;
  createdAt: string;
}

export interface StockSignature {
  id: string;
  location: 'Trailer' | 'Lockup';
  signedBy: string;
  signedAt: string;
}

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningTimes {
  [key: string]: DaySchedule;
}

export interface StoreSettings {
  id: string;
  is_store_open: boolean; // Computed or legacy status
  schedule_override: 'none' | 'force_open' | 'force_closed';
  opening_times: OpeningTimes;
}

export interface StoreContextType {
  filteredMenu: MenuItem[];
  menu: MenuItem[];
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  editOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  stock: StockItem[];
  updateStock: (updates: Partial<StockItem>[]) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  deleteStockItem: (id: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  deleteSupplier: (id: string) => void;
  signatures: StockSignature[];
  signStock: (location: StockSignature['location'], signedBy: string) => void;
  getRevenueData: (startDate: string, endDate: string) => any[];
  getCategorySales: (startDate: string, endDate: string) => any[];
  getTopProducts: (startDate: string, endDate: string) => any[];
  getOrderVolume: (startDate: string, endDate: string) => any[];
  user: any;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  settings: StoreSettings | null;
  averageOrderTime: number;
}