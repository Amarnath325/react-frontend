import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen, Bookmark, CheckCircle2, Clock, Plus, Trash2,
  Search, AlertTriangle, ShieldCheck, X, Users, DollarSign
} from 'lucide-react';
import api from '../../services/api';

interface BookItem {
  id: number;
  book_code: string;
  title: string;
  isbn: string;
  author: string;
  publisher?: string;
  category: string;
  quantity: number;
  available_quantity: number;
  price: number;
  location?: string;
}

interface IssueItem {
  id: number;
  book_id: number;
  borrower_name: string;
  borrower_type: string;
  issue_date: string;
  due_date: string;
  fine_amount: number;
  status: string;
}

interface LibraryStats {
  total_titles: number;
  total_copies: number;
  available_copies: number;
  issued_books: number;
}

export default function LibraryManagementPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'issues'>('catalog');
  const [books, setBooks] = useState<BookItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    total_titles: 2, total_copies: 25, available_copies: 20, issued_books: 1
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', book_code: '', isbn: '', author: '', category: 'Physics', quantity: 10, price: 450, location: 'Rack A-1'
  });

  const loadData = useCallback(async () => {
    try {
      const [resStats, resBooks, resIssues] = await Promise.all([
        api.get('/admin/library/stats'),
        api.get('/admin/library/books'),
        api.get('/admin/library/issues')
      ]);
      if (resStats.data.success) setStats(resStats.data.data);
      if (resBooks.data.success) setBooks(resBooks.data.data);
      if (resIssues.data.success) setIssues(resIssues.data.data);
    } catch {
      setBooks([
        { id: 1, book_code: 'BK-1001', title: 'Concepts of Physics (Vol 1)', isbn: '978-0131103627', author: 'H.C. Verma', publisher: 'Bharti Bhawan', category: 'Physics', quantity: 15, available_quantity: 12, price: 450, location: 'Rack A-3' },
        { id: 2, book_code: 'BK-1002', title: 'Organic Chemistry for Class 12', isbn: '978-0198811000', author: 'O.P. Tandon', publisher: 'GRB Publication', category: 'Chemistry', quantity: 10, available_quantity: 8, price: 620, location: 'Rack B-1' },
      ]);
      setIssues([
        { id: 1, book_id: 1, borrower_name: 'Kavya Sengupta (Class 12-A)', borrower_type: 'student', issue_date: new Date(Date.now() - 432000000).toISOString(), due_date: new Date(Date.now() + 777600000).toISOString(), fine_amount: 0, status: 'issued' }
      ]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.book_code || !form.isbn || !form.author) {
      toast.error('Please fill in required book details');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/library/books', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setForm({ title: '', book_code: '', isbn: '', author: '', category: 'Physics', quantity: 10, price: 450, location: 'Rack A-1' });
        loadData();
      }
    } catch {
      setBooks(prev => [...prev, { ...form, id: Date.now(), available_quantity: form.quantity }]);
      toast.success('Book cataloged (Demo)');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Delete this book from catalog?')) return;
    try {
      await api.delete(`/admin/library/books/${id}`);
      toast.success('Book deleted');
      loadData();
    } catch {
      setBooks(prev => prev.filter(b => b.id !== id));
      toast.success('Book deleted (Demo)');
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.book_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30"><BookOpen className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Digital Library & E-Inventory</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Library ERP v3.0</span>
          </div>
          <p className="text-xs text-slate-300">Catalog book titles, ISBN barcodes, track issues/returns, and automate late return fine calculations.</p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Catalog New Book
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.total_titles} Titles</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Book Titles</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><Bookmark className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.total_copies} Copies</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Copies</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-emerald-700">{stats.available_copies} Available</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">On Racks Now</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-amber-700">{stats.issued_books} Issued</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Borrowed Books</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button onClick={() => setActiveTab('catalog')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <BookOpen className="w-4 h-4" /> Book Catalog ({books.length})
        </button>
        <button onClick={() => setActiveTab('issues')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${activeTab === 'issues' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <Bookmark className="w-4 h-4" /> Book Issues Log ({issues.length})
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search title, author, ISBN barcode..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBooks.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-2 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded uppercase font-mono">{b.book_code}</span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{b.title}</h3>
                  </div>
                  <button onClick={() => handleDeleteBook(b.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                  <span>Author: <strong>{b.author}</strong></span>
                  <span>Category: <strong>{b.category}</strong></span>
                  <span>ISBN: <strong className="font-mono text-slate-800">{b.isbn}</strong></span>
                  <span>Copies: <strong className="text-emerald-600">{b.available_quantity} / {b.quantity}</strong></span>
                </div>
                {b.location && <p className="text-[11px] text-slate-500 font-mono border-t border-slate-200/60 pt-1.5">Rack Location: {b.location}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Issues Log */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          {issues.map(i => (
            <div key={i.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{i.borrower_name}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px] uppercase">{i.status}</span>
                </div>
                <div className="text-slate-500 mt-1">Issue Date: {new Date(i.issue_date).toLocaleDateString()} • Due Date: {new Date(i.due_date).toLocaleDateString()}</div>
              </div>
              <div className="text-right font-mono font-bold text-slate-700">
                Fine: ₹{i.fine_amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /> Catalog New Book</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddBook} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Book Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Higher Algebra" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Book Code *</label>
                  <input value={form.book_code} onChange={e => setForm({ ...form, book_code: e.target.value })} placeholder="BK-1003" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ISBN Barcode *</label>
                  <input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-0123456789" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Author Name *</label>
                  <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author Name" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Physics / Chemistry" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity Copies</label>
                  <input type="number" min="1" max="500" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rack Location</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Rack C-2" className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">{submitting ? 'Saving...' : 'Catalog Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
