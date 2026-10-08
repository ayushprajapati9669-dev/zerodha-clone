import Currency from "./Currency";
import { Routes, Route } from "react-router-dom";
import Equity from "./Equity";
import Nav from "./Nav";
import Commodity from "./Commodity";
function ChargeTab() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Equity />} />
        <Route path="currency" element={<Currency />} />
        <Route path="commodity" element={<Commodity />} />
      </Routes>
    </>
  );
}

export default ChargeTab;
