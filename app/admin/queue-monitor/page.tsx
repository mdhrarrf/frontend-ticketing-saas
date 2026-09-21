'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Clock, AlertCircle, Play, Pause, RefreshCw } from 'lucide-react';

export default function QueueMonitorPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const queues = [
    {
      id: 'EVT-001',
      name: 'Coldplay: Music of the Spheres',
      status: 'active',
      totalQueue: 45290,
      processingRate: 150, // per minute
      avgWaitTime: '45m',
      lastProcessed: 'Just now'
    },
    {
      id: 'EVT-002',
      name: 'Taylor Swift: The Eras Tour',
      status: 'paused',
      totalQueue: 120500,
      processingRate: 0, 
      avgWaitTime: 'Unknown',
      lastProcessed: '5m ago'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-red-500 w-6 h-6" /> Queue Monitor
          </h1>
          <p className="text-gray-400 text-sm">Real-time ticketing queue management</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button className="p-2 bg-[#13131A] rounded border border-[#1F1F2E] text-gray-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {queues.map((q, i) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-6 border-l-4 ${q.status === 'active' ? 'border-l-green-500 bg-green-500/5' : 'border-l-amber-500 bg-amber-500/5'}`}
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{q.name}</h2>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${q.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {q.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">ID: {q.id}</p>
              </div>
              <div className="flex gap-2">
                {q.status === 'active' ? (
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors border border-amber-500/20">
                    <Pause className="w-4 h-4" /> Pause Queue
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors border border-green-500/20">
                    <Play className="w-4 h-4" /> Resume Queue
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Force Process
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#1F1F2E]">
                <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Users className="w-4 h-4" /> Total in Queue</div>
                <div className="text-2xl font-bold text-white">{q.totalQueue.toLocaleString()}</div>
              </div>
              <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#1F1F2E]">
                <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Activity className="w-4 h-4" /> Processing Rate</div>
                <div className="text-2xl font-bold text-green-400">{q.processingRate} <span className="text-sm text-gray-500 font-normal">/min</span></div>
              </div>
              <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#1F1F2E]">
                <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Avg Wait Time</div>
                <div className="text-2xl font-bold text-amber-400">{q.avgWaitTime}</div>
              </div>
              <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#1F1F2E]">
                <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Last Processed</div>
                <div className="text-2xl font-bold text-white">{q.lastProcessed}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
