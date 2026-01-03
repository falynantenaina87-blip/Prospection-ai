import React, { useEffect, useState } from 'react';
import { Prospect, UserStatus } from '../types';
import * as dbService from '../services/dbService';

const ProspectList: React.FC = () => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = dbService.subscribeToProspects((data) => {
            setProspects(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: UserStatus) => {
        // Optimistic update handled by Firestore subscription usually, 
        // but we can just trigger the service
        await dbService.updateProspectStatus(id, newStatus);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Delete this prospect?')) {
            await dbService.deleteProspect(id);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Connecting to CRM Database...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <span>Prospect Pipeline</span>
                <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{prospects.length} leads</span>
            </h2>
            
            <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Business</th>
                            <th className="px-6 py-4 w-1/3">AI Strategy</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {prospects.map((prospect) => (
                            <tr key={prospect.id} className="hover:bg-gray-800/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg
                                        ${(prospect.ai_insight?.score || 0) > 75 ? 'bg-gradient-to-br from-green-500 to-green-700' : 
                                          (prospect.ai_insight?.score || 0) > 40 ? 'bg-gradient-to-br from-yellow-500 to-yellow-700' : 'bg-gradient-to-br from-red-500 to-red-700'}
                                    `}>
                                        {prospect.ai_insight?.score || 0}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white text-base">{prospect.business_data.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{prospect.business_data.address}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Added: {new Date(prospect.timestamp).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2" title={prospect.ai_insight?.analysis_summary}>
                                            <span className="text-blue-400 font-semibold">Insight:</span> {prospect.ai_insight?.analysis_summary}
                                        </p>
                                        <div className="bg-gray-800 p-2 rounded border border-gray-700">
                                            <p className="text-blue-200 text-xs italic">
                                                "{prospect.ai_insight?.suggested_offer}"
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {prospect.business_data.website ? (
                                            <a href={prospect.business_data.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                <span>Website ↗</span>
                                            </a>
                                        ) : <span className="text-gray-600 italic">No Website</span>}
                                        {prospect.business_data.phone ? (
                                            <span className="text-gray-300">{prospect.business_data.phone}</span>
                                        ) : <span className="text-gray-600 italic">No Phone</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={prospect.user_status}
                                        onChange={(e) => handleStatusChange(prospect.id, e.target.value as UserStatus)}
                                        className={`
                                            bg-gray-800 border-none text-white text-xs rounded-full px-3 py-1.5 cursor-pointer focus:ring-1 focus:ring-blue-500
                                            ${prospect.user_status === UserStatus.NEW ? 'text-blue-300 bg-blue-900/30' : ''}
                                            ${prospect.user_status === UserStatus.CONTACTED ? 'text-yellow-300 bg-yellow-900/30' : ''}
                                            ${prospect.user_status === UserStatus.SIGNED ? 'text-green-300 bg-green-900/30' : ''}
                                        `}
                                    >
                                        {Object.values(UserStatus).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(prospect.id)}
                                        className="text-gray-600 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Prospect"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {prospects.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                        </div>
                                        <p>No prospects saved yet.</p>
                                        <p className="text-sm">Go to Exploration mode to find new clients.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProspectList;