import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FileText, Video, Link, File, Plus, Search, Trash2, 
  Download, Filter, AlertCircle, RefreshCw, X, CheckSquare
} from 'lucide-react';

interface StudyResource {
  id: number;
  title: string;
  className: string;
  subjectName: string;
  resourceType: 'PDF' | 'Video' | 'Link' | 'Doc';
  fileNameOrUrl: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedDate: string;
  description: string;
}

const INITIAL_RESOURCES: StudyResource[] = [
  {
    id: 1,
    title: 'Algebra Formula Sheet & Tricks',
    className: 'Class 10',
    subjectName: 'Mathematics',
    resourceType: 'PDF',
    fileNameOrUrl: 'Algebra_Formula_Notes_10.pdf',
    fileSize: '2.4 MB',
    uploadedBy: 'Mr. Rajesh Sharma',
    uploadedDate: '2026-06-20',
    description: 'Quick reference formula sheet covering quadratic equations, arithmetic progressions, and linear equations.'
  },
  {
    id: 2,
    title: 'Light Refraction Physics Animation Video',
    className: 'Class 10',
    subjectName: 'Physics',
    resourceType: 'Video',
    fileNameOrUrl: 'https://www.youtube.com/watch?v=refraction-demo',
    uploadedBy: 'Dr. Sunita Verma',
    uploadedDate: '2026-06-22',
    description: 'Visual 3D rendering explanation of Snell\'s Law, total internal reflection, and prism dispersion.'
  },
  {
    id: 3,
    title: 'English Grammer Sentence Structures Rules',
    className: 'Class 9',
    subjectName: 'English Literature',
    resourceType: 'Doc',
    fileNameOrUrl: 'Grammar_Sentences_Rules_9.docx',
    fileSize: '780 KB',
    uploadedBy: 'Mrs. Emily D\'souza',
    uploadedDate: '2026-06-24',
    description: 'Comprehensive guide to active/passive voice, direct/indirect speeches, and prepositions guidelines.'
  }
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'English Literature'];
const TYPES = ['PDF', 'Video', 'Link', 'Doc'];

export default function StudyMaterialManager() {
  const [resources, setResources] = useState<StudyResource[]>(INITIAL_RESOURCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    className: CLASSES[0],
    subjectName: SUBJECTS[0],
    resourceType: 'PDF' as 'PDF' | 'Video' | 'Link' | 'Doc',
    fileNameOrUrl: '',
    uploadedBy: 'Mr. Rajesh Sharma',
    description: ''
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      className: CLASSES[0],
      subjectName: SUBJECTS[0],
      resourceType: 'PDF',
      fileNameOrUrl: '',
      uploadedBy: 'Mr. Rajesh Sharma',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.fileNameOrUrl.trim()) {
      toast.error('Please enter resource title and document link/file name');
      return;
    }

    const newResource: StudyResource = {
      id: Date.now(),
      ...formData,
      fileSize: formData.resourceType === 'PDF' || formData.resourceType === 'Doc' ? '1.2 MB' : undefined,
      uploadedDate: new Date().toISOString().split('T')[0]
    };

    setResources(prev => [newResource, ...prev]);
    toast.success('Study material shared with students successfully');
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this learning material?')) {
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success('Resource deleted successfully');
    }
  };

  const filteredResources = resources.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass ? item.className === selectedClass : true;
    const matchesType = selectedType ? item.resourceType === selectedType : true;

    return matchesSearch && matchesClass && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'Video':
        return <Video className="w-8 h-8 text-sky-500" />;
      case 'Link':
        return <Link className="w-8 h-8 text-indigo-500" />;
      default:
        return <File className="w-8 h-8 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Study Material & E-Learning</h1>
          <p className="text-slate-500 mt-1 text-sm">Upload notes, lecture videos, curriculum PDFs, and worksheets for student revision portals.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, subject, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="">All Classes</option>
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="">All Resource Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {(searchTerm || selectedClass || selectedType) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('');
              setSelectedType('');
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-lg transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-xl py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No Learning Material Found</p>
          </div>
        ) : (
          filteredResources.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {getIcon(item.resourceType)}
                  </div>
                  
                  <div className="text-right">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                      {item.className}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1 font-semibold uppercase">{item.subjectName}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
                </div>

                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Source/Link:</span>
                    <span className="text-slate-700 font-semibold truncate max-w-[180px]" title={item.fileNameOrUrl}>
                      {item.fileNameOrUrl}
                    </span>
                  </div>
                  {item.fileSize && (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>File Size:</span>
                      <span className="text-slate-700 font-semibold">{item.fileSize}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer actions */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex items-center justify-between text-xs font-semibold">
                <div className="flex flex-col text-[10px] text-slate-400">
                  <span>Uploaded by:</span>
                  <span className="font-semibold text-slate-600 mt-0.5">{item.uploadedBy}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <a
                    href={item.fileNameOrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Access</span>
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Upload Study Material</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class/Grade</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={formData.subjectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Resource Type</label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, resourceType: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Uploaded By</label>
                  <input
                    type="text"
                    value={formData.uploadedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, uploadedBy: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 3 Trigonometry Cheat Sheet"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {formData.resourceType === 'Video' || formData.resourceType === 'Link' ? 'Web Link URL' : 'File Link / Path Name'}
                </label>
                <input
                  type="text"
                  placeholder={formData.resourceType === 'Video' ? 'e.g. https://youtube.com/watch?v=...' : 'e.g. Worksheet_Equations.pdf'}
                  value={formData.fileNameOrUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileNameOrUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide short guidelines for students on what this document contains..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
