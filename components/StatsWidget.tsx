import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Lun', tasks: 12 },
  { name: 'Mar', tasks: 19 },
  { name: 'Mer', tasks: 15 },
  { name: 'Jeu', tasks: 22 },
  { name: 'Ven', tasks: 18 },
  { name: 'Sam', tasks: 8 },
  { name: 'Dim', tasks: 5 },
];

export const StatsWidget: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Activité de la semaine</h3>
        <select className="bg-slate-100 dark:bg-slate-800 border-none text-xs rounded-md px-2 py-1 text-slate-600 dark:text-slate-300 outline-none">
          <option>Cette semaine</option>
          <option>Derniers 30 jours</option>
        </select>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: 'var(--tw-bg-opacity, #1e293b)', 
                borderRadius: '8px', 
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 3 ? '#3b82f6' : '#cbd5e1'} className="dark:opacity-80" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};