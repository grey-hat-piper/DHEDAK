import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer id="contact" className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm leading-relaxed">Health Intelligence. Education. Services. Initial country focus: Ghana, Cameroon and Uganda.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Platform</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/#about" className="hover:text-white">About DHEDAK</a></li>
            <li><a href="/#services" className="hover:text-white">Services</a></li>
            <li><Link to="/methodology" className="hover:text-white">Data and methodology</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms of service</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <p className="mt-3 text-sm">Contact details will be published here once supplied.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-400">© {new Date().getFullYear()} DHEDAK</div>
    </footer>
  );
}
