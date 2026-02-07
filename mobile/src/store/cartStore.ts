import { create } from 'zustand';

interface CartItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  price: number;
  currency: string;
}

interface CartState {
  items: CartItem[];
  eventId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (ticketTypeId: string) => void;
  updateQuantity: (ticketTypeId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  setEventId: (eventId: string) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  eventId: null,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.ticketTypeId === item.ticketTypeId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.ticketTypeId === item.ticketTypeId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (ticketTypeId) =>
    set((state) => ({
      items: state.items.filter((i) => i.ticketTypeId !== ticketTypeId),
    })),
  updateQuantity: (ticketTypeId, quantity) =>
    set((state) => ({
      items:
        quantity === 0
          ? state.items.filter((i) => i.ticketTypeId !== ticketTypeId)
          : state.items.map((i) =>
              i.ticketTypeId === ticketTypeId ? { ...i, quantity } : i
            ),
    })),
  clearCart: () => set({ items: [], eventId: null }),
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  setEventId: (eventId) => set({ eventId }),
}));
