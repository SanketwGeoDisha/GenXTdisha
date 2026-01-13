import React, { useMemo, useCallback } from 'react';
import { 
    BookOpen, CheckCircle, Database, Layout, Award, Users, Briefcase, TrendingUp, 
    Building2, FileText, ExternalLink, GraduationCap, Download, Globe, ShieldCheck
} from 'lucide-react';

const ReportDisplay = ({ report }) => {
    const parsedData = useMemo(() => {
        if (!report) return null;

        const sections = [];
        let collegeInfo = { name: '', sources: '' };
        
        const lines = report.split('\n');
        let currentSection = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Extract College Info
            if (trimmed.startsWith('College Name:')) {
                collegeInfo.name = trimmed.replace('College Name:', '').trim();
            }
            else if (trimmed.startsWith('Primary Data Sources Used:')) {
                collegeInfo.sources = trimmed.replace('Primary Data Sources Used:', '').trim().replace(/^<|>$/g, '');
            }
            
            // Check for section headers (## Section Name)
            else if (trimmed.startsWith('## ')) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: trimmed.replace('## ', '').trim(),
                    items: []
                };
            }
            // Check for data items (Label: Value | Source: Source)
            else if (line.includes('| Source:') && currentSection) {
                const parts = line.split('| Source:');
                if (parts.length === 2) {
                    const contentPart = parts[0].trim();
                    const source = parts[1].trim();

                    // Split content into label and value (first colon)
                    const firstColonIndex = contentPart.indexOf(':');
                    if (firstColonIndex !== -1) {
                        const label = contentPart.substring(0, firstColonIndex).trim();
                        const value = contentPart.substring(firstColonIndex + 1).trim();

                        // Clean up value (remove < > if present from template)
                        const cleanValue = value.replace(/^<|>$/g, '');
                        const cleanSource = source.replace(/^<|>$/g, '');

                        currentSection.items.push({
                            label,
                            value: cleanValue,
                            source: cleanSource
                        });
                    }
                }
            }
        });

        if (currentSection) {
            sections.push(currentSection);
        }

        return { collegeInfo, sections };
    }, [report]);

    if (!report) return null;

    // Icons mapping based on section titles (simple heuristic)
    const getIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes('verdict') || t.includes('strategy')) return <Award className="w-5 h-5 text-red-600" />;
        if (t.includes('infrastructure')) return <Database className="w-5 h-5 text-blue-600" />;
        if (t.includes('graduate') || t.includes('outcome') || t.includes('employability')) return <TrendingUp className="w-5 h-5 text-green-600" />;
        if (t.includes('innovation') || t.includes('startup')) return <Layout className="w-5 h-5 text-purple-600" />;
        if (t.includes('research')) return <BookOpen className="w-5 h-5 text-indigo-600" />;
        if (t.includes('admission')) return <Users className="w-5 h-5 text-pink-600" />;
        if (t.includes('industry')) return <Briefcase className="w-5 h-5 text-orange-600" />;
        if (t.includes('teaching') || t.includes('learning')) return <Award className="w-5 h-5 text-yellow-600" />;
        if (t.includes('student') || t.includes('well-being')) return <CheckCircle className="w-5 h-5 text-teal-600" />;
        if (t.includes('international') || t.includes('global')) return <Globe className="w-5 h-5 text-cyan-600" />;
        if (t.includes('quality') || t.includes('nep') || t.includes('accreditation')) return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
        return <Layout className="w-5 h-5 text-gray-600" />;
    };

    const { collegeInfo, sections } = parsedData;

    // CSV Export function
    const exportToCSV = useCallback(() => {
        if (!sections || sections.length === 0) return;

        const csvRows = [];
        
        // Header row
        csvRows.push(['Section', 'KPI', 'Value', 'Source URL']);
        
        // Data rows
        sections.forEach(section => {
            // Clean section title (remove numbering like "1. ")
            const sectionTitle = section.title.replace(/^\d+\.\s*/, '');
            
            section.items.forEach(item => {
                // Escape values that contain commas or quotes
                const escapeCSV = (str) => {
                    if (!str) return '';
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                
                csvRows.push([
                    escapeCSV(sectionTitle),
                    escapeCSV(item.label),
                    escapeCSV(item.value),
                    escapeCSV(item.source)
                ]);
            });
        });
        
        // Create CSV content
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${collegeInfo.name || 'college'}_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [sections, collegeInfo.name]);

    if (!sections || sections.length === 0) {
        // Fallback for non-standard format
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 mt-8 border border-gray-100">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">{report}</pre>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-6">
            
            {/* College Info Card */}
            {collegeInfo.name && (
                <div className="bg-white rounded-xl shadow-md border-l-4 border-indigo-600 p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Building2 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{collegeInfo.name}</h2>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                                    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                                        <Database className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">Primary Sources:</span>
                                        <span>{collegeInfo.sources}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                    title="Export to CSV"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-sm font-medium">Export CSV</span>
                                </button>
                                <div className="hidden md:block">
                                    <div className="p-3 bg-indigo-50 rounded-lg">
                                        <GraduationCap className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sections Grid */}
            <div className="grid grid-cols-1 gap-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                {getIcon(section.title)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.items.map((item, itemIdx) => {
                                    // Check if data is verified/cross-checked
                                    const isVerified = item.value.toLowerCase().includes('verified') || 
                                                      item.value.toLowerCase().includes('cross-checked');
                                    const displayValue = item.value
                                        .replace(/\(verified\)/gi, '')
                                        .replace(/\(cross-checked\)/gi, '')
                                        .trim();
                                    
                                    return (
                                    <div key={itemIdx} className={`group relative bg-white border rounded-lg p-4 hover:bg-indigo-50/10 transition-all duration-200 ${isVerified ? 'border-green-300 hover:border-green-400' : 'border-gray-200 hover:border-indigo-300'}`}>
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide" title={item.label}>
                                                    {item.label}
                                                </span>
                                                {isVerified && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Data verified from multiple sources">
                                                        ✓ Verified
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="mt-1 mb-3">
                                                <span className="text-base font-bold text-gray-900 leading-snug">
                                                    {displayValue}
                                                </span>
                                            </div>

                                            <div className="mt-auto flex items-center pt-2 border-t border-dashed border-gray-100">
                                                {item.source && (() => {
                                                    const source = item.source;
                                                    const sourceLower = source.toLowerCase();
                                                    const collegeName = collegeInfo.name || '';
                                                    
                                                    // Check if source is already a valid URL
                                                    const isValidUrl = source.match(/^https?:\/\//i);
                                                    
                                                    if (isValidUrl) {
                                                        // Direct URL provided by AI - use it directly
                                                        return (
                                                            <a
                                                                href={source}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                                                title={`Open: ${source}`}
                                                            >
                                                                <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="truncate max-w-[200px]">
                                                                    {source.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0]}
                                                                </span>
                                                            </a>
                                                        );
                                                    }
                                                    
                                                    // Check if it's a "Search:" format
                                                    if (sourceLower.startsWith('search:')) {
                                                        const searchTerm = source.replace(/^search:\s*/i, '');
                                                        return (
                                                            <a
                                                                href={`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center text-xs text-orange-600 hover:text-orange-800 hover:underline transition-colors cursor-pointer"
                                                                title={`Search: ${searchTerm}`}
                                                            >
                                                                <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="truncate max-w-[200px]">
                                                                    🔍 {searchTerm}
                                                                </span>
                                                            </a>
                                                        );
                                                    }
                                                    
                                                    // Fallback: Create smart search based on source type
                                                    let searchQuery = `${collegeName} ${source} ${item.label}`;
                                                    
                                                    if (sourceLower.includes('nirf')) {
                                                        searchQuery = `${collegeName} NIRF 2024 site:nirfindia.org`;
                                                    } else if (sourceLower.includes('naac')) {
                                                        searchQuery = `${collegeName} NAAC grade site:naac.gov.in`;
                                                    } else if (sourceLower.includes('nba')) {
                                                        searchQuery = `${collegeName} NBA accreditation site:nbaind.org`;
                                                    } else if (sourceLower.includes('aicte') || sourceLower.includes('mandatory')) {
                                                        searchQuery = `${collegeName} mandatory disclosure AICTE`;
                                                    } else if (sourceLower.includes('careers360')) {
                                                        searchQuery = `${collegeName} site:careers360.com`;
                                                    } else if (sourceLower.includes('shiksha')) {
                                                        searchQuery = `${collegeName} site:shiksha.com`;
                                                    }
                                                    
                                                    return (
                                                        <a
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-xs text-gray-500 hover:text-indigo-600 hover:underline transition-colors cursor-pointer"
                                                            title={`Search: ${searchQuery}`}
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate max-w-[200px]">
                                                                {source}
                                                            </span>
                                                        </a>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportDisplay;
