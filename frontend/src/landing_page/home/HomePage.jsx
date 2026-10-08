import Footer from "../Footer";
import Navbar from "../Navbar";
import OpenAccount from "../OpenAccount";
import Education from "./Education";
import Pricing from "./Pricing";
import Hero from "./Hero";
import Stats from "./Stats";
import KiteConnectBanner from "./KiteConnectBanner";

function HomePage() {
  return (
    <div>
      <Hero />
      <Stats />
      <KiteConnectBanner />
      <Pricing />
      <Education />
      <OpenAccount />
    </div>
  );
}

export default HomePage;
