import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden font-display uppercase tracking-wider py-3 px-6 text-sm font-bold transition-all duration-300 clip-path-polygon";
  
  const variants = {
    primary: "bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400",
    secondary: "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-700",
    danger: "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 hover:text-white",
    ghost: "bg-transparent text-slate-400 hover:text-white"
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};