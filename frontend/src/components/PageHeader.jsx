import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title Container - STRICT shrink-0 min-w-max to PREVENT VERTICAL SQUEEZING */}
        <div className="shrink-0 min-w-max">
          <h1 
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase whitespace-nowrap"
            style={{ whiteSpace: 'nowrap', display: 'inline-block', minWidth: 'max-content' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons Container */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
