import Hero from "./Hero.jsx";
import LeftSection from "./LeftSection.jsx";
import RightSection from "./RightSection.jsx";
import Universe from "./Universe.jsx";
function ProductPage() {
  return (
    <>
      <Hero />
      <LeftSection
        imageUrl="assets/products-kite.png"
        title=" Kite"
        description="Our ultra-fast flagship trading platform with streaming market data,
            advanced charts, an elegant UI, and more. Enjoy the Kite experience
            seamlessly on your Android and iOS devices."
        url1="https://kite-demo.zerodha.com/dashboard"
        url2="https://zerodha.com/products/kite"
        str1="Try demo "
        str2="Learn more "
      />
      <RightSection
        imageUrl="assets/products-console.png"
        title="Console"
        description="The central dashboard for your Zerodha account. Gain insights into your trades and investments with in-depth reports and visualisations."
        url1="https://zerodha.com/products/console"
        url2=""
        str1="Learn more "
        str2=""
      />
      <LeftSection
        imageUrl="assets/products-coin.png"
        title=" Coin"
        description="Buy direct mutual funds online, commission-free, delivered directly to your Demat account. Enjoy the investment experience on your Android and iOS devices."
        url1="https://coin.zerodha.com/"
        url2=""
        str1="Coin"
        str2=""
      />
      <RightSection
        imageUrl="assets/landing.svg"
        title="Kite Connect API"
        description="Build powerful trading platforms and experiences with our super simple HTTP/JSON APIs. If you are a startup, build your investment app and showcase it to our clientbase."
        url1="https://zerodha.com/products/api/"
        url2=""
        str1="Kite Connect "
        str2=""
      />
      <LeftSection
        imageUrl="assets/varsity-products.svg"
        title="Varsity mobile"
        description="An easy to grasp, collection of stock market lessons with in-depth coverage and illustrations. Content is broken down into bite-size cards to help you learn on the go."
        url1=""
        url2=""
        str1=""
        str2=""
      />

      <Universe />
    </>
  );
}

export default ProductPage;
