interface ThinkingLoaderProps {
  searchQuery?: string;
  searchStatus?: string;
}

const PegtopSVG = () => (
  <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
      <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" opacity="0.3" />
    </g>
  </svg>
);

const ThinkingLoader = ({ searchQuery, searchStatus }: ThinkingLoaderProps) => {
  const statusText = searchStatus || (searchQuery ? `Searching for "${searchQuery}"` : "Thinking");

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="pegtop-loader" style={{ width: 60, height: 60 }}>
        <div id="pegtopone"><PegtopSVG /></div>
        <div id="pegtoptwo"><PegtopSVG /></div>
        <div id="pegtopthree"><PegtopSVG /></div>
      </div>
      <span className="text-xs text-muted-foreground animate-pulse">{statusText}</span>
    </div>
  );
};

export default ThinkingLoader;
