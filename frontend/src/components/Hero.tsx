import { Link } from "react-router-dom";
import HeroGlobe from "./HeroGlobe";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-brand">Health Intelligence. Education. Services.</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-navy-900 sm:text-5xl">
            Connecting Health Intelligence to Better Healthcare Access.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-600">
            Discover healthcare services, explore health intelligence and strengthen health programmes through one connected platform.
          </p>
          <p className="mt-3 max-w-xl text-sm text-ink-600">
            DHEDAK is a health intelligence, education and services company improving access to reliable healthcare information across Africa, starting with Ghana, Cameroon and Uganda.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/livemap" className="rounded-full bg-brand-600 px-7 py-3 font-medium text-white hover:bg-brand-500">Explore LiveMap</Link>
            <Link to="/register" className="rounded-full border border-navy-900 px-7 py-3 font-medium text-navy-900 hover:bg-navy-900 hover:text-white">Get Started</Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[560px] rounded-full bg-navy-950 shadow-xl ring-1 ring-line">
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <HeroGlobe />
          </div>
        </div>
      </div>
    </section>
  );
}
