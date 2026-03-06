import { Sparkles } from "lucide-react";

interface FancyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const FancyButton = ({ children, onClick, className = "" }: FancyButtonProps) => (
  <button className={`fancy-btn ${className}`} onClick={onClick}>
    <span className="fold" />
    <div className="points_wrapper">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="point" />
      ))}
    </div>
    <span className="inner">
      <Sparkles className="w-4 h-4" />
      {children}
    </span>
  </button>
);

export default FancyButton;
