import React from 'react';
import { Flame, TreeDeciduous, CarFront, Plus, Info, MapPin, ChevronRight, Truck } from 'lucide-react';
import { Incident } from '../types';

interface IncidentCardProps {
  incident: Incident;
  key?: React.Key;
  onClick?: (incident: Incident) => void;
}

const colorMap = {
  red: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    lightBg: 'bg-red-50',
    icon: Flame
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    lightBg: 'bg-orange-50',
    icon: CarFront
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    icon: Plus
  },
  green: {
    bg: 'bg-green-600',
    text: 'text-green-600',
    lightBg: 'bg-green-50',
    icon: TreeDeciduous
  },
  gray: {
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    lightBg: 'bg-gray-50',
    icon: Info
  }
};

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const styles = colorMap[incident.color] || colorMap.gray;
  const Icon = styles.icon;

  if (incident.category === 'INFO') {
    return (
      <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100 mb-4">
        <div className={`w-14 h-14 rounded-2xl ${styles.bg} flex items-center justify-center shrink-0 mr-4 shadow-sm`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-gray-900 mb-1">Hinweis</h3>
          <p className="text-sm text-gray-500 leading-snug">
            {incident.message}
          </p>
        </div>
      </div>
    );
  }

  const title = incident.title || incident.message;
  const location = incident.location || incident.unit;

  return (
    <div 
      className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100 mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick && onClick(incident)}
    >
      <div className={`w-14 h-14 rounded-2xl ${styles.bg} flex items-center justify-center shrink-0 mr-4 shadow-sm`}>
        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.text}`}>
          {incident.type}
        </p>
        <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 leading-snug mb-1" title={title}>
          {title}
        </h3>
        <div className="flex items-center text-gray-400 text-[12px] leading-tight mb-1">
          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>
        {incident.units && incident.units.length > 0 && (
          <div className="flex items-start text-gray-400 text-[11px] leading-tight mt-1">
            <Truck className="w-3.5 h-3.5 mr-1 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{incident.units.join(', ')}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-end ml-2 shrink-0 h-full justify-between">
        <div className={`${styles.lightBg} ${styles.text} text-[12px] font-bold px-3 py-1 rounded-full mb-2`}>
          {incident.time}
        </div>
        <div className="flex items-center gap-1">
          {incident.status && (
            <div className={`${styles.text} text-[10px] font-bold uppercase tracking-wider`}>
              {incident.status}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
