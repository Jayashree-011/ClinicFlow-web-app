import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../constants/data";

interface NavbarProps {
  scrolled:     boolean;
  menuOpen:     boolean;
  onToggleMenu: () => void;
  onScrollTo:   (id: string) => void;
}

export function Navbar({ scrolled, menuOpen, onToggleMenu, onScrollTo }: NavbarProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <nav className={`sticky top-0 z-50 bg-slate-950 border-b transition-all duration-300 ${
      scrolled ? "border-blue-500/30 shadow-2xl shadow-black/60" : "border-slate-800"
    }`}>

      {/* Main bar */}
      <div className="max-w-[1160px] mx-auto px-8 h-[66px] flex items-center justify-between gap-4">

        {/* LEFT — brand */}
        <button
          onClick={() => onScrollTo("hero")}
          className="flex items-center gap-2.5 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
        >
          <div className="w-[34px] h-[34px] rounded-[9px] bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1v16M1 9h16" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[19px] font-extrabold tracking-tight text-white">
            Clinic<span className="text-sky-400">Flow</span>
          </span>
        </button>

        {/* CENTRE — nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => onScrollTo(link.id)}
              className="bg-transparent border-none cursor-pointer text-sm font-semibold text-slate-400 px-4 py-2 rounded-lg hover:text-white hover:bg-slate-800 transition-all duration-150"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* RIGHT — auth */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate("/login")}
            className="bg-transparent cursor-pointer text-sm font-semibold text-slate-400 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-800 transition-all duration-150"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-blue-500 border-none cursor-pointer text-sm font-bold text-white px-5 py-[9px] rounded-[9px] shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all duration-150"
          >
            Sign up
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={onToggleMenu}
          aria-label="Toggle menu"
          className="md:hidden bg-transparent border-none cursor-pointer text-slate-400 p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-6 pb-5 pt-3 flex flex-col">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => onScrollTo(link.id)}
              className="bg-transparent border-none cursor-pointer text-left text-[15px] font-semibold text-slate-400 py-3 px-2 border-b border-slate-800 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-transparent cursor-pointer text-sm font-semibold text-slate-400 px-4 py-2 rounded-lg flex-1 border border-slate-700 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-500 border-none cursor-pointer text-sm font-bold text-white px-4 py-2 rounded-lg flex-1 hover:bg-blue-400 transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}