import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SearchResult, BusinessData, AIInsight, Prospect, UserStatus } from '../types';
import * as geminiService from '../services/geminiService';
import * as dbService from '../services/dbService';

// Fix Leaflet marker icon issue in React
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to fly map to new results
const MapFlyTo = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13, { duration: 1.5 });
    }, [center, map]);
    return null;
};

const MapExplorer: React.FC = () => {
    const [query, setQuery] = useState('Marketing Agencies');
    const [locationName, setLocationName] = useState('New York, NY');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<SearchResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // NYC Default
    const [message, setMessage] = useState<string>("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        setSelectedBusiness(null);
        setInsight(null);
        
        try {
            const data = await geminiService.searchBusinesses(query, locationName);
            setResults(data);
            if (data.length > 0) {
                setMapCenter([data[0].location.lat, data[0].location.lng]);
            }
        } catch (error) {
            console.error(error);
            setMessage("Error searching. Check API Key.");
        } finally {
            setSearching(false);
        }
    };

    const handleAnalyze = async (business: BusinessData) => {
        setAnalyzing(true);
        try {
            const result = await geminiService.analyzeProspect(business);
            setInsight(result);
        } catch (error) {
            console.error(error);
            setInsight({
                score: 0,
                analysis_summary: "AI could not complete analysis.",
                suggested_offer: "Manual review required."
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async (searchResult: SearchResult, aiData: AIInsight) => {
        const prospect: Prospect = {
            id: searchResult.id,
            business_data: searchResult.business_data,
            location: searchResult.location,
            ai_insight: aiData,
            user_status: UserStatus.NEW,
            timestamp: Date.now()
        };
        await dbService.saveProspect(prospect);
        setMessage("Prospect saved to CRM!");
        setTimeout(() => setMessage(""), 3000);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
            {/* Map Area */}
            <div className="flex-1 relative z-0">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapFlyTo center={mapCenter} />
                    {results.map((res) => (
                        <Marker 
                            key={res.id} 
                            position={[res.location.lat, res.location.lng]} 
                            icon={icon}
                            eventHandlers={{
                                click: () => {
                                    setSelectedBusiness(res);
                                    setInsight(null);
                                },
                            }}
                        />
                    ))}
                </MapContainer>
                
                {/* Search Floating Bar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[1000]">
                    <form onSubmit={handleSearch} className="flex gap-2 shadow-2xl">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Business Type (e.g. Dentist)"
                            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-l-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="City"
                            className="w-1/3 bg-gray-800 text-white px-4 py-3 border-t border-b border-gray-700 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg font-medium disabled:opacity-50 transition-colors"
                        >
                            {searching ? 'Searching...' : 'Search Maps'}
                        </button>
                    </form>
                </div>

                {/* Toast Message */}
                {message && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg z-[1000] animate-bounce">
                        {message}
                    </div>
                )}
            </div>

            {/* Side Panel (Details) */}
            <div className={`
                w-96 bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 absolute right-0 top-0 h-full z-[999] shadow-2xl
                ${selectedBusiness ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {selectedBusiness && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight mb-1">
                                    {selectedBusiness.business_data.name}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {selectedBusiness.business_data.address}
                                </p>
                            </div>
                            <button onClick={() => setSelectedBusiness(null)} className="text-gray-500 hover:text-white">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Basic Data */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Rating</span>
                                    <span className="text-yellow-400 font-bold">
                                        ★ {selectedBusiness.business_data.rating || 'N/A'} 
                                        <span className="text-gray-500 font-normal ml-1">
                                            ({selectedBusiness.business_data.userRatingCount || 0})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Website</span>
                                    {selectedBusiness.business_data.website ? (
                                        <a href={selectedBusiness.business_data.website} target="_blank" className="text-blue-400 truncate max-w-[150px] hover:underline">
                                            Visit Link
                                        </a>
                                    ) : <span className="text-red-400">Missing</span>}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="text-gray-300">{selectedBusiness.business_data.phone || 'N/A'}</span>
                                </div>
                            </div>

                            <hr className="border-gray-800" />

                            {/* AI Section */}
                            {!insight ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-400 text-sm mb-4">
                                        Use Gemini to analyze if this business is a good prospect for your services.
                                    </p>
                                    <button
                                        onClick={() => handleAnalyze(selectedBusiness.business_data)}
                                        disabled={analyzing}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                        {analyzing ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                Analyze with Gemini
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-800/50 rounded-lg p-4 space-y-4 border border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-300">Prospect Score</span>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            insight.score > 70 ? 'bg-green-900 text-green-300' : 
                                            insight.score > 40 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                                        }`}>
                                            {insight.score}/100
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Analysis</span>
                                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                            {insight.analysis_summary}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Strategy</span>
                                        <p className="text-sm text-blue-200 mt-1 leading-relaxed italic">
                                            "{insight.suggested_offer}"
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleSave(selectedBusiness, insight)}
                                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
                                    >
                                        Save Prospect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapExplorer;