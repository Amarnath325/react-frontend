import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown,
  Percent, Calendar, Download, Search, Plus, Trash2,
  Edit3, CheckCircle, AlertCircle, X, Printer, FileText,
  Briefcase, ShieldAlert, Award, Compass, Truck, Home,
  FolderMinus, Landmark, RefreshCw
} from 'lucide-react';

export default function FeeAndFinanceHub() {
  const location = useLocation();
  const path = location.pathname;

  // Active module detection
  const isDashboard = path.includes('/fees/dashboard');
  const isMasterSetup = path.includes('/fees/master-setup');
  const isHead = path.includes('/fees/head');
  const isStructure = path.includes('/fees/structure');
  const isClassSetup = path.includes('/fees/class-setup');
  const isAllocation = path.includes('/fees/allocation');
  const isCollect = path.includes('/fees/collect');
  const isOnlinePayment = path.includes('/fees/online-payment');
  const isReceipts = path.includes('/fees/receipts');
  const isDiscounts = path.includes('/fees/discounts');
  const isScholarships = path.includes('/fees/scholarships');
  const isFines = path.includes('/fees/fines');
  const isInstallments = path.includes('/fees/installments');
  const isRefunds = path.includes('/fees/refunds');
  const isDueFees = path.includes('/fees/due-fees');
  const isTransport = path.includes('/fees/transport');
  const isHostel = path.includes('/fees/hostel');
  const isOtherIncome = path.includes('/fees/other-income');
  const isExpenses = path.includes('/fees/expenses');
  const isVendorPayments = path.includes('/fees/vendor-payments');
  const isAccounting = path.includes('/fees/accounting');
  const isBank = path.includes('/fees/bank');
  const isCashBook = path.includes('/fees/cash-book');
  const isBudget = path.includes('/fees/budget');
  const isReports = path.includes('/fees/reports');

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form Fields State
  const [formFields, setFormFields] = useState<any>({
    name: '',
    amount: '',
    code: '',
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    reference: '',
    status: 'Active'
  });

  // Dummy Master Data
  const [feeHeads, setFeeHeads] = useState([
    { id: 1, name: 'Tuition Fee', type: 'Academic', code: 'TUIT', frequency: 'Monthly', amount: 3500 },
    { id: 2, name: 'Registration Fee', type: 'Admission', code: 'REG', frequency: 'One Time', amount: 5000 },
    { id: 3, name: 'Laboratory Fee', type: 'Academic', code: 'LAB', frequency: 'Term Wise', amount: 1500 },
    { id: 4, name: 'Sports Fee', type: 'Co-Curricular', code: 'SPO', frequency: 'Yearly', amount: 2000 },
    { id: 5, name: 'Library Fee', type: 'Academic', code: 'LIB', frequency: 'Yearly', amount: 1000 },
  ]);

  const [feeStructures, setFeeStructures] = useState([
    { id: 1, name: 'Primary Class Structure (LKG-V)', totalAmount: 45000, headsCount: 4, isDefault: true },
    { id: 2, name: 'Middle Class Structure (VI-VIII)', totalAmount: 58000, headsCount: 5, isDefault: false },
    { id: 3, name: 'Senior Class Structure (IX-XII)', totalAmount: 72000, headsCount: 6, isDefault: false },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, studentName: 'Rahul Sharma', rollNo: '1004', class: 'Class 10', receiptNo: 'RCP-8921', amount: 8500, date: '2026-06-24', mode: 'Cash', status: 'Paid' },
    { id: 2, studentName: 'Ananya Verma', rollNo: '1012', class: 'Class 9', receiptNo: 'RCP-8922', amount: 12000, date: '2026-06-24', mode: 'Online', status: 'Paid' },
    { id: 3, studentName: 'Arjun Das', rollNo: '1025', class: 'Class 10', receiptNo: 'RCP-8923', amount: 3500, date: '2026-06-23', mode: 'Cheque', status: 'Pending Verification' },
    { id: 4, studentName: 'Sneha Patel', rollNo: '1031', class: 'Class 8', receiptNo: 'RCP-8924', amount: 9500, date: '2026-06-23', mode: 'Online', status: 'Paid' },
    { id: 5, studentName: 'Vikas Kumar', rollNo: '1044', class: 'Class 10', receiptNo: 'RCP-8925', amount: 6200, date: '2026-06-22', mode: 'Cash', status: 'Failed' },
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Office Stationery Purchase', category: 'Administrative', amount: 4500, date: '2026-06-25', paidTo: 'Metro Book Depot', status: 'Paid' },
    { id: 2, title: 'Science Lab Equipment', category: 'Academic', amount: 28500, date: '2026-06-23', paidTo: 'SciTech Instruments', status: 'Paid' },
    { id: 3, title: 'Generator Diesel Fill', category: 'Utility', amount: 8000, date: '2026-06-22', paidTo: 'Bharat Petroleum', status: 'Paid' },
    { id: 4, title: 'Server Hosting & SSL Renewal', category: 'IT Support', amount: 15400, date: '2026-06-20', paidTo: 'Hostinger India', status: 'Paid' },
  ]);

  const [scholarships, setScholarships] = useState([
    { id: 1, studentName: 'Priyan Singh', class: 'Class 10', schemeName: 'Merit-Cum-Means Scholarship', percentage: 50, amount: 22500, status: 'Approved' },
    { id: 2, studentName: 'Kabir Dev', class: 'Class 9', schemeName: 'Sports Achiever Concession', percentage: 100, amount: 58000, status: 'Approved' },
    { id: 3, studentName: 'Riya Sen', class: 'Class 11', schemeName: 'Single Girl Child Grant', percentage: 25, amount: 18000, status: 'Pending Review' },
  ]);

  const [dueFees, setDueFees] = useState([
    { id: 1, studentName: 'Amit Mishra', class: 'Class 10', totalDue: 14500, dueDate: '2026-06-15', fineAmount: 250, mobile: '9876543210' },
    { id: 2, studentName: 'Neha Rajput', class: 'Class 9', totalDue: 8200, dueDate: '2026-06-15', fineAmount: 150, mobile: '9876543211' },
    { id: 3, studentName: 'Siddharth Rao', class: 'Class 10', totalDue: 22000, dueDate: '2026-06-10', fineAmount: 500, mobile: '9876543212' },
  ]);

  const [budgets, setBudgets] = useState([
    { id: 1, department: 'Academic Development', allocated: 250000, utilized: 128000, balance: 122000, fiscalYear: '2026-27' },
    { id: 2, Infrastructure: 'Classroom & Repair', allocated: 400000, utilized: 350000, balance: 50000, fiscalYear: '2026-27' },
    { id: 3, 'Sports & Events': 150000, allocated: 150000, utilized: 45000, balance: 105000, fiscalYear: '2026-27' },
  ]);

  // Page Header Text & Subtitle Resolver
  const getHeaderDetails = () => {
    if (isDashboard) return { title: 'Finance Dashboard', subtitle: 'Global financial overview, revenue streams, and expenditure index' };
    if (isMasterSetup) return { title: 'Fee Master Setup', subtitle: 'Define base structures, frequency definitions, and default accounts' };
    if (isHead) return { title: 'Fee Head Management', subtitle: 'Configure distinct fee heads (Tuition, Library, Exam, Sports)' };
    if (isStructure) return { title: 'Fee Structure Management', subtitle: 'Compile fee heads into structured packages class-wise' };
    if (isClassSetup) return { title: 'Class Wise Fee Setup', subtitle: 'Map compiled fee structures directly to standard grades' };
    if (isAllocation) return { title: 'Student Fee Allocation', subtitle: 'Assign fee structures and custom overrides to individual students' };
    if (isCollect) return { title: 'Fee Collection Portal', subtitle: 'Search student record, process cash/cheque/pos fee payments' };
    if (isOnlinePayment) return { title: 'Online Payment Gateway Management', subtitle: 'Monitor online transactions, gateway fees, and settlements' };
    if (isReceipts) return { title: 'Receipt & Invoice Management', subtitle: 'Generate, print, and download PDF receipts and invoices' };
    if (isDiscounts) return { title: 'Fee Discount Schemes', subtitle: 'Define dynamic concession schemes (Sibling, Staff Child, Covid Assistance)' };
    if (isScholarships) return { title: 'Scholarships & Grants Desk', subtitle: 'Manage academic and sports scholarships mapping student allocations' };
    if (isFines) return { title: 'Fine & Late Penalty Manager', subtitle: 'Set automatic penalty thresholds for late fee submissions' };
    if (isInstallments) return { title: 'Installment Schemes Management', subtitle: 'Allow parent billing structure divisions (Bi-Monthly, Quarterly)' };
    if (isRefunds) return { title: 'Refund Processing Portal', subtitle: 'Validate, approve, and disburse student security and fee refunds' };
    if (isDueFees) return { title: 'Due Fee Management Desk', subtitle: 'Track outstanding balances, dispatch reminders, and apply locks' };
    if (isTransport) return { title: 'Transport Fee Management', subtitle: 'Configure route-based monthly billing and student tracking' };
    if (isHostel) return { title: 'Hostel Billing Desk', subtitle: 'Manage room and mess fee structures for boarder students' };
    if (isOtherIncome) return { title: 'Other Income Streams', subtitle: 'Record auxiliary incomes (Auditorium Rent, Scrap Sales, Donations)' };
    if (isExpenses) return { title: 'Expense Tracker', subtitle: 'Log administrative, utility, academic, and staff operation costs' };
    if (isVendorPayments) return { title: 'Vendor Payments Hub', subtitle: 'Approve invoices, track vendor credit balances, and log payouts' };
    if (isAccounting) return { title: 'Accounting Management System', subtitle: 'Chart of Accounts, Journal entries, General Ledger, and trial balance' };
    if (isBank) return { title: 'Bank Account & Reconciliations', subtitle: 'Manage corporate bank accounts, deposits, and bank reconciliation statements' };
    if (isCashBook) return { title: 'Cash Book Registry', subtitle: 'Verify daily cash receipt logs, cash box closures, and cash flows' };
    if (isBudget) return { title: 'Budget Allocation Manager', subtitle: 'Distribute fiscal budgets department-wise and limit expenditures' };
    if (isReports) return { title: 'Finance Reports & Ledger Analytics', subtitle: 'Generate Balance Sheets, Profit & Loss accounts, and collection charts' };

    return { title: 'Fee & Finance Management', subtitle: 'Configure master structures, process payments, and track institutional ledger' };
  };

  const { title, subtitle } = getHeaderDetails();

  // Handlers
  const handleOpenAddModal = () => {
    setModalType('add');
    setFormFields({
      name: '',
      amount: '',
      code: '',
      type: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      reference: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalType('edit');
    setActiveItem(item);
    setFormFields({ ...item });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'add') {
      toast.success('Record created successfully');
    } else {
      toast.success('Record updated successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    toast.error('Record deleted successfully');
  };

  const handleTriggerAction = (actionName: string) => {
    toast.success(`${actionName} triggered successfully!`);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              {isExpenses || isVendorPayments ? <TrendingDown className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
            </span>
            <span>{title}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          {isReports && (
            <button
              onClick={() => handleTriggerAction('Export Ledger Report')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}

          {!isDashboard && !isReports && !isCollect && !isAccounting && !isCashBook && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Record</span>
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC METRIC CARDS FOR FINANCE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Collection (FY 26-27)</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">₹12,45,800</span>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12.4% vs last term
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Outstanding Due Fees</span>
            <span className="text-2xl font-black text-rose-650 mt-1 block">₹3,18,400</span>
            <span className="text-[10px] text-amber-500 font-bold mt-1 inline-flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" /> Action required
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Administrative Expenses</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">₹2,84,500</span>
            <span className="text-[10px] text-slate-400 font-bold mt-1 block">Within allocated budget</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Scholarship Concessions</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">₹1,14,000</span>
            <span className="text-[10px] text-indigo-500 font-bold mt-1 block">42 active scholarship grant holders</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DASHBOARD PAGE EXCLUSIVES */}
      {isDashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Monthly Revenue Collection Trend (Lakhs)</h3>
              <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded">2026-27</span>
            </div>
            
            {/* SVG Custom Graph for Revenue */}
            <div className="h-48 w-full flex items-end justify-between px-2 pt-4">
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-16 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-10"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹1.8L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Jan</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-24 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-18"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹2.4L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Feb</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-36 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-28"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹3.5L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Mar</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-28 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-22"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹2.8L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Apr</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-44 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-38"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹4.2L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">May</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-1/6">
                <div className="w-full bg-slate-100 hover:bg-slate-200 rounded-t-lg h-48 transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 hover:bg-indigo-700 rounded-t-lg h-44"></div>
                  <span className="absolute -top-6 inset-x-0 text-center text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">₹5.0L</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Jun</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Collection distribution by Payment Mode</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>Online / Net Banking Gateway</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 h-full w-[65%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>Cash Payments</span>
                  <span>22%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[22%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>Bank Cheque Verification</span>
                  <span>10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[10%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-655 mb-1">
                  <span>POS Swipes / QR Scanner</span>
                  <span>3%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full w-[3%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATA CONTENT SECTION (TABLES & SEARCHES) */}
      {!isDashboard && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-55/10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Grades</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 8">Class 8</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC SUBMODULE DATA TABLES */}
          <div className="overflow-x-auto">
            
            {/* 1. FEE HEAD MANAGEMENT TABLE */}
            {isHead && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Fee Head Code</th>
                    <th className="py-3 px-4">Head Name</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Default Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {feeHeads.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{h.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{h.name}</td>
                      <td className="py-3 px-4">{h.frequency}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px]">{h.type}</span></td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-850">₹{h.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(h)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(h.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. FEE STRUCTURE TABLE */}
            {(isStructure || isMasterSetup) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Structure Name</th>
                    <th className="py-3 px-4">Total Amount Package</th>
                    <th className="py-3 px-4">Heads Included</th>
                    <th className="py-3 px-4">Default Scheme</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {feeStructures.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-3 px-4 font-black text-slate-850">₹{s.totalAmount}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{s.headsCount} standard fee heads</td>
                      <td className="py-3 px-4">
                        {s.isDefault ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">Active Default</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold text-[10px]">Alternate</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. TRANSACTION / FEE COLLECTION TABLE */}
            {(isCollect || isOnlinePayment || isReceipts || isCashBook) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.receiptNo}</td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block">{t.studentName}</span>
                          <span className="text-[10px] text-slate-400">Roll No: {t.rollNo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{t.class}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{t.mode}</td>
                      <td className="py-3 px-4">{t.date}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-850">₹{t.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'Failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>{t.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleTriggerAction(`Print receipt ${t.receiptNo}`)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600" title="Print Invoice"><Printer className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleOpenEditModal(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-600" title="Edit Log"><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. EXPENSE MANAGEMENT TABLE */}
            {(isExpenses || isVendorPayments || isAccounting) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To / Vendor</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Debit Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{e.title}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px]">{e.category}</span></td>
                      <td className="py-3 px-4 text-slate-655 font-semibold">{e.paidTo}</td>
                      <td className="py-3 px-4">{e.date}</td>
                      <td className="py-3 px-4 text-right font-black text-rose-650">₹{e.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px]">{e.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleOpenEditModal(e)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. SCHOLARSHIP / DISCOUNTS TABLE */}
            {(isScholarships || isDiscounts) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Scheme / Scholarship Name</th>
                    <th className="py-3 px-4 text-center">Discount Concession</th>
                    <th className="py-3 px-4 text-right">Net Allocated Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {scholarships.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.studentName}</td>
                      <td className="py-3 px-4">{s.class}</td>
                      <td className="py-3 px-4 font-medium text-indigo-650">{s.schemeName}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{s.percentage}% Concession</td>
                      <td className="py-3 px-4 text-right font-black text-slate-850">₹{s.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          s.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleTriggerAction(`Approve grant ${s.id}`)} className="p-1.5 hover:bg-slate-100 rounded text-emerald-500 hover:text-emerald-700" title="Verify Grant"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600" title="Revoke"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. DUE FEES / FINES / TRANSPORT / HOSTEL TABLE */}
            {(isDueFees || isFines || isTransport || isHostel || isRefunds) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Penalty Charges</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {dueFees.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block">{d.studentName}</span>
                          <span className="text-[10px] text-slate-400">Mobile: {d.mobile}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{d.class}</td>
                      <td className="py-3 px-4 font-semibold text-rose-650">{d.dueDate}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-600">₹{d.fineAmount}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-850">₹{d.totalDue}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleTriggerAction(`Send notification to ${d.studentName}`)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[10px]">Send Reminder</button>
                          <button onClick={() => handleTriggerAction(`Verify Ledger`)} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-[10px]">Verify Ledger</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 7. BUDGET MANAGEMENT / GENERAL ACCOUNTING TABLE */}
            {(isBudget || isClassSetup || isAllocation) && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase pb-2">
                    <th className="py-3 px-4">Department Segment</th>
                    <th className="py-3 px-4">Allocated Fiscal Funds</th>
                    <th className="py-3 px-4">Utilized Funds</th>
                    <th className="py-3 px-4">Remaining Balance</th>
                    <th className="py-3 px-4">Fiscal Period</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {budgets.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-bold text-slate-800">{b.department || Object.keys(b)[1]}</td>
                      <td className="py-3 px-4 font-semibold text-slate-850">₹{b.allocated}</td>
                      <td className="py-3 px-4 font-semibold text-rose-650">₹{b.utilized}</td>
                      <td className="py-3 px-4 font-black text-emerald-650">₹{b.balance}</td>
                      <td className="py-3 px-4">{b.fiscalYear}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          b.balance > 100000 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>Active Allocated</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 8. GENERAL FINANCIAL REPORTS VIEW */}
            {isReports && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40">
                    <h4 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Institutional Income Account</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between font-medium text-slate-655"><span>Tuition Collections</span><span>₹8,50,000</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>Registration & Admissions</span><span>₹2,40,000</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>Transport Fees Ledger</span><span>₹1,15,800</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>Hostel Boarding Fees</span><span>₹40,000</span></div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-300 pt-2 text-sm">
                        <span>Total Revenue Stream</span>
                        <span>₹12,45,800</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40">
                    <h4 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>Operating Expenditures</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between font-medium text-slate-655"><span>Administrative Costs</span><span>₹1,84,500</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>Academic Tools & Instruments</span><span>₹28,500</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>Utility & Fuel Refills</span><span>₹8,000</span></div>
                      <div className="flex justify-between font-medium text-slate-655"><span>IT Servers & Portal Support</span><span>₹63,000</span></div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-300 pt-2 text-sm">
                        <span>Total Operational Expenses</span>
                        <span>₹2,84,500</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-900 text-white flex items-center justify-between shadow-md">
                  <div>
                    <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Computed Net Surplus (Fiscal Profit)</h4>
                    <span className="text-3xl font-black block mt-1">₹9,61,300</span>
                  </div>
                  <button onClick={() => handleTriggerAction('Verify audited balance sheet')} className="px-4 py-2 bg-indigo-800 hover:bg-indigo-750 text-indigo-100 hover:text-white font-bold rounded-xl text-xs transition">
                    Lock Fiscal Accounts Sheet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPACT MODAL POPUP DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-650 to-violet-650 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{modalType === 'add' ? 'Add Record Entry' : 'Edit Record Details'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Record Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Tuition Fee or Diesel Expense"
                  value={formFields.name || formFields.title || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="₹ 0.00"
                    value={formFields.amount || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reference Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FY-26"
                    value={formFields.code || formFields.receiptNo || ''}
                    onChange={(e) => setFormFields(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Memo</label>
                <textarea
                  placeholder="Memo notes..."
                  value={formFields.description || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-750 text-white rounded-lg font-semibold"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
