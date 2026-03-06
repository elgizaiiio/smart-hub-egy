const ThinkingLoader = () => {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="thinking-loader">
        <svg id="pegtopone" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <g>
            <path d="M50 15 L65 50 L50 85 L35 50 Z" />
            <path d="M50 15 L65 50 L50 85 L35 50 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
        <svg id="pegtoptwo" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <g>
            <path d="M50 15 L65 50 L50 85 L35 50 Z" />
            <path d="M50 15 L65 50 L50 85 L35 50 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
        <svg id="pegtopthree" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <g>
            <path d="M50 15 L65 50 L50 85 L35 50 Z" />
            <path d="M50 15 L65 50 L50 85 L35 50 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
      </div>
      <span className="text-sm text-muted-foreground animate-pulse">يفكر...</span>
    </div>
  );
};

export default ThinkingLoader;
