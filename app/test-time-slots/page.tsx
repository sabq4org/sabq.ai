'use client'

import { useState } from 'react'
import SmartDigestBlock from '@/components/smart-blocks/SmartDigestBlock'

const timeSlots = [
  { value: 'morning', label: 'جرعة صباحية (6:00 ص - 11:00 ص)' },
  { value: 'noon', label: 'جرعة الظهيرة (11:00 ص - 4:00 م)' },
  { value: 'evening', label: 'جرعة مسائية (4:00 م - 7:00 م)' },
  { value: 'night', label: 'جرعة ما قبل النوم (7:00 م - 2:00 ص)' }
]

export default function TestTimeSlotsPage() {
  const [selectedSlot, setSelectedSlot] = useState('morning')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          اختبار فترات الجرعات اليومية
        </h1>
        
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {timeSlots.map((slot) => (
            <button
              key={slot.value}
              onClick={() => setSelectedSlot(slot.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedSlot === slot.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            معاينة: {timeSlots.find(s => s.value === selectedSlot)?.label}
          </p>
          
          {/* عرض البلوك مع تجاوز الوقت الحالي */}
          <SmartDigestBlock forceTimeSlot={selectedSlot as any} />
        </div>
      </div>
    </div>
  )
} 