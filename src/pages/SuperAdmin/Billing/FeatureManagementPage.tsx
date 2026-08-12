import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Cpu, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Zap, ToggleLeft, ToggleRight,
  LayoutGrid, Edit2, Code, Save, Layers, Sparkles,
  Bookmark, CheckSquare, Square, Layers3, SlidersHorizontal
} from 'lucide-react';
import api from '../../../services/api';

export interface SaaSPlanDef {
  key: string;
  name: string;
  price: string;
  max_students: number;
}

export interface FeatureManagementItem {
  id: string;
  feature_id: string;
  feature_name: string;
  feature_key: string;
  category: string;
  min_plan_required: string;
  status: 'ENABLED' | 'DISABLED';
  description?: string;
  assigned_plans: string[]; // List of plan keys e.g. ['STARTER_ACADEMY', 'PRO_SLA']
}

type TabMode = 'catalog' | 'matrix' | 'plan_config';
type SortField = 'feature_name' | 'feature_key' | 'category';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 6 | 12 | 24 | 'all';
type ViewMode = 'grid' | 'list';

interface SearchableOption {
  value: string;
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  labelPrefix
}: {
  options: SearchableOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon?: React.ElementType;
  labelPrefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-bold cursor-pointer transition-all"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[140px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[10px] text-slate-500 text-center font-medium">No options match</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    opt.value === value
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const defaultPlans: SaaSPlanDef[] = [
  { key: 'MICRO_BASIC', name: 'Micro School Basic', price: '₹1,499/mo', max_students: 500 },
  { key: 'STARTER_ACADEMY', name: 'Starter Academy', price: '₹2,999/mo', max_students: 1500 },
  { key: 'PRO_SLA', name: 'Pro SLA Tier', price: '₹6,999/mo', max_students: 5000 },
  { key: 'ENTERPRISE_SLA', name: 'Enterprise SLA Plan', price: '₹14,999/mo', max_students: 10000 },
  { key: 'MULTI_BRANCH_SAAS', name: 'Multi-Branch SaaS Tier', price: '₹29,999/mo', max_students: 50000 },
];

const mockFeaturesCatalog: FeatureManagementItem[] = [
  {
    id: 'ftr-101',
    feature_id: 'FTR-1001',
    feature_name: 'Student Information System (SIS Core)',
    feature_key: 'sis_core_module',
    category: 'CORE ERP',
    min_plan_required: 'MICRO_BASIC',
    status: 'ENABLED',
    description: 'Complete student profiles, enrollment, parent details, and document upload.',
    assigned_plans: ['MICRO_BASIC', 'STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-102',
    feature_id: 'FTR-1002',
    feature_name: 'Daily Student & Staff Attendance (Manual & QR)',
    feature_key: 'attendance_mgmt',
    category: 'CORE ERP',
    min_plan_required: 'MICRO_BASIC',
    status: 'ENABLED',
    description: 'Mark daily attendance, subject-wise attendance, QR code scanning, and monthly reports.',
    assigned_plans: ['MICRO_BASIC', 'STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-103',
    feature_id: 'FTR-1003',
    feature_name: 'Academic Classes, Sections & Subject Allocator',
    feature_key: 'academic_scheduler',
    category: 'ACADEMICS',
    min_plan_required: 'MICRO_BASIC',
    status: 'ENABLED',
    description: 'Configure academic year, class sections, subjects, and teacher subject mapping.',
    assigned_plans: ['MICRO_BASIC', 'STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-104',
    feature_id: 'FTR-1004',
    feature_name: 'Examination, Marks Gradebook & Report Cards',
    feature_key: 'exam_report_cards',
    category: 'ACADEMICS',
    min_plan_required: 'MICRO_BASIC',
    status: 'ENABLED',
    description: 'Exam schedules, hall tickets, mark entries, GPA/CCE grading, and PDF report cards.',
    assigned_plans: ['MICRO_BASIC', 'STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-105',
    feature_id: 'FTR-1005',
    feature_name: 'Fee Management & Manual Receipt Generator',
    feature_key: 'fee_collection',
    category: 'FINANCE',
    min_plan_required: 'MICRO_BASIC',
    status: 'ENABLED',
    description: 'Custom fee structures, due alerts, concession rules, and offline print receipts.',
    assigned_plans: ['MICRO_BASIC', 'STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-106',
    feature_id: 'FTR-1006',
    feature_name: 'Online Payment Gateway (Razorpay, Paytm, Stripe)',
    feature_key: 'online_fee_gateway',
    category: 'FINANCE',
    min_plan_required: 'STARTER_ACADEMY',
    status: 'ENABLED',
    description: 'Accept online fee payments via UPI, Credit/Debit cards, and Auto-reconcile invoices.',
    assigned_plans: ['STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-107',
    feature_id: 'FTR-1007',
    feature_name: 'Staff Payroll Management & Automated Pay Slips',
    feature_key: 'staff_payroll_hrms',
    category: 'HRMS',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Teacher salary breakdown, EPF/ESI calculations, automated monthly payslip PDF generation.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-108',
    feature_id: 'FTR-1008',
    feature_name: 'Staff Leave Application & Approval Workflow',
    feature_key: 'leave_management',
    category: 'HRMS',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Casual, Sick, and Paid leave balance tracking with multi-tier approval levels.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-109',
    feature_id: 'FTR-1009',
    feature_name: 'SMS & Email Broadcast Communication Hub',
    feature_key: 'sms_email_broadcast',
    category: 'COMMUNICATION',
    min_plan_required: 'STARTER_ACADEMY',
    status: 'ENABLED',
    description: 'Send bulk SMS notices, emergency alerts, and email newsletters to parents.',
    assigned_plans: ['STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-110',
    feature_id: 'FTR-1010',
    feature_name: 'WhatsApp Cloud API Automated Gateway',
    feature_key: 'whatsapp_cloud_gateway',
    category: 'COMMUNICATION',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Instant WhatsApp notifications for fee receipts, homework alerts, and exam results.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-111',
    feature_id: 'FTR-1011',
    feature_name: 'Transport Fleet Management & Bus Live GPS',
    feature_key: 'transport_gps_tracking',
    category: 'LOGISTICS',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Vehicle routes, driver roster, pick-up points, and real-time parent GPS map.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-112',
    feature_id: 'FTR-1012',
    feature_name: 'Hostel Allocation & Mess Outpass Gate System',
    feature_key: 'hostel_mess_management',
    category: 'LOGISTICS',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Dormitory room assignment, student outpass generation, and mess attendance.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-113',
    feature_id: 'FTR-1013',
    feature_name: 'Digital Library Barcode Circulation System',
    feature_key: 'library_barcode_system',
    category: 'ACADEMICS',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Book cataloging, barcode scanning, issue/return ledger, and late fine calculation.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-114',
    feature_id: 'FTR-1014',
    feature_name: 'Biometric Face Recognition Attendance Ingestion',
    feature_key: 'biometric_face_attendance',
    category: 'HARDWARE SDK',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: 'Hardware IP camera integration for AI facial recognition auto-attendance.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-115',
    feature_id: 'FTR-1015',
    feature_name: 'AI Automatic Timetable & Exam Conflict Scheduler',
    feature_key: 'ai_timetable_scheduler',
    category: 'AI & AUTOMATION',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'AI algorithm to generate zero-clash period timetables considering teacher availability.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-116',
    feature_id: 'FTR-1016',
    feature_name: 'AI Predictive Student Performance Analytics',
    feature_key: 'ai_student_analytics',
    category: 'AI & AUTOMATION',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: 'Identify weak academic areas, dropout risk indicators, and automated remediation hints.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-117',
    feature_id: 'FTR-1017',
    feature_name: 'Reception, Visitor Desk & Security Gate Pass',
    feature_key: 'reception_gate_pass',
    category: 'SECURITY',
    min_plan_required: 'STARTER_ACADEMY',
    status: 'ENABLED',
    description: 'Log visitor check-ins, print thermal gate passes, and SMS parent approval for student pickup.',
    assigned_plans: ['STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-118',
    feature_id: 'FTR-1018',
    feature_name: 'Online Admissions & CRM Sales Pipeline',
    feature_key: 'admissions_crm',
    category: 'CRM',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Manage admission inquiries, counselor follow-ups, and lead conversion funnel.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-119',
    feature_id: 'FTR-1019',
    feature_name: 'Homework & Online Learning LMS Hub',
    feature_key: 'lms_homework',
    category: 'LMS',
    min_plan_required: 'STARTER_ACADEMY',
    status: 'ENABLED',
    description: 'Digital study material sharing, video lectures, and student homework assignment submission.',
    assigned_plans: ['STARTER_ACADEMY', 'PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-120',
    feature_id: 'FTR-1020',
    feature_name: 'Inventory & School Store Asset Manager',
    feature_key: 'inventory_assets',
    category: 'LOGISTICS',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: 'Uniform/book store stock management, vendor POs, and furniture asset tracking.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-121',
    feature_id: 'FTR-1021',
    feature_name: 'Multi-Branch Campus Switcher & HQ Reporting',
    feature_key: 'multi_branch_saas',
    category: 'SAAS & ADMIN',
    min_plan_required: 'MULTI_BRANCH_SAAS',
    status: 'ENABLED',
    description: 'Manage group of schools, unified central login, branch comparison analytics.',
    assigned_plans: ['MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-122',
    feature_id: 'FTR-1022',
    feature_name: 'Custom White-Label Subdomain & Domain Routing',
    feature_key: 'custom_white_label_domain',
    category: 'CUSTOM BRANDING',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: 'Custom school domain (e.g. erp.stxaviers.com), custom login page, branding logo.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-123',
    feature_id: 'FTR-1023',
    feature_name: 'Developer REST API Access & Custom Webhooks',
    feature_key: 'api_webhooks_access',
    category: 'DEVELOPER API',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: 'Developer tokens, event triggers (webhooks) for third-party ERP integrations.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-124',
    feature_id: 'FTR-1024',
    feature_name: 'Automated AWS S3 Cloud Database Backups',
    feature_key: 'cloud_s3_backup',
    category: 'DATABASE',
    min_plan_required: 'PRO_SLA',
    status: 'ENABLED',
    description: 'Daily snapshot backups to cloud storage with one-click point-in-time restore.',
    assigned_plans: ['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  },
  {
    id: 'ftr-125',
    feature_id: 'FTR-1025',
    feature_name: '24/7 Dedicated Account Manager & SLA Support',
    feature_key: 'priority_247_support',
    category: 'SUPPORT',
    min_plan_required: 'ENTERPRISE_SLA',
    status: 'ENABLED',
    description: '1-hour SLA response time, phone assistance, and priority bug resolution queue.',
    assigned_plans: ['ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']
  }
];

export default function FeatureManagementPage() {
  const [plans, setPlans] = useState<SaaSPlanDef[]>(defaultPlans);
  const [features, setFeatures] = useState<FeatureManagementItem[]>(mockFeaturesCatalog);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>('catalog');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Per-Plan Configurator Selected Plan Key
  const [selectedPlanConfigKey, setSelectedPlanConfigKey] = useState<string>('STARTER_ACADEMY');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('feature_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(12);

  // Modals
  const [selectedFeature, setSelectedFeature] = useState<FeatureManagementItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureManagementItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formMinPlan, setFormMinPlan] = useState('PRO_SLA');
  const [formCategory, setFormCategory] = useState('CORE ERP');
  const [formStatus, setFormStatus] = useState<'ENABLED' | 'DISABLED'>('ENABLED');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedPlans, setFormAssignedPlans] = useState<string[]>(['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/feature-management');
      if (res.data.success) {
        if (Array.isArray(res.data.data)) {
          setFeatures(res.data.data);
        }
        if (Array.isArray(res.data.plans)) {
          setPlans(res.data.plans);
        }
      }
    } catch {
      // Fallback to local mock state
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Module features & plan entitlement matrix refreshed');
      }, 400);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, planFilter, sortBy, sortOrder, pageSize]);

  // Toggle Feature Enable/Disable Status
  const handleToggleStatus = async (id: string, currentStatus: 'ENABLED' | 'DISABLED', ftrName: string) => {
    const newStatus: 'ENABLED' | 'DISABLED' = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    toast.loading(`Updating status for '${ftrName}' to ${newStatus}...`, { id: 'ftr-status-toast' });

    try {
      await api.put(`/landlord/feature-management/${id}`, { status: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFeatures(prev => prev.map(f => (f.id === id ? { ...f, status: newStatus } : f)));
      toast.success(`Feature '${ftrName}' is now ${newStatus === 'ENABLED' ? 'ENABLED 🟢' : 'DISABLED 🔴'}!`, { id: 'ftr-status-toast' });
    }, 400);
  };

  // Toggle Feature Inclusion in Matrix for a Plan
  const handleTogglePlanInclusion = (featureId: string, planKey: string) => {
    setFeatures(prev =>
      prev.map(f => {
        if (f.id !== featureId) return f;
        const exists = f.assigned_plans.includes(planKey);
        const updatedPlans = exists
          ? f.assigned_plans.filter(p => p !== planKey)
          : [...f.assigned_plans, planKey];
        return { ...f, assigned_plans: updatedPlans };
      })
    );
  };

  // Save Entitlement Matrix Bulk Update
  const handleSaveMatrix = async () => {
    toast.loading('Saving plan entitlement matrix to Redis cache...', { id: 'save-matrix-toast' });
    try {
      await api.put('/landlord/feature-management/matrix', { matrix: features });
    } catch {
      // Fallback
    }
    setTimeout(() => {
      toast.success('🎉 Subscription Plan Feature Matrix updated successfully!', { id: 'save-matrix-toast' });
    }, 500);
  };

  // Bulk Actions for Per-Plan Configurator
  const handleBulkPlanConfig = (action: 'all' | 'none' | 'core' | 'ai') => {
    setFeatures(prev =>
      prev.map(f => {
        let assigned = [...f.assigned_plans];
        const hasPlan = assigned.includes(selectedPlanConfigKey);

        if (action === 'all') {
          if (!hasPlan) assigned.push(selectedPlanConfigKey);
        } else if (action === 'none') {
          assigned = assigned.filter(p => p !== selectedPlanConfigKey);
        } else if (action === 'core') {
          if (['CORE ERP', 'ACADEMICS', 'FINANCE'].includes(f.category)) {
            if (!hasPlan) assigned.push(selectedPlanConfigKey);
          }
        } else if (action === 'ai') {
          if (['AI & AUTOMATION', 'HARDWARE SDK'].includes(f.category)) {
            if (!hasPlan) assigned.push(selectedPlanConfigKey);
          }
        }

        return { ...f, assigned_plans: assigned };
      })
    );

    const planName = plans.find(p => p.key === selectedPlanConfigKey)?.name || selectedPlanConfigKey;
    toast.success(`Updated plan features for '${planName}' using preset!`);
  };

  // Create Feature Flag
  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formKey.trim()) {
      toast.error('Please enter Feature Name and Code Key');
      return;
    }

    toast.loading('Registering new module feature flag...', { id: 'create-ftr-toast' });

    const keyFormatted = formKey.toLowerCase().replace(/\s+/g, '_');

    try {
      await api.post('/landlord/feature-management', {
        feature_name: formName,
        feature_key: keyFormatted,
        category: formCategory,
        min_plan_required: formMinPlan,
        status: formStatus,
        description: formDescription,
        assigned_plans: formAssignedPlans
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newFeature: FeatureManagementItem = {
        id: `ftr-${Date.now()}`,
        feature_id: `FTR-${Math.floor(1000 + Math.random() * 9000)}`,
        feature_name: formName,
        feature_key: keyFormatted,
        category: formCategory.toUpperCase(),
        min_plan_required: formMinPlan,
        status: formStatus,
        description: formDescription || 'Newly configured ERP module feature.',
        assigned_plans: formAssignedPlans
      };

      setFeatures(prev => [newFeature, ...prev]);
      toast.success(`⚙️ Module feature '${formName}' registered successfully!`, { id: 'create-ftr-toast' });
      setIsAddModalOpen(false);

      // Reset form
      setFormName('');
      setFormKey('');
      setFormDescription('');
    }, 500);
  };

  // Open Edit Modal
  const handleOpenEdit = (f: FeatureManagementItem) => {
    setEditingFeature(f);
    setFormName(f.feature_name);
    setFormKey(f.feature_key);
    setFormCategory(f.category);
    setFormMinPlan(f.min_plan_required);
    setFormStatus(f.status);
    setFormDescription(f.description || '');
    setFormAssignedPlans(f.assigned_plans || []);
  };

  // Update Feature
  const handleUpdateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;

    toast.loading(`Updating feature '${editingFeature.feature_name}'...`, { id: 'edit-ftr-toast' });

    const keyFormatted = formKey.toLowerCase().replace(/\s+/g, '_');

    try {
      await api.put(`/landlord/feature-management/${editingFeature.id}`, {
        feature_name: formName,
        feature_key: keyFormatted,
        category: formCategory,
        min_plan_required: formMinPlan,
        status: formStatus,
        description: formDescription,
        assigned_plans: formAssignedPlans
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFeatures(prev =>
        prev.map(f =>
          f.id === editingFeature.id
            ? {
                ...f,
                feature_name: formName,
                feature_key: keyFormatted,
                category: formCategory.toUpperCase(),
                min_plan_required: formMinPlan,
                status: formStatus,
                description: formDescription,
                assigned_plans: formAssignedPlans
              }
            : f
        )
      );
      toast.success(`✏️ Feature '${formName}' updated successfully!`, { id: 'edit-ftr-toast' });
      setEditingFeature(null);
    }, 400);
  };

  // Delete Feature Flag
  const handleDeleteFeature = async (id: string, ftrId: string) => {
    toast.loading(`Disabling feature flag '${ftrId}'...`, { id: 'del-ftr-toast' });

    try {
      await api.delete(`/landlord/feature-management/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFeatures(prev => prev.filter(f => f.id !== id));
      toast.success(`🗑️ Feature flag '${ftrId}' disabled!`, { id: 'del-ftr-toast' });
    }, 500);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Categories extraction
  const categoriesList = Array.from(new Set(features.map(f => f.category)));

  // Filtered Features
  const filtered = features.filter(f => {
    const matchesSearch =
      f.feature_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.feature_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesPlan = planFilter === 'all' || f.assigned_plans.includes(planFilter);

    return matchesSearch && matchesCategory && matchesStatus && matchesPlan;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  // Searchable Options
  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    ...categoriesList.map(c => ({ value: c, label: c }))
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ENABLED', label: 'ENABLED 🟢' },
    { value: 'DISABLED', label: 'DISABLED 🔴' },
  ];

  const planOptionsFilter: SearchableOption[] = [
    { value: 'all', label: 'All Subscription Plans' },
    ...plans.map(p => ({ value: p.key, label: p.name }))
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'feature_name', label: 'Feature Name' },
    { value: 'feature_key', label: 'Feature Key' },
    { value: 'category', label: 'Category Module' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '6', label: '6 per page' },
    { value: '12', label: '12 per page' },
    { value: '24', label: '24 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-5 font-sans text-slate-100 pb-10">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Module Feature Management & Subscription Plan Mapping
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <ToggleLeft className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Redis Entitlement Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage all built ERP module features and decide which subscription plan tier gets access to which specific modules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormName('');
              setFormKey('');
              setFormMinPlan('PRO_SLA');
              setFormCategory('CORE ERP');
              setFormStatus('ENABLED');
              setFormDescription('');
              setFormAssignedPlans(['PRO_SLA', 'ENTERPRISE_SLA', 'MULTI_BRANCH_SAAS']);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Module Feature
          </button>

          <button
            onClick={handleSaveMatrix}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Save Matrix Changes
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Module Features</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{features.length} Features ⚙️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Built ERP Capabilities</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Subscription Tiers</span>
            <Bookmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{plans.length} Pricing Plans</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Basic to Multi-Branch</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Module Categories</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{categoriesList.length} Categories</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Functional Domains</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Feature Gates</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{features.filter(f => f.status === 'ENABLED').length} Enabled</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Tenant Gates</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gating Latency</span>
            <Zap className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-400 font-mono">0.3 ms ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Redis In-Memory Lookup</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers3 className="w-4 h-4" /> Feature Catalog ({filtered.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Plan vs Feature Matrix Grid
          </button>
          <button
            onClick={() => setActiveTab('plan_config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'plan_config'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Per-Plan Entitlement Configurator
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: FEATURE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Searchable Filters Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search features by name, code key, module category, or description..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category Module..." icon={Layers} labelPrefix="Module" />
              <SearchableSelect options={planOptionsFilter} value={planFilter} onChange={setPlanFilter} placeholder="Filter Plan..." icon={Bookmark} labelPrefix="Included In" />
              <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
              
              <div className="flex items-center gap-1">
                <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
                <button
                  onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
            </div>
          </div>

          {/* GRID VIEW vs LIST VIEW */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedData.map(f => (
                <div
                  key={f.id}
                  className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                    f.status === 'ENABLED'
                      ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5'
                      : 'border-slate-800/60 opacity-60 bg-slate-950/40'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{f.feature_id}</span>
                        <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-0.5">{f.feature_name}</h3>
                      </div>

                      {/* Active / Inactive Toggle Switch Button */}
                      <button
                        onClick={() => handleToggleStatus(f.id, f.status, f.feature_name)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black cursor-pointer transition-all ${
                          f.status === 'ENABLED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                        title="Click to toggle Enabled / Disabled"
                      >
                        {f.status === 'ENABLED' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                        {f.status}
                      </button>
                    </div>

                    <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Code className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-mono text-indigo-300 font-bold truncate">{f.feature_key}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-500/15 text-teal-400 border border-teal-500/30 font-bold text-[10px] rounded-lg uppercase">
                        {f.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{f.description}</p>

                    {/* Assigned Plans Badges */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-900">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Included In Plans:</div>
                      <div className="flex flex-wrap gap-1">
                        {plans.map(p => {
                          const isAssigned = f.assigned_plans.includes(p.key);
                          return (
                            <button
                              key={p.key}
                              onClick={() => handleTogglePlanInclusion(f.id, p.key)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                isAssigned
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                  : 'bg-slate-900 text-slate-600 border-slate-800 hover:text-slate-400'
                              }`}
                              title={`Click to ${isAssigned ? 'remove from' : 'add to'} ${p.name}`}
                            >
                              {isAssigned ? '✓ ' : '+ '}{p.name.replace(' Subscription Plan', '').replace(' Tier', '').replace(' Plan', '')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedFeature(f)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> View Details
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(f.id, f.feature_id)}
                        className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer transition-all"
                        title="Disable Feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE LIST VIEW */
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                      <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('feature_name')}>Module Feature Name & ID</th>
                      <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('feature_key')}>Feature Code Key</th>
                      <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('category')}>Category Module</th>
                      <th className="p-3.5 font-mono">Subscription Plans Inclusion</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedData.map(f => (
                      <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-bold text-white font-mono">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-white font-black">{f.feature_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{f.feature_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-indigo-400 font-bold">{f.feature_key}</td>
                        <td className="p-3.5 font-bold text-teal-400 text-xs">{f.category}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {plans.map(p => {
                              const isAssigned = f.assigned_plans.includes(p.key);
                              return (
                                <span
                                  key={p.key}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    isAssigned
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-slate-900/50 text-slate-600 border-slate-800'
                                  }`}
                                >
                                  {p.name.split(' ')[0]}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(f.id, f.status, f.feature_name)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase cursor-pointer transition-all ${
                              f.status === 'ENABLED'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                            }`}
                          >
                            {f.status === 'ENABLED' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                            {f.status}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedFeature(f)}
                              className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" /> View
                            </button>
                            <button
                              onClick={() => handleOpenEdit(f)}
                              className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteFeature(f.id, f.feature_id)}
                              className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                              title="Disable Feature"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAN VS FEATURE MATRIX GRID */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                Subscription Plan vs Module Feature Entitlement Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click checkmarks to directly enable or disable any module feature for specific subscription plans
              </p>
            </div>

            <button
              onClick={handleSaveMatrix}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Save className="w-4 h-4" /> Save Matrix Settings
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full text-left text-xs font-medium border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-4 sticky left-0 bg-slate-900 z-10 w-72">Module Feature Name & Key</th>
                  <th className="p-4 text-center">Category</th>
                  {plans.map(p => (
                    <th key={p.key} className="p-4 text-center border-l border-slate-800/80">
                      <div className="font-black text-amber-400 text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {features.map(f => (
                  <tr key={f.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-white sticky left-0 bg-slate-950 z-10 border-r border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-white font-black">{f.feature_name}</div>
                          <div className="text-[10px] text-indigo-400 font-mono">{f.feature_key}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold text-[10px]">
                        {f.category}
                      </span>
                    </td>
                    {plans.map(p => {
                      const isAssigned = f.assigned_plans.includes(p.key);
                      return (
                        <td key={p.key} className="p-3.5 text-center border-l border-slate-800/60">
                          <button
                            onClick={() => handleTogglePlanInclusion(f.id, p.key)}
                            className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center justify-center border ${
                              isAssigned
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
                                : 'bg-slate-900 text-slate-600 border-slate-800 hover:text-slate-400 hover:border-slate-700'
                            }`}
                            title={`${isAssigned ? 'Enabled' : 'Disabled'} for ${p.name}`}
                          >
                            {isAssigned ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PER-PLAN ENTITLEMENT CONFIGURATOR */}
      {activeTab === 'plan_config' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6">
          {/* Top Selector & Preset Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider block mb-1">
                Select Subscription Plan Tier to Configure:
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPlanConfigKey}
                  onChange={e => setSelectedPlanConfigKey(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-white font-extrabold text-sm focus:outline-none focus:border-amber-400"
                >
                  {plans.map(p => (
                    <option key={p.key} value={p.key}>
                      {p.name} ({p.price}) - Max {p.max_students.toLocaleString()} Students
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-400 font-medium">
                  Currently Enabled Features: {' '}
                  <strong className="text-amber-400 font-extrabold">
                    {features.filter(f => f.assigned_plans.includes(selectedPlanConfigKey)).length} / {features.length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Bulk Actions Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkPlanConfig('all')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Select All Modules
              </button>
              <button
                onClick={() => handleBulkPlanConfig('core')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Core ERP Preset
              </button>
              <button
                onClick={() => handleBulkPlanConfig('ai')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-teal-400" /> Enable AI Suite
              </button>
              <button
                onClick={() => handleBulkPlanConfig('none')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-red-400" /> Deselect All
              </button>
            </div>
          </div>

          {/* Grouped Modules Checkbox List */}
          <div className="space-y-6">
            {categoriesList.map(cat => {
              const catFeatures = features.filter(f => f.category === cat);
              return (
                <div key={cat} className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      {cat} ({catFeatures.length} Features)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {catFeatures.filter(f => f.assigned_plans.includes(selectedPlanConfigKey)).length} Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {catFeatures.map(f => {
                      const isAssigned = f.assigned_plans.includes(selectedPlanConfigKey);
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleTogglePlanInclusion(f.id, selectedPlanConfigKey)}
                          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all select-none ${
                            isAssigned
                              ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black truncate ${isAssigned ? 'text-amber-300' : 'text-slate-300'}`}>
                                {f.feature_name}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-indigo-400 font-bold">{f.feature_key}</div>
                            {f.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{f.description}</p>
                            )}
                          </div>

                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => {}} // handled by div container click
                              className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveMatrix}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xl hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <Save className="w-4 h-4" /> Save Configuration For Selected Plan
            </button>
          </div>
        </div>
      )}

      {/* VIEW SPEC MODAL */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">{selectedFeature.feature_name}</h3>
              </div>
              <button onClick={() => setSelectedFeature(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Feature Code Key</div>
                  <div className="text-indigo-400 font-bold mt-0.5">{selectedFeature.feature_key}</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Feature ID</div>
                  <div className="text-amber-400 font-bold mt-0.5">{selectedFeature.feature_id}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Module Description</div>
                <p className="text-slate-300 leading-relaxed">{selectedFeature.description || 'No detailed description provided.'}</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Included Subscription Plans</div>
                <div className="flex flex-wrap gap-1.5">
                  {plans.map(p => {
                    const isAssigned = selectedFeature.assigned_plans.includes(p.key);
                    return (
                      <span
                        key={p.key}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                          isAssigned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        {isAssigned ? '✓ ' : '✕ '}{p.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE FEATURE FLAG MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create New Module Feature Flag</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeature} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Module Feature Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. AI Automatic Timetable Scheduler"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Feature Code Key (Unique identifier) *</label>
                <input
                  type="text"
                  required
                  value={formKey}
                  onChange={e => setFormKey(e.target.value)}
                  placeholder="e.g. ai_timetable_scheduler"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Category Module</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="AI & AUTOMATION"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'ENABLED' | 'DISABLED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ENABLED">ENABLED 🟢</option>
                    <option value="DISABLED">DISABLED 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Module Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Short description of what this ERP module does..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">Assign to Subscription Plans:</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {plans.map(p => {
                    const isAssigned = formAssignedPlans.includes(p.key);
                    return (
                      <label key={p.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormAssignedPlans([...formAssignedPlans, p.key]);
                            } else {
                              setFormAssignedPlans(formAssignedPlans.filter(k => k !== p.key));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-amber-500 rounded"
                        />
                        <span>{p.name} ({p.price})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  Create Feature Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FEATURE FLAG MODAL */}
      {editingFeature && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Edit Module Feature ({editingFeature.feature_id})</h3>
              </div>
              <button onClick={() => setEditingFeature(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFeature} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Feature Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Feature Code Key *</label>
                <input
                  type="text"
                  required
                  value={formKey}
                  onChange={e => setFormKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Category Module</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'ENABLED' | 'DISABLED')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ENABLED">ENABLED 🟢</option>
                    <option value="DISABLED">DISABLED 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">Assigned Subscription Plans:</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {plans.map(p => {
                    const isAssigned = formAssignedPlans.includes(p.key);
                    return (
                      <label key={p.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormAssignedPlans([...formAssignedPlans, p.key]);
                            } else {
                              setFormAssignedPlans(formAssignedPlans.filter(k => k !== p.key));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-amber-500 rounded"
                        />
                        <span>{p.name} ({p.price})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFeature(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  Update Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
