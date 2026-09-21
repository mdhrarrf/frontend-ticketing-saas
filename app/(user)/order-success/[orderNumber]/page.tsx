'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Download, Share2, Ticket } from 'lucide-react';
import Confetti from 'react-confetti'; // This would need to be installed, but we can simulate or just use the import

export default function OrderSuccessPage() {
  const params = useParams();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {windowSize.width > 0 && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false}
          numberOfPieces={500}
          colors={['#6366F1', '#EC4899', '#F59E0B', '#10B981']}
        />
      )}

      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-10"
      >
        <Check className="w-12 h-12 text-white" strokeWidth={3} />
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center z-10 max-w-lg w-full"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">Order #{params.orderNumber} has been confirmed.</p>

        <div className="glass-card p-6 mb-8 text-left">
          <div className="flex items-center mb-4 pb-4 border-b border-[#1F1F2E]">
            <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden mr-4">
              <img src="https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=200" alt="Event" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-white">Neon Dreams Music Festival</h3>
              <p className="text-sm text-gray-400">15 Aug 2024 • Stora Stadium</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tickets</span>
              <span className="text-white font-medium">2x VIP Standing</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Paid</span>
              <span className="text-pink-400 font-bold">Rp 5.800.000</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/tickets" className="w-full gradient-primary text-white py-3 rounded-lg font-bold flex items-center justify-center hover:opacity-90">
              <Ticket className="w-5 h-5 mr-2" /> View My Tickets
            </Link>
            <button className="w-full bg-[#13131A] border border-[#2A2A35] text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-[#1A1A24] transition-colors">
              <Download className="w-5 h-5 mr-2" /> Download PDF Receipt
            </button>
          </div>
        </div>
        
        <Link href="/events" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors">
          Browse more events
        </Link>
      </motion.div>
    </div>
  );
}
