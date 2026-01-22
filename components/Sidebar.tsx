
import React from 'react';
import { Page } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const mainMenuItems = [
    { id: Page.Dashboard, label: 'Dashboard', icon: <Icons.Dashboard /> },
    { id: Page.Transactions, label: 'Transações', icon: <Icons.Transactions /> },
    { id: Page.Recurring, label: 'Gastos Fixos', icon: <Icons.Recurring /> },
    { id: Page.History, label: 'Histórico', icon: <Icons.History /> },
    { id: Page.Annual, label: 'Resumo Anual', icon: <Icons.Annual /> },
    { id: Page.Insights, label: 'Insights AI', icon: <Icons.Insights /> },
  ];

  const bottomMenuItems = [
    { id: Page.Settings, label: 'Configurações', icon: <Icons.Settings /> },
  ];

  // Fix: Explicitly added 'key' to the props type definition of NavItem to resolve JSX assignment errors when used in lists
  const NavItem = ({ item }: { item: { id: Page; label: string; icon: React.ReactNode }; key?: React.Key }) => (
    <button
      onClick={() => setCurrentPage(item.id)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${currentPage === item.id 
          ? 'bg-accent text-white shadow-lg shadow-accent/20' 
          : 'hover:bg-white/5 text-gray-400 hover:text-white'}
      `}
      title={!isOpen ? item.label : undefined}
    >
      <div className={`shrink-0 transition-transform duration-200 ${currentPage !== item.id && 'group-hover:scale-110'}`}>
        {item.icon}
      </div>
      {isOpen && <span className="font-semibold text-sm tracking-tight">{item.label}</span>}
    </button>
  );

  return (
    <aside className={`
      ${isOpen ? 'w-64' : 'w-20'} 
      bg-primary text-gray-300 transition-all duration-300 flex flex-col border-r border-gray-800
      hidden md:flex h-screen sticky top-0 z-40
    `}>
      {/* Brand Logo Area */}
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-white/5">
          <svg width="22" height="22" viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.1469 15.4746L14.971 30.2038C14.7818 30.5188 14.6817 30.8759 14.6807 31.2397C14.6796 31.6035 14.7776 31.9612 14.965 32.2772C15.1523 32.5933 15.4225 32.8566 15.7485 33.0411C16.0746 33.2256 16.4452 33.3248 16.8235 33.3288H35.1752C35.5535 33.3248 35.9241 33.2256 36.2502 33.0411C36.5762 32.8566 36.8464 32.5933 37.0337 32.2772C37.2211 31.9612 37.3191 31.6035 37.318 31.2397C37.317 30.8759 37.2169 30.5188 37.0277 30.2038L27.8519 15.4746C27.6587 15.1684 27.3868 14.9153 27.0623 14.7397C26.7378 14.564 26.3717 14.4717 25.9994 14.4717C25.627 14.4717 25.2609 14.4717 24.9364 14.7397C24.6119 14.9153 24.34 15.1684 24.1469 15.4746Z" stroke="#151D2A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {isOpen && <span className="text-white font-black text-xl tracking-tighter animate-in fade-in slide-in-from-left-4 duration-300">Family</span>}
      </div>

      {/* Main Navigation */}
      <nav className="mt-6 flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5 pb-8">
          {mainMenuItems.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Actions & Settings */}
      <div className="px-4 py-4 space-y-1.5 border-t border-gray-800/50 bg-primary">
        {bottomMenuItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all mt-1"
          title={isOpen ? "Recolher menu" : "Expandir menu"}
        >
          <svg className={`transition-transform duration-500 ${isOpen ? 'rotate-0' : 'rotate-180'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
