import React from "react";

const sizeClassMap = {
  sm: "pool-loader--sm",
  md: "pool-loader--md",
  lg: "pool-loader--lg",
};

const PoolLoader = ({ size = "md", className = "" }) => {
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;
  const mergedClassName = `pool-loader ${sizeClass} ${className}`.trim();

  return (
    <div
      className={mergedClassName}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="pool-loader__pool">
        <span className="pool-loader__lane" />
        <span className="pool-loader__lane pool-loader__lane--bottom" />
        <div className="pool-loader__swimmer">
          <span className="pool-loader__arm" />
          <span className="pool-loader__body" />
          <span className="pool-loader__head" />
          <span className="pool-loader__ripple pool-loader__ripple--one" />
          <span className="pool-loader__ripple pool-loader__ripple--two" />
          <span className="pool-loader__ripple pool-loader__ripple--three" />
        </div>
      </div>
    </div>
  );
};

export default PoolLoader;
