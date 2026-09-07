import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 sm:mb-8 gap-4">
      <div className="overflow-hidden">
        <h1 className="text-2xl sm:text-3xl font-black text-ci-text tracking-tighter uppercase whitespace-nowrap">{title}</h1>
        {subtitle && <p className="text-ci-muted text-xs sm:text-sm font-medium mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
