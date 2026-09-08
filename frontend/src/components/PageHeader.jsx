import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="w-full space-y-4 mb-6 sm:mb-8">
      {/* Title Container - Full Width Row */}
      <div className="w-full block text-left space-y-1">
        <h1 
          style={{ writingMode: 'horizontal-tb', display: 'block', width: '100%', minWidth: '250px', whiteSpace: 'normal' }}
          className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase block w-full whitespace-normal leading-tight"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-3xl leading-relaxed block w-full mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Buttons Container */}
      {actions && (
        <div className="w-full flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
