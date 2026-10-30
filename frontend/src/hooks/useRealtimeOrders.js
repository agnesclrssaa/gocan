import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRealtimeOrders = (filter = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('orders').select('*, order_items(*)');

    if (filter.canteen_id) {
      query = query.eq('canteen_id', filter.canteen_id);
    }
    if (filter.runner_id) {
      query = query.eq('runner_id', filter.runner_id);
    }
    if (filter.customer_id) {
      query = query.eq('customer_id', filter.customer_id);
    }

    const fetchInitial = async () => {
      setLoading(true);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchInitial();

    const channel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) => (order.id === payload.new.id ? { ...order, ...payload.new } : order))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter.canteen_id, filter.runner_id, filter.customer_id]);

  return { orders, loading, setOrders };
};
