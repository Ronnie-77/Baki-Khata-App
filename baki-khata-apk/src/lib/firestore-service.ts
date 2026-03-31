import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './firebase';

// ===== TYPES =====
interface Customer {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  createdAt: any;
  updatedAt: any;
  totalCredit?: number;
  totalPaid?: number;
  netDue?: number;
  transactionCount?: number;
}

interface Transaction {
  id: string;
  customerId: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  description: string | null;
  productName: string | null;
  date: any;
  createdAt: any;
  customer?: { id: string; name: string; code: string };
}

// ===== HELPERS =====
function tsToDate(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

// ===== SUMMARY =====
export async function getSummary(uid: string) {
  // Get all customers
  const custSnap = await getDocs(collection(db, 'users', uid, 'customers'));
  const customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const totalCustomers = customers.length;

  // Get all transactions
  const txSnap = await getDocs(collection(db, 'users', uid, 'transactions'));
  const allTx = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const totalCredit = allTx.filter(t => t.type === 'CREDIT').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPaid = allTx.filter(t => t.type === 'PAYMENT').reduce((s, t) => s + (t.amount || 0), 0);
  const netDue = totalCredit - totalPaid;

  // Recent 10 transactions with customer info
  const customerMap: Record<string, { name: string; code: string }> = {};
  customers.forEach(c => { customerMap[c.id] = { name: c.name, code: c.code }; });

  const sorted = [...allTx].sort((a, b) => {
    const da = tsToDate(a.date);
    const db2 = tsToDate(b.date);
    return db2.localeCompare(da);
  });
  const recent10 = sorted.slice(0, 10).map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    date: tsToDate(tx.date),
    customer: customerMap[tx.customerId] || { id: '', name: 'Unknown', code: '' },
  }));

  return { totalCredit, totalPaid, netDue, totalCustomers, recentTransactions: recent10 };
}

// ===== CUSTOMERS =====
export async function getCustomers(uid: string, search?: string): Promise<Customer[]> {
  const constraints: QueryConstraint[] = [];
  if (search) {
    // Firestore doesn't support case-insensitive contains, so we filter client-side
  }
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, 'users', uid, 'customers'), ...constraints);
  const snap = await getDocs(q);
  let customers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));

  if (search) {
    const s = search.toLowerCase();
    customers = customers.filter(c => c.name.toLowerCase().includes(s));
  }

  // Get all transactions for aggregate calculation
  const txSnap = await getDocs(collection(db, 'users', uid, 'transactions'));
  const allTx = txSnap.docs.map(d => d.data());

  return customers.map(c => {
    const txns = allTx.filter(t => t.customerId === c.id);
    const totalCredit = txns.filter(t => t.type === 'CREDIT').reduce((s, t) => s + (t.amount || 0), 0);
    const totalPaid = txns.filter(t => t.type === 'PAYMENT').reduce((s, t) => s + (t.amount || 0), 0);
    return {
      ...c,
      totalCredit,
      totalPaid,
      netDue: totalCredit - totalPaid,
      transactionCount: txns.length,
    };
  });
}

export async function getCustomer(uid: string, customerId: string) {
  const custDoc = await getDoc(doc(db, 'users', uid, 'customers', customerId));
  if (!custDoc.exists()) return null;

  const customer = { id: custDoc.id, ...custDoc.data() } as Customer;

  // Get transactions for this customer
  const txSnap = await getDocs(
    query(collection(db, 'users', uid, 'transactions'), where('customerId', '==', customerId), orderBy('date', 'desc'))
  );
  const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));

  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPaid = transactions.filter(t => t.type === 'PAYMENT').reduce((s, t) => s + (t.amount || 0), 0);

  return {
    ...customer,
    totalCredit,
    totalPaid,
    netDue: totalCredit - totalPaid,
    transactionCount: transactions.length,
    transactions: transactions.map(t => ({
      ...t,
      date: tsToDate(t.date),
    })),
  };
}

export async function createCustomer(uid: string, data: { name: string; phone?: string }) {
  // Generate code
  const custSnap = await getDocs(collection(db, 'users', uid, 'customers'));
  const count = custSnap.size;
  const code = `CUST-${String(count + 1).padStart(4, '0')}`;

  const docRef = await addDoc(collection(db, 'users', uid, 'customers'), {
    name: data.name,
    code,
    phone: data.phone || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, name: data.name, code, phone: data.phone || null };
}

export async function deleteCustomer(uid: string, customerId: string) {
  // Delete all transactions for this customer
  const txSnap = await getDocs(query(collection(db, 'users', uid, 'transactions'), where('customerId', '==', customerId)));
  for (const txDoc of txSnap.docs) {
    await deleteDoc(doc(db, 'users', uid, 'transactions', txDoc.id));
  }
  await deleteDoc(doc(db, 'users', uid, 'customers', customerId));
}

// ===== TRANSACTIONS =====
export async function getAllTransactions(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'transactions'));
  const custSnap = await getDocs(collection(db, 'users', uid, 'customers'));
  const customerMap: Record<string, { id: string; name: string; code: string }> = {};
  custSnap.docs.forEach(d => {
    const data = d.data();
    customerMap[d.id] = { id: d.id, name: data.name, code: data.code };
  });

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      amount: data.amount,
      productName: data.productName || null,
      date: tsToDate(data.date),
      description: data.description || null,
      customer: customerMap[data.customerId] || { id: '', name: 'Unknown', code: '' },
    };
  });
}

export async function createTransaction(uid: string, data: {
  customerId: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  productName?: string;
  description?: string;
  date?: string;
}) {
  const docRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
    customerId: data.customerId,
    type: data.type,
    amount: data.amount,
    productName: data.productName || null,
    description: data.description || null,
    date: data.date ? new Date(data.date) : serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Update customer updatedAt
  await updateDoc(doc(db, 'users', uid, 'customers', data.customerId), {
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

export async function deleteTransaction(uid: string, transactionId: string) {
  await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId));
}

// ===== PROFILE =====
export async function updateProfile(uid: string, data: { name?: string; email?: string; phone?: string; avatar?: string }) {
  const updateData: Record<string, any> = { updatedAt: serverTimestamp() };
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.avatar) updateData.avatar = data.avatar;

  await updateDoc(doc(db, 'users', uid), updateData);

  // Return updated user data for the store
  return {
    name: data.name,
    email: data.email,
    phone: data.phone !== undefined ? (data.phone || null) : undefined,
    avatar: data.avatar,
  };
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// ===== ANALYTICS =====
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export async function getAnalytics(uid: string) {
  const custSnap = await getDocs(collection(db, 'users', uid, 'customers'));
  const customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const txSnap = await getDocs(collection(db, 'users', uid, 'transactions'));
  const allTx = txSnap.docs.map(d => d.data());

  const totalTransactions = allTx.length;
  const totalCredit = allTx.filter(t => t.type === 'CREDIT').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPaid = allTx.filter(t => t.type === 'PAYMENT').reduce((s, t) => s + (t.amount || 0), 0);
  const netDue = totalCredit - totalPaid;

  // Monthly data for chart
  const monthlyMap: Record<string, { credit: number; payment: number }> = {};
  allTx.forEach(tx => {
    const date = tsToDate(tx.date);
    const monthKey = date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { credit: 0, payment: 0 };
    if (tx.type === 'CREDIT') monthlyMap[monthKey].credit += tx.amount || 0;
    else monthlyMap[monthKey].payment += tx.amount || 0;
  });

  // Last 6 months
  const sortedMonths = Object.keys(monthlyMap).sort().slice(-6);
  const monthlyData = sortedMonths.map(month => {
    const credit = monthlyMap[month].credit;
    const payment = monthlyMap[month].payment;
    return {
      month: formatMonthLabel(month + '-01'),
      credit,
      payment,
      net: credit - payment,
    };
  });

  // Top defaulters
  const customerTxMap: Record<string, { credit: number; payment: number }> = {};
  customers.forEach(c => { customerTxMap[c.id] = { credit: 0, payment: 0 }; });
  allTx.forEach(tx => {
    if (customerTxMap[tx.customerId]) {
      if (tx.type === 'CREDIT') customerTxMap[tx.customerId].credit += tx.amount || 0;
      else customerTxMap[tx.customerId].payment += tx.amount || 0;
    }
  });

  const topDebtors = customers
    .map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      netDue: (customerTxMap[c.id]?.credit || 0) - (customerTxMap[c.id]?.payment || 0),
    }))
    .filter(c => c.netDue > 0)
    .sort((a, b) => b.netDue - a.netDue)
    .slice(0, 5);

  return { totalTransactions, totalCredit, totalPaid, netDue, monthlyData, topDebtors };
}

// ===== FORGOT PASSWORD =====
import { sendPasswordResetEmail } from 'firebase/auth';

export async function sendResetEmail(email: string) {
  await sendPasswordResetEmail(auth, email);
}
