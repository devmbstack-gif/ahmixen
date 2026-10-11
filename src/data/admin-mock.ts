/**
 * MOCK DATA - replace with database
 * Used only by the admin dashboard UI until real queries are wired.
 */

export const adminMockUpcomingSession = {
  title: '2.5-Hour Live AI Workshop',
  date: 'Oct 24, 2026',
  time: '7:00 PM PKT',
};

export const adminMockSeats = {
  total: 100,
  confirmed: 62,
  held: 8,
};

export const adminMockPendingPayments = 5;

export const adminMockNewLeadsToday = 12;

export type AdminMockOrderStatus = 'pending' | 'approved' | 'rejected';

export const adminMockRecentOrders: Array<{
  id: string;
  name: string;
  plan: string;
  amount: string;
  status: AdminMockOrderStatus;
  date: string;
}> = [
  {
    id: 'ord_1001',
    name: 'Ayesha Khan',
    plan: 'Early Bird',
    amount: 'PKR 2,999',
    status: 'pending',
    date: '2026-10-10',
  },
  {
    id: 'ord_1002',
    name: 'Bilal Ahmed',
    plan: 'Standard',
    amount: 'PKR 4,999',
    status: 'approved',
    date: '2026-10-10',
  },
  {
    id: 'ord_1003',
    name: 'Sara Malik',
    plan: 'Early Bird',
    amount: 'PKR 2,999',
    status: 'pending',
    date: '2026-10-09',
  },
  {
    id: 'ord_1004',
    name: 'Hassan Raza',
    plan: 'Installment (1/3)',
    amount: 'PKR 1,666',
    status: 'rejected',
    date: '2026-10-09',
  },
  {
    id: 'ord_1005',
    name: 'Fatima Noor',
    plan: 'Standard',
    amount: 'PKR 4,999',
    status: 'approved',
    date: '2026-10-08',
  },
];
