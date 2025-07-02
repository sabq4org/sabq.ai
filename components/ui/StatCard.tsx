import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  change, 
  changeType 
}) => {
  return (
    <div className="stat-card group">
      <div className="stat-content">
        <div className="stat-info">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {changeType === 'increase' ? (
                <svg 
                  className="w-4 h-4 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 10l7-7m0 0l7 7m-7-7v18" 
                  />
                </svg>
              ) : (
                <svg 
                  className="w-4 h-4 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              )}
              <span 
                className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change}%
              </span>
            </div>
          )}
        </div>
        <div 
          className="stat-icon"
          style={{ 
            background: `linear-gradient(135deg, ${color}, ${color}dd)` 
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard; 